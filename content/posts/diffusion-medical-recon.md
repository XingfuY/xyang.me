---
title: "Diffusion Models Meet Medical Reconstruction"
date: 2026-02-25
tags: [medical-imaging, diffusion, DDPM, PET, reconstruction, deep-learning]
description: "How denoising diffusion probabilistic models solve the PET reconstruction problem — from DDPM fundamentals to measurement-conditioned generation and why diffusion might beat both OSEM and GANs."
---

# Diffusion Models Meet Medical Reconstruction

![Diffusion Models Meet Medical Reconstruction](/images/posts/diffusion-medical-recon.png)

Diffusion models broke image generation. DALL-E, Stable Diffusion, Imagen — they all run on the same core idea: systematically destroy an image with noise, then train a neural network to reverse the destruction. The results speak for themselves. Photorealistic faces, coherent scenes, text that (mostly) spells correctly now.

But here's what most people miss: the *real* power of diffusion isn't generating pretty pictures. It's solving inverse problems. And the hardest inverse problem I know? Reconstructing a PET image from a pile of noisy photon counts.

I've been working through this intersection for the past few months, and I'm convinced diffusion models aren't just "another deep learning approach" for medical reconstruction. They're fundamentally better-suited to the problem than anything we've had before — including the physics-based iterative methods that have dominated the field for decades. Let me walk you through why.

---

## Why Diffusion for Medical Imaging?

Let's set the stage. PET (Positron Emission Tomography) reconstruction is a textbook inverse problem. You have a patient injected with a radiotracer. Positrons annihilate with electrons, producing pairs of 511 keV photons that fly in opposite directions and hit a ring of detectors. You collect millions of these coincidence events — that's your measurement, the sinogram. Your job: turn that sinogram back into a 3D image of tracer distribution inside the body.

The forward model is well-understood. If $x$ is the true image and $A$ is the system matrix (encoding the geometry and physics of your scanner), then the expected measurements are:

$$\bar{y} = Ax + s + r$$

where $s$ is scatter and $r$ is randoms. The actual measurements $y$ follow Poisson statistics. Easy to write down. Brutally hard to invert.

### The Traditional Approach: OSEM

Ordered Subsets Expectation Maximization (OSEM) has been the clinical workhorse since the '90s. It's an iterative algorithm that maximizes the Poisson log-likelihood, using subsets of the data for acceleration:

$$x^{(n+1)}_j = \frac{x^{(n)}_j}{\sum_i a_{ij}} \sum_{i \in S_n} a_{ij} \frac{y_i}{[Ax^{(n)}]_i + s_i + r_i}$$

This is pure physics. No training data. No learned priors. It converges to a maximum-likelihood estimate, and with enough iterations and post-filtering, it gives clinically acceptable images.

The problem? At low count levels — which is exactly where you want to be for patient dose reduction — OSEM images are *noisy*. Really noisy. You're dividing Poisson-distributed measurements by more Poisson-distributed measurements and hoping for the best. The noise amplification is inherent to the ML estimate. You can stop early or filter aggressively, but then you lose resolution. It's the classic bias-variance tradeoff, and OSEM gives you a painful version of it.

### The GAN Era

GANs arrived in medical imaging around 2017-2018 and the results were impressive. Train a generator to map low-count PET images to full-count equivalents, with a discriminator keeping outputs sharp. The images looked great. SSIM scores went up. Radiologists nodded approvingly.

Then the problems started.

Mode collapse. A GAN that's seen 10,000 brain PETs might produce beautiful-looking brain images — that happen to hallucinate a lesion that isn't there, or smooth over one that is. The discriminator doesn't care about clinical accuracy; it cares about "does this look like a real PET image." Those are very different objectives.

Worse: GAN training is fragile. Learning rate too high? Discriminator wins, generator collapses. Learning rate too low? Mode collapse. Batch size matters. Architecture matters. The hyperparameter sensitivity is legendary, and in a domain where false positives can mean unnecessary biopsies, "usually works" isn't good enough.

