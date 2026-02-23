---
title: "The DL Engineer's Field Guide to 3D Medical Imaging"
date: 2026-02-22
tags: [medical-imaging, PET, SPECT, DICOM, NIfTI, tutorial]
description: "A crash course in 3D medical imaging for ML engineers: PET/SPECT physics, DICOM vs NIfTI, coordinate systems, and Python code to work with real clinical data."
---

# The DL Engineer's Field Guide to 3D Medical Imaging

![The DL Engineer's Field Guide to 3D Medical Imaging](/images/posts/dl-medical-imaging-intro.png)

You can fine-tune a 70B parameter model. You can write custom Triton kernels. You can shard a training run across 512 GPUs and make NCCL behave. But hand you a folder of DICOM files from a PET/CT scanner and suddenly you're staring at 8,000 tiny files with no idea which dimension is which, what a "Hounsfield unit" means, or why your 3D convolution is producing garbage.

I've been there. Most of us have.

This post is the crash course I wish I'd had when I first started working with medical imaging data. We're going to cover the physics (enough to be dangerous), the file formats (enough to be competent), the coordinate systems (enough to stop flipping your volumes the wrong way), and the Python code to actually load, transform, and visualize real clinical 3D data.

No radiology degree required. Just bring your NumPy intuition.

---

## Why Should a DL Engineer Care About Medical Imaging?

Three reasons:

1. **The data is fundamentally different.** Natural images are 2D, 8-bit RGB, roughly uniform in scale. Medical images are 3D (or 4D), 16-bit signed integers, with voxel spacings that vary wildly between scans. Every assumption your vision pipeline makes is wrong.

2. **The metadata matters.** In ImageNet, metadata is the filename. In clinical imaging, metadata tells you the physical size of each voxel, the patient's orientation in the scanner, the radiation dose, the reconstruction algorithm. Ignore it and your model learns the wrong thing.

3. **The stakes are real.** A misaligned segmentation mask isn't a lower mAP score. It's a mislocalized tumor. The coordinate systems and affine transforms we'll cover aren't academic -- they're the difference between "the lesion is in the left lung" and "the lesion is in the right lung."

Let's start with what the scanners actually measure.

---

## PET/SPECT/CT Physics for Non-Physicists

You don't need to derive the Radon transform to work with this data. But you do need a mental model of what each modality captures, because it determines what your neural network is actually learning from.

### PET: Seeing Metabolism

Positron Emission Tomography works like this:

1. **Inject a radiotracer.** The most common is F-18 FDG (fluorodeoxyglucose) -- it's glucose with a radioactive fluorine-18 atom swapped in. Metabolically active cells (tumors, brain tissue, inflamed tissue) gobble it up.

2. **Positron annihilation.** The F-18 decays and emits a positron. That positron travels about 1mm before it meets an electron and they annihilate. This produces two 511 keV photons traveling in *exactly opposite directions* (180 degrees apart).

3. **Coincidence detection.** A ring of detectors surrounds the patient. When two detectors fire within ~10 nanoseconds, the system knows the annihilation happened somewhere along the line connecting them. This is called a **line of response (LOR)**.

4. **Reconstruction.** Collect millions of LORs. Apply filtered backprojection or iterative reconstruction (OSEM is the workhorse). Out comes a 3D volume where each voxel's intensity is proportional to tracer uptake.

The clinical metric is **SUV** (Standardized Uptake Value):

$$
\text{SUV} = \frac{\text{tissue activity concentration (Bq/mL)}}{\text{injected dose (Bq)} / \text{body weight (g)}}
$$

An SUV of 1.0 means "average uptake if the tracer distributed uniformly." Tumors typically show SUV > 2.5. Your model is learning to detect and quantify these hotspots.

**Key thing for DL:** PET images are *noisy*. The physics limits spatial resolution to ~4-5mm. Count statistics are Poisson-distributed. If your model is hallucinating fine detail on PET data, something is wrong.

Typical PET volume dimensions: 128x128 or 168x168 in-plane, with 3-5mm voxels, and ~80-200 slices axially. Compare that to a CT at 512x512 with sub-millimeter pixels. Your multi-modal model needs to handle this resolution mismatch -- either resample to a common grid or use separate encoding branches with different receptive fields.

### SPECT: Seeing Perfusion

Single Photon Emission Computed Tomography is PET's older, cheaper sibling:

1. **Inject a tracer.** Technetium-99m (Tc-99m) compounds are the standard -- Tc-99m sestamibi for cardiac perfusion, Tc-99m MDP for bone scans.

2. **Single photon emission.** Unlike PET, there's no annihilation trick. The tracer emits individual gamma rays at 140 keV in random directions.

3. **Collimated detection.** Since you can't use coincidence timing, you need a physical collimator -- a lead grid that blocks all photons except those arriving head-on. This is why SPECT is less sensitive than PET (you're throwing away >99.9% of photons).

