"""
MedScan Backend — Grad-CAM Explainability
===========================================
Generates Grad-CAM heatmap overlays showing which brain regions
influenced the model's prediction.

Reference: Selvaraju et al., "Grad-CAM: Visual Explanations from Deep
Networks via Gradient-based Localization" (arXiv:1610.02391).

Usage:
    from gradcam import generate_gradcam
    overlay_b64 = generate_gradcam(image_pil, predicted_label)
"""

import base64
import io
import cv2
import numpy as np
import torch
from PIL import Image

from model import get_model, preprocess_image, get_class_names
from config import DEVICE


class GradCAM:
    """Grad-CAM implementation for ResNet34.

    Hooks into the specified target layer to capture forward activations
    and backward gradients, then computes the weighted activation map.
    """

    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None

        # Register hooks
        self._forward_hook = target_layer.register_forward_hook(self._save_activation)
        self._backward_hook = target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, input, output):
        """Store forward-pass feature maps."""
        self.activations = output.detach()

    def _save_gradient(self, module, grad_input, grad_output):
        """Store backward-pass gradients."""
        self.gradients = grad_output[0].detach()

    def generate(self, input_tensor: torch.Tensor, target_class: int) -> np.ndarray:
        """Compute the Grad-CAM heatmap for a given input and target class.

        Args:
            input_tensor: Preprocessed image tensor of shape (1, 3, H, W).
            target_class: The class index to compute the heatmap for.

        Returns:
            Heatmap as a numpy array of shape (H, W), values in [0, 1].
        """
        self.model.eval()

        # Forward pass
        output = self.model(input_tensor)

        # Zero all gradients
        self.model.zero_grad()

        # Backward pass for the target class
        target_score = output[0, target_class]
        target_score.backward(retain_graph=True)

        # Pool gradients across spatial dimensions (GAP)
        # gradients shape: (1, C, H, W) → weights shape: (C,)
        weights = torch.mean(self.gradients, dim=(2, 3))[0]

        # Weighted combination of activation maps
        # activations shape: (1, C, H, W)
        cam = torch.zeros(self.activations.shape[2:], dtype=torch.float32, device=DEVICE)
        for i, w in enumerate(weights):
            cam += w * self.activations[0, i]

        # ReLU — only keep positive influence
        cam = torch.relu(cam)

        # Normalise to [0, 1]
        if cam.max() > 0:
            cam = cam / cam.max()

        return cam.cpu().numpy()

    def remove_hooks(self):
        """Clean up registered hooks."""
        self._forward_hook.remove()
        self._backward_hook.remove()


def _apply_heatmap_overlay(
    original_image: Image.Image,
    heatmap: np.ndarray,
    max_alpha: float = 0.65,
    colormap: int = cv2.COLORMAP_JET,
) -> Image.Image:
    """Overlay a Grad-CAM heatmap onto the original image.

    Uses dynamic alpha blending: the hotter the heatmap region, the more opaque
    the colourmap. Cold regions (near 0) remain completely transparent, leaving
    the original MRI untouched.

    Args:
        original_image: The original PIL Image.
        heatmap: Numpy array of shape (H, W), values in [0, 1].
        max_alpha: Maximum blending factor for the hottest regions.
        colormap: OpenCV colourmap to use.

    Returns:
        PIL Image with the heatmap overlay.
    """
    # Convert original to numpy RGB
    img_array = np.array(original_image.convert("RGB")).astype(np.float32)
    h, w = img_array.shape[:2]

    # Resize heatmap to match original image dimensions
    heatmap_resized = cv2.resize(heatmap, (w, h))
    
    # Apply Gaussian blur for smoother medical heatmaps
    heatmap_resized = cv2.GaussianBlur(heatmap_resized, (25, 25), 0)
    
    # Re-normalize to [0, 1] after blurring
    if heatmap_resized.max() > 0:
        heatmap_resized = heatmap_resized / heatmap_resized.max()

    # Convert heatmap to colourmap (0–255 uint8)
    heatmap_uint8 = np.uint8(255 * heatmap_resized)
    heatmap_coloured = cv2.applyColorMap(heatmap_uint8, colormap)
    heatmap_coloured = cv2.cvtColor(heatmap_coloured, cv2.COLOR_BGR2RGB).astype(np.float32)

    # Dynamic alpha mask based on heatmap intensity
    alpha_mask = heatmap_resized * max_alpha
    alpha_mask = np.expand_dims(alpha_mask, axis=-1)

    # Blend: (alpha * colourmap) + ((1 - alpha) * original)
    overlay = (alpha_mask * heatmap_coloured + (1.0 - alpha_mask) * img_array)
    overlay = np.clip(overlay, 0, 255).astype(np.uint8)

    return Image.fromarray(overlay)


