"""
MedScan Backend — Configuration
================================
Central configuration for the Flask backend.
All paths, device settings, and constants live here.
"""

import os
import torch

# ── Paths ──────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)

# Model checkpoint — swap this file to change models (2-class or 4-class)
MODEL_PATH = os.path.join(PROJECT_ROOT, "models", "best_resnet34_binary_subject_split.pth")

# Temporary upload storage
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ── Flask Settings ─────────────────────────────────────────
SECRET_KEY = os.environ.get("SECRET_KEY", "medscan-dev-key-change-in-prod")
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload

# ── Allowed Image Extensions ──────────────────────────────
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "tif", "tiff", "bmp"}

# ── Device ─────────────────────────────────────────────────
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ── ImageNet Normalisation Constants ───────────────────────
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