4. **Rotating camera.** One or two gamma cameras rotate around the patient, acquiring projections at many angles. Reconstruct with filtered backprojection or OSEM.

**Key thing for DL:** SPECT resolution (~10-12mm) is worse than PET. The images are blurrier, noisier, and more prone to attenuation artifacts (the body absorbs more 140 keV photons than 511 keV). But SPECT tracers are cheaper, have longer half-lives (Tc-99m: 6 hours vs F-18: 110 minutes), and don't require an on-site cyclotron. So there's a *lot* of SPECT data in the world -- especially cardiac perfusion studies. If your model can handle SPECT-quality inputs, that's a feature, not a bug.

One more thing: SPECT can do *gated* acquisitions. The camera syncs to the patient's ECG and bins the photons by cardiac phase, giving you a 4D volume (3D spatial + time). You can measure ejection fraction, wall motion, and wall thickening -- all from nuclear data. If you're building a cardiac DL model, gated SPECT is a goldmine of labeled functional data.

### CT: Seeing Anatomy

Computed Tomography is the structural backbone:

1. **X-ray source** rotates around the patient.
2. Detectors on the opposite side measure **attenuation** -- how much the beam was weakened by passing through tissue.
3. Reconstruction produces a 3D volume in **Hounsfield Units (HU)**:

$$
\text{HU} = 1000 \times \frac{\mu_{\text{tissue}} - \mu_{\text{water}}}{\mu_{\text{water}} - \mu_{\text{air}}}
$$

Reference values:
- Air: -1000 HU
- Fat: ~ -100 HU
- Water: 0 HU
- Soft tissue: +20 to +60 HU
- Bone: +300 to +3000 HU

**Key thing for DL:** CT gives you millimeter-resolution anatomy. When you window the HU range (e.g., [-1000, 400] for lung, [40, 400] for bone), you're doing the same thing as adjusting brightness/contrast, but with physical meaning. Your preprocessing windowing choices directly affect what your model can learn.

### The Fusion: PET/CT and SPECT/CT

Here's the clinical punchline: **PET and SPECT tell you what's happening. CT tells you where.** Modern scanners acquire both in a single session, with the patient in the same position. The CT also provides an attenuation map for correcting the emission data.

When you get a PET/CT dataset, you'll typically have two registered 3D volumes: a high-resolution CT and a lower-resolution PET, aligned to the same coordinate space. Your model might take both as input channels, or you might use the CT for anatomical context and the PET for the actual classification target.

---

## DICOM vs NIfTI: Two Worlds

You will encounter exactly two file formats. They serve different masters and make different tradeoffs.

### DICOM: The Hospital Standard

DICOM (Digital Imaging and Communications in Medicine) is what the scanner produces and what the hospital PACS (picture archiving) stores. It's a format designed by committee for clinical workflow, and it shows.

**Structure:** One file per 2D slice. A single CT scan is typically 200-800 `.dcm` files in a folder. Each file contains:

- **Pixel data**: A single 2D image (usually 512x512 for CT)
- **Rich metadata**: Hundreds of DICOM tags organized as (group, element) pairs

The metadata is where the real information lives:

```python
import pydicom

ds = pydicom.dcmread("slice_001.dcm")

# Patient info
print(ds.PatientName)           # 'DOE^JOHN'
print(ds.PatientID)             # 'MRN12345'

# Geometry — you WILL need these
print(ds.PixelSpacing)          # [0.976, 0.976]  (mm, within-slice)
print(ds.SliceThickness)        # 2.5  (mm, between slices)
print(ds.ImagePositionPatient)  # [-250.0, -250.0, -400.0]  (mm, origin of this slice)
print(ds.ImageOrientationPatient)  # [1, 0, 0, 0, 1, 0]  (row and column direction cosines)

# Pixel values
print(ds.RescaleSlope)          # 1.0
print(ds.RescaleIntercept)      # -1024.0  (apply these to get Hounsfield units!)
print(ds.pixel_array.shape)     # (512, 512)
```

