# 🧠 MedScan — Alzheimer's MRI Detection System

<p align="center">
  <img src="https://img.shields.io/badge/Status-Phase%201%20Complete-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/badge/React-18.0%2B-blue?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-18.0%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/PyTorch-2.3.0-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

<p align="center">
  <b>An AI-powered clinical decision-support tool for Alzheimer's disease detection from brain MRI scans.</b><br><br>
  <a href="https://med-scan-alzheimer-s.vercel.app/"><b>🚀 VIEW LIVE DEMO</b></a>
</p>

---

## 📌 What Is MedScan?

MedScan is a deep learning application designed to assist **neurologists, radiologists, and general physicians** in the early detection of Alzheimer's disease through brain MRI analysis.

The system analyses a brain MRI scan and returns:
- A **Binary / 4-class Alzheimer's stage classification** powered by a fine-tuned ResNet34 CNN.
- A **Grad-CAM heatmap** highlighting the brain regions that influenced the model's decision.
- **Explainable AI (XAI)** featuring clinically simplified anatomical descriptions (e.g., "Central Fluid Spaces") to improve patient comprehension.
- A modern, glassmorphic **React Diagnostic Studio** interface.

> ⚠️ **Disclaimer:** MedScan is a **decision-support tool**, not a replacement for clinical judgement. All outputs must be reviewed by a qualified medical professional before clinical use.

---

## 🏗️ Architecture

MedScan utilizes a high-performance **Hybrid Node.js + Python Architecture**:

1. **Frontend (React + Vite)**: A premium, dynamic "Light Medical" themed web application for uploading MRIs and visualizing diagnostic results.
2. **Backend API (Node.js/Express)**: A fast, lightweight server that handles file routing, uploads via Multer, and API communication (`http://localhost:4000`).
3. **Inference Worker (Python/PyTorch)**: A spawned background process (`inference_worker.py`) that loads the PyTorch CNN checkpoint, performs tensor operations, generates Grad-CAM heatmaps, and pipelines the data back to Node.js.

---

## 🌐 Live Cloud Deployment

MedScan is currently deployed and accessible online:
- **Frontend (UI)**: Hosted on [Vercel](https://med-scan-alzheimer-s.vercel.app/) for ultra-fast global edge delivery.
- **Backend (API + PyTorch)**: Dockerized and hosted on [Render](https://render.com) to handle the heavy GPU/CPU tensor operations required by the CNN. 

---

## 🚀 How to Run Locally

To spin up the full application on your local machine, follow these steps:

### 1. Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../node_backend
npm install

# Python Core
cd ../backend
pip install -r requirements.txt
```

### 2. Start the Servers
You need two terminal windows open:

**Terminal 1 (Node.js Backend):**
```bash
cd node_backend
node server.js
# Runs on http://127.0.0.1:4000
```

**Terminal 2 (React Frontend):**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```
Visit `http://localhost:5173` in your browser to access the Diagnostic Studio!

---

## ✅ Phase 1: Work Done So Far

- **CNN Backbone Selection**: Compared ResNet18, EfficientNet-B5, and DenseNet121 before settling on a carefully fine-tuned **ResNet34**.
- **Subject-Disjoint Splitting**: Implemented strict clinical data-leakage prevention by splitting validation/test data at the *patient* level, not the slice level.
- **Backend Migration**: Upgraded from a synchronous Flask server to a fast Node.js Express server to resolve network payload bottlenecks.
- **Clinical XAI**: Re-engineered the Grad-CAM heuristic mapping to translate dense medical jargon into accessible summaries for non-experts.

### 📓 Research Notebooks
The `/notebooks` directory contains the heavily documented Jupyter Notebooks used to train the models (perfect for adding to your ML portfolio):
- `01_Data_Exploration_and_Extraction_FIXED.ipynb`: Exploratory Data Analysis.
- `02_2D_CNN_Preprocessing_FIXED (1).ipynb`: Slice extraction and normalization.
- `04_Kaggle_Comparison_Training.ipynb`: Initial backbone architecture bake-off.
- `Model Architecture.ipynb`: Final subject-level binary classification training pipeline for the ResNet34 model.

---

## 📦 Dataset

| Dataset | Description | Access |
|---------|-------------|--------|
| **Augmented Alzheimer's MRI Dataset** | Preprocessed & augmented MRI slices | [Free](https://www.kaggle.com/datasets/uraninjo/augmented-alzheimer-mri-dataset) |
| **OASIS-1 / OASIS-2** | Longitudinal MRI; 416 subjects | [Free, registration required](https://www.oasis-brains.org) |

---

## 📄 License

This project is licensed under the **MIT License**.

---

<p align="center">
  <i>MedScan — Built to give clinicians a faster, more transparent second opinion.</i>
</p>
