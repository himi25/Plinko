/**
 * Fixed symmetric payout table for Plinko bins 0-12
 * 
 * Higher multipliers near edges, lower in center.
 * Values are multipliers (e.g., 110 = 110x bet)
 */

// Bin 0 = 110x, Bin 6 = 1x, Bin 12 = 110x (symmetric)
export const PAYOUT_TABLE: readonly number[] = [
    110,  // Bin 0 (leftmost edge)
    40,   // Bin 1
    20,   // Bin 2
    10,   // Bin 3
    4,    // Bin 4
    2,    // Bin 5
    1,    // Bin 6 (center)
    2,    // Bin 7
    4,    // Bin 8
    10,   // Bin 9
    20,   // Bin 10
    40,   // Bin 11
    110,  // Bin 12 (rightmost edge)
] as const;

/**
 * Get payout multiplier for a given bin index
 * 
 * @param binIndex - Bin index (0-12)
 * @returns Payout multiplier
 */
export function getPayoutMultiplier(binIndex: number): number {
    if (binIndex < 0 || binIndex >= PAYOUT_TABLE.length) {
        throw new Error(`Invalid bin index: ${binIndex}. Must be 0-${PAYOUT_TABLE.length - 1}`);
    }
    return PAYOUT_TABLE[binIndex];
}

/**
 * Calculate payout in cents
 * 
 * @param betCents - Bet amount in cents
 * @param binIndex - Landing bin index (0-12)
 * @returns Payout amount in cents
 */
export function calculatePayout(betCents: number, binIndex: number): number {
    const multiplier = getPayoutMultiplier(binIndex);
    return Math.floor(betCents * multiplier);
}