**Critical gotcha:** The raw pixel values in DICOM are *not* Hounsfield units. You must apply: `HU = pixel_value * RescaleSlope + RescaleIntercept`. Forget this and your model trains on meaningless stored values. I've seen people train entire models on raw stored values, get "decent" results because the relative ordering is preserved, and only realize the mistake when they try to apply standard HU windowing and everything looks wrong.

**Another gotcha:** Slice order. DICOM files are not guaranteed to be named in order. `IM_0001.dcm` might be slice 150. `CT.2.16.840...dcm` tells you nothing about position. You must sort by `ImagePositionPatient[2]` (the z-coordinate) or `InstanceNumber` to reconstruct the 3D volume correctly. Get this wrong and you get a scrambled volume that looks plausible at first glance but is physically nonsensical.

**Yet another gotcha:** A single DICOM directory might contain multiple series -- a CT, a PET, a dose map, a scout image. You need to filter by `SeriesInstanceUID` to isolate the series you want before stacking slices.

### NIfTI: The Research Standard

NIfTI (Neuroimaging Informatics Technology Initiative) was born in the neuroimaging community and has become the de facto standard for research:

**Structure:** One file = one entire 3D (or 4D) volume. Either `.nii` (uncompressed) or `.nii.gz` (gzipped, 3-10x smaller).

A NIfTI file has:
- A 352-byte header with dimensions, data type, voxel sizes, and a 4x4 affine matrix
- The raw voxel data as a contiguous 3D array

```python
import nibabel as nib

img = nib.load("brain.nii.gz")
print(img.shape)         # (256, 256, 180)
print(img.header.get_zooms())  # (1.0, 1.0, 1.2)  — voxel size in mm
print(img.affine)        # 4x4 matrix: voxel indices → world coordinates

data = img.get_fdata()   # numpy array, shape (256, 256, 180)
```

Clean. One file. One array. One affine. No sorting. No rescaling. No metadata archaeology.

The tradeoff? You lose all the clinical metadata. Patient demographics, acquisition parameters, reconstruction settings, radiation dose -- all gone. NIfTI headers have a few description fields, but they're limited. If you need that metadata downstream (e.g., for multi-task learning on acquisition parameters, or for stratifying your test set by scanner model), extract it from DICOM *before* converting and store it in a sidecar JSON.

### When to Use Which

| Scenario | Format | Why |
|----------|--------|-----|
| Receiving data from a hospital / PACS | DICOM | That's what they produce |
| Training a model | NIfTI | Simpler loading, one file per volume |
| Preprocessing pipeline | DICOM in, NIfTI out | Convert once, use forever |
| Sharing with clinicians | DICOM | They need it for their viewers |
| Public datasets (BraTS, AMOS, TotalSegmentator) | NIfTI | Research convention |

The workflow in practice: receive DICOM, convert to NIfTI, do all your ML work in NIfTI, convert back to DICOM if clinicians need to see results.

---

## LPS vs RAS: Coordinate Systems That Will Ruin Your Day

Here's where things get treacherous. There are two conventions for orienting 3D medical images, and mixing them up means your left and right are swapped.

### The Setup

Picture a patient lying face-up on the scanner bed (supine position, head-first). Now define three orthogonal axes:

- **Left-Right**: Across the patient's body
- **Anterior-Posterior**: Front to back
- **Superior-Inferior**: Head to feet

The question is: which direction is *positive* for each axis?

### LPS (DICOM Convention)

- **+x** = patient's **L**eft
- **+y** = patient's **P**osterior (toward the back)
- **+z** = patient's **S**uperior (toward the head)

