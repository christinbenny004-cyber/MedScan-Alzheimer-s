# 🧠 MedScan — Alzheimer's MRI Detection System

<p align="center">
  <img src="https://img.shields.io/badge/Status-In%20Development-yellow?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/PyTorch-2.3.0-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

<p align="center">
  <b>An AI-powered clinical decision-support tool for Alzheimer's disease detection from brain MRI scans.</b>
</p>

---

## 📌 What Is MedScan?

MedScan is a deep learning application designed to assist **neurologists, radiologists, and general physicians** in the early detection and progression monitoring of Alzheimer's disease through brain MRI analysis.

The system analyses a brain MRI scan and returns:
- A **4-class Alzheimer's stage classification** (Cognitively Normal / MCI / Mild / Moderate–Severe)
- A **Grad-CAM heatmap** highlighting the brain regions that influenced the model's decision
- A **severity score** with uncertainty quantification
- A downloadable **clinical PDF report**

> ⚠️ **Disclaimer:** MedScan is a **decision-support tool**, not a replacement for clinical judgement. All outputs must be reviewed by a qualified medical professional before clinical use.

---

## 🧬 Classification Stages

| Stage | Clinical Meaning | CDR Score |
|-------|-----------------|-----------|
| **Cognitively Normal** | No signs of impairment | CDR 0 |
| **Mild Cognitive Impairment (MCI)** | Early warning; independent living intact | CDR 0.5 |
| **Mild Dementia** | Memory and functional impairment beginning | CDR 1 |
| **Moderate / Severe Dementia** | Significant cognitive decline | CDR 2–3 |

---

## ✅ Work Done So Far

### Architecture Comparison Study

A **comparison study across multiple pretrained CNN backbones** was conducted on real preprocessed Alzheimer's MRI data to make an evidence-based model selection before committing to a full training run.

📓 **Notebook:** [`Alzheimer's Classification-Comparision.ipynb`](Alzheimer's%20Classification-Comparision.ipynb)

The study evaluated candidate architectures under identical conditions (same dataset, same preprocessing, same loss function) and recorded validation accuracy, macro F1, and confusion matrices to identify the best accuracy-per-parameter trade-off for this dataset.

---

## 📦 Dataset


| Dataset | Description | Access |
|---------|-------------|--------|
| **Augmented Alzheimer's MRI Dataset** | Preprocessed & augmented 4-class MRI slices | [Free](https://www.kaggle.com/datasets/uraninjo/augmented-alzheimer-mri-dataset) |
| **OASIS-1 / OASIS-2** | Longitudinal MRI; 416 subjects | [Free, registration required](https://www.oasis-brains.org) |
| **ADNI** | Gold-standard MRI + PET + cognitive scores | [Institutional approval required](https://adni.loni.usc.edu) |

---

## 📚 References

| Paper / Resource | Link |
|-----------------|------|
| Grad-CAM (Selvaraju et al., 2017) | [arXiv:1610.02391](https://arxiv.org/abs/1610.02391) |
| EfficientNet (Tan & Le, 2019) | [arXiv:1905.11946](https://arxiv.org/abs/1905.11946) |
| Swin Transformer (Liu et al., 2021) | [arXiv:2103.14030](https://arxiv.org/abs/2103.14030) |
| Focal Loss (Lin et al., 2017) | [arXiv:1708.02002](https://arxiv.org/abs/1708.02002) |
| MTA Scale (Scheltens et al., 1992) | [PubMed](https://pubmed.ncbi.nlm.nih.gov/1419003/) |
| RadImageNet | [arXiv:2204.06645](https://arxiv.org/abs/2204.06645) |
| OASIS Dataset | [oasis-brains.org](https://www.oasis-brains.org) |
| ADNI Dataset | [adni.loni.usc.edu](https://adni.loni.usc.edu) |

---

## 📄 License

This project is licensed under the **MIT License**.

---

<p align="center">
  <i>MedScan — Built to give clinicians a faster, more transparent second opinion.</i>
</p>