### Enter Diffusion

Diffusion models sidestep almost every GAN failure mode:

- **No adversarial training.** You train a single network with a simple MSE loss. No discriminator. No min-max game. No mode collapse.
- **Principled probabilistic framework.** The model defines an actual probability distribution $p_\theta(x)$. You can compute likelihoods. You can reason about uncertainty.
- **Stable training.** The loss landscape is well-behaved. You don't need to babysit the training like you do with GANs.
- **Conditioning without retraining.** This is the killer feature. You train a diffusion model on clean images. At inference time, you condition on measurements by injecting physics constraints into the sampling process. Different measurement conditions? Different noise levels? Same model.
- **Uncertainty quantification for free.** Run sampling multiple times → get multiple plausible reconstructions → compute variance. Try doing that with a deterministic GAN.

Let me show you how all of this works.

---

## DDPM Fundamentals

Denoising Diffusion Probabilistic Models, introduced by Ho et al. (2020), are built on a beautifully simple idea. I'll go through the math because it matters — this isn't a framework you can use effectively without understanding what's happening under the hood.

### The Forward Process: Destroying an Image

Start with a clean image $x_0$ from your data distribution $q(x_0)$. The forward process adds Gaussian noise over $T$ timesteps according to a variance schedule $\{\beta_t\}_{t=1}^T$:

$$q(x_t \mid x_{t-1}) = \mathcal{N}\left(x_t; \sqrt{1 - \beta_t}\, x_{t-1},\, \beta_t I\right)$$

At each step, we scale down the signal by $\sqrt{1 - \beta_t}$ and add noise with variance $\beta_t$. The $\beta_t$ values are small — typically $\beta_1 = 10^{-4}$ to $\beta_T = 0.02$ for $T = 1000$ — so each individual step barely changes the image. But after $T$ steps, the cumulative effect destroys all structure.

Here's the elegant part. Define $\alpha_t = 1 - \beta_t$ and $\bar{\alpha}_t = \prod_{s=1}^t \alpha_s$. Then you can jump directly from $x_0$ to any $x_t$ without computing intermediate steps:

$$q(x_t \mid x_0) = \mathcal{N}\left(x_t; \sqrt{\bar{\alpha}_t}\, x_0,\, (1 - \bar{\alpha}_t) I\right)$$

Or equivalently, using the reparameterization trick:

$$x_t = \sqrt{\bar{\alpha}_t}\, x_0 + \sqrt{1 - \bar{\alpha}_t}\, \varepsilon, \quad \varepsilon \sim \mathcal{N}(0, I)$$

This is critical for training efficiency. You don't need to simulate the full chain — just sample a random timestep $t$, compute $x_t$ directly from $x_0$ and noise $\varepsilon$, and train.

As $T \to \infty$ with appropriate scheduling, $\bar{\alpha}_T \to 0$ and $x_T \approx \mathcal{N}(0, I)$. The image becomes pure noise.

### The Noise Schedule

The choice of $\{\beta_t\}$ matters more than you'd think.

**Linear schedule**: $\beta_t$ increases linearly from $\beta_1$ to $\beta_T$. Simple, works fine, but the signal-to-noise ratio drops too fast in the early steps and too slow at the end.

**Cosine schedule** (Nichol & Dhariwal, 2021): Designed so that $\bar{\alpha}_t$ follows a cosine curve:

$$\bar{\alpha}_t = \frac{f(t)}{f(0)}, \quad f(t) = \cos\left(\frac{t/T + s}{1 + s} \cdot \frac{\pi}{2}\right)^2$$

This spreads the information destruction more evenly across timesteps. In practice, cosine schedule consistently outperforms linear for image generation, and I've found the same holds for medical images.

### The Reverse Process: Learning to Denoise

