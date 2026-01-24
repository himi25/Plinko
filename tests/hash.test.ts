/**
 * Unit tests for SHA-256 hashing utilities
 */

import { describe, it, expect } from 'vitest';
import { sha256, computeCommit, computeCombinedSeed, hexToBytes, generateRandomHex } from '../lib/fairness/hash';

describe('sha256', () => {
    it('should hash empty string correctly', async () => {
        const hash = await sha256('');
        expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });

    it('should hash "hello" correctly', async () => {
        const hash = await sha256('hello');
        expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    });

    it('should hash "test:value" format correctly', async () => {
        const hash = await sha256('test:value');
        expect(hash).toHaveLength(64);
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should be deterministic', async () => {
        const input = 'deterministic-test-input';
        const hash1 = await sha256(input);
        const hash2 = await sha256(input);
        expect(hash1).toBe(hash2);
    });
});

describe('computeCommit', () => {
    it('should compute SHA256(serverSeed + ":" + nonce)', async () => {
        const serverSeed = 'abc123';
        const nonce = 'xyz789';

        const commit = await computeCommit(serverSeed, nonce);
        const expected = await sha256(`${serverSeed}:${nonce}`);

        expect(commit).toBe(expected);
    });
});

describe('computeCombinedSeed', () => {
    it('should compute SHA256(serverSeed + ":" + clientSeed + ":" + nonce)', async () => {
        const serverSeed = 'server123';
        const clientSeed = 'client456';
        const nonce = 'nonce789';

        const combined = await computeCombinedSeed(serverSeed, clientSeed, nonce);
        const expected = await sha256(`${serverSeed}:${clientSeed}:${nonce}`);

        expect(combined).toBe(expected);
    });

    it('should be deterministic', async () => {
        const serverSeed = 'server';
        const clientSeed = 'client';
        const nonce = 'nonce';

        const combined1 = await computeCombinedSeed(serverSeed, clientSeed, nonce);
        const combined2 = await computeCombinedSeed(serverSeed, clientSeed, nonce);

        expect(combined1).toBe(combined2);
    });
});

describe('hexToBytes', () => {
    it('should convert hex string to Uint8Array', () => {
        const hex = 'deadbeef';
        const bytes = hexToBytes(hex);

        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(4);
        expect(bytes[0]).toBe(0xde);
        expect(bytes[1]).toBe(0xad);
        expect(bytes[2]).toBe(0xbe);
        expect(bytes[3]).toBe(0xef);
    });

    it('should handle leading zeros', () => {
        const hex = '00ff00ff';
        const bytes = hexToBytes(hex);

        expect(bytes[0]).toBe(0x00);
        expect(bytes[1]).toBe(0xff);
        expect(bytes[2]).toBe(0x00);
        expect(bytes[3]).toBe(0xff);
    });
});

describe('generateRandomHex', () => {
    it('should generate hex string of correct length', () => {
        const hex = generateRandomHex(16);
        expect(hex).toHaveLength(32); // 16 bytes = 32 hex chars
        expect(hex).toMatch(/^[a-f0-9]{32}$/);
    });

    it('should generate different values each time', () => {
        const hex1 = generateRandomHex(16);
        const hex2 = generateRandomHex(16);
        expect(hex1).not.toBe(hex2);
    });
});
