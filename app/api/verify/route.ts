/**
 * GET /api/verify
 * 
 * Verifies a round by recomputing all values from seeds.
 * Query params: serverSeed, clientSeed, nonce, dropColumn
 * Returns: recomputed values for verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { computeCommit, computeCombinedSeed } from '@/lib/fairness/hash';
import { createPRNGFromHex } from '@/lib/fairness/prng';
import { generatePegMap, computePegMapHash, simulateDrop, ROWS } from '@/lib/fairness/engine';
import { getPayoutMultiplier } from '@/lib/fairness/payouts';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        const serverSeed = searchParams.get('serverSeed');
        const clientSeed = searchParams.get('clientSeed');
        const nonce = searchParams.get('nonce');
        const dropColumnStr = searchParams.get('dropColumn');

        // Validate inputs
        if (!serverSeed || !clientSeed || !nonce || !dropColumnStr) {
            return NextResponse.json(
                { error: 'Missing required parameters: serverSeed, clientSeed, nonce, dropColumn' },
                { status: 400 }
            );
        }

        const dropColumn = parseInt(dropColumnStr, 10);

        if (isNaN(dropColumn) || dropColumn < 0 || dropColumn > ROWS) {
            return NextResponse.json(
                { error: `dropColumn must be between 0 and ${ROWS}` },
                { status: 400 }
            );
        }

        // Recompute commitment
        const commitHex = await computeCommit(serverSeed, nonce);

        // Recompute combined seed
        const combinedSeed = await computeCombinedSeed(serverSeed, clientSeed, nonce);

        // Initialize PRNG
        const rand = createPRNGFromHex(combinedSeed);

        // Generate peg map
        const pegMap = generatePegMap(rand, ROWS);
        const pegMapHash = await computePegMapHash(pegMap);

        // Simulate drop
        const dropResult = simulateDrop(pegMap, dropColumn, rand);

        // Get payout multiplier
        const payoutMultiplier = getPayoutMultiplier(dropResult.binIndex);

        return NextResponse.json({
            // Input echo
            serverSeed,
            clientSeed,
            nonce,
            dropColumn,

            // Recomputed values
            commitHex,
            combinedSeed,
            pegMapHash,
            binIndex: dropResult.binIndex,
            payoutMultiplier,
            path: dropResult.path,

            // Detailed decisions for debugging
            decisions: dropResult.decisions,
        });
    } catch (error) {
        console.error('Error verifying round:', error);
        return NextResponse.json(
            { error: 'Failed to verify round' },
            { status: 500 }
        );
    }
}
