/**
 * SHA-256 hashing utilities for the provably-fair protocol
 */

/**
 * Compute SHA-256 hash of a string, returning hex string
 */
export async function sha256(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compute commitment hash: SHA256(serverSeed + ":" + nonce)
 */
export async function computeCommit(serverSeed: string, nonce: string): Promise<string> {
    return sha256(`${serverSeed}:${nonce}`);
}

/**
 * Compute combined seed: SHA256(serverSeed + ":" + clientSeed + ":" + nonce)
 */
export async function computeCombinedSeed(
    serverSeed: string,
    clientSeed: string,
    nonce: string
): Promise<string> {
    return sha256(`${serverSeed}:${clientSeed}:${nonce}`);
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
}

/**
 * Generate cryptographically secure random hex string
 */
export function generateRandomHex(bytes: number): string {
    const buffer = new Uint8Array(bytes);
    crypto.getRandomValues(buffer);
    return Array.from(buffer)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
