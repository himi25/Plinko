/**
 * xorshift32 PRNG implementation for deterministic randomness
 * 
 * This PRNG is seeded from the first 4 bytes of the combined seed (big-endian).
 * It produces the same sequence of values for the same seed, ensuring
 * deterministic and reproducible game outcomes.
 */

/**
 * xorshift32 core function - single step
 * Returns the next state and the generated value
 */
export function xorshift32Step(state: number): { value: number; next: number } {
    // Ensure state is treated as unsigned 32-bit integer
    let x = state >>> 0;

    // xorshift32 algorithm
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;

    // Ensure result is unsigned 32-bit
    x = x >>> 0;

    return { value: x, next: x };
}

/**
 * Create a PRNG generator from a seed (Uint8Array)
 * Uses the first 4 bytes as big-endian unsigned 32-bit integer
 * 
 * @param seedBytes - Uint8Array of seed bytes (at least 4 bytes)
 * @returns A function that returns a float in [0, 1) on each call
 */
export function createPRNG(seedBytes: Uint8Array): () => number {
    // Extract first 4 bytes as big-endian unsigned 32-bit integer
    let state = (
        (seedBytes[0] << 24) |
        (seedBytes[1] << 16) |
        (seedBytes[2] << 8) |
        seedBytes[3]
    ) >>> 0;

    // xorshift32 cannot have a zero state - use 1 as fallback
    if (state === 0) {
        state = 1;
    }

    return function rand(): number {
        const result = xorshift32Step(state);
        state = result.next;
        // Convert to float in [0, 1) by dividing by 2^32
        return result.value / 0x100000000;
    };
}

/**
 * Create a PRNG from a hex string seed
 * Uses the first 4 bytes (8 hex characters) as the seed
 * 
 * @param hexSeed - Hex string (at least 8 characters for 4 bytes)
 * @returns A function that returns a float in [0, 1) on each call
 */
export function createPRNGFromHex(hexSeed: string): () => number {
    const bytes = new Uint8Array(4);
    for (let i = 0; i < 4; i++) {
        bytes[i] = parseInt(hexSeed.slice(i * 2, i * 2 + 2), 16);
    }
    return createPRNG(bytes);
}