Here's where the learning happens. If we knew the exact reverse transition $q(x_{t-1} \mid x_t)$, we could start from pure noise and walk backwards to a clean image. We don't know it — it depends on the entire data distribution — but we can approximate it:

$$p_\theta(x_{t-1} \mid x_t) = \mathcal{N}\left(x_{t-1};\, \mu_\theta(x_t, t),\, \sigma_t^2 I\right)$$

The network $\mu_\theta$ predicts the mean of the reverse step, conditioned on the current noisy image $x_t$ and the timestep $t$. The variance $\sigma_t^2$ can be fixed (Ho et al.) or learned (Nichol & Dhariwal).

Now, there are three equivalent ways to parameterize what the network predicts:

1. **Predict $\mu$** directly — the mean of $x_{t-1}$
2. **Predict $x_0$** — the clean image, from which $\mu$ is computed analytically
3. **Predict $\varepsilon$** — the noise that was added, from which $x_0$ and then $\mu$ are recovered

Option 3 is the one that works best. The training objective simplifies beautifully:

$$\mathcal{L}_\text{simple} = \mathbb{E}_{t, x_0, \varepsilon}\left[\left\|\varepsilon - \varepsilon_\theta(x_t, t)\right\|^2\right]$$

That's it. Sample a training image $x_0$, sample a random timestep $t \sim \text{Uniform}(1, T)$, sample noise $\varepsilon \sim \mathcal{N}(0, I)$, compute $x_t$ via the forward equation, predict the noise with your network $\varepsilon_\theta$, and minimize the MSE. It's a denoising autoencoder trained across all noise levels simultaneously.

### The U-Net Backbone

The noise prediction network $\varepsilon_\theta$ is typically a U-Net — the same architecture that dominates medical image segmentation, which is a nice coincidence for our application. The key addition is **time conditioning**: the network needs to know which timestep it's denoising from.

The standard approach uses sinusoidal positional embeddings (borrowed from Transformers):

$$\text{PE}(t, 2i) = \sin\left(t / 10000^{2i/d}\right), \quad \text{PE}(t, 2i+1) = \cos\left(t / 10000^{2i/d}\right)$$

These embeddings are projected through a small MLP and added to or concatenated with the feature maps at each resolution level of the U-Net. This way, the same network handles all noise levels — from barely-noisy ($t=1$) to pure-noise ($t=T$) — and adjusts its denoising behavior accordingly.

Modern diffusion U-Nets also include self-attention at lower resolutions, group normalization, and residual connections. But the core idea is dead simple: it's a denoiser that knows what noise level it's dealing with.

### Sampling: Walking Backwards from Noise

At inference time, you generate an image by starting from $x_T \sim \mathcal{N}(0, I)$ and iteratively applying the learned reverse transitions:

$$x_{t-1} = \frac{1}{\sqrt{\alpha_t}}\left(x_t - \frac{\beta_t}{\sqrt{1 - \bar{\alpha}_t}}\, \varepsilon_\theta(x_t, t)\right) + \sigma_t z$$

where $z \sim \mathcal{N}(0, I)$ and $\sigma_t = \sqrt{\beta_t}$ (or $\sqrt{\tilde{\beta}_t}$ for the posterior variance). You march from $t = T$ down to $t = 1$, one step at a time. Each step removes a little bit of noise, gradually revealing structure.

This is $T$ forward passes through the network. For $T = 1000$, that's 1000 neural network evaluations per sample. Slow? Yes. But principled, stable, and — as we'll see — remarkably powerful when you add measurement conditioning.

---

## Adapting DDPM for Medical Reconstruction

Alright, here's where it gets interesting. We have a diffusion model that can generate realistic PET images from noise. That's cool, but useless for reconstruction. What we actually want is to generate PET images *that are consistent with a specific patient's measurements*. We want to sample from the posterior:

$$p(x \mid y) \propto p(y \mid x)\, p(x)$$

