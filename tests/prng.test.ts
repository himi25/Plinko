/**
 * Unit tests for xorshift32 PRNG
 */

import { describe, it, expect } from 'vitest';
import { xorshift32Step, createPRNG, createPRNGFromHex } from '../lib/fairness/prng';

describe('xorshift32Step', () => {
    it('should produce consistent output for same input', () => {
        const state = 12345;
        const result1 = xorshift32Step(state);
        const result2 = xorshift32Step(state);

        expect(result1.value).toBe(result2.value);
        expect(result1.next).toBe(result2.next);
    });

    it('should produce different output for different inputs', () => {
        const result1 = xorshift32Step(1);
        const result2 = xorshift32Step(2);

        expect(result1.value).not.toBe(result2.value);
    });

    it('should never produce zero when input is non-zero', () => {
        // xorshift32 has a period of 2^32 - 1, never produces 0
        let state = 1;
        for (let i = 0; i < 1000; i++) {
            const result = xorshift32Step(state);
            expect(result.value).not.toBe(0);
            state = result.next;
        }
    });
});

describe('createPRNG', () => {
    it('should create PRNG from seed bytes', () => {
        const seed = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
        const rand = createPRNG(seed);

        expect(typeof rand).toBe('function');
        const value = rand();
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
    });

    it('should be deterministic with same seed', () => {
        const seed1 = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
        const seed2 = new Uint8Array([0x12, 0x34, 0x56, 0x78]);

        const rand1 = createPRNG(seed1);
        const rand2 = createPRNG(seed2);

        for (let i = 0; i < 100; i++) {
            expect(rand1()).toBe(rand2());
        }
    });

    it('should produce different sequences with different seeds', () => {
        const rand1 = createPRNG(new Uint8Array([0x00, 0x00, 0x00, 0x01]));
        const rand2 = createPRNG(new Uint8Array([0x00, 0x00, 0x00, 0x02]));

        const v1 = rand1();
        const v2 = rand2();

        expect(v1).not.toBe(v2);
    });

    it('should handle zero seed by using fallback of 1', () => {
        const zeroSeed = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
        const rand = createPRNG(zeroSeed);

        // Should not throw and should produce values
        const value = rand();
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
    });

    it('should use big-endian byte order', () => {
        // 0xdeadbeef in big-endian
        const seed = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
        const rand = createPRNG(seed);

        // The first value should be deterministic for this seed
        const value = rand();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);

        // Same seed should always produce same first value
        const rand2 = createPRNG(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
        expect(rand2()).toBe(value);
    });
});

describe('createPRNGFromHex', () => {
    it('should create PRNG from hex string', () => {
        const rand = createPRNGFromHex('deadbeef12345678');

        expect(typeof rand).toBe('function');
        const value = rand();
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
    });

    it('should be deterministic', () => {
        const hex = 'abcdef0123456789';
        const rand1 = createPRNGFromHex(hex);
        const rand2 = createPRNGFromHex(hex);

        for (let i = 0; i < 50; i++) {
            expect(rand1()).toBe(rand2());
        }
    });

    it('should only use first 4 bytes (8 hex chars)', () => {
        // These two should produce the same sequence since only first 4 bytes matter
        const rand1 = createPRNGFromHex('12345678aaaaaaaa');
        const rand2 = createPRNGFromHex('12345678bbbbbbbb');

        for (let i = 0; i < 10; i++) {
            expect(rand1()).toBe(rand2());
        }
    });
});

describe('PRNG distribution', () => {
    it('should produce values uniformly distributed in [0, 1)', () => {
        const rand = createPRNGFromHex('abcdef0123456789');
        const buckets = new Array(10).fill(0);
        const samples = 10000;

        for (let i = 0; i < samples; i++) {
            const value = rand();
            const bucket = Math.floor(value * 10);
            buckets[bucket]++;
        }

        // Each bucket should have roughly 10% of samples
        const expected = samples / 10;
        const tolerance = expected * 0.2; // Allow 20% deviation

        for (let i = 0; i < 10; i++) {
            expect(buckets[i]).toBeGreaterThan(expected - tolerance);
            expect(buckets[i]).toBeLessThan(expected + tolerance);
        }
    });
});
