# Overfitting vs Underfitting — accuracy notes

**Definition.**
- *Overfitting*: the model fits the training data too closely — it learns the noise and quirks of the
  specific training examples instead of the underlying pattern. Training error is low, but error on
  unseen (validation/test) data is much higher. A large train–validation gap is the signature.
- *Underfitting*: the model is too simple (or under-trained / over-regularised) to capture the real
  pattern. Error is high on **both** the training set and unseen data.
- The goal is **generalisation**: low error on data the model has never seen.

**Problem it solves / why it matters.** We train on a finite, noisy sample but deploy on new data.
Training accuracy alone is misleading: a sufficiently flexible model (e.g. a high-degree polynomial,
a deep tree, a large net trained too long) can drive training error to ~0 by memorising points,
including their noise, and then predict badly on new inputs.

**How it works (bias–variance view).**
- Expected test error ≈ bias² + variance + irreducible noise.
- Underfitting ↔ high bias (systematic error from wrong/too simple assumptions).
- Overfitting ↔ high variance (predictions change a lot with the particular training sample).
- Classic picture vs model complexity: training error decreases monotonically as complexity grows;
  validation error first falls, then rises again (U-shape). Left side: both high = underfitting.
  Right side: training low, validation rising, gap widens = overfitting. The sweet spot is the
  complexity with the lowest validation error.
- Same shape over training epochs for neural nets: training loss keeps going down, validation loss
  falls then starts to rise once the model begins memorising → early stopping.
- (Modern caveat, not in the video: very over-parameterised nets can show "double descent"; the
  classic U-curve is still the standard interview answer.)

**States / flows.** Underfit (too simple) → good fit (sweet spot) → overfit (too complex). Diagnose by
comparing training vs validation error: both high → underfit; train low + val high → overfit;
both low and close → good fit.

**Production example (used in the video).** Training a fraud-detection classifier on card payments.
Each epoch, training loss drops. Validation loss (held-out payments) drops, then turns upward after
~epoch 12 as the model starts memorising specific training transactions. Early stopping monitors
validation loss (with some patience) and keeps the checkpoint with the best validation score.

**Fixes.**
- Overfitting: more (or augmented) training data, regularisation (L1/L2 weight decay), dropout,
  early stopping, simpler model / fewer features, pruning trees, cross-validation for model selection.
- Underfitting: more capacity (bigger model, more features, higher-degree terms), train longer,
  reduce regularisation.

**Misconceptions.**
- High training accuracy ≠ a good model; always judge on held-out data.
- More data helps overfitting but does little for underfitting (a too-simple model stays too simple).
- Validation set is used for tuning/early stopping; the test set should be touched once at the end.
- Overfitting is not only "too many parameters" — training too long also overfits.

**Interview points.** Define both with train/val error; bias vs variance mapping; the U-shaped
validation curve and sweet spot; fixes for each; early stopping; cross-validation.