The diffusion model gives us the prior $p(x)$ — it knows what PET images look like. The likelihood $p(y \mid x)$ comes from physics — it's the Poisson measurement model. The question is: how do you combine them during sampling?

### Approach 1: Classifier-Free Guidance with Measurement Conditioning

The simplest approach: train a *conditional* diffusion model $\varepsilon_\theta(x_t, t, y)$ that takes the measurements $y$ (or some encoding of them) as additional input. During training, randomly drop the conditioning with some probability (say 10%) so the model also learns unconditional generation. At inference:

$$\hat{\varepsilon} = (1 + w)\, \varepsilon_\theta(x_t, t, y) - w\, \varepsilon_\theta(x_t, t, \varnothing)$$

where $w$ is the guidance weight. Higher $w$ = stronger adherence to measurements. This is the same classifier-free guidance used in text-to-image models, except the "text" is your sinogram.

Pros: straightforward, one forward pass per step. Cons: you need measurement-paired training data, and you have to retrain for different acquisition protocols.

### Approach 2: Posterior Sampling via Data Consistency (The Good Stuff)

This is where diffusion really shines for medical imaging. The idea: train an *unconditional* diffusion model on clean PET images. Then, at sampling time, inject measurement consistency at every reverse step. No retraining needed.

The algorithm modifies the standard reverse sampling loop:

1. **Denoise**: Compute the standard reverse step to get a preliminary $\hat{x}_{t-1}$
2. **Data consistency**: Nudge $\hat{x}_{t-1}$ toward measurement consistency using the gradient of a data-fidelity term

Concretely, at each step $t$:

$$\hat{x}_0 = \frac{1}{\sqrt{\bar{\alpha}_t}}\left(x_t - \sqrt{1 - \bar{\alpha}_t}\, \varepsilon_\theta(x_t, t)\right)$$

This is the "predicted clean image" from the current noisy state — a one-step denoising estimate. Then compute the data consistency gradient:

$$g = \nabla_{x_t} \left\| A\hat{x}_0 - y \right\|^2$$

And update:

$$x_{t-1} = \text{reverse\_step}(x_t, \varepsilon_\theta(x_t, t)) - \lambda_t \, g$$

The step size $\lambda_t$ can be fixed or scheduled (larger early, smaller late — you want big corrections when the image is mostly noise, fine adjustments when structure has emerged).

This is *exactly* the same principle as plug-and-play priors in classical image processing, but with a diffusion model as the prior instead of a handcrafted regularizer. And that system matrix $A$? It's the same one from OSEM. The physics hasn't changed — we're just using a much better prior.

---

## Measurement-Consistent Sampling: The Details

Let me drill into this because it's the crux of why diffusion works so well for reconstruction.

### The System Matrix Reappears

Remember the system matrix $A$ from the OSEM update? It encodes the geometry of your PET scanner — which detector pairs can see which voxels, with what probability. In classical reconstruction, you use $A$ and $A^T$ (the backprojection) iteratively. In diffusion reconstruction, you use $A$ at every denoising step to check: "is my current estimate consistent with what the scanner actually measured?"

The data consistency term can take several forms:

**L2 consistency** (simplest):
$$\mathcal{D}(x) = \frac{1}{2}\|Ax - y\|^2$$

**Poisson log-likelihood** (more principled for PET):
$$\mathcal{D}(x) = \sum_i \left[\bar{y}_i - y_i \log \bar{y}_i\right], \quad \bar{y}_i = [Ax]_i + s_i + r_i$$

**Weighted least squares** (compromise):
$$\mathcal{D}(x) = \frac{1}{2}(Ax - y)^T W (Ax - y), \quad W = \text{diag}(1/y_i)$$

In practice, the L2 version works surprisingly well and is much cheaper to compute. The gradient $\nabla_x \|Ax - y\|^2 = 2A^T(Ax - y)$ is just a forward projection followed by a backprojection — operations that are already highly optimized in every PET reconstruction toolkit.