This is the DICOM standard (and ITK, SimpleITK, 3D Slicer's internal representation).

### RAS (NIfTI Convention)

- **+x** = patient's **R**ight
- **+y** = patient's **A**nterior (toward the front)
- **+z** = patient's **S**uperior (toward the head)

This is the NIfTI standard (and FreeSurfer, nibabel's default).

### The Relationship

RAS and LPS differ by flipping the x and y axes:

$$
\begin{bmatrix} x_{\text{RAS}} \\ y_{\text{RAS}} \\ z_{\text{RAS}} \end{bmatrix} = \begin{bmatrix} -1 & 0 & 0 \\ 0 & -1 & 0 \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} x_{\text{LPS}} \\ y_{\text{LPS}} \\ z_{\text{LPS}} \end{bmatrix}
$$

That's it. Negate x and y. But if you forget this conversion when mixing DICOM-loaded and NIfTI-loaded data, you get a left-right flip that might not be visually obvious on symmetric anatomy (like the brain). On asymmetric anatomy (like the heart), it's catastrophic.

### Practical Rule

**Always know what convention your data is in.** When you load with nibabel, you're in RAS. When you load with pydicom and build the affine from DICOM tags, you're in LPS. When you use SimpleITK, you're in LPS. When you use MONAI, check the `Orientation` transform -- it lets you specify explicitly.

```python
from monai.transforms import Orientation

# Force everything to RAS, regardless of input convention
orient = Orientation(axcodes="RAS")
data = orient(data)
```

One line. No ambiguity. Do this early in your pipeline and never think about it again.

---

## Affine Matrices: The Key to Everything

If you take one thing from this post, let it be this: **the affine matrix is the bridge between voxel indices and physical space.** Every 3D medical image has one. Every spatial operation (resampling, registration, fusion) depends on it. If your affine is wrong, nothing downstream will be right.

### What It Does

A 4x4 affine matrix maps voxel coordinates `(i, j, k)` to world coordinates `(x, y, z)` in millimeters:

$$
\begin{bmatrix} x \\ y \\ z \\ 1 \end{bmatrix} = \mathbf{A} \begin{bmatrix} i \\ j \\ k \\ 1 \end{bmatrix} = \begin{bmatrix} a_{00} & a_{01} & a_{02} & a_{03} \\ a_{10} & a_{11} & a_{12} & a_{13} \\ a_{20} & a_{21} & a_{22} & a_{23} \\ 0 & 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} i \\ j \\ k \\ 1 \end{bmatrix}
$$

The matrix encodes three things simultaneously:
- **Voxel size** (scaling): How many millimeters per voxel in each direction
- **Orientation** (rotation): How the voxel grid axes map to patient axes
- **Origin** (translation): Where voxel `(0, 0, 0)` sits in world space

For an axis-aligned scan with no rotation (the common case):

$$
\mathbf{A} = \begin{bmatrix} \Delta x & 0 & 0 & x_0 \\ 0 & \Delta y & 0 & y_0 \\ 0 & 0 & \Delta z & z_0 \\ 0 & 0 & 0 & 1 \end{bmatrix}
$$

where $\Delta x, \Delta y, \Delta z$ are voxel spacings and $(x_0, y_0, z_0)$ is the origin.

### Building the Affine from DICOM Tags

This is the part nobody explains well. Here's how the DICOM tags map to the affine:

```python
import numpy as np
import pydicom

def build_affine_from_dicom(slices):
    """
    Build a 4x4 affine matrix (LPS convention) from a sorted list
    of pydicom Dataset objects.
    """
    ds = slices[0]

    # In-plane pixel spacing (row_spacing, col_spacing) in mm
    row_sp, col_sp = float(ds.PixelSpacing[0]), float(ds.PixelSpacing[1])

    # Direction cosines: first 3 = row direction, last 3 = column direction
    iop = [float(x) for x in ds.ImageOrientationPatient]
    row_cosine = np.array(iop[:3])  # direction of increasing column index
    col_cosine = np.array(iop[3:])  # direction of increasing row index

    # Slice direction: cross product of row and column cosines
    slice_cosine = np.cross(row_cosine, col_cosine)

    # Slice spacing: distance between first two slice positions
    ipp0 = np.array([float(x) for x in slices[0].ImagePositionPatient])
    ipp1 = np.array([float(x) for x in slices[1].ImagePositionPatient])
    slice_sp = np.linalg.norm(ipp1 - ipp0)

    # Determine slice direction sign
    if np.dot(ipp1 - ipp0, slice_cosine) < 0:
        slice_cosine = -slice_cosine

    # Build the affine
    affine = np.eye(4)
    affine[:3, 0] = row_cosine * col_sp    # column index direction
    affine[:3, 1] = col_cosine * row_sp    # row index direction
    affine[:3, 2] = slice_cosine * slice_sp  # slice direction
    affine[:3, 3] = ipp0                     # origin

    return affine
```

