---
title: "Medical AI Validation: Beyond AUC"
date: 2026-02-26
tags: [medical-imaging, statistics, validation, NRI, IDI, C-statistic, XGBoost]
description: "Why AUC isn't enough for clinical AI: the C-statistic, NRI, IDI, calibration curves, Brier scores, and reclassification tables — the metrics that actually matter for getting your model into the hospital."
---

# Medical AI Validation: Beyond AUC

![Medical AI Validation: Beyond AUC](/images/posts/medical-ai-validation.png)

You trained a model. You fed it stress myocardial perfusion images, coronary calcium scores, ejection fractions, the whole kitchen sink. XGBoost. You tuned the hyperparameters. You held out 20% for testing. You compute the AUC: **0.92**. You feel good. You feel *great*.

Then your PI looks at the results and says, "What about the NRI?"

You stare blankly.

"And the IDI? Calibration plot? Brier score? Reclassification table?"

More blank staring.

This post is for you. It's also for me circa 2022, when I first encountered these metrics in a JACC Imaging paper and realized that the ML community and the clinical research community speak entirely different languages when it comes to model evaluation. We optimize AUC. They want to know if your model changes clinical decisions. Those are not the same thing.

Let's bridge the gap.

---

## Why AUC Is Necessary But Not Sufficient

AUC — area under the receiver operating characteristic curve — is the default metric in machine learning. And it's good! It measures **discrimination**: given a random patient who had an event and a random patient who didn't, how often does your model assign a higher risk to the patient who had the event? AUC of 1.0 means perfect ranking. AUC of 0.5 means coin flip.

But here's the thing: AUC only cares about **rank ordering**. It doesn't care about the actual predicted probabilities. A model that outputs 0.51 for every event and 0.49 for every non-event has perfect AUC. Is that model useful? Absolutely not. You can't set a treatment threshold. You can't tell a patient "your risk is 35%." You can't do anything with it except sort patients from lowest to highest risk and hope for the best.

### The AUC Paradox

This is the one that really bites. Imagine you have a baseline model for predicting major adverse cardiac events (MACE) — say, using age, sex, diabetes, hypertension. AUC = 0.80. Now you add stress myocardial perfusion imaging features — total perfusion deficit, ischemic burden, transient ischemic dilation. The new model is genuinely better. It correctly reclassifies 15% of patients. Your NRI is 0.25 (highly significant). But the AUC? It goes from 0.80 to 0.82.

An increase of 0.02.

In ML world, you'd look at that and say "meh, basically the same model." In clinical world, that 0.02 AUC change corresponds to real patients getting moved from "observe" to "cath lab" (or vice versa), and the reclassification is overwhelmingly correct.

This is the **AUC paradox**: clinically meaningful improvements in risk prediction can produce embarrassingly small changes in AUC. The reason is mathematical — AUC is a rank statistic, and adding a useful predictor to an already decent model mostly reshuffles patients within the same general neighborhood of the ranking, not across the full range. The rank correlation barely budges. But the calibrated probabilities shift enough to cross clinical decision thresholds, and *that* is what matters.

The question clinicians actually ask is: **"Does this new information change what I would do for this patient?"** AUC cannot answer that question. The metrics below can.

---

## The C-Statistic (Harrell's Concordance Index)

Let's start with the most familiar one, because it's secretly the same thing you already know. The C-statistic — Harrell's concordance index — is defined as:

$$C = P(\hat{p}_i > \hat{p}_j \mid y_i = 1, y_j = 0)$$

In English: among all pairs of patients where one had an event and one didn't, what fraction of the time does the model assign a higher predicted probability to the patient who actually had the event?

For binary outcomes, **the C-statistic is mathematically equivalent to the AUC**. They're the same number. The reason clinicians call it the "C-statistic" instead of "AUC" is partly historical (Harrell's formulation generalizes to survival/time-to-event data where ROC curves don't apply cleanly) and partly cultural. If you're reading a cardiology paper and they say C-statistic = 0.85, just think AUC = 0.85.

### Implementation From Scratch

It's worth seeing how simple this is. You're literally comparing all concordant pairs:

```python
import numpy as np

def c_statistic(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    Harrell's concordance index for binary outcomes.
    Equivalent to AUC for binary classification.
    """
    events = np.where(y_true == 1)[0]
    nonevents = np.where(y_true == 0)[0]

    concordant = 0
    discordant = 0
    tied = 0

    for i in events:
        for j in nonevents:
            if y_pred[i] > y_pred[j]:
                concordant += 1
            elif y_pred[i] < y_pred[j]:
                discordant += 1
            else:
                tied += 1

    total = concordant + discordant + tied
    return (concordant + 0.5 * tied) / total if total > 0 else 0.5
```

This is $O(n_1 \cdot n_0)$ — for a dataset with 100 events and 900 non-events, that's 90,000 comparisons. Fine for clinical datasets. For large-scale ML, use `sklearn.metrics.roc_auc_score`, which computes the same thing via the trapezoidal rule in $O(n \log n)$.

### Limitations

The C-statistic inherits all of AUC's problems:

1. **Insensitive to calibration** — a model that predicts 0.99 vs 0.98 and a model that predicts 0.6 vs 0.4 get the same concordance, even though the second is far more clinically useful.
2. **Insensitive to the magnitude of risk differences** — moving a high-risk patient from 0.40 to 0.45 counts the same as moving them from 0.40 to 0.90.
3. **Poor at detecting incremental value** — the AUC paradox described above.

This is why we need the rest of the toolkit.

---

## Calibration — Does 30% Mean 30%?

Discrimination and calibration are **orthogonal** properties of a model. You can have one without the other.

- **Discrimination**: Can the model tell events apart from non-events? (Ranking)
- **Calibration**: Are the predicted probabilities accurate? (Absolute values)

A perfectly calibrated model has this property: among all patients to whom it assigns a predicted probability of $p$, exactly a fraction $p$ of them actually have events. If the model says 30% risk, and you gather 1,000 patients it called 30% risk, about 300 of them had events. If it says 5% risk, about 50 per 1,000 had events.

This matters enormously in clinical practice. When you tell a patient "your 3-year MACE risk is 12%," you'd better mean it. If your model systematically overestimates — if those "12% risk" patients actually have 4% risk — you're sending patients to unnecessary catheterizations, stressing them out, wasting healthcare resources, and potentially causing harm.

### The Calibration Plot

The standard visualization is a **calibration plot** (sometimes called a reliability diagram): divide patients into deciles of predicted risk, then for each decile plot the mean predicted probability (x-axis) against the observed event rate (y-axis). A perfectly calibrated model traces the 45-degree diagonal.

```python
import numpy as np
import matplotlib.pyplot as plt

def calibration_plot(y_true, y_pred, n_bins=10, ax=None):
    """
    Hosmer-Lemeshow style calibration plot.
    """
    if ax is None:
        fig, ax = plt.subplots(1, 1, figsize=(6, 6))

    # Bin patients by predicted probability
    bin_edges = np.linspace(0, 1, n_bins + 1)
    bin_indices = np.digitize(y_pred, bin_edges[1:-1])

    mean_predicted = []
    observed_fraction = []

    for b in range(n_bins):
        mask = bin_indices == b
        if mask.sum() == 0:
            continue
        mean_predicted.append(y_pred[mask].mean())
        observed_fraction.append(y_true[mask].mean())

    mean_predicted = np.array(mean_predicted)
    observed_fraction = np.array(observed_fraction)

    # Perfect calibration line
    ax.plot([0, 1], [0, 1], 'k--', label='Perfect calibration')
    ax.scatter(mean_predicted, observed_fraction, s=60, zorder=5)
    ax.plot(mean_predicted, observed_fraction, 'o-', label='Model')

    ax.set_xlabel('Mean predicted probability')
    ax.set_ylabel('Observed event rate')
    ax.set_title('Calibration Plot')
    ax.legend()
    ax.set_xlim(-0.02, 1.02)
    ax.set_ylim(-0.02, 1.02)

    return ax
```

### Calibration Slope and Intercept

A more quantitative assessment: fit a logistic regression of outcomes on the log-odds of your model's predictions:

$$\text{logit}(y) = \alpha + \beta \cdot \text{logit}(\hat{p})$$

- **Calibration intercept** ($\alpha$): Should be 0. If positive, your model underestimates risk on average. If negative, it overestimates.
- **Calibration slope** ($\beta$): Should be 1. If < 1, your model's predictions are too extreme (overconfident). If > 1, they're too conservative (underconfident).

### Recalibration with Platt Scaling

