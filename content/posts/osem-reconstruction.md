---
title: "Reconstructing Reality: OSEM and the Math of PET Imaging"
date: 2026-02-23
tags: [medical-imaging, OSEM, MLEM, reconstruction, PET, tutorial]
description: "From raw detector data to 3D images: the inverse problem of PET reconstruction, MLEM derivation, OSEM acceleration, and why every clinical PET scan you've seen was made with this algorithm."
---

# Reconstructing Reality: OSEM and the Math of PET Imaging

![Reconstructing Reality](/images/posts/osem-reconstruction.png)

Every PET image you've ever seen is a lie.

Or more precisely, it's a *statistical estimate*. The scanner doesn't "see" the radiotracer distribution inside the patient. It doesn't peek inside the body and paint a picture. What it actually measures is a storm of coincidence events — pairs of 511 keV photons hitting detector crystals on opposite sides of a ring, nanoseconds apart — and from that noisy, incomplete, ambiguous data, it *infers* where the radiotracer probably was.

That inference is a reconstruction algorithm. And for the past two decades, the algorithm running on virtually every clinical PET scanner on the planet has been **OSEM** — Ordered Subsets Expectation Maximization.

If you've ever looked at an oncology PET scan, a cardiac perfusion study, or a neuroimaging amyloid map, you were looking at OSEM's output. Not raw data. Not a photograph. A maximum-likelihood estimate, accelerated by a clever partitioning trick from 1994.

Let's build it from scratch.

---

## The Inverse Problem

Here's the setup. You inject a patient with a radiotracer — say, $^{18}$F-FDG, the workhorse of oncology PET. The tracer accumulates in metabolically active tissue (tumors love glucose). Fluorine-18 decays by positron emission. The positron annihilates with a nearby electron, producing two 511 keV gamma photons that fly off in *almost* exactly opposite directions. A ring of scintillation detectors catches these photon pairs in coincidence.

Each coincidence event defines a **line of response (LOR)** — a line connecting the two detector elements that fired. The annihilation happened *somewhere* along that line. Millions of LORs, and somewhere in that mess is the 3D radiotracer distribution you actually want.

### The Forward Model

Let's formalize this. Define:

- $\mathbf{x} \in \mathbb{R}^J$ — the image we want to reconstruct. $x_j$ is the activity in voxel $j$.
- $\mathbf{y} \in \mathbb{R}^I$ — the measured data. $y_i$ is the number of detected counts in detector bin $i$ (or LOR $i$).
- $\mathbf{A} \in \mathbb{R}^{I \times J}$ — the **system matrix**. $a_{ij}$ is the probability that an emission from voxel $j$ is detected in bin $i$.

The forward model says:

$$\bar{y}_i = \sum_{j=1}^{J} a_{ij} \, x_j$$

Or in matrix form: $\bar{\mathbf{y}} = \mathbf{A}\mathbf{x}$.

The system matrix $\mathbf{A}$ encodes all the physics: detector geometry, solid angles, crystal penetration, detector efficiency, maybe even patient-specific attenuation. It's enormous — a typical PET scanner might have $I \sim 10^8$ LORs and $J \sim 10^6$ voxels. You are never, ever going to store this thing as a dense matrix. In practice it's computed on-the-fly or stored as sparse projectors.

### Why You Can't Just Invert $\mathbf{A}$

The naive thought is: "I have $\mathbf{y} = \mathbf{A}\mathbf{x}$, so just compute $\mathbf{x} = \mathbf{A}^{-1}\mathbf{y}$."

Three problems with that:

1. **$\mathbf{A}$ is rectangular and rank-deficient.** Way more LORs than voxels (but also many LORs that are nearly redundant). There's no unique inverse.

2. **The data is noisy.** PET counts follow Poisson statistics. A typical clinical scan might collect $10^6$ to $10^8$ total events, spread across $10^8$ LORs. Many LORs have zero or one count. You're working with horrifically noisy data.

3. **Naive inversion amplifies noise.** Even if you could invert $\mathbf{A}$ (or use a pseudoinverse), small noise in $\mathbf{y}$ would blow up into massive artifacts in $\mathbf{x}$. This is the fundamental ill-conditioning of tomographic inverse problems.

So you need something smarter. Historically, the field went through two eras: analytic methods (filtered back-projection) and iterative methods (MLEM/OSEM). Let's look at both.

