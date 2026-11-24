# Krylo — open-source aerodynamic analysis

**Krylo** (Ukrainian *крило*, "wing") is free, open-source software for aerodynamic analysis that runs entirely in a web browser — no installation, no account, works on phones and on slow connections.

| Tool | Method | Outputs |
|---|---|---|
| Airfoil | Hess–Smith source–vortex panel method | Pressure distribution, *cl*, *cm*, profile-drag estimate |
| Polar | Angle-of-attack sweep | Lift-curve slope, zero-lift angle, *cl*(α), *cm*(α) |
| Wing | Prandtl lifting-line theory (Glauert series) | *CL*, induced drag, span efficiency, span loading |
| Atmosphere | ISO 2533 standard atmosphere, 0–20 km | *T*, *p*, ρ, speed of sound, viscosity |
| Performance | Parabolic drag polar | Stall speed, best-L/D speed, drag and power curves |
| Validation | 18 checks against theory and standard tables | Pass/fail with references |

Every tool exports CSV. The interface is in **English and Ukrainian**.

## Use it
Open `web/index.html` in any browser, or use the hosted version (add your link here after deploying).

## Accuracy
Krylo is validated against analytical theory, textbook values and the standard atmosphere — see the **Validation** tab or run:

```
node tests/run.js
```

Example: NACA 2412 zero-lift angle −2.12° (theory −2.08°, experiment ≈ −2.1°); rectangular wing AR 6 span efficiency 0.954 (textbook ≈ 0.95).

**Limitations:** the airfoil solver is inviscid and incompressible — it does not predict stall, maximum lift or viscous drag. Results are for education and preliminary design, not certification. Details in [docs/METHODS.md](docs/METHODS.md).

## Project structure
```
web/krylo.js        solver library (no dependencies; browser + Node.js)
web/validation.js   validation cases shared by app and tests
web/app.js          user interface
web/index.html      page
tests/run.js        command-line test runner
docs/METHODS.md     physics and numerics explained
```

## Deploy your own copy
Drag the `web` folder onto Netlify (app.netlify.com → Add new project → Deploy manually), or enable GitHub Pages on the repository with `web/` as the published folder.

## Roadmap
NACA 5-digit sections · viscous boundary layer (Thwaites/Head) · Prandtl–Glauert compressibility correction · vortex-lattice method for swept wings · propeller blade-element momentum theory.

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md). Issues and pull requests are welcome.

## License
[MIT](LICENSE) © 2026 Antony Sheshenya and Krylo contributors.