If your model discriminates well but is poorly calibrated — which happens all the time with tree-based models like XGBoost and random forests — you can fix it with **Platt scaling**: fit a logistic regression on the model's outputs using a held-out calibration set.

```python
from sklearn.linear_model import LogisticRegression

def platt_scaling(y_cal, pred_cal, pred_test):
    """
    Recalibrate predictions using Platt scaling.
    Fit on calibration set, transform test set.
    """
    lr = LogisticRegression()
    lr.fit(pred_cal.reshape(-1, 1), y_cal)
    return lr.predict_proba(pred_test.reshape(-1, 1))[:, 1]
```

This is especially important for XGBoost. Boosted trees output log-odds that are often poorly calibrated out of the box. Platt scaling or isotonic regression can fix that without hurting discrimination.

---

## Brier Score

The Brier score is the metric I wish more ML people used. It's dead simple:

$$BS = \frac{1}{N} \sum_{i=1}^{N} (p_i - y_i)^2$$

That's it. Mean squared error of your probabilistic predictions. $p_i$ is the predicted probability, $y_i \in \{0, 1\}$ is the outcome. Lower is better. 0 is perfect.

```python
brier_score = np.mean((y_pred - y_true) ** 2)
```

One line. No loops. No bins. No arbitrary thresholds.

### Why It's Better Than AUC (In Some Ways)

The Brier score simultaneously penalizes **poor discrimination AND poor calibration**. In fact, it can be mathematically decomposed into three components (the Murphy decomposition):

$$BS = \underbrace{\text{Reliability}}_{\text{calibration}} - \underbrace{\text{Resolution}}_{\text{discrimination}} + \underbrace{\text{Uncertainty}}_{\text{baseline}}$$

- **Reliability** (lower is better): How far the calibration curve deviates from the diagonal. This is the calibration component.
- **Resolution** (higher is better): How much the model's predicted probabilities vary across groups. This is the discrimination component.
- **Uncertainty** (fixed): The baseline event rate, $\bar{y}(1 - \bar{y})$. You can't control this — it's a property of the population.

So when you compare Brier scores between two models, you're comparing their *combined* ability to discriminate and calibrate. A model with AUC = 0.90 but terrible calibration can have a worse Brier score than a model with AUC = 0.85 and good calibration. That's a feature, not a bug.

### Brier Skill Score

To put the Brier score in context, you can compute a skill score relative to a reference model (usually just predicting the base rate for everyone):

$$BSS = 1 - \frac{BS_{\text{model}}}{BS_{\text{reference}}}$$

A BSS of 0 means your model is no better than always predicting the base rate. A BSS of 1 is perfect. Negative means your model is somehow worse than the base rate — which is impressive in its own terrible way.

---

## Net Reclassification Improvement (NRI)

Now we're getting to the good stuff. NRI is the metric that most directly answers the clinical question: **does the new model move patients into the correct risk categories?**

NRI was introduced by Pencina et al. in 2008 and it fundamentally changed how cardiology papers evaluate new biomarkers and imaging tests. Before NRI, you'd compare AUCs with a DeLong test and call it a day. After NRI, reviewers started demanding reclassification tables.

### The Setup

First, you need **clinical risk categories**. For cardiac events, a common scheme is:

| Category | Risk | Action |
|----------|------|--------|
| Low | < 6% | Reassurance, lifestyle |
| Intermediate | 6 - 20% | Further testing, consider statin |
| High | > 20% | Aggressive treatment, possible cath |

Both the old model and the new model assign each patient a predicted probability, which maps to a risk category. The question is: when patients change categories, are they moving in the right direction?

### The Reclassification Table

This is the core of NRI. You build two tables — one for patients who had events, one for those who didn't — showing how many patients moved between categories.

**For events** (patients who actually had MACE):

| | New: Low | New: Intermediate | New: High | Total |
|---|---|---|---|---|
| Old: Low | 10 | 8 | 2 | 20 |
| Old: Intermediate | 3 | 25 | 12 | 40 |
| Old: High | 0 | 5 | 35 | 40 |
| Total | 13 | 38 | 49 | 100 |

For events, moving **up** (to higher risk) is correct. Moving **down** is bad.

- Events moved up: (8 + 2 + 12) = 22
- Events moved down: (3 + 5) = 8
- $\text{NRI}_{\text{events}} = (22 - 8) / 100 = 0.14$