---

## Filtered Back-Projection: The Fast-and-Dirty Classic

Before iterative methods took over PET, the standard approach was **Filtered Back-Projection (FBP)**. It's still the workhorse for CT reconstruction, and understanding it gives you the right intuition for why iterative methods exist.

### The Radon Transform

Imagine a 2D image $f(x, y)$. A projection at angle $\theta$ integrates $f$ along parallel lines perpendicular to the direction $\theta$:

$$p(s, \theta) = \int_{-\infty}^{\infty} f(s\cos\theta - t\sin\theta, \; s\sin\theta + t\cos\theta) \, dt$$

This is the **Radon transform**. The collection of all projections $p(s, \theta)$ for $\theta \in [0, \pi)$ is called a **sinogram** (because a point source traces a sinusoid in $(s, \theta)$-space).

### The Fourier Slice Theorem

Here's the key insight that makes FBP work. Take the 1D Fourier transform of the projection $p(s, \theta)$ with respect to $s$:

$$P(\nu, \theta) = \int_{-\infty}^{\infty} p(s, \theta) \, e^{-2\pi i \nu s} \, ds$$

The **Fourier Slice Theorem** says: $P(\nu, \theta)$ equals the 2D Fourier transform of $f(x,y)$ evaluated along a line through the origin at angle $\theta$. In other words, each projection gives you a "slice" of the 2D frequency domain.

So the reconstruction recipe is:

1. Take all your projections (one per angle).
2. Fourier transform each one.
3. These fill in the 2D Fourier space of the image on a polar grid.
4. Interpolate to a Cartesian grid, inverse 2D FFT, done.

In practice, you don't do the interpolation step — instead you apply a **ramp filter** $|\nu|$ in frequency domain (to correct for the non-uniform sampling density in polar coordinates) and then **back-project** each filtered projection across the image. That's FBP:

$$f(x, y) = \int_0^{\pi} \left[ p(s, \theta) * h(s) \right]_{s = x\cos\theta + y\sin\theta} \, d\theta$$

where $h(s)$ is the ramp filter (inverse FT of $|\nu|$).

### Why FBP Fails for PET

FBP is fast. One forward pass through the data, done. It's perfect for CT, where you have $10^9$ photons and the noise is Gaussian-ish.

PET is a different beast:

- **Low counts.** Orders of magnitude fewer events than CT. Many LORs are empty.
- **Poisson noise.** The variance equals the mean. Low-count bins have signal-to-noise ratios near 1.
- **The ramp filter amplifies high-frequency noise.** It's literally $|\nu|$ — a filter that *increases* with frequency. On noisy PET data, it's catastrophic.

You can window the ramp filter (Hann, Hamming, Butterworth), and people did this for years. But you're always fighting the same losing battle: FBP doesn't model the noise statistics, so it can't optimally trade off resolution and noise. It treats every count as equally trustworthy, whether it came from a high-activity bin with 10,000 counts or a background bin with 2.

We need a method that *knows* the noise model. Enter MLEM.

---

## MLEM: Maximum Likelihood Expectation Maximization

### The Statistical Model

Here's where we get principled. The counts in each detector bin follow independent Poisson distributions:

$$y_i \sim \text{Poisson}(\bar{y}_i) \quad \text{where} \quad \bar{y}_i = \sum_{j=1}^{J} a_{ij} \, x_j$$

The likelihood of observing data $\mathbf{y}$ given image $\mathbf{x}$ is:

$$L(\mathbf{x}) = \prod_{i=1}^{I} \frac{\bar{y}_i^{y_i} \, e^{-\bar{y}_i}}{y_i!}$$

Taking the log:

$$\ell(\mathbf{x}) = \sum_{i=1}^{I} \left[ y_i \ln \bar{y}_i - \bar{y}_i - \ln(y_i!) \right]$$

We want to find $\mathbf{x}^* = \arg\max_{\mathbf{x} \geq 0} \, \ell(\mathbf{x})$. The non-negativity constraint is natural — activity can't be negative.

Setting the gradient to zero and solving directly is hard because of the log-sum structure and the non-negativity constraint. But the **EM algorithm** gives us an elegant iterative solution.

### The EM Framework

The EM algorithm is a general technique for maximum likelihood estimation when you have "missing" or "incomplete" data. In PET, the idea is:

