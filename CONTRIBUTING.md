# Contributing to Krylo

Thank you for helping! Krylo aims to be accurate, understandable and free for every student.

1. **Open an issue first** for bugs or ideas — describe what you expected and what happened (include the airfoil, angle and numbers).
2. **Keep the solver dependency-free.** `web/krylo.js` must run unchanged in browsers and Node.js.
3. **Every new method needs a validation case** in `web/validation.js`, with an independent reference (theory, textbook or published data) and a tolerance.
4. Run `node tests/run.js` — all checks must pass.
5. Explain the physics in `docs/METHODS.md` so others can learn from your change.

Good first contributions: NACA 5-digit airfoils, a viscous boundary-layer model (Thwaites + Head), compressibility correction (Prandtl–Glauert), swept wings (vortex-lattice method), Ukrainian translations of the documentation.
