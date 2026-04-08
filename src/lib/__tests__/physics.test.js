import { describe, it, expect } from "vitest";
import { equilibriumTemperature, radiatedPower } from "../physics.js";

describe("physics: Stefan–Boltzmann", () => {
  const base = { emissivity: 0.9, area: 2, ambient: 100 };

  it("returns ambient temperature when power is zero", () => {
    const T = equilibriumTemperature({ ...base, power: 0 });
    expect(T).toBeCloseTo(100, 6);
  });

  it("is monotonically increasing in power", () => {
    const T1 = equilibriumTemperature({ ...base, power: 100 });
    const T2 = equilibriumTemperature({ ...base, power: 1000 });
    expect(T2).toBeGreaterThan(T1);
  });

  it("is the inverse of radiatedPower", () => {
    const T = equilibriumTemperature({ ...base, power: 500 });
    const Q = radiatedPower({ ...base, temperature: T });
    expect(Q).toBeCloseTo(500, 4);
  });

  it("smaller radiating area gives a hotter equilibrium", () => {
    const big = equilibriumTemperature({ ...base, power: 500, area: 10 });
    const small = equilibriumTemperature({ ...base, power: 500, area: 0.5 });
    expect(small).toBeGreaterThan(big);
  });
});