- **Complete data**: If we knew which voxel produced each detected event, the problem would be trivial. Just bin the events by voxel and you have the image.
- **Incomplete data**: We only know *which detector bin* caught each event, not which voxel emitted it.

Define $n_{ij}$ as the (unobserved) number of events emitted from voxel $j$ and detected in bin $i$. Then $y_i = \sum_j n_{ij}$ and $n_{ij} \sim \text{Poisson}(a_{ij} x_j)$.

**E-step**: Compute the expected complete data given the current estimate $\mathbf{x}^n$:

$$\mathbb{E}[n_{ij} \mid y_i, \mathbf{x}^n] = y_i \cdot \frac{a_{ij} \, x_j^n}{\sum_{k} a_{ik} \, x_k^n}$$

This is just Bayes' rule: given that bin $i$ detected $y_i$ counts, the fraction attributed to voxel $j$ is proportional to $a_{ij} x_j^n$ — the expected contribution from that voxel.

**M-step**: Update the image by maximizing the expected complete-data log-likelihood:

$$x_j^{n+1} = \frac{1}{\sum_i a_{ij}} \sum_{i=1}^{I} \mathbb{E}[n_{ij} \mid y_i, \mathbf{x}^n]$$

Substituting the E-step result:

$$\boxed{x_j^{n+1} = \frac{x_j^n}{\sum_{i} a_{ij}} \sum_{i=1}^{I} a_{ij} \frac{y_i}{\sum_{k} a_{ik} \, x_k^n}}$$

That's the **MLEM update equation**. Published independently by Shepp & Vardi (1982) and Lange & Carson (1984). It's one of the most important equations in medical imaging.

### Intuition

Read the update equation carefully. It's a **multiplicative correction**:

$$x_j^{n+1} = x_j^n \times \text{(correction factor for voxel } j\text{)}$$

The correction factor is the back-projection of the **ratio** $y_i / \hat{y}_i^n$, normalized by the sensitivity $s_j = \sum_i a_{ij}$ (total detection probability for voxel $j$).

- If the current estimate $\mathbf{x}^n$ perfectly predicts the data, $y_i / \hat{y}_i^n = 1$ everywhere, and $x_j^{n+1} = x_j^n$. Fixed point.
- If the estimate underpredicts in bins that voxel $j$ contributes to, the ratio $> 1$, and the voxel gets boosted.
- If it overpredicts, the ratio $< 1$, and the voxel gets shrunk.

This multiplicative structure automatically preserves non-negativity: start with $\mathbf{x}^0 > 0$, and every iterate stays positive. No projection onto the positive orthant needed.

### Properties

MLEM has some beautiful theoretical properties:

1. **Monotonic likelihood increase**: $\ell(\mathbf{x}^{n+1}) \geq \ell(\mathbf{x}^n)$. Every iteration is guaranteed to improve (or maintain) the log-likelihood. This is a general property of EM.

2. **Converges to the ML estimate** (under regularity conditions).

3. **Automatically non-negative**. The multiplicative update never produces negative values.

4. **Noise amplification with iterations**. This is the catch. The ML estimate itself is *noisy* — it overfits to the Poisson noise. Early iterations improve the image (recovering large-scale structure), but late iterations add noise (fitting the random fluctuations). In practice, you stop early. This is called **implicit regularization** and it's one of the dirty secrets of clinical PET: the number of iterations is a regularization hyperparameter.

### Python Implementation

Let's implement MLEM from scratch on a simple 2D phantom. No medical imaging libraries — just NumPy and basic geometry.