Every line has physical meaning. The column vectors of the upper-left 3x3 block tell you: "if I step one voxel in the i/j/k direction, how far do I move in the x/y/z world?" The last column tells you where voxel (0,0,0) lives.

### Inverse: World to Voxel

Going the other direction is just matrix inversion:

```python
affine_inv = np.linalg.inv(affine)

# Where is world point (0, -150, 200) in voxel space?
world_point = np.array([0, -150, 200, 1])
voxel_point = affine_inv @ world_point
i, j, k = voxel_point[:3]
```

You need this for resampling one image into another's voxel grid, for mapping annotations between coordinate systems, and for any cross-modality fusion (e.g., projecting PET hotspots onto a CT volume).

---

## Python Walkthrough: From Raw Files to 3D Volume

Let's put it all together. Here's the practical code for loading, converting, and visualizing medical imaging data.

### Loading a DICOM Series

```python
import os
import numpy as np
import pydicom

def load_dicom_series(directory):
    """
    Load all DICOM files from a directory, sort by position,
    and return a 3D numpy array in Hounsfield Units plus metadata.
    """
    # Read all DICOM files
    slices = []
    for fname in os.listdir(directory):
        fpath = os.path.join(directory, fname)
        try:
            ds = pydicom.dcmread(fpath)
            if hasattr(ds, 'ImagePositionPatient'):
                slices.append(ds)
        except Exception:
            continue

    if not slices:
        raise ValueError(f"No valid DICOM files found in {directory}")

    # Sort by slice position (z-coordinate in LPS)
    slices.sort(key=lambda s: float(s.ImagePositionPatient[2]))

    # Extract pixel data and apply rescale
    volume = np.stack([s.pixel_array.astype(np.float32) for s in slices], axis=-1)
    slope = float(slices[0].RescaleSlope)
    intercept = float(slices[0].RescaleIntercept)
    volume = volume * slope + intercept  # Now in Hounsfield Units

    # Build affine
    affine = build_affine_from_dicom(slices)

    # Voxel spacing
    row_sp, col_sp = [float(x) for x in slices[0].PixelSpacing]
    ipp0 = np.array([float(x) for x in slices[0].ImagePositionPatient])
    ipp1 = np.array([float(x) for x in slices[1].ImagePositionPatient])
    slice_sp = np.linalg.norm(ipp1 - ipp0)

    return volume, affine, (col_sp, row_sp, slice_sp)

volume, affine, spacing = load_dicom_series("path/to/dicom/series")
print(f"Volume shape: {volume.shape}")       # e.g., (512, 512, 327)
print(f"Voxel spacing: {spacing} mm")        # e.g., (0.976, 0.976, 2.5)
print(f"HU range: [{volume.min():.0f}, {volume.max():.0f}]")
```

### Loading NIfTI

This is embarrassingly simple by comparison:

```python
import nibabel as nib

img = nib.load("patient_ct.nii.gz")
volume = img.get_fdata()
affine = img.affine
spacing = img.header.get_zooms()[:3]

print(f"Volume shape: {volume.shape}")
print(f"Affine:\n{affine}")
print(f"Voxel spacing: {spacing} mm")
```

Three lines to load. That's why researchers use NIfTI.

### DICOM to NIfTI Conversion

```python
import nibabel as nib
import numpy as np

def dicom_to_nifti(dicom_dir, output_path):
    """
    Convert a DICOM series to NIfTI format.
    Handles the LPS→RAS coordinate conversion automatically.
    """
    volume, affine_lps, spacing = load_dicom_series(dicom_dir)

    # Convert LPS affine to RAS (negate x and y rows)
    lps_to_ras = np.diag([-1, -1, 1, 1])
    affine_ras = lps_to_ras @ affine_lps

    # Create NIfTI image
    nii_img = nib.Nifti1Image(volume, affine_ras)
    nib.save(nii_img, output_path)
    print(f"Saved NIfTI: {output_path}, shape={volume.shape}")

dicom_to_nifti("path/to/dicom/series", "output.nii.gz")
```

Note the `lps_to_ras` matrix. That one `np.diag([-1, -1, 1, 1])` is doing the coordinate conversion we discussed earlier. Miss it and your NIfTI file will have flipped left-right and anterior-posterior orientation.