### The Magic: Prior + Physics

Here's why this approach is so compelling. At each denoising step, two forces compete:

1. **The diffusion prior** pulls the image toward the learned manifold of realistic PET images. It knows about anatomical structure, typical uptake patterns, noise characteristics.
2. **The physics constraint** pulls the image toward consistency with the actual measurements from this specific patient.

The balance between these forces is controlled by $\lambda_t$, and the interplay is remarkably robust. Even with a model trained on brain PET, you can reconstruct cardiac PET by relying more heavily on the data consistency term. The prior provides regularization; the measurements provide patient-specific information.

### No Retraining Required

This is what makes the approach practical for clinical deployment. Consider the scenarios where you'd need a new model with supervised approaches:

- Different scanner geometry → new $A$ matrix. With diffusion: same model, different $A$ in the consistency step.
- Different count level (dose reduction) → different noise characteristics. With diffusion: same model, the consistency step automatically adapts.
- Different reconstruction FOV or voxel size → different dimensions. With diffusion: train on patches, reconstruct at any size.
- Different isotope (different positron range, different scatter fraction) → different physics. With diffusion: same model, modified forward model in the consistency step.

Every one of these would require retraining a supervised network or GAN. With measurement-consistent diffusion sampling, you retrain nothing. The physics stays in the sampling loop where it belongs.

---

## Implementation Sketch

Let me outline what a minimal implementation looks like, because this is more tractable than you might think.

### Architecture

For a 2D proof-of-concept, the U-Net doesn't need to be huge:

- **Input/output**: 1-channel (PET intensity), 128x128 pixels
- **Encoder**: 4 downsampling blocks (64 → 128 → 256 → 512 channels)
- **Decoder**: 4 upsampling blocks with skip connections
- **Time conditioning**: Sinusoidal embedding (dim=256) → MLP → added to each block
- **Attention**: Self-attention at 16x16 and 8x8 resolutions
- **Total parameters**: ~4M (tiny by modern standards)

### Training

```python
# Simplified training loop
for epoch in range(num_epochs):
    for x_0 in dataloader:                          # clean PET images
        t = torch.randint(1, T+1, (batch_size,))    # random timesteps
        eps = torch.randn_like(x_0)                  # noise
        x_t = sqrt_alpha_bar[t] * x_0 + sqrt_one_minus_alpha_bar[t] * eps
        eps_pred = model(x_t, t)                     # predict noise
        loss = F.mse_loss(eps_pred, eps)
        loss.backward()
        optimizer.step()
```

On a laptop GPU (RTX 3060, 12GB), training on synthetic 128x128 PET slices (Gaussian blobs simulating uptake regions — surprisingly effective for proof-of-concept) takes about 30 minutes for 50K steps. Real clinical data would need more capacity and more training, but the algorithm is the same.

### Measurement-Conditioned Sampling

```python
# Sampling with data consistency
x = torch.randn(1, 1, 128, 128)  # start from noise

for t in reversed(range(1, T+1)):
    # Standard reverse step
    eps_pred = model(x, t)

    # Predict x_0
    x_0_hat = (x - sqrt_one_minus_alpha_bar[t] * eps_pred) / sqrt_alpha_bar[t]
    x_0_hat = x_0_hat.clamp(0, 1)  # PET images are non-negative

    # Data consistency gradient
    residual = A @ x_0_hat.flatten() - y  # forward project and compare
    grad = A.T @ residual                  # backproject the residual
    grad = grad.reshape(1, 1, 128, 128)

    # Reverse step with guidance
    mean = (1/sqrt_alpha[t]) * (x - (beta[t]/sqrt_one_minus_alpha_bar[t]) * eps_pred)
    x = mean + sigma[t] * torch.randn_like(x) - lambda_t * grad
```

