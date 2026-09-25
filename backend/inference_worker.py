"""
MedScan Inference Worker
========================
Command-line script called by the Node.js backend.
Takes an image path, runs ResNet34 inference & Grad-CAM,
and outputs a JSON string wrapped in <MEDSCAN_RESULT> tags.
"""

import sys
import json
import warnings
from PIL import Image

# Ignore warnings to keep stdout clean
warnings.filterwarnings("ignore")

# Import the core logic from existing backend modules
from config import MODEL_PATH
from model import load_model, predict, get_num_classes, get_class_names
from gradcam import generate_gradcam, image_to_base64

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided."}))
        sys.exit(1)

    image_path = sys.argv[1]

    try:
        # Load the PyTorch model
        # Note: Since this worker spins up per-request, it loads the model from disk every time.
        # This is a trade-off for moving the HTTP layer to Node.js without rewriting the ML logic.
        load_model(MODEL_PATH)
        
        # Load image
        image = Image.open(image_path).convert("RGB")

        # Run Inference
        result = predict(image)

        # Generate Grad-CAM
        gradcam_b64, analysis = generate_gradcam(image, result["predicted_label"])

        # Base64 original image
        original_b64 = image_to_base64(image)

        final_result = {
            "prediction": result,
            "gradcam_image": gradcam_b64,
            "original_image": original_b64,
            "analysis": analysis,
        }

        # Print enveloped JSON so Node.js can safely parse it
        print(f"\n<MEDSCAN_RESULT>{json.dumps(final_result)}</MEDSCAN_RESULT>\n")

    except Exception as e:
        # Print enveloped error
        error_result = {"error": str(e)}
        print(f"\n<MEDSCAN_RESULT>{json.dumps(error_result)}</MEDSCAN_RESULT>\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