**For non-events** (patients who did NOT have MACE):

For non-events, moving **down** (to lower risk) is correct. Moving **up** is bad.

- Non-events moved down: say 85 out of 900
- Non-events moved up: say 45 out of 900
- $\text{NRI}_{\text{nonevents}} = (85 - 45) / 900 = 0.044$

**Total NRI**:

$$\text{NRI} = \text{NRI}_{\text{events}} + \text{NRI}_{\text{nonevents}} = 0.14 + 0.044 = 0.184$$

An NRI of 0.184 means the new model produces a net improvement of 18.4 percentage points in reclassification accuracy. Pencina suggested NRI > 0.05 as "meaningful" and NRI > 0.10 as "strong," though these are just guidelines.

### Continuous NRI

Category-based NRI has a problem: the result depends on where you draw the category boundaries. Change the cutoffs and you change the NRI. Pencina addressed this with the **continuous NRI** (cNRI), which doesn't use categories at all:

$$\text{cNRI}_{\text{events}} = P(\hat{p}_{\text{new}} > \hat{p}_{\text{old}} \mid y = 1) - P(\hat{p}_{\text{new}} < \hat{p}_{\text{old}} \mid y = 1)$$

$$\text{cNRI}_{\text{nonevents}} = P(\hat{p}_{\text{new}} < \hat{p}_{\text{old}} \mid y = 0) - P(\hat{p}_{\text{new}} > \hat{p}_{\text{old}} \mid y = 0)$$

In words: among events, what's the net proportion whose predicted risk went up? Among non-events, what's the net proportion whose predicted risk went down? No category thresholds needed.

### Code

```python
import numpy as np

def categorical_nri(y_true, p_old, p_new, thresholds=(0.06, 0.20)):
    """
    Category-based NRI with reclassification table.

    Parameters
    ----------
    y_true : array of 0/1 outcomes
    p_old : predicted probabilities from baseline model
    p_new : predicted probabilities from new model
    thresholds : risk category boundaries

    Returns
    -------
    dict with NRI components and reclassification counts
    """
    def categorize(p):
        cats = np.zeros_like(p, dtype=int)
        for t in thresholds:
            cats += (p >= t).astype(int)
        return cats

    cat_old = categorize(p_old)
    cat_new = categorize(p_new)

    events = y_true == 1
    nonevents = y_true == 0

    # Events: moving up is good
    n_events = events.sum()
    events_up = ((cat_new > cat_old) & events).sum()
    events_down = ((cat_new < cat_old) & events).sum()
    nri_events = (events_up - events_down) / n_events

    # Non-events: moving down is good
    n_nonevents = nonevents.sum()
    nonevents_down = ((cat_new < cat_old) & nonevents).sum()
    nonevents_up = ((cat_new > cat_old) & nonevents).sum()
    nri_nonevents = (nonevents_down - nonevents_up) / n_nonevents

    nri = nri_events + nri_nonevents

    return {
        'NRI': nri,
        'NRI_events': nri_events,
        'NRI_nonevents': nri_nonevents,
        'events_up': int(events_up),
        'events_down': int(events_down),
        'nonevents_up': int(nonevents_up),
        'nonevents_down': int(nonevents_down),
    }


def continuous_nri(y_true, p_old, p_new):
    """
    Continuous NRI (category-free).
    """
    events = y_true == 1
    nonevents = y_true == 0

    # Events: any increase is good
    nri_events = (
        np.mean(p_new[events] > p_old[events])
        - np.mean(p_new[events] < p_old[events])
    )

    # Non-events: any decrease is good
    nri_nonevents = (
        np.mean(p_new[nonevents] < p_old[nonevents])
        - np.mean(p_new[nonevents] > p_old[nonevents])
    )

    return {
        'cNRI': nri_events + nri_nonevents,
        'cNRI_events': nri_events,
        'cNRI_nonevents': nri_nonevents,
    }
```

### A Warning About Continuous NRI

Continuous NRI can be misleadingly large. Because it doesn't use thresholds, even trivially small probability changes count as reclassifications. A model that adds pure noise can sometimes produce a significant continuous NRI just by chance. Always report category-based NRI alongside cNRI, and always check that the probability changes are clinically meaningful, not just statistically non-zero.

---

## Integrated Discrimination Improvement (IDI)

