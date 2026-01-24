/**
 * Deterministic Plinko engine
 * 
 * Implements the core game logic with deterministic outcomes based on
 * the combined seed from the provably-fair protocol.
 */

import { sha256 } from './hash';

// Game constants
export const ROWS = 12;
export const BINS = ROWS + 1; // 13 bins (0-12)

// Type definitions
export interface Peg {
    row: number;
    index: number;
    leftBias: number; // probability of going left (0.4-0.6 range)
}

export interface PegMap {
    rows: number;
    pegs: Peg[][];
}

export interface DropResult {
    binIndex: number;
    path: ('L' | 'R')[];
    decisions: { row: number; pegIndex: number; bias: number; adjustedBias: number; rand: number; direction: 'L' | 'R' }[];
}

/**
 * Generate peg map with biases for each peg
 * 
 * For each row r (0-based), there are r+1 pegs.
 * Each peg has a leftBias = 0.5 + (rand() - 0.5) * 0.2
 * This gives a range of [0.4, 0.6]
 * 
 * @param rand - PRNG function returning float in [0, 1)
 * @param rows - Number of rows (default 12)
 * @returns PegMap with all peg biases
 */
export function generatePegMap(rand: () => number, rows: number = ROWS): PegMap {
    const pegs: Peg[][] = [];

    for (let row = 0; row < rows; row++) {
        const rowPegs: Peg[] = [];
        const pegCount = row + 1;

        for (let index = 0; index < pegCount; index++) {
            const randomValue = rand();
            // leftBias = 0.5 + (rand() - 0.5) * 0.2
            // Range: [0.4, 0.6]
            const leftBias = Number((0.5 + (randomValue - 0.5) * 0.2).toFixed(6));

            rowPegs.push({
                row,
                index,
                leftBias,
            });
        }

        pegs.push(rowPegs);
    }

    return { rows, pegs };
}

/**
 * Compute hash of peg map for verification
 * 
 * @param pegMap - The peg map to hash
 * @returns SHA-256 hash of JSON stringified peg map
 */
export async function computePegMapHash(pegMap: PegMap): Promise<string> {
    return sha256(JSON.stringify(pegMap));
}

/**
 * Simulate a ball drop through the peg map
 * 
 * Logic:
 * - pos = number of Right moves (starts at 0)
 * - For each row r, use peg at index min(pos, r)
 * - Drop column bias: adj = (dropColumn - floor(rows/2)) * 0.01
 * - adjustedBias = clamp(leftBias + adj, 0, 1)
 * - If rand() < adjustedBias → LEFT, else RIGHT (pos += 1)
 * - Final binIndex = pos
 * 
 * @param pegMap - The peg map with biases
 * @param dropColumn - Starting column (0 to BINS-1)
 * @param rand - PRNG function returning float in [0, 1)
 * @returns DropResult with binIndex, path, and decision details
 */
export function simulateDrop(
    pegMap: PegMap,
    dropColumn: number,
    rand: () => number
): DropResult {
    const { rows, pegs } = pegMap;

    // Calculate drop column adjustment
    // adj = (dropColumn - floor(rows/2)) * 0.01
    const centerColumn = Math.floor(rows / 2);
    const dropAdj = (dropColumn - centerColumn) * 0.01;

    let pos = 0; // Number of Right moves
    const path: ('L' | 'R')[] = [];
    const decisions: DropResult['decisions'] = [];

    for (let row = 0; row < rows; row++) {
        // Use peg at index min(pos, row)
        const pegIndex = Math.min(pos, row);
        const peg = pegs[row][pegIndex];

        // Calculate adjusted bias with drop column offset
        const adjustedBias = Math.max(0, Math.min(1, peg.leftBias + dropAdj));

        // Make decision
        const randValue = rand();
        let direction: 'L' | 'R';

        if (randValue < adjustedBias) {
            direction = 'L';
            // Left: pos stays the same
        } else {
            direction = 'R';
            pos += 1;
        }

        path.push(direction);
        decisions.push({
            row,
            pegIndex,
            bias: peg.leftBias,
            adjustedBias,
            rand: randValue,
            direction,
        });
    }

    // Final bin index = number of Right moves
    const binIndex = pos;

    return {
        binIndex,
        path,
        decisions,
    };
}

/**
 * Run a complete game round
 * 
 * @param combinedSeedHex - Combined seed as hex string
 * @param dropColumn - Starting column (0 to BINS-1)
 * @param rows - Number of rows (default 12)
 * @returns Complete game result with pegMap, hash, and drop result
 */
export async function runGame(
    combinedSeedHex: string,
    dropColumn: number,
    rows: number = ROWS,
    createPRNGFromHex: (hex: string) => () => number
): Promise<{
    pegMap: PegMap;
    pegMapHash: string;
    dropResult: DropResult;
}> {
    // Create PRNG from combined seed
    const rand = createPRNGFromHex(combinedSeedHex);

    // Generate peg map (consumes PRNG first)
    const pegMap = generatePegMap(rand, rows);
    const pegMapHash = await computePegMapHash(pegMap);

    // Simulate drop (PRNG continues from where peg map left off)
    const dropResult = simulateDrop(pegMap, dropColumn, rand);

    return {
        pegMap,
        pegMapHash,
        dropResult,
    };
}
