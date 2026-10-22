# Gradient Descent — accuracy notes

**Definition.** Gradient descent is an iterative optimisation algorithm that minimises a differentiable
loss function L(θ) by repeatedly moving the parameters a small step in the direction of the negative
gradient: θ ← θ − η · ∇L(θ), where η is the learning rate (step size).

**Problem it solves.** A model starts from random (or zero) weights, so its predictions are wrong.
The loss turns "how wrong" into a single number (lower is better). With millions of weights we cannot
try values by hand or grid-search them; we need to know which direction to move every weight at once.
The gradient gives exactly that: for each weight, how the loss changes if that weight increases.

**How it works.**
1. Forward pass: compute predictions and the loss.
2. Compute the gradient ∇L (in neural networks, via backpropagation).
3. The gradient points in the direction of steepest *increase*; step the opposite way.
4. Update: w_new = w_old − η · gradient.
5. Repeat until the loss stops improving (convergence) or for a fixed number of steps/epochs.
- With a fixed η, the step size is η·|gradient|, so steps naturally shrink as the slope flattens near a
  minimum.
- Learning rate: too large → overshoots, oscillates or diverges; too small → very slow progress.
- Convex losses (e.g. linear regression with MSE) have one global minimum. Neural-network losses are
  non-convex: local minima, plateaus and saddle points exist; in practice high-dimensional nets mostly
  face saddle points/plateaus rather than bad local minima.

**Variants.** Batch GD (full dataset per step), stochastic GD (one example), mini-batch GD (a batch of
e.g. 32–512 examples; what "SGD" means in practice). Momentum, RMSProp and Adam are adaptive /
accelerated variants of the same idea.

**Production example (used in the video).** Fitting a line to predict house price from size:
price ≈ w · size. Loss = mean squared error, which is a convex parabola in w. Each step: compute
the error on a batch of houses, compute dL/dw, update w; the fitted line rotates toward the data and
the loss falls. The same loop (forward → loss → backprop → optimizer step) trains every deep network.

**Misconceptions.**
- Gradient descent is not backpropagation: backprop computes the gradient; GD uses it to update.
- It does not guarantee the global minimum on non-convex losses.
- "Steps shrink" is because the gradient shrinks, not because the learning rate changes (unless a
  schedule is used).

**Interview points.** The update rule; role of learning rate; batch vs stochastic vs mini-batch;
convexity / local minima / saddle points; optimisers such as Adam; GD ≠ backprop.