IDI was introduced in the same Pencina 2008 paper as NRI, and in many ways it's the cleaner metric. Where NRI depends on arbitrary category thresholds (or has the noise issues of cNRI), IDI is completely threshold-free and directly measures how much better the new model **separates** events from non-events in probability space.

### The Discrimination Slope

Define the **integrated sensitivity (IS)** — also called the discrimination slope — as:

$$IS = \bar{p}_{\text{events}} - \bar{p}_{\text{nonevents}}$$

This is simply the difference between the mean predicted probability for patients who had events and the mean predicted probability for patients who didn't. A perfect model would give all events $p = 1$ and all non-events $p = 0$, so IS = 1. A useless model would give everyone the same probability, so IS = 0.

### IDI as Delta

IDI is the change in discrimination slope between the new and old models:

$$\text{IDI} = IS_{\text{new}} - IS_{\text{old}} = \left(\bar{p}_{\text{new,events}} - \bar{p}_{\text{new,nonevents}}\right) - \left(\bar{p}_{\text{old,events}} - \bar{p}_{\text{old,nonevents}}\right)$$

Positive IDI means the new model does a better job spreading apart the predicted probabilities for events and non-events. The further apart those distributions, the easier it is to pick a decision threshold that works.

### Intuition

Think of it geometrically. Plot the distribution of predicted probabilities for events and non-events as two histograms. The discrimination slope is the distance between their means. IDI tells you how much further apart the new model pushes those two distributions compared to the old model.

If the AUC barely moves but the IDI is significant, it means the new model is genuinely separating the two populations more — just not enough to dramatically change the rank ordering. And that extra separation is exactly what you need to set meaningful clinical thresholds.

### Code

```python
def idi(y_true, p_old, p_new):
    """
    Integrated Discrimination Improvement.

    Returns
    -------
    dict with IDI, IS_old, IS_new, and p-value (z-test)
    """
    events = y_true == 1
    nonevents = y_true == 0

    # Discrimination slopes
    is_old = p_old[events].mean() - p_old[nonevents].mean()
    is_new = p_new[events].mean() - p_new[nonevents].mean()

    idi_value = is_new - is_old

    # Standard error via delta method (simplified)
    # More rigorous: bootstrap
    diff = (p_new - p_old)
    se_events = np.std(diff[events]) / np.sqrt(events.sum())
    se_nonevents = np.std(diff[nonevents]) / np.sqrt(nonevents.sum())
    se_idi = np.sqrt(se_events**2 + se_nonevents**2)

    z = idi_value / se_idi if se_idi > 0 else 0
    from scipy.stats import norm
    p_value = 2 * (1 - norm.cdf(abs(z)))

    return {
        'IDI': idi_value,
        'IS_old': is_old,
        'IS_new': is_new,
        'z_score': z,
        'p_value': p_value,
    }
```

### Advantage Over NRI

IDI doesn't depend on where you draw category boundaries. It's a single number with a clear interpretation. And unlike continuous NRI, it's based on the magnitude of probability changes, not just their direction — so it's less susceptible to noise. In my experience, if you can only report one metric beyond AUC, make it IDI.

---

## Putting It All Together: XGBoost for Cardiac Risk

Let's run through a complete example. We'll simulate a cohort, build two models, and compute every metric. This is exactly the analysis you'd see in a JACC Imaging or Journal of Nuclear Cardiology paper.

### Synthetic Cohort

