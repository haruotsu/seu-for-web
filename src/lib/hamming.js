// Hamming(7,4) single-error-correcting code.
// Bit positions (1-indexed): p1 p2 d1 p4 d2 d3 d4
//   p1 covers 1,3,5,7
//   p2 covers 2,3,6,7
//   p4 covers 4,5,6,7

/**
 * Encode 4 data bits into a 7-bit Hamming codeword.
 * @param {number[]} d four bits, each 0|1
 * @returns {number[]} seven bits
 */
export function encode(d) {
  if (d.length !== 4) throw new Error("encode expects 4 bits");
  const [d1, d2, d3, d4] = d;
  const p1 = d1 ^ d2 ^ d4;
  const p2 = d1 ^ d3 ^ d4;
  const p4 = d2 ^ d3 ^ d4;
  return [p1, p2, d1, p4, d2, d3, d4];
}

/**
 * Decode a 7-bit Hamming word, correcting any single bit flip.
 * @param {number[]} c seven bits
 * @returns {{ data: number[], corrected: number|null }}
 *   corrected = 1-indexed bit position that was flipped, or null if clean.
 */
export function decode(c) {
  if (c.length !== 7) throw new Error("decode expects 7 bits");
  const bits = c.slice();
  const s1 = bits[0] ^ bits[2] ^ bits[4] ^ bits[6];
  const s2 = bits[1] ^ bits[2] ^ bits[5] ^ bits[6];
  const s4 = bits[3] ^ bits[4] ^ bits[5] ^ bits[6];
  const syndrome = s1 + (s2 << 1) + (s4 << 2);
  let corrected = null;
  if (syndrome !== 0) {
    bits[syndrome - 1] ^= 1;
    corrected = syndrome;
  }
  return { data: [bits[2], bits[4], bits[5], bits[6]], corrected };
}