```python
import numpy as np
import matplotlib.pyplot as plt

def create_shepp_logan_phantom(size=128):
    """Create a simplified Shepp-Logan-like phantom."""
    img = np.zeros((size, size))
    y, x = np.mgrid[-1:1:size*1j, -1:1:size*1j]

    # Outer ellipse (skull)
    mask = (x/0.69)**2 + (y/0.92)**2 <= 1
    img[mask] = 1.0

    # Inner ellipse (brain)
    mask = (x/0.6624)**2 + (y/0.874)**2 <= 1
    img[mask] = 0.2

    # Two hot spots (tumors)
    mask = ((x - 0.22)/0.11)**2 + ((y)/0.31)**2 <= 1
    img[mask] = 0.8
    mask = ((x + 0.22)/0.16)**2 + ((y - 0.0)/0.41)**2 <= 1
    img[mask] = 0.6

    # Small bright lesion
    mask = (x + 0.1)**2 + (y + 0.25)**2 <= 0.02**2
    img[mask] = 2.0

    return img


def build_system_matrix(img_size, n_angles, n_bins):
    """
    Build a simple 2D parallel-beam system matrix.
    A[i, j] = length of intersection of ray i with pixel j.
    Simplified: binary (0 or 1) based on nearest-pixel ray tracing.
    """
    n_rays = n_angles * n_bins
    n_pixels = img_size * img_size

    # Sparse construction
    rows, cols, vals = [], [], []

    angles = np.linspace(0, np.pi, n_angles, endpoint=False)
    bins = np.linspace(-1, 1, n_bins)

    for a_idx, theta in enumerate(angles):
        cos_t, sin_t = np.cos(theta), np.sin(theta)
        for b_idx, s in enumerate(bins):
            ray_idx = a_idx * n_bins + b_idx
            # Parameterize ray: (x,y) = s*(cos,sin) + t*(-sin,cos)
            for t_step in np.linspace(-1.5, 1.5, 3 * img_size):
                px = s * cos_t - t_step * sin_t
                py = s * sin_t + t_step * cos_t
                # Convert to pixel indices
                ix = int((px + 1) / 2 * img_size)
                iy = int((py + 1) / 2 * img_size)
                if 0 <= ix < img_size and 0 <= iy < img_size:
                    j = iy * img_size + ix
                    rows.append(ray_idx)
                    cols.append(j)
                    vals.append(1.0)

    from scipy.sparse import csr_matrix
    A = csr_matrix((vals, (rows, cols)),
                   shape=(n_rays, n_pixels))
    return A


def mlem(A, y, n_iter=50, img_size=128):
    """
    MLEM reconstruction.
    A: system matrix (I x J), sparse
    y: measured sinogram (I,)
    """
    J = A.shape[1]
    # Sensitivity image: s_j = sum_i a_ij
    sensitivity = np.array(A.sum(axis=0)).flatten()
    sensitivity[sensitivity == 0] = 1e-10  # avoid division by zero

    # Initialize with uniform image
    x = np.ones(J)

    for n in range(n_iter):
        # Forward project: y_hat = A @ x
        y_hat = A @ x
        y_hat[y_hat == 0] = 1e-10

        # Ratio
        ratio = y / y_hat

        # Back-project the ratio
        correction = np.array(A.T @ ratio).flatten()

        # MLEM update
        x = x * correction / sensitivity

        if (n + 1) % 10 == 0:
            print(f"Iteration {n+1}/{n_iter}")

    return x.reshape(img_size, img_size)


# --- Run it ---
img_size = 64  # small for speed
phantom = create_shepp_logan_phantom(img_size)

# Build system matrix
n_angles, n_bins = 90, 64
A = build_system_matrix(img_size, n_angles, n_bins)

# Forward project + add Poisson noise
true_sinogram = A @ phantom.flatten()
scale = 1000  # total expected counts scaling
true_sinogram = true_sinogram * (scale / true_sinogram.sum())
noisy_sinogram = np.random.poisson(true_sinogram).astype(float)

# Reconstruct
recon = mlem(A, noisy_sinogram, n_iter=30, img_size=img_size)

# Plot
fig, axes = plt.subplots(1, 3, figsize=(12, 4))
axes[0].imshow(phantom, cmap='hot'); axes[0].set_title('Phantom')
axes[1].imshow(noisy_sinogram.reshape(n_angles, n_bins),
               cmap='hot', aspect='auto'); axes[1].set_title('Sinogram')
axes[2].imshow(recon, cmap='hot'); axes[2].set_title('MLEM (30 iters)')
plt.tight_layout()
plt.savefig('mlem_reconstruction.png', dpi=150)
plt.show()
```

Run this and watch the phantom emerge from noise. The first few iterations recover gross anatomy; later iterations sharpen edges but also amplify noise. That tension is the entire story of iterative reconstruction.

---

## OSEM: Making MLEM Clinically Viable

MLEM has a big practical problem: **it's slow**.

