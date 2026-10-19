# Sigmoid Function — accuracy notes

**Definition.** The logistic sigmoid σ(x) = 1 / (1 + e^(−x)). It maps any real number to the open
interval (0, 1). Smooth, monotonically increasing, S-shaped. σ(0) = 0.5; σ(x) → 1 as x → +∞ and → 0 as
x → −∞; symmetric: σ(−x) = 1 − σ(x).

**Problem it solves.** A model's final linear layer outputs an unbounded raw score (a *logit*,
w·x + b), which can be any real number. For binary classification we want P(class = 1), which must lie
in [0, 1]. Sigmoid converts the logit into that probability. (The logit is the inverse of the sigmoid:
logit(p) = ln(p / (1 − p)), the log-odds.)

**Values used in the video (checked numerically).**
- σ(0) = 0.5
- σ(2) = 0.8808 → "about 0.88";  σ(−2) = 0.1192 → "about 0.12"
- σ(2.5) = 0.9241 → "92%"
- σ(6) = 0.9975, σ(−6) = 0.0025 → saturated

**Gradient.** σ'(x) = σ(x)(1 − σ(x)). Maximum 0.25 at x = 0; near zero for |x| large (saturation).
Backprop multiplies these small derivatives through layers → vanishing gradients in deep networks with
sigmoid hidden units. Sigmoid is also not zero-centred.

**Where it is used (production).**
- Output of binary classifiers / logistic regression (spam vs not spam, fraud vs legit, click vs no click),
  trained with binary cross-entropy (log loss). Frameworks fuse them for numerical stability
  (PyTorch `BCEWithLogitsLoss`, TF `sigmoid_cross_entropy_with_logits`).
- Multi-label classification: one independent sigmoid per label.
- Gates inside LSTM / GRU cells (values 0..1 act as "how much to let through").
- Decision: compare probability with a threshold, 0.5 by default; the threshold is tunable
  (precision/recall trade-off).

**Example in the video.** Spam filter: features (links, "free", unknown sender) are weighted and summed
into a logit of 2.5 → σ(2.5) ≈ 0.92 → above 0.5 → spam folder. Illustrative numbers, behaviour is real.

**Misconceptions.**
- Sigmoid output is a probability only if the model is trained for it (e.g. with log loss); it is not
  automatically well calibrated.
- For mutually exclusive multi-class problems use softmax (sigmoid outputs don't sum to 1). Softmax with
  two classes is equivalent to a sigmoid.
- Modern hidden layers use ReLU / GELU rather than sigmoid because sigmoid saturates.
- Outputs never reach exactly 0 or 1.

**Interview points.**
1. σ(x) = 1/(1+e^−x), range (0,1), σ(0)=0.5, derivative σ(1−σ) (max 0.25).
2. Binary output + binary cross-entropy; logit = log-odds.
3. Softmax for multi-class, sigmoid per label for multi-label.
4. Saturation → vanishing gradients → prefer ReLU in hidden layers.