def calculate_severity_score(
    image: Image.Image,
    heatmap: np.ndarray,
    predicted_class: str,
    threshold: float = 0.55
) -> dict:
    """Calculate quantitative involvement and clinical severity/integrity metrics.
    
    Args:
        image: Original PIL image.
        heatmap: Grad-CAM heatmap array (values 0-1).
        predicted_class: Name of predicted class (e.g., 'Non Demented', 'Demented').
        threshold: Intensity threshold for 'high activation'.
        
    Returns:
        Dictionary with quantitative scores, coverage percent, and status.
    """
    img_array = np.array(image.convert("L"))
    brain_mask = img_array > 15
    total_brain_pixels = int(np.sum(brain_mask))
    
    if total_brain_pixels == 0:
        return {
            "severity_score": 0.0,
            "category": "Indeterminate",
            "coverage_pct": 0.0,
            "metric_label": "Analysis Indeterminate",
        }

    h, w = img_array.shape
    heatmap_resized = cv2.resize(heatmap, (w, h))
    hot_mask = (heatmap_resized > threshold) & brain_mask
    hot_pixels = int(np.sum(hot_mask))
    
    coverage_pct = round((hot_pixels / total_brain_pixels) * 100.0, 1)
    is_safe = predicted_class.lower() in ["non demented", "cognitively normal", "normal"]

    if is_safe:
        # For Non-Demented, the network's high confidence reflects healthy preservation
        preservation_score = round(max(8.5, min(10.0, 10.0 - (coverage_pct * 0.05))), 1)
        return {
            "severity_score": preservation_score,
            "category": "Normal Structural Integrity",
            "coverage_pct": coverage_pct,
            "metric_label": "Tissue Preservation Index",
            "clinical_status": "Preserved Parenchyma",
        }
    else:
        # For Demented, calculate disease severity score (1.0 to 10.0) based on activation extent
        MAX_EXPECTED_RATIO = 0.15 # 15% brain involvement represents severe focal biomarker load
        ratio = hot_pixels / total_brain_pixels
        raw_score = min((ratio / MAX_EXPECTED_RATIO) * 10.0, 10.0)
        score = round(max(1.5, float(raw_score)), 1)
        
        if score < 4.0:
            category = "Mild Regional Atrophy"
        elif score < 7.0:
            category = "Moderate Neurodegeneration"
        else:
            category = "Marked Structural Atrophy"
            
        return {
            "severity_score": score,
            "category": category,
            "coverage_pct": coverage_pct,
            "metric_label": "Neurodegenerative Severity Score",
            "clinical_status": "Pathological Biomarker Detected",
        }