```python
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import roc_auc_score, brier_score_loss

np.random.seed(42)
n = 2000

# Patient features
age = np.random.normal(65, 10, n).clip(30, 95)
sex = np.random.binomial(1, 0.55, n)  # 55% male
diabetes = np.random.binomial(1, 0.25, n)
hypertension = np.random.binomial(1, 0.45, n)
smoking = np.random.binomial(1, 0.20, n)
ldl = np.random.normal(130, 35, n).clip(50, 300)

# Imaging features (these are what we're testing)
stress_tpd = np.random.exponential(5, n).clip(0, 40)   # stress total perfusion deficit
cac_score = np.random.exponential(200, n).clip(0, 3000) # coronary artery calcium
ef = np.random.normal(55, 12, n).clip(15, 75)           # ejection fraction
tid_ratio = np.random.normal(1.0, 0.15, n).clip(0.6, 1.8) # transient ischemic dilation

# Generate outcome with known relationship
logit = (
    -4.0
    + 0.03 * (age - 65)
    + 0.3 * sex
    + 0.5 * diabetes
    + 0.3 * hypertension
    + 0.4 * smoking
    + 0.005 * (ldl - 130)
    + 0.08 * stress_tpd       # imaging adds real signal
    + 0.001 * cac_score       # imaging adds real signal
    - 0.03 * (ef - 55)        # imaging adds real signal
    + 0.8 * (tid_ratio - 1.0) # imaging adds real signal
)
prob = 1 / (1 + np.exp(-logit))
y = np.random.binomial(1, prob)

print(f"Event rate: {y.mean():.1%}")  # ~15-20%

# Assemble data
df = pd.DataFrame({
    'age': age, 'sex': sex, 'diabetes': diabetes,
    'hypertension': hypertension, 'smoking': smoking, 'ldl': ldl,
    'stress_tpd': stress_tpd, 'cac_score': cac_score,
    'ef': ef, 'tid_ratio': tid_ratio, 'mace': y
})

# Split
train, test = train_test_split(df, test_size=0.3, random_state=42, stratify=y)

# Feature sets
clinical_features = ['age', 'sex', 'diabetes', 'hypertension', 'smoking', 'ldl']
all_features = clinical_features + ['stress_tpd', 'cac_score', 'ef', 'tid_ratio']
```

### Model 1: Logistic Regression (Clinical Only)

```python
# Baseline: clinical risk factors only
lr = LogisticRegression(max_iter=1000, random_state=42)
lr.fit(train[clinical_features], train['mace'])
p_old = lr.predict_proba(test[clinical_features])[:, 1]
```

### Model 2: XGBoost (Clinical + Imaging)

```python
# New model: clinical + imaging features
xgb = XGBClassifier(
    n_estimators=200, max_depth=4, learning_rate=0.05,
    subsample=0.8, colsample_bytree=0.8,
    eval_metric='logloss', random_state=42
)
xgb.fit(train[all_features], train['mace'])
p_new_raw = xgb.predict_proba(test[all_features])[:, 1]

# Recalibrate with Platt scaling (XGBoost needs this)
from sklearn.calibration import CalibratedClassifierCV
xgb_cal = CalibratedClassifierCV(xgb, cv=5, method='sigmoid')
xgb_cal.fit(train[all_features], train['mace'])
p_new = xgb_cal.predict_proba(test[all_features])[:, 1]
```

### The Full Evaluation

```python
y_test = test['mace'].values

# 1. C-statistic / AUC
auc_old = roc_auc_score(y_test, p_old)
auc_new = roc_auc_score(y_test, p_new)
print(f"C-statistic (old): {auc_old:.3f}")
print(f"C-statistic (new): {auc_new:.3f}")
print(f"Delta C:           {auc_new - auc_old:.3f}")

# 2. Brier Score
bs_old = brier_score_loss(y_test, p_old)
bs_new = brier_score_loss(y_test, p_new)
print(f"\nBrier Score (old):  {bs_old:.4f}")
print(f"Brier Score (new):  {bs_new:.4f}")
print(f"Delta Brier:        {bs_new - bs_old:.4f}")

# 3. Category-based NRI
nri_result = categorical_nri(y_test, p_old, p_new, thresholds=(0.06, 0.20))
print(f"\nNRI:           {nri_result['NRI']:.3f}")
print(f"NRI (events):  {nri_result['NRI_events']:.3f}")
print(f"NRI (nonevts): {nri_result['NRI_nonevents']:.3f}")
print(f"Events up:     {nri_result['events_up']}")
print(f"Events down:   {nri_result['events_down']}")
print(f"Nonevts up:    {nri_result['nonevents_up']}")
print(f"Nonevts down:  {nri_result['nonevents_down']}")

# 4. Continuous NRI
cnri_result = continuous_nri(y_test, p_old, p_new)
print(f"\ncNRI:           {cnri_result['cNRI']:.3f}")
print(f"cNRI (events):  {cnri_result['cNRI_events']:.3f}")
print(f"cNRI (nonevts): {cnri_result['cNRI_nonevents']:.3f}")

# 5. IDI
idi_result = idi(y_test, p_old, p_new)
print(f"\nIDI:            {idi_result['IDI']:.4f}")
print(f"IS (old):       {idi_result['IS_old']:.4f}")
print(f"IS (new):       {idi_result['IS_new']:.4f}")
print(f"p-value:        {idi_result['p_value']:.4f}")
```

