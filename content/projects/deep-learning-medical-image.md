# Deep Learning for 3D Medical Imaging

![Deep Learning Medical Imaging](/images/projects/deep-learning-medical-image-hero.png)

A pedagogical tutorial series bridging the gap between ML engineering and medical imaging. If you can train a ResNet but don't know what a sinogram is, this is for you.

## The Problem

Medical imaging AI papers assume you know what SUV means, how OSEM works, and why attenuation correction matters. ML tutorials assume you've never seen a convolution. There's a gap in the middle — for experienced ML engineers who want to build medical imaging systems but lack the domain knowledge. This project fills that gap.

## What's Inside

### Jupyter Notebooks

Five hands-on notebooks that take you from raw DICOM files to state-of-the-art reconstruction:

| # | Notebook | What You'll Learn |
|---|----------|-------------------|
| 1 | **3D Data Loading** | PET/SPECT/CT physics, DICOM & NIfTI formats, coordinate systems (LPS/RAS), affine matrices, 3D visualization |
| 2 | **Reconstruction & Metrics** | Radon transform, FBP, MLEM, OSEM from scratch, attenuation correction, medical & statistical validation metrics |
| 3a | **OSEM with PyTomography** | Production-grade reconstruction with corrections (attenuation, scatter, PSF), noise-resolution trade-offs |
| 3b | **Conditional GAN** | DeepAC for SPECT attenuation correction, 3D U-Net + PatchGAN, adversarial training, clinical evaluation |
| 3c | **Diffusion Reconstruction** | DDPM for PET, measurement-conditioned generation, posterior guidance, uncertainty quantification |

### Companion Blog Posts

1. [The DL Engineer's Field Guide to 3D Medical Imaging](/posts/dl-medical-imaging-intro) — PET/SPECT physics, DICOM, NIfTI, coordinate systems
2. [Reconstructing Reality: OSEM and the Math of PET Imaging](/posts/osem-reconstruction) — Inverse problems, MLEM, OSEM, attenuation correction
3. [GANs in the Hospital](/posts/conditional-gan-medical) — Conditional adversarial networks for SPECT attenuation correction
4. [Diffusion Models Meet Medical Reconstruction](/posts/diffusion-medical-recon) — DDPM for inverse problems in imaging
5. [Medical AI Validation: Beyond AUC](/posts/medical-ai-validation) — C-statistic, NRI, IDI, calibration, reclassification

## Key Technologies

- **PyDICOM** + **NiBabel** for data loading
- **PyTomography** for OSEM reconstruction
- **MONAI** for medical imaging transforms and augmentation
- **PyTorch Lightning** for training pipelines
- **XGBoost** for risk stratification demos

## Get Started

```bash
git clone https://github.com/XingfuY/Deep_Learning_Medical_Image.git
cd Deep_Learning_Medical_Image
pip install -r requirements.txt
jupyter notebook notebooks/
```

Every notebook includes synthetic data generators — no clinical data download required to run the code.