Each iteration requires a complete forward projection ($\mathbf{A}\mathbf{x}$) and a complete back-projection ($\mathbf{A}^T \mathbf{r}$) through *all* the data. For a 3D PET scanner with $10^8$ LORs and $10^6$ voxels, that's a lot of floating-point ops. In the early 1990s, one MLEM iteration could take minutes. Getting to 30-50 iterations for reasonable convergence? Clinicians don't have that kind of patience. Patients are waiting.

**Hudson and Larkin (1994)** had a simple but powerful idea: what if you don't use all the data in every iteration?

### The OSEM Algorithm

Partition the detector bins into $S$ disjoint **subsets**: $\{B_1, B_2, \ldots, B_S\}$ where $\bigcup_s B_s = \{1, 2, \ldots, I\}$.

Now apply the MLEM update using only one subset at a time:

$$x_j^{n, s+1} = \frac{x_j^{n, s}}{\sum_{i \in B_s} a_{ij}} \sum_{i \in B_s} a_{ij} \frac{y_i}{\sum_{k} a_{ik} \, x_k^{n, s}}$$

One pass through all $S$ subsets constitutes one OSEM **iteration**. Each sub-iteration uses only $1/S$ of the data — so each sub-iteration is $S$ times cheaper than a full MLEM iteration.

The key insight: after processing just one subset, the image estimate has already been updated using new information. By the time you've cycled through all $S$ subsets, you've effectively done work equivalent to one MLEM iteration but with $S$ intermediate updates. And those intermediate updates *propagate* — each subset benefits from the corrections made by the previous one.

### Why It's Fast

Empirically, one OSEM iteration (cycling through all $S$ subsets) produces an image comparable to $S$ MLEM iterations. If you use 16 subsets, you get 16x acceleration. That's not a constant-factor speedup from better hardware — it's an algorithmic speedup from smarter data access patterns.

Think of it like SGD vs. GD in deep learning. Full-batch gradient descent (MLEM) computes the exact gradient using all training examples. Stochastic/mini-batch gradient descent (OSEM) computes a noisy but unbiased estimate using a subset. The mini-batch version makes much faster early progress because it updates more frequently, even though each update is noisier.

The analogy is almost exact. OSEM *is* a block-incremental EM algorithm. The subsets are the mini-batches. The connection was formalized by several authors in the late 1990s.

### Subset Selection

How do you choose the subsets? You want each subset to provide a "balanced" view of the object — good angular coverage so the sub-iteration update is informative.

The standard approach: if you have projection angles $\{0^\circ, 1^\circ, 2^\circ, \ldots, 179^\circ\}$ and $S = 12$ subsets, assign angles to subsets in a strided pattern:

- Subset 1: $\{0^\circ, 12^\circ, 24^\circ, \ldots\}$
- Subset 2: $\{1^\circ, 13^\circ, 25^\circ, \ldots\}$
- Subset $s$: $\{(s-1)^\circ, (s-1+S)^\circ, (s-1+2S)^\circ, \ldots\}$

This maximizes angular diversity within each subset. You never want two adjacent angles in the same subset — that would give you a highly correlated, uninformative update.

### The Convergence Caveat

Here's the thing nobody tells you in the marketing material: **OSEM does not converge to the ML estimate.**

With a fixed number of subsets, OSEM enters a **limit cycle** — it oscillates around the ML solution without settling down. Each subset "pulls" the estimate in a slightly different direction, and these pulls never perfectly cancel.

This is analogous to how SGD with a fixed learning rate oscillates around the minimum rather than converging to it. In deep learning, you decay the learning rate. In OSEM... most clinical implementations just don't care. They run 2-3 iterations with 8-16 subsets and stop. The image is "good enough" — the limit cycle oscillation is small relative to the noise and the bias is negligible compared to other sources of error (attenuation correction, scatter, randoms, patient motion).

If you truly want convergence, you need to relax the subsets over time (like learning rate decay) or switch to methods like **RAMLA** (Row-Action Maximum Likelihood Algorithm) or **BSREM** (Block Sequential Regularized EM). More on those later.

### Clinical Parameters

On a modern GE, Siemens, or Philips PET/CT scanner, the typical OSEM configuration is:

| Parameter | Typical Value |
|-----------|--------------|
| Iterations | 2-3 |
| Subsets | 8-21 |
| Equivalent MLEM iterations | 16-63 |
| Post-reconstruction filter | Gaussian, 4-6mm FWHM |