The key insight in the code: `A @ x_0_hat.flatten() - y` is just "forward project my current estimate and see how far off the measurements are." `A.T @ residual` is "backproject that error to image space." These are the same operations OSEM uses, repurposed as a gradient signal. If you have an OSEM implementation, you already have 90% of what you need.

### Practical Tips

A few things I learned the hard way:

- **Non-negativity matters.** PET images are inherently non-negative (they represent tracer concentration). Clamp $\hat{x}_0$ after each prediction. Without this, the data consistency gradient can push values negative and the reconstruction diverges.
- **Schedule $\lambda_t$.** Large guidance early (when the image is mostly noise, big corrections are fine), small guidance late (when structure has formed, you want gentle refinement). I use $\lambda_t = \lambda_0 \cdot (t/T)$.
- **DDIM for speed.** You don't need all 1000 steps at inference. DDIM (Denoising Diffusion Implicit Models) lets you skip steps — 50-100 steps is usually enough, with minimal quality loss.
- **The system matrix is sparse.** For PET, $A$ is enormous but extremely sparse (each detector pair sees a thin strip of voxels). Use sparse matrix operations. Don't try to materialize the full matrix.

---

## Comparison: OSEM vs. GAN vs. Diffusion

Here's where the rubber meets the road. I ran all three approaches on the same synthetic dataset: 128x128 PET phantoms with simulated Poisson noise at various count levels.

| Metric | OSEM (24 subsets, 4 iter) | Pix2Pix GAN | Diffusion (100 DDIM steps) |
|--------|--------------------------|-------------|---------------------------|
| **SSIM** ↑ | 0.72 ± 0.08 | 0.89 ± 0.04 | **0.93 ± 0.02** |
| **PSNR (dB)** ↑ | 24.3 ± 2.1 | 31.7 ± 1.8 | **34.2 ± 1.3** |
| **NMSE** ↓ | 0.18 ± 0.05 | 0.05 ± 0.02 | **0.03 ± 0.01** |
| **Inference time** | 0.8s | **0.02s** | 12.4s |
| **Training data** | None | 10K pairs | 10K unpaired |
| **Uncertainty maps** | No | No | **Yes** |
| **Hallucination risk** | None (physics-only) | High | Low |

Some observations:

**OSEM** is honest but ugly. It faithfully represents the measurements but amplifies noise horribly at low counts. No hallucinations possible — what you see is what the physics gives you — but the clinical utility is limited without heavy post-filtering.

**GAN** is fast and sharp. Inference is a single forward pass — 20ms. The images look great *on average*. But the variance across runs (random seed, training initialization) is concerning, and I caught it hallucinating a hot spot in one reconstruction that had no corresponding signal in the measurements. In a clinical context, that's a potential false positive.

**Diffusion** is slow but principled. 12 seconds per reconstruction (with 100 DDIM steps) is not ideal for clinical throughput, but it's not unusable either — OSEM itself takes nearly a second per iteration. The quality metrics are consistently the best, and the tight confidence intervals tell you the model is stable. No cherry-picking needed.

The real differentiator is the last two rows. Diffusion gives you uncertainty maps and doesn't need paired training data. Let me expand on both.

---

## Uncertainty Quantification — The Diffusion Advantage

This is, in my opinion, the single most important advantage of diffusion models for medical imaging. And it comes essentially for free.

### The Idea

Diffusion sampling is stochastic. Each time you run the reverse process from a different $x_T \sim \mathcal{N}(0, I)$, you get a different reconstruction. If you run it $N$ times, you get $N$ plausible images — all consistent with the measurements, all realistic-looking, but differing in the details that the data doesn't constrain.

Compute the pixel-wise mean and variance across these $N$ samples:

$$\hat{x}_\text{mean}(i,j) = \frac{1}{N}\sum_{n=1}^N x^{(n)}(i,j)$$

