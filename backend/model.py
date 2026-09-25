"""
MedScan Backend — Model Loading & Inference
=============================================
Loads the ResNet34 checkpoint and runs predictions on MRI images.

The module dynamically reads `num_classes` and `class_names` from the
checkpoint metadata, so it works with both 2-class (binary) and 4-class
models without any code changes.
"""

import io
import torch
import torch.nn as nn
import numpy as np
from PIL import Image
from torchvision import models, transforms

from config import DEVICE, MODEL_PATH, IMAGENET_MEAN, IMAGENET_STD


# ── Module-level state (loaded once at startup) ───────────
_model = None
_class_names = None
_num_classes = None
_img_size = 224
_transform = None


def _build_resnet34(num_classes: int, state_dict: dict = None) -> nn.Module:
    """Rebuild the ResNet34 architecture with the correct classifier head.

    Auto-detects whether the checkpoint used:
      - Simple head: Dropout → Linear(512, N)
      - Multi-layer head: Dropout → Linear(512, 256) → ReLU → Dropout → Linear(256, N)

    This is determined by inspecting the state_dict keys.
    """
    model = models.resnet34(weights=None)  # no pretrained — we load our own weights
    in_features = model.fc.in_features  # 512 for ResNet34

    # Detect classifier architecture from state_dict
    uses_multi_layer = False
    if state_dict:
        # Multi-layer head has keys like 'fc.4.weight' (the second Linear)
        uses_multi_layer = any(k.startswith("fc.4.") for k in state_dict)

    if uses_multi_layer:
        # Training notebook head: Dropout(0.5) → Linear(512, 256) → ReLU → Dropout(0.3) → Linear(256, N)
        model.fc = nn.Sequential(
            nn.Dropout(p=0.5),
            nn.Linear(in_features, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.3),
            nn.Linear(256, num_classes),
        )
    else:
        # Simple head: Dropout(0.5) → Linear(512, N)
        model.fc = nn.Sequential(
            nn.Dropout(p=0.5),
            nn.Linear(in_features, num_classes),
        )

    return model


def load_model(checkpoint_path: str = MODEL_PATH) -> None:
    """Load the ResNet34 model from a checkpoint file.

    Reads `num_classes`, `class_names`, and `img_size` from the checkpoint
    metadata, rebuilds the architecture, loads the weights, and sets the
    model to eval mode.

    This function is called once at Flask startup.
    """
    global _model, _class_names, _num_classes, _img_size, _transform

    print(f"[MedScan] Loading model from: {checkpoint_path}")
    print(f"[MedScan] Device: {DEVICE}")

    checkpoint = torch.load(checkpoint_path, map_location=DEVICE, weights_only=False)

    # Read metadata from checkpoint
    _num_classes = checkpoint.get("num_classes", 4)
    _class_names = checkpoint.get(
        "class_names",
        ["Non Demented", "Demented"] if _num_classes == 2
        else ["Non Demented", "Very mild Dementia", "Mild Dementia", "Moderate Dementia"],
    )
    _img_size = checkpoint.get("img_size", 224)

    print(f"[MedScan] Classes ({_num_classes}): {_class_names}")
    print(f"[MedScan] Image size: {_img_size}x{_img_size}")

    # Rebuild architecture and load weights
    model_state = checkpoint["model_state_dict"]
    _model = _build_resnet34(num_classes=_num_classes, state_dict=model_state)
    _model.load_state_dict(model_state)
    _model = _model.to(DEVICE)
    _model.eval()

    # Build the preprocessing transform (same as training validation transform)
    _transform = transforms.Compose([
        transforms.Resize((_img_size, _img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])

    param_count = sum(p.numel() for p in _model.parameters())
    print(f"[MedScan] Model loaded successfully ({param_count:,} parameters)")


def get_model():
    """Return the loaded model (for use by gradcam.py)."""
    if _model is None:
        raise RuntimeError("Model not loaded. Call load_model() first.")
    return _model


def get_class_names():
    """Return the class names from the loaded checkpoint."""
    return _class_names


def get_num_classes():
    """Return the number of classes from the loaded checkpoint."""
    return _num_classes


def get_transform():
    """Return the preprocessing transform."""
    return _transform


def preprocess_image(image: Image.Image) -> torch.Tensor:
    """Preprocess a PIL Image for model input.

    Args:
        image: PIL Image (any mode — will be converted to RGB).

    Returns:
        Tensor of shape (1, 3, img_size, img_size) on the correct device.
    """
    if image.mode != "RGB":
        image = image.convert("RGB")
    tensor = _transform(image).unsqueeze(0).to(DEVICE)
    return tensor


def predict(image_file) -> dict:
    """Run inference on an uploaded image file.

    Args:
        image_file: A file-like object or file path containing an MRI image.

    Returns:
        dict with keys:
            predicted_class (str): Human-readable class name.
            predicted_label (int): Numeric class index.
            confidence (float): Probability of the predicted class.
            probabilities (dict): {class_name: probability} for all classes.
            class_names (list): All class names.
            num_classes (int): Number of classes.
    """
    if _model is None:
        raise RuntimeError("Model not loaded. Call load_model() first.")

    # Load and preprocess image
    if isinstance(image_file, (str, bytes)):
        image = Image.open(image_file)
    elif hasattr(image_file, "read"):
        image = Image.open(io.BytesIO(image_file.read()))
    else:
        image = image_file  # assume it's already a PIL Image

    if image.mode != "RGB":
        image = image.convert("RGB")

    tensor = preprocess_image(image)

    # Forward pass
    with torch.no_grad():
        outputs = _model(tensor)
        probs = torch.softmax(outputs, dim=1).cpu().numpy()[0]
        pred_label = int(np.argmax(probs))

    return {
        "predicted_class": _class_names[pred_label],
        "predicted_label": pred_label,
        "confidence": float(probs[pred_label]),
        "probabilities": {
            name: round(float(p), 4) for name, p in zip(_class_names, probs)
        },
        "class_names": _class_names,
        "num_classes": _num_classes,
    }