Yes, you read that right. **Two to three iterations.** After spending all that math deriving a beautiful iterative algorithm, clinical practice runs it for barely any iterations and then blurs the result with a Gaussian filter. Welcome to the pragmatism of clinical medicine.

The Gaussian post-filter serves as explicit regularization — it suppresses the high-frequency noise that OSEM amplifies in later iterations. The "optimal" filter width depends on the clinical task: oncology (want to detect small lesions, use narrow filter) vs. cardiac (want smooth perfusion maps, use wider filter).

### Python: OSEM Extension

Extending our MLEM implementation to OSEM is trivial:

```python
def osem(A, y, n_iter=3, n_subsets=12, img_size=128):
    """
    OSEM reconstruction.
    Same as MLEM but processes data in subsets.
    """
    J = A.shape[1]
    I = A.shape[0]

    # Create subset indices (strided)
    subset_indices = [list(range(s, I, n_subsets))
                      for s in range(n_subsets)]

    # Initialize
    x = np.ones(J)

    for iteration in range(n_iter):
        for s, indices in enumerate(subset_indices):
            # Extract subset of system matrix and data
            A_sub = A[indices, :]
            y_sub = y[indices]

            # Subset sensitivity
            sens_sub = np.array(A_sub.sum(axis=0)).flatten()
            sens_sub[sens_sub == 0] = 1e-10

            # Forward project (subset only)
            y_hat_sub = A_sub @ x
            y_hat_sub[y_hat_sub == 0] = 1e-10

            # Ratio and back-project
            ratio = y_sub / y_hat_sub
            correction = np.array(A_sub.T @ ratio).flatten()

            # OSEM update
            x = x * correction / sens_sub

        print(f"OSEM iteration {iteration+1}/{n_iter} complete")

    return x.reshape(img_size, img_size)

# Compare MLEM (30 iters) vs OSEM (3 iters x 12 subsets)
recon_mlem = mlem(A, noisy_sinogram, n_iter=30, img_size=img_size)
recon_osem = osem(A, noisy_sinogram, n_iter=3, n_subsets=12,
                  img_size=img_size)
```

With 3 iterations and 12 subsets, OSEM produces an image visually comparable to 30+ MLEM iterations, in roughly 1/10th the compute time. That's the entire value proposition.

---

## Attenuation Correction: The Physics You Can't Ignore

So far we've been pretending that every photon pair emitted from the patient reaches the detectors. In reality, the human body is a bag of water, bone, and air that absorbs and scatters 511 keV photons. This is **attenuation**, and ignoring it produces disastrously wrong images.

### The Problem

Photon attenuation follows the **Beer-Lambert law**. The probability that both photons in a coincidence pair survive to reach the detectors is:

$$\text{ACF}_i = \exp\left(-\int_{L_i} \mu(x, y) \, dl\right)$$

where $\mu(x, y)$ is the linear attenuation coefficient at 511 keV and $L_i$ is the LOR path through the patient.

For soft tissue, $\mu_{511} \approx 0.096 \; \text{cm}^{-1}$. For a 30 cm torso (typical chest diameter), the total attenuation along a LOR through the center is $e^{-0.096 \times 30} \approx e^{-2.88} \approx 0.056$. That means **only 5.6% of photon pairs survive** — you lose 94% of your signal to attenuation through the center of the chest.

Without attenuation correction, deep structures appear cold (low activity) and peripheral structures appear hot, purely as an artifact of path length. In cardiac PET, this is catastrophic: the inferior wall of the heart is behind the diaphragm and appears to have reduced perfusion, mimicking ischemia. Cardiologists ordering unnecessary catheterizations because of attenuation artifacts is not a hypothetical — it happened routinely in the 1980s.

### Chang's Method (First-Order Correction)

The simplest attenuation correction, proposed by **Chang (1978)**, is a multiplicative correction applied to the reconstructed image:

1. Reconstruct the image without attenuation correction (FBP or MLEM).
2. For each voxel $j$, compute the average attenuation correction factor over all LORs passing through that voxel.
3. Divide the reconstructed value by this factor.

It's crude — it doesn't account for how attenuation varies along each specific LOR — but it works surprisingly well for uniform-attenuation objects (like the brain, which is roughly a uniform ellipse of water). For the thorax, with its mix of lung, bone, and soft tissue, you need something better.

