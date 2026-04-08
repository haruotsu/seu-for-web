import { describe, it, expect } from "vitest";
import { majorityVote } from "../tmr.js";

describe("TMR majority vote", () => {
  it("agrees when all replicas agree", () => {
    expect(majorityVote([0, 0, 0])).toBe(0);
    expect(majorityVote([1, 1, 1])).toBe(1);
  });

  it("corrects a single dissenter", () => {
    expect(majorityVote([0, 1, 0])).toBe(0);
    expect(majorityVote([1, 0, 1])).toBe(1);
    expect(majorityVote([1, 1, 0])).toBe(1);
  });
});
