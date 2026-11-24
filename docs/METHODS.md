# Krylo — methods

This document explains the physics and numerics behind every Krylo result, so that users can check and understand them.

## 1. Airfoil geometry
NACA 4-digit sections (`naca4`): digit 1 = maximum camber *m* (% chord), digit 2 = its position *p* (tenths of chord), digits 3–4 = thickness *t* (% chord). Standard thickness distribution with a closed trailing edge (last coefficient −0.1036), cosine point spacing (dense at leading and trailing edges). Custom airfoils are read in Selig `.dat` format.

## 2. Hess–Smith panel method
The surface is split into *N* straight panels. Each panel carries a constant-strength source *qᵢ*; all panels share one constant vortex strength *γ*.

* **Flow tangency** at each panel midpoint: the normal velocity from the free stream, all sources and the vortex sum to zero → *N* equations.
* **Kutta condition**: the tangential velocities on the first and last (trailing-edge) panels are equal and opposite → 1 equation.

The (*N*+1)×(*N*+1) linear system is solved by Gaussian elimination with partial pivoting. Influence coefficients use the analytical integrals of a constant-strength source/vortex panel (logarithm of the distance ratio and the subtended angle β).

Outputs: surface tangential speed *Vₜ*, pressure coefficient *Cp* = 1 − (*Vₜ*/*V*∞)², lift and pitching moment (about the quarter chord) by integrating pressure. Two internal checks are reported: pressure drag ≈ 0 (d'Alembert's paradox) and lift from pressure ≈ lift from circulation (Kutta–Joukowski, *cl* = 2Γ/(*V*∞*c*)).

**Limits:** inviscid and incompressible — no stall, no maximum lift, no viscous drag, no Mach effects.

## 3. Profile-drag estimate
*cd* ≈ 2·*Cf*·*FF*, with *Cf* = 1.328/√Re (laminar, Re < 5×10⁵) or 0.074/Re^0.2 (turbulent) and form factor *FF* = 1 + 2(*t/c*) + 60(*t/c*)⁴. This is an order-of-magnitude estimate for preliminary design, not a boundary-layer calculation.

## 4. Prandtl lifting-line theory
Circulation along the span: Γ(θ) = 2*bV*∞ Σ *Aₙ* sin(*n*θ), *y* = −(*b*/2)cos θ, odd *n* only (symmetric loading). Prandtl's equation is enforced at *N* collocation points θₖ = *k*π/(2*N*):

Σ *Aₙ* sin(*n*θ)(μ*n* + sin θ) = μ(α − α_L0) sin θ,  μ = *c*(θ)·*a*₀/(4*b*).

Results: *CL* = π·AR·*A*₁, *CDi* = π·AR·Σ *n*·*Aₙ*², span efficiency *e* = 1/(1 + δ), δ = Σₙ>₁ *n*(*Aₙ*/*A*₁)². Chord varies linearly with taper ratio λ; twist varies linearly from root to tip.

**Limits:** unswept wings of moderate-to-high aspect ratio, linear lift range.

## 5. International Standard Atmosphere
ISO 2533: troposphere (0–11 km) with lapse rate −6.5 K/km, isothermal lower stratosphere (11–20 km) at 216.65 K. Viscosity from Sutherland's law: μ = 1.458×10⁻⁶ *T*^1.5/(*T* + 110.4).

## 6. Flight performance
Parabolic drag polar *CD* = *CD0* + *k·CL*², *k* = 1/(π·*e*·AR).
* Stall speed *Vs* = √(2*W*/(ρ*S*·*CL*max)) — *CL*max must come from tests or data, because the inviscid solver cannot predict it.
* Best L/D: *CL** = √(*CD0*/*k*), (L/D)max = 1/(2√(*k·CD0*)).
* "Use in performance" copies wing *S* and AR and applies *e*_aircraft ≈ 0.85 × *e*_wing as a rule-of-thumb allowance for fuselage and interference effects.

## 7. Validation
`web/validation.js` holds 18 checks against independent references (thin-airfoil theory, Anderson's *Fundamentals of Aerodynamics*, the US Standard Atmosphere 1976). They run in the app's Validation tab and with `node tests/run.js`.

## References
* J. L. Hess, A. M. O. Smith, "Calculation of potential flow about arbitrary bodies", *Progress in Aerospace Sciences* 8 (1967).
* J. Moran, *An Introduction to Theoretical and Computational Aerodynamics*, Wiley (1984).
* J. D. Anderson, *Fundamentals of Aerodynamics*, McGraw-Hill.
* J. Katz, A. Plotkin, *Low-Speed Aerodynamics*, Cambridge University Press.
* ISO 2533:1975, *Standard Atmosphere*.
