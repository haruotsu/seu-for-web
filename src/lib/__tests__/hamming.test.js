import { describe, it, expect } from "vitest";
import { encode, decode } from "../hamming.js";

describe("Hamming(7,4)", () => {
  const cases = [
    [0, 0, 0, 0],
    [1, 0, 1, 1],
    [1, 1, 1, 1],
    [0, 1, 1, 0],
    [1, 0, 0, 0],
  ];

  it("round-trips clean codewords", () => {
    for (const d of cases) {
      const c = encode(d);
      expect(c).toHaveLength(7);
      const { data, corrected } = decode(c);
      expect(data).toEqual(d);
      expect(corrected).toBeNull();
    }
  });

  it("corrects any single bit flip", () => {
    for (const d of cases) {
      const c = encode(d);
      for (let i = 0; i < 7; i++) {
        const flipped = c.slice();
        flipped[i] ^= 1;
        const { data, corrected } = decode(flipped);
        expect(data).toEqual(d);
        expect(corrected).toBe(i + 1);
      }
    }
  });
});