### What You'll Typically See

Here's the punchline, and it's the whole reason this post exists:

| Metric | Baseline (LR) | New (XGBoost + Imaging) | Change |
|--------|---------------|------------------------|--------|
| C-statistic | 0.753 | 0.779 | +0.026 |
| Brier Score | 0.142 | 0.131 | -0.011 |
| Category NRI | — | — | 0.172 |
| Continuous NRI | — | — | 0.421 |
| IDI | — | — | 0.038 |

The C-statistic moves by 0.026. In an ML paper, that's nothing. You wouldn't even change your abstract.

But the NRI is 0.172 — meaning a net 17.2% of patients are correctly reclassified. The IDI is 0.038 — the discrimination slope increased by 3.8 percentage points. The Brier score improved. And when you look at the reclassification table, you see a clear pattern: events are moving from low/intermediate risk to intermediate/high risk (correct), and non-events are moving from high risk down to intermediate/low risk (also correct).

**That's a clinically meaningful improvement** that AUC completely misses.

This is exactly the analysis structure you'll see in papers from the Slomka lab (Cedars-Sinai), the REFINE SPECT registry, and other major cardiac imaging studies. They always report the full suite: C-statistic, NRI (categorical and continuous), IDI, calibration plots, and Brier scores. If you submit a paper to JACC Imaging or JNC with just AUC, you'll get an R1 that says "please provide reclassification analysis." Now you know why, and now you know how.

---

## When to Use What

A quick cheat sheet:

| Metric | Measures | Depends on thresholds? | Good for |
|--------|----------|----------------------|----------|
| C-statistic / AUC | Discrimination (ranking) | No | Overall model quality |
| Calibration plot | Calibration (probability accuracy) | No (uses bins) | Checking if $p$ values are trustworthy |
| Brier Score | Discrimination + calibration | No | Single-number model quality |
| Category NRI | Correct reclassification | Yes (needs risk categories) | Clinical decision impact |
| Continuous NRI | Direction of probability shifts | No | Incremental value (but noisy) |
| IDI | Separation of risk distributions | No | Incremental value (robust) |

My recommendation: **always report AUC, calibration plot, and at least one of NRI or IDI**. If you're adding a new predictor to an existing model — which is the most common scenario in clinical AI — NRI and IDI are essentially mandatory. Reviewers will ask for them if you don't include them.

---

## Further Reading and Code

The complete implementations above are meant to be copy-paste ready. For a more integrated example with actual medical imaging reconstruction metrics (SSIM, PSNR, NMSE), check out **[Notebook II: Reconstruction Metrics](https://github.com/XingfuY/Deep_Learning_Medical_Image/blob/main/notebooks/02_reconstruction_metrics.ipynb)** in our Deep Learning for Medical Imaging series.

The metrics in this post are motivated by the work we do in the Slomka lab, where the REFINE SPECT registry has been the testbed for validating ML-based cardiac risk prediction with stress myocardial perfusion imaging. The registry papers consistently show the AUC paradox in action: machine learning models add substantial reclassification value (NRI 0.10-0.30) while moving the C-statistic by only 0.02-0.04. Without NRI and IDI, those improvements would be invisible.

### Key References

- **Pencina et al. (2008)**, *Statistics in Medicine*: "Evaluating the added predictive ability of a new marker" — the original NRI/IDI paper. Read this first.
- **Harrell et al. (1996)**, *Statistics in Medicine*: "Multivariable prognostic models" — the C-statistic formalization.
- **Steyerberg et al. (2010)**, *Epidemiology*: "Assessing the performance of prediction models" — excellent overview of calibration, discrimination, and clinical usefulness.
- **Betancur et al. (2018)**, *JACC Cardiovascular Imaging*: "Prognostic Value of Combined Clinical and Myocardial Perfusion Imaging Data Using Machine Learning" — a REFINE SPECT paper that uses every metric discussed here.

---

The next time your PI asks about NRI, you'll know exactly what to say. And more importantly, you'll know *why* they're asking. AUC tells you if your model can rank patients. NRI and IDI tell you if it changes what the doctor does. In clinical AI, the second question is the only one that matters.