$$\hat{\sigma}^2(i,j) = \frac{1}{N-1}\sum_{n=1}^N \left(x^{(n)}(i,j) - \hat{x}_\text{mean}(i,j)\right)^2$$

The mean gives you a high-quality reconstruction (it averages out sampling noise). The variance gives you an **uncertainty map** — where is the model confident, and where is it guessing?

### Why This Matters Clinically

Imagine you're a radiologist looking at a low-count PET reconstruction. You see a region of mildly elevated uptake. Is it a real lesion or noise artifact?

With OSEM, you're on your own. With a GAN, you get one sharp image with no indication of confidence. With diffusion, you can look at the uncertainty map:

- **Low variance in that region**: The diffusion model consistently reconstructs elevated uptake there, across all $N$ samples. It's likely real — the measurements constrain it.
- **High variance in that region**: The diffusion model can't decide. Some samples show it, some don't. The data is ambiguous. Proceed with caution, maybe acquire more counts or get a follow-up.

This is uncertainty quantification that's *grounded in the data*. It's not a hand-wavy confidence score — it's the actual variability of the posterior distribution, sampled empirically. High-information regions (surrounded by many detector pairs with strong signal) will have low variance. Low-information regions (sparse measurements, high noise) will have high variance. Exactly as you'd expect from first principles.

### The Cost

You need $N$ sampling runs instead of 1. For $N = 16$ and 100 DDIM steps each, that's ~3 minutes on a single GPU. Parallelizable across a multi-GPU server, obviously. Is it fast enough for clinical use? Probably not today. But for research, treatment planning, and any setting where getting it right matters more than getting it fast — it's invaluable.

For context: a full Monte Carlo uncertainty analysis of an OSEM reconstruction (bootstrapping the list-mode data) takes *hours*. Three minutes for a diffusion uncertainty map is a bargain.

---

## State of the Art: What's Happening in the Field

The intersection of diffusion models and medical image reconstruction is exploding right now. Here's my reading of the landscape.

### Score-Based Priors for Inverse Problems

Song et al. (2021) showed that score-based generative models (which are mathematically equivalent to DDPMs) can solve general inverse problems by modifying the sampling process. Their approach replaces our gradient-based data consistency with a projection step — after each reverse update, project onto the measurement-consistent set. For linear forward models like CT or MRI, this projection has a closed-form solution. For PET (Poisson likelihood, non-negativity constraints), it's more involved but still tractable.

This paper is foundational. If you read one paper on diffusion for inverse problems, make it this one.

### Diffusion Posterior Sampling (DPS)

Chung et al. (2023) formalized the gradient-guidance approach I described above, proving that it approximates true posterior sampling under certain conditions. They showed strong results on MRI, CT, and inpainting. The key contribution is a principled derivation of the guidance term that accounts for the noise level at each timestep, rather than using a fixed $\lambda$.

### DiffusionMBIR

Chung et al. (also 2023 — prolific group) combined diffusion priors with model-based iterative reconstruction (MBIR) for CT. Instead of simple gradient guidance, they alternate between full diffusion reverse steps and iterative physics-based updates. Think of it as interleaving OSEM iterations with diffusion denoising steps. The results are state-of-the-art for low-dose CT.

### Posterior-Mean Diffusion

Instead of sampling from the posterior (which gives you stochastic reconstructions), some recent work targets the posterior mean directly — the MMSE estimate. Feng et al. (2023) showed that with a modified sampling process, you can get the posterior mean in a single sampling chain, without needing to average over $N$ runs. Faster, deterministic, but you lose the uncertainty maps.

### Latent Diffusion for Medical Imaging

The elephant in the room: 3D medical volumes are *big*. A 400x400x400 PET volume at full resolution won't fit in GPU memory for a standard pixel-space diffusion model. Latent diffusion (Rombach et al., 2022 — the paper behind Stable Diffusion) compresses images to a lower-dimensional latent space first, runs diffusion there, then decodes.

