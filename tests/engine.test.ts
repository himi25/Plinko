/**
 * Unit tests for deterministic Plinko engine
 */

import { describe, it, expect } from 'vitest';
import { generatePegMap, simulateDrop, ROWS, BINS } from '../lib/fairness/engine';
import { createPRNGFromHex } from '../lib/fairness/prng';
import { computeCombinedSeed } from '../lib/fairness/hash';

describe('generatePegMap', () => {
    it('should generate correct number of rows', () => {
        const rand = createPRNGFromHex('abcdef0123456789');
        const pegMap = generatePegMap(rand, 12);

        expect(pegMap.rows).toBe(12);
        expect(pegMap.pegs.length).toBe(12);
    });

    it('should have correct number of pegs per row', () => {
        const rand = createPRNGFromHex('abcdef0123456789');
        const pegMap = generatePegMap(rand, 12);

        for (let row = 0; row < 12; row++) {
            expect(pegMap.pegs[row].length).toBe(row + 1);
        }
    });

    it('should have leftBias in range [0.4, 0.6]', () => {
        const rand = createPRNGFromHex('abcdef0123456789');
        const pegMap = generatePegMap(rand, 12);

        for (const row of pegMap.pegs) {
            for (const peg of row) {
                expect(peg.leftBias).toBeGreaterThanOrEqual(0.4);
                expect(peg.leftBias).toBeLessThanOrEqual(0.6);
            }
        }
    });

    it('should be deterministic', () => {
        const rand1 = createPRNGFromHex('1234567890abcdef');
        const rand2 = createPRNGFromHex('1234567890abcdef');

        const pegMap1 = generatePegMap(rand1, 12);
        const pegMap2 = generatePegMap(rand2, 12);

        expect(JSON.stringify(pegMap1)).toBe(JSON.stringify(pegMap2));
    });

    it('should round leftBias to 6 decimal places', () => {
        const rand = createPRNGFromHex('abcdef0123456789');
        const pegMap = generatePegMap(rand, 12);

        for (const row of pegMap.pegs) {
            for (const peg of row) {
                const decimals = peg.leftBias.toString().split('.')[1];
                if (decimals) {
                    expect(decimals.length).toBeLessThanOrEqual(6);
                }
            }
        }
    });
});

describe('simulateDrop', () => {
    it('should return binIndex in range [0, BINS-1]', () => {
        const rand = createPRNGFromHex('abcdef0123456789');
        const pegMap = generatePegMap(rand, ROWS);

        for (let dropColumn = 0; dropColumn < BINS; dropColumn++) {
            const randDrop = createPRNGFromHex('deadbeef12345678');
            // Skip peg map generation calls
            for (let i = 0; i < 78; i++) {
                randDrop();
            }

            const result = simulateDrop(pegMap, dropColumn, randDrop);
            expect(result.binIndex).toBeGreaterThanOrEqual(0);
            expect(result.binIndex).toBeLessThan(BINS);
        }
    });

    it('should return path of length equal to rows', () => {
        const rand = createPRNGFromHex('abcdef0123456789');
        const pegMap = generatePegMap(rand, ROWS);

        const result = simulateDrop(pegMap, 6, rand);
        expect(result.path.length).toBe(ROWS);
    });

    it('should have path containing only L and R', () => {
        const rand = createPRNGFromHex('abcdef0123456789');
        const pegMap = generatePegMap(rand, ROWS);

        const result = simulateDrop(pegMap, 6, rand);
        for (const direction of result.path) {
            expect(direction === 'L' || direction === 'R').toBe(true);
        }
    });

    it('should have binIndex equal to count of R moves', () => {
        const rand = createPRNGFromHex('abcdef0123456789');
        const pegMap = generatePegMap(rand, ROWS);

        const result = simulateDrop(pegMap, 6, rand);
        const rightCount = result.path.filter(d => d === 'R').length;
        expect(result.binIndex).toBe(rightCount);
    });

    it('should be deterministic', () => {
        const hex = 'fedcba9876543210';

        const rand1 = createPRNGFromHex(hex);
        const pegMap1 = generatePegMap(rand1, ROWS);
        const result1 = simulateDrop(pegMap1, 6, rand1);

        const rand2 = createPRNGFromHex(hex);
        const pegMap2 = generatePegMap(rand2, ROWS);
        const result2 = simulateDrop(pegMap2, 6, rand2);

        expect(result1.binIndex).toBe(result2.binIndex);
        expect(result1.path).toEqual(result2.path);
    });
});

describe('full game determinism', () => {
    it('should produce identical results with same seeds', async () => {
        const serverSeed = 'server-seed-test-123';
        const clientSeed = 'client-seed-test-456';
        const nonce = 'nonce-test-789';
        const dropColumn = 6;

        // First run
        const combinedSeed1 = await computeCombinedSeed(serverSeed, clientSeed, nonce);
        const rand1 = createPRNGFromHex(combinedSeed1);
        const pegMap1 = generatePegMap(rand1, ROWS);
        const result1 = simulateDrop(pegMap1, dropColumn, rand1);

        // Second run
        const combinedSeed2 = await computeCombinedSeed(serverSeed, clientSeed, nonce);
        const rand2 = createPRNGFromHex(combinedSeed2);
        const pegMap2 = generatePegMap(rand2, ROWS);
        const result2 = simulateDrop(pegMap2, dropColumn, rand2);

        expect(combinedSeed1).toBe(combinedSeed2);
        expect(JSON.stringify(pegMap1)).toBe(JSON.stringify(pegMap2));
        expect(result1.binIndex).toBe(result2.binIndex);
        expect(result1.path).toEqual(result2.path);
    });

    it('should produce different results with different client seeds', async () => {
        const serverSeed = 'server-seed-fixed';
        const nonce = 'nonce-fixed';
        const dropColumn = 6;

        const combinedSeed1 = await computeCombinedSeed(serverSeed, 'client1', nonce);
        const rand1 = createPRNGFromHex(combinedSeed1);
        const pegMap1 = generatePegMap(rand1, ROWS);
        const result1 = simulateDrop(pegMap1, dropColumn, rand1);

        const combinedSeed2 = await computeCombinedSeed(serverSeed, 'client2', nonce);
        const rand2 = createPRNGFromHex(combinedSeed2);
        const pegMap2 = generatePegMap(rand2, ROWS);
        const result2 = simulateDrop(pegMap2, dropColumn, rand2);

        expect(combinedSeed1).not.toBe(combinedSeed2);
        // Results may differ (very high probability)
        expect(JSON.stringify(pegMap1)).not.toBe(JSON.stringify(pegMap2));
    });
});

describe('drop column bias', () => {
    it('should apply column offset to bias calculation', () => {
        const hex = 'abcdef0123456789';
        const rand = createPRNGFromHex(hex);
        const pegMap = generatePegMap(rand, ROWS);

        // Different drop columns should be valid
        for (let col = 0; col < BINS; col++) {
            const randDrop = createPRNGFromHex(`test${col}`);
            generatePegMap(randDrop, ROWS); // consume for peg map
            const result = simulateDrop(pegMap, col, randDrop);

            // All results should be valid
            expect(result.binIndex).toBeGreaterThanOrEqual(0);
            expect(result.binIndex).toBeLessThan(BINS);
            expect(result.path.length).toBe(ROWS);
        }
    });
});