### CT-Based Attenuation Correction

This is why **PET/CT** exists.

The CT scan provides a high-resolution map of $\mu$ at the CT energy (~70 keV effective). You convert these to $\mu$ at 511 keV using a bilinear scaling:

$$\mu_{511} = \begin{cases} \mu_{CT} \times (0.096/0.184) & \text{if HU} \leq 0 \text{ (soft tissue)} \\ \mu_{CT} \times f(HU) & \text{if HU} > 0 \text{ (bone)} \end{cases}$$

where the bone scaling accounts for the different photoelectric/Compton ratios at 70 vs. 511 keV.

Once you have the 511 keV attenuation map, you compute $\text{ACF}_i$ for each LOR by ray-tracing through the $\mu$-map and integrate. Then you incorporate it into the system matrix:

$$\bar{y}_i = \text{ACF}_i \sum_{j} a_{ij} \, x_j$$

Or equivalently, modify $a_{ij} \to a_{ij} \times \text{ACF}_i$ and proceed with MLEM/OSEM as before.

This is elegant: attenuation correction becomes just another factor in the system matrix, and the iterative reconstruction handles it naturally. No separate correction step. No approximations. The physics is baked into the forward model where it belongs.

### Why PET/CT Changed Everything

Before PET/CT (pre-2001), attenuation correction used rotating transmission sources ($^{68}$Ge rods), which were slow, noisy, and added radiation dose. CT-based AC is fast (seconds), low-noise, and anatomically precise. The improvement in image quality was so dramatic that standalone PET scanners essentially disappeared from clinical practice within a decade.

Every modern PET scanner is a PET/CT (or PET/MR). The CT isn't optional — it's required for accurate attenuation correction.

---

## Beyond OSEM: The Modern Landscape

OSEM is the clinical standard, but the field hasn't stood still. Several advances have built on the OSEM foundation.

### BSREM / Q.Clear: Penalized Likelihood

The fundamental problem with OSEM (and MLEM): the ML estimate is noisy. Early stopping and post-filtering are hacks, not principled solutions.

**Penalized likelihood** adds a regularization term:

$$\mathbf{x}^* = \arg\max_{\mathbf{x} \geq 0} \left[ \ell(\mathbf{x}) - \beta \cdot R(\mathbf{x}) \right]$$

where $R(\mathbf{x})$ is a penalty that discourages noisy images (typically a quadratic or relative difference penalty on neighboring voxels) and $\beta$ controls the strength.

**BSREM** (Block Sequential Regularized EM) is the subset-accelerated version, and GE's commercial implementation is called **Q.Clear**. The key advantage: because the penalty stabilizes the optimization, BSREM actually **converges** — you can run it until the image stops changing, unlike OSEM which limit-cycles.

The $\beta$ parameter replaces the iteration count + filter width as the single tunable knob. Higher $\beta$ = smoother images. Lower $\beta$ = sharper but noisier. Clinically, Q.Clear is gaining adoption because it simplifies the reconstruction parameter space: one number instead of three (iterations, subsets, filter width).

### Time-of-Flight (TOF)

Standard PET knows *which LOR* the annihilation happened on, but not *where along the LOR*. TOF-PET adds timing information.

If the two photons arrive at times $t_1$ and $t_2$, the position along the LOR is:

$$\Delta x = \frac{c \cdot (t_1 - t_2)}{2}$$

Modern PET detectors achieve timing resolution $\Delta t \approx 200$-$400$ ps, which localizes the annihilation to within $\sim 3$-$6$ cm. That's not enough to skip reconstruction entirely (you'd need $\sim 10$ ps for that, corresponding to $\sim 1.5$ mm), but it massively constrains the problem.

In the system matrix, each element $a_{ij}$ gets weighted by a Gaussian kernel centered at the TOF-predicted position. The effect: faster convergence, better signal-to-noise ratio (by a factor of $\sim D / \Delta x$ where $D$ is the patient diameter), and reduced sensitivity to attenuation correction errors.

TOF is now standard on all premium PET/CT scanners. The clinical impact is most visible in large patients (where standard PET struggles with attenuation and low counts).

### PSF Modeling (Resolution Recovery)

