/**
 * Triple Modular Redundancy: majority vote on three bits.
 * @param {number[]} votes exactly three 0|1 values
 */
export function majorityVote(votes) {
  if (votes.length !== 3) throw new Error("TMR needs 3 votes");
  const sum = votes[0] + votes[1] + votes[2];
  return sum >= 2 ? 1 : 0;
}