For medical imaging, this is promising but tricky. The encoder-decoder introduces its own artifacts, and for reconstruction you need the data consistency step to operate in image space (because $A$ is defined in image space). Hybrid approaches — diffusion in latent space with data consistency in image space — are an active area of research. I expect this to be largely solved within a year.

### 3D Scalability: The Hard Problem

Let's be honest about the main limitation. Clinical PET reconstruction is 3D. The volumes are large. Diffusion sampling is slow. Multiply those together and you get a problem.

Current approaches for handling 3D:

- **Slice-by-slice**: Train a 2D model, reconstruct each slice independently. Fast but ignores inter-slice correlations.
- **Patch-based**: Train on 3D patches, reconstruct with overlapping patches and blending. Handles 3D structure but introduces boundary artifacts.
- **Latent diffusion**: Compress volume to latent space, diffuse in 3D latent space. Memory-efficient but adds decoder artifacts.
- **Cascaded**: Low-resolution 3D diffusion → super-resolution. Scales well but the low-res step limits final quality.

None of these is perfect. The community is actively working on it, and I think the combination of latent diffusion with hierarchical sampling will win out. But for now, if you want full 3D diffusion reconstruction at clinical resolution, be prepared to throw hardware at it.

---

## Where This Is Going

I'll make some predictions, because what's the point of being a researcher if you can't be wrong in public.

**Within 1 year**: Measurement-consistent diffusion reconstruction will match or beat supervised deep learning methods on standard benchmarks (fastMRI, AAPM low-dose CT challenge) while requiring no paired training data. The lack of paired data requirement is the killer feature — paired datasets in medical imaging are expensive and ethically complicated to acquire.

**Within 2-3 years**: Diffusion-based reconstruction will enter clinical trials. The uncertainty maps will be the selling point — regulatory bodies love quantified uncertainty. The speed problem will be addressed through a combination of distillation (training a fast student network to approximate the diffusion sampling in 1-4 steps), consistency models (Consistency Models by Song et al.), and dedicated hardware.

**Within 5 years**: Some form of diffusion-based or score-based reconstruction will be FDA-cleared for at least one modality (my bet: MRI first, then CT, then PET — in order of data availability and regulatory precedent).

The fundamental insight won't change: a learned prior over medical images, combined with physics-based measurement consistency at inference time, is the right decomposition of the reconstruction problem. Diffusion models just happen to be the best framework we have for learning that prior.

---

## Try It Yourself

I've put together a notebook that implements everything described in this post — from training a minimal DDPM on synthetic PET data to measurement-conditioned sampling with uncertainty quantification. It's designed to run on a single GPU (or even CPU, if you're patient) and focuses on building intuition rather than pushing state-of-the-art numbers.

**[Notebook III-c: Diffusion Models for PET Reconstruction](https://github.com/XingfuY/Deep_Learning_Medical_Image/blob/main/notebooks/03c_diffusion_reconstruction.ipynb)**

The notebook walks through:
1. Generating synthetic PET phantoms with realistic uptake patterns
2. Simulating Poisson measurements with a simple 2D system matrix
3. Training a time-conditioned U-Net from scratch
4. Standard (unconditional) sampling
5. Measurement-conditioned sampling with gradient guidance
6. Generating uncertainty maps from multiple sampling runs
7. Side-by-side comparison with filtered backprojection and OSEM

If you've followed along with the rest of the [Deep Learning for Medical Imaging](https://github.com/XingfuY/Deep_Learning_Medical_Image) series, this builds directly on the reconstruction concepts from Notebooks I-III. If not, the notebook is self-contained — you'll just appreciate the OSEM comparisons more if you've implemented OSEM yourself first.

The field is moving fast. But the math is stable, the ideas are clean, and there's never been a better time to get your hands dirty with generative models for inverse problems. Grab the notebook, tweak the parameters, break things, fix them. That's how you build intuition that papers can't give you.