The detector elements in a PET scanner have finite size ($\sim 4$ mm crystals), and the point-spread function (PSF) varies across the field of view due to parallax (photons entering crystals at oblique angles penetrate into neighboring crystals).

**PSF modeling** incorporates the spatially-variant detector response into the system matrix:

$$a_{ij} \to a_{ij} \otimes \text{PSF}(j)$$

This is sometimes called "resolution recovery" or "resolution modeling" because it effectively deconvolves the detector blur during reconstruction, recovering spatial resolution that would otherwise be lost. Siemens markets this as **HD-PET** and GE as **SharpIR**.

The improvement is real: PSF modeling can recover $\sim 1$-$2$ mm of spatial resolution, which matters for small lesions. The caveat: it can also produce **Gibbs ringing** (edge artifacts) if not carefully regularized.

### Motion Correction

Patients breathe. Hearts beat. These motions blur the PET image, especially in the thorax and abdomen.

**Motion-corrected reconstruction** incorporates deformation fields (estimated from gated data or external tracking) directly into the reconstruction loop:

$$\bar{y}_i^{(g)} = \sum_j a_{ij} \, T_g(x_j)$$

where $T_g$ is the deformation that maps the reference frame to respiratory/cardiac gate $g$. The reconstruction simultaneously estimates the motion-free image and accounts for the motion-induced blurring.

This is an active research area. Clinical implementations exist (e.g., GE's MotionFree, Siemens's HD-Chest) but aren't universally adopted. The computational cost is significant — you're now solving a joint image + motion estimation problem.

---

## The Big Picture

Let's zoom out. What have we actually built?

1. **Forward model**: radiotracer $\to$ detected photons, encoded in the system matrix $\mathbf{A}$.
2. **Statistical model**: Poisson noise on the detected counts.
3. **MLEM**: the principled ML estimator. Beautiful math, guaranteed convergence, too slow.
4. **OSEM**: the practical accelerator. Same update, subset data, $S\times$ faster. Good enough for clinical use.
5. **Attenuation correction**: the essential physics correction without which everything is wrong.
6. **Modern extensions**: penalized likelihood for convergence, TOF for SNR, PSF for resolution, motion correction for sharpness.

Every clinical PET image produced today flows through some variant of this pipeline. The scanner collects coincidence events, sorts them into sinograms (or list-mode data), applies corrections (randoms, scatter, attenuation, normalization, dead time), and feeds the corrected data into OSEM (or BSREM). The output is a 3D volume of estimated radiotracer concentration, in units of Bq/mL or SUV.

The entire chain is a statistical inference problem. The image is not a measurement — it's an *estimate*. Understanding that distinction is the first step to doing anything intelligent with PET data, whether that's training a neural network on PET images, designing a new reconstruction algorithm, or evaluating a clinical study.

And if you ever forget, just remember: every pixel in that PET scan is the output of an EM algorithm that ran for two iterations and then got hit with a Gaussian blur. We call it "clinical standard of care."

---

## Next Steps

If you want to get hands-on with this material, I've put together Jupyter notebooks that implement everything discussed here:

- [**Notebook II: Reconstruction Metrics**](https://github.com/XingfuY/Deep_Learning_Medical_Image/blob/main/notebooks/02_reconstruction_metrics.ipynb) — quantitative evaluation of reconstructed images (SSIM, PSNR, bias-variance trade-offs, contrast recovery coefficients).
- [**Notebook III-a: OSEM Reconstruction**](https://github.com/XingfuY/Deep_Learning_Medical_Image/blob/main/notebooks/03a_osem_reconstruction.ipynb) — full OSEM implementation with attenuation correction, convergence analysis, and comparison to FBP.

Clone the repo. Run the cells. Break things. That's how you learn reconstruction — not by reading about it, but by watching the algorithm iterate and seeing the image emerge from noise, one subset at a time.

---

## Deep Learning for Medical Imaging — Full Series

1. [The DL Engineer's Field Guide to 3D Medical Imaging](/posts/dl-medical-imaging-intro)
2. **Reconstructing Reality: OSEM and the Math of PET Imaging**
3. [GANs in the Hospital: Conditional Adversarial Networks for SPECT](/posts/conditional-gan-medical)
4. [Diffusion Models Meet Medical Reconstruction](/posts/diffusion-medical-recon)
5. [Medical AI Validation: Beyond AUC](/posts/medical-ai-validation)