### Visualization

Matplotlib can give you quick orthogonal views (axial, coronal, sagittal) -- the three standard planes every radiologist uses:

```python
import matplotlib.pyplot as plt

def plot_orthogonal(volume, spacing=None, title=""):
    """
    Plot axial, coronal, and sagittal slices through the center of a 3D volume.
    """
    nx, ny, nz = volume.shape
    cx, cy, cz = nx // 2, ny // 2, nz // 2

    fig, axes = plt.subplots(1, 3, figsize=(15, 5))

    # Axial (top-down)
    axes[0].imshow(volume[:, :, cz].T, cmap='gray', origin='lower')
    axes[0].set_title(f"Axial (z={cz})")

    # Coronal (front view)
    axes[1].imshow(volume[:, cy, :].T, cmap='gray', origin='lower')
    axes[1].set_title(f"Coronal (y={cy})")

    # Sagittal (side view)
    axes[2].imshow(volume[cx, :, :].T, cmap='gray', origin='lower')
    axes[2].set_title(f"Sagittal (x={cx})")

    if spacing is not None:
        for ax in axes:
            ax.set_aspect('equal')

    fig.suptitle(title, fontsize=14)
    plt.tight_layout()
    plt.show()

# CT windowing: lung window
lung_window = np.clip(volume, -1000, 400)
plot_orthogonal(lung_window, title="CT — Lung Window")

# CT windowing: soft tissue window
soft_window = np.clip(volume, -160, 240)
plot_orthogonal(soft_window, title="CT — Soft Tissue Window")
```

---

## The Package Ecosystem: Tools That Will Save You Weeks

You *can* build everything from scratch with pydicom and nibabel. You probably shouldn't. Here's what the field actually uses:

### SimpleITK

The Swiss army knife. Handles reading, writing, resampling, registration, filtering -- basically everything spatial:

```python
import SimpleITK as sitk

# Load a DICOM series (handles sorting, stacking, metadata — all of it)
reader = sitk.ImageSeriesReader()
dicom_names = reader.GetGDCMSeriesFileNames("path/to/dicom/series")
reader.SetFileNames(dicom_names)
image = reader.Execute()

print(image.GetSize())       # (512, 512, 327)
print(image.GetSpacing())    # (0.976, 0.976, 2.5)
print(image.GetOrigin())     # (-250.0, -250.0, -400.0)
print(image.GetDirection())  # 9 values: flattened 3x3 rotation matrix

# Resample to isotropic 1mm spacing
resampler = sitk.ResampleImageFilter()
resampler.SetOutputSpacing([1.0, 1.0, 1.0])
resampler.SetSize([int(s * sp / 1.0) for s, sp in
                    zip(image.GetSize(), image.GetSpacing())])
resampler.SetInterpolator(sitk.sitkLinear)
resampled = resampler.Execute(image)
```

SimpleITK operates in LPS. Remember that.

### TotalSegmentator

One command. Full-body CT segmentation. 117 anatomical structures. It's absurd how good this is:

```bash
TotalSegmentator -i ct_scan.nii.gz -o segmentations/
```

Out come 117 NIfTI masks: `liver.nii.gz`, `heart.nii.gz`, `vertebrae_L1.nii.gz`, and so on. Built on nnU-Net. Free for research. If you need organ-level ROIs for your project, start here.

### MONAI

MONAI is PyTorch for medical imaging. It gives you domain-specific transforms, losses, network architectures, and data loaders:

```python
from monai.transforms import (
    Compose, LoadImaged, EnsureChannelFirstd,
    Spacingd, Orientationd, ScaleIntensityRanged,
    CropForegroundd, RandCropByPosNegLabeld,
)

train_transforms = Compose([
    LoadImaged(keys=["image", "label"]),
    EnsureChannelFirstd(keys=["image", "label"]),
    Orientationd(keys=["image", "label"], axcodes="RAS"),
    Spacingd(keys=["image", "label"], pixdim=(1.5, 1.5, 2.0),
             mode=("bilinear", "nearest")),
    ScaleIntensityRanged(keys=["image"],
                         a_min=-175, a_max=250,
                         b_min=0.0, b_max=1.0, clip=True),
    CropForegroundd(keys=["image", "label"], source_key="image"),
    RandCropByPosNegLabeld(
        keys=["image", "label"],
        label_key="label",
        spatial_size=(96, 96, 96),
        pos=1, neg=1, num_samples=4,
    ),
])
```