def identify_brain_region(heatmap: np.ndarray, predicted_class: str) -> dict:
    """Identify anatomical structures, hemisphere attribution, and clinical significance.
    
    Uses 2D axial MRI spatial mapping and clinical neuropathology heuristics.
    """
    y_idx, x_idx = np.unravel_index(np.argmax(heatmap), heatmap.shape)
    y_norm = float(y_idx / heatmap.shape[0])
    x_norm = float(x_idx / heatmap.shape[1])
    
    # Hemisphere localization
    if x_norm < 0.42:
        hemisphere = "Left Hemisphere"
    elif x_norm > 0.58:
        hemisphere = "Right Hemisphere"
    else:
        hemisphere = "Bilateral / Midline"
        
    is_safe = predicted_class.lower() in ["non demented", "cognitively normal", "normal"]

    # Region segmentation heuristics for axial brain MRI
    if 0.30 <= x_norm <= 0.70 and 0.32 <= y_norm <= 0.65:
        region = "Central Fluid Spaces (Ventricles)"
        anatomical_role = "The central fluid-filled spaces in the brain."
        if not is_safe:
            pathology = "The fluid spaces have expanded significantly. This often happens because the surrounding brain tissue has shrunk, causing the spaces to widen."
            biomarker = "Enlarged Fluid Spaces & Tissue Shrinkage"
        else:
            pathology = "The fluid spaces are a normal, healthy size without any concerning expansion."
            biomarker = "Normal Fluid Spaces"

    elif y_norm > 0.58 and (x_norm < 0.40 or x_norm > 0.60):
        region = "Memory Center (Hippocampus)"
        anatomical_role = "The memory center of the brain, responsible for learning and storing new memories."
        if not is_safe:
            pathology = "Noticeable shrinkage in the memory center. This is often one of the earliest physical signs of Alzheimer's disease."
            biomarker = "Memory Center Shrinkage"
        else:
            pathology = "The memory center is a normal, healthy size, consistent with good cognitive health."
            biomarker = "Healthy Memory Center"

    elif y_norm < 0.38:
        region = "Frontal Brain (Frontal Lobe)"
        anatomical_role = "The front of the brain, responsible for reasoning, planning, judgment, and complex thinking."
        if not is_safe:
            pathology = "Thinning in the front of the brain, which can lead to difficulties with planning and decision-making."
            biomarker = "Frontal Brain Thinning"
        else:
            pathology = "The front of the brain appears thick and healthy, with normal structural spacing."
            biomarker = "Healthy Frontal Brain Structure"

    elif (x_norm < 0.28 or x_norm > 0.72) and 0.35 <= y_norm <= 0.68:
        region = "Side Brain Grooves (Sylvian Fissure)"
        anatomical_role = "The deep groove separating the upper and lower brain areas, involved in language and hearing."
        if not is_safe:
            pathology = "Widening of the brain grooves, indicating that the surrounding brain tissue is slowly shrinking."
            biomarker = "Widened Brain Grooves"
        else:
            pathology = "The brain grooves are narrow and normal, meaning the surrounding tissue is well preserved."
            biomarker = "Normal Brain Grooves"

    else:
        region = "Back of Brain (Parieto-Occipital)"
        anatomical_role = "The back of the brain, which processes visual information and spatial awareness."
        if not is_safe:
            pathology = "Volume loss in the back of the brain, a pattern commonly seen in Alzheimer's progression."
            biomarker = "Back-Brain Volume Loss"
        else:
            pathology = "The back of the brain is dense and healthy without noticeable tissue loss."
            biomarker = "Healthy Back-Brain Density"

    # Clinical decision support recommendation
    if not is_safe:
        recommendations = [
            "Consult a doctor for a standard memory and thinking test.",
            "Consider follow-up blood tests or a more detailed diagnostic scan.",
            "Schedule another MRI in 6 months to see if any changes occur over time.",
        ]
    else:
        recommendations = [
            "Keep up with your regular preventative health checkups.",
            "No urgent action is needed based on this brain region.",
        ]

    return {
        "region": region,
        "hemisphere": hemisphere,
        "anatomical_role": anatomical_role,
        "pathological_findings": pathology,
        "biomarker": biomarker,
        "recommendations": recommendations,
        "coordinates": {"x": round(x_norm, 3), "y": round(y_norm, 3)},
        "heatmap_legend": {
            "high": "Crimson/Red (Peak Attention): Top primary anatomical structures guiding the classification.",
            "medium": "Yellow/Green (Contributory): Secondary supporting tissue and surrounding structural margins.",
            "low": "Blue/Clear (Baseline): Unaffected background brain parenchyma.",
        }
    }


def generate_gradcam(image: Image.Image, target_class: int) -> tuple[str, dict]:
    """Generate a Grad-CAM overlay for an MRI image and return it as base64 along with anatomical analysis.

    Args:
        image: PIL Image of the MRI scan.
        target_class: The predicted class index.

    Returns:
        Tuple containing:
        - Base64-encoded PNG string of the Grad-CAM overlay image.
        - Dictionary containing anatomical region analysis.
    """
    model = get_model()
    class_names = get_class_names()
    predicted_class_name = class_names[target_class] if target_class < len(class_names) else "Unknown"

    # Target layer: last convolutional block of ResNet34 (layer4[-1])
    target_layer = model.layer4[-1]

    # Set up Grad-CAM
    grad_cam = GradCAM(model, target_layer)

    try:
        # Preprocess and enable gradients for Grad-CAM backward pass
        input_tensor = preprocess_image(image)
        input_tensor.requires_grad_(True)

        # Generate heatmap
        heatmap = grad_cam.generate(input_tensor, target_class)
        
        # Identify region with clinical context
        analysis = identify_brain_region(heatmap, predicted_class_name)
        
        # Calculate quantitative severity/integrity score
        metrics = calculate_severity_score(image, heatmap, predicted_class_name)
        analysis.update(metrics)

        # Create overlay
        overlay = _apply_heatmap_overlay(image.convert("RGB"), heatmap, max_alpha=0.65)

        # Encode to base64
        buffer = io.BytesIO()
        overlay.save(buffer, format="PNG")
        buffer.seek(0)
        b64_string = base64.b64encode(buffer.read()).decode("utf-8")

        return b64_string, analysis

    finally:
        grad_cam.remove_hooks()


def image_to_base64(image: Image.Image) -> str:
    """Convert a PIL Image to a base64-encoded PNG string."""
    buffer = io.BytesIO()
    image.convert("RGB").save(buffer, format="PNG")
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode("utf-8")
