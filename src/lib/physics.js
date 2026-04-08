// Stefan–Boltzmann constant (W m^-2 K^-4)
export const SIGMA = 5.670374419e-8;

/**
 * Radiated power from a gray body.
 *   Q = ε σ A (T^4 - T0^4)
 */
export function radiatedPower({ emissivity, area, temperature, ambient }) {
  return emissivity * SIGMA * area * (temperature ** 4 - ambient ** 4);
}

/**
 * Solve ε σ A (T^4 - T0^4) = P for T (equilibrium temperature) in Kelvin.
 * Closed-form: T = (P / (εσA) + T0^4)^(1/4)
 */
export function equilibriumTemperature({ power, emissivity, area, ambient }) {
  const inside = power / (emissivity * SIGMA * area) + ambient ** 4;
  return Math.pow(inside, 1 / 4);
}