This pipeline handles everything: loading, reorientation, resampling to uniform spacing, intensity normalization, foreground cropping, and random patch extraction for training. In a declarative, composable API. If you're doing 3D medical image segmentation, MONAI is the framework.

### 3D Slicer

For visualization, nothing beats [3D Slicer](https://www.slicer.org/). Open source, cross-platform, extensible with Python. You can:

- Load DICOM and NIfTI volumes
- Overlay PET on CT with adjustable opacity
- Draw manual segmentation masks
- Run TotalSegmentator directly from the GUI
- Inspect affine matrices and coordinate systems visually

It's the ImageJ of 3D medical imaging. Install it. Use it to sanity-check your preprocessing pipeline before feeding data to your model.

---

## Common Pitfalls (The Ones That Actually Bite)

Before I close, here are the mistakes I've seen (and made) that cost the most debugging time:

1. **Forgetting RescaleSlope/RescaleIntercept.** Your CT values will be in stored pixel values instead of HU. Your windowing will be wrong. Your model will learn garbage features.

2. **Not sorting DICOM slices.** The filenames mean nothing. Sort by `ImagePositionPatient[2]` or `InstanceNumber`. Always.

3. **Mixing LPS and RAS.** If you load with SimpleITK (LPS) and save with nibabel (RAS) without converting, your volume is flipped. The x and y axes need negation.

4. **Ignoring anisotropic spacing.** A CT scan might be 0.5mm in-plane but 5mm between slices. If you treat all axes equally, your 3D convolutions will have a 10:1 aspect ratio in physical space. Resample to isotropic first.

5. **Training on pixel intensities without windowing.** CT covers [-1024, +3071] HU. Most of that range is irrelevant for any given task. Window to the relevant range (lung, soft tissue, bone) and normalize to [0, 1] before your model sees it.

6. **Assuming all scans have the same dimensions.** They don't. Different scanners, different protocols, different fields of view. Your data loader needs to handle variable shapes with cropping or padding.

7. **Not handling negative SliceThickness or reversed slice ordering.** Some scanners store slices from superior to inferior, others from inferior to superior. If you blindly stack without checking the sign of the z-spacing, your volume might be upside down. Always verify with a visualization.

8. **Using 2D models on inherently 3D data.** Slice-by-slice 2D networks throw away the spatial continuity between slices. For tasks like nodule detection or organ segmentation, a 3D model (or at least 2.5D with adjacent slices as channels) almost always outperforms pure 2D. The exception: when your between-slice spacing is so large (>5mm) that adjacent slices are nearly independent.

---

## What's Next

This post gives you the vocabulary and the code to work with real 3D medical imaging data. The companion notebook walks through everything interactively:

**[Notebook I: 3D Data Loading](https://github.com/XingfuY/Deep_Learning_Medical_Image/blob/main/notebooks/01_3d_data_loading.ipynb)** -- load DICOM, convert to NIfTI, build affines, visualize orthogonal slices, all in a Jupyter notebook you can run on your own data.

In the next post, we'll go deeper: **image reconstruction**. How do you go from raw sinograms (the actual scanner output) to the reconstructed volumes we've been working with here? What do filtered backprojection and iterative reconstruction actually do, and why does the reconstruction algorithm choice matter for your downstream DL model?

We'll implement a 2D parallel-beam reconstruction from scratch in NumPy, then look at how modern DL-based reconstruction methods (learned primal-dual, unrolled ADMM) are changing the game.

Until then -- go load some DICOMs. Break things. Check your affines. And for the love of all that is holy, sort your slices.

---

## Deep Learning for Medical Imaging — Full Series

1. **The DL Engineer's Field Guide to 3D Medical Imaging**
2. [Reconstructing Reality: OSEM and the Math of PET Imaging](/posts/osem-reconstruction)
3. [GANs in the Hospital: Conditional Adversarial Networks for SPECT](/posts/conditional-gan-medical)
4. [Diffusion Models Meet Medical Reconstruction](/posts/diffusion-medical-recon)
5. [Medical AI Validation: Beyond AUC](/posts/medical-ai-validation)
