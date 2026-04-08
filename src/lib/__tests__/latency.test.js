import { describe, it, expect } from "vitest";
import { rtt, moonRTT, EARTH_MOON_DISTANCE } from "../latency.js";

describe("latency", () => {
  it("computes RTT as 2L/c", () => {
    expect(rtt(299_792_458)).toBeCloseTo(2, 6);
  });

  it("Earth–Moon RTT is approximately 2.56 s", () => {
    const t = moonRTT();
    expect(t).toBeGreaterThan(2.5);
    expect(t).toBeLessThan(2.7);
  });

  it("uses the documented Earth–Moon distance", () => {
    expect(EARTH_MOON_DISTANCE).toBeCloseTo(3.844e8, -3);
  });
});
