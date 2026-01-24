/**
 * POST /api/rounds/commit
 * 
 * Creates a new round with server-side commitment.
 * Returns { roundId, commitHex, nonce }
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateRandomHex, computeCommit } from '@/lib/fairness/hash';

export async function POST() {
    try {
        // Generate server seed (32 bytes = 64 hex chars)
        const serverSeed = generateRandomHex(32);

        // Generate nonce (16 bytes = 32 hex chars)
        const nonce = generateRandomHex(16);

        // Compute commitment: SHA256(serverSeed + ":" + nonce)
        const commitHex = await computeCommit(serverSeed, nonce);

        // Store in database
        const round = await prisma.round.create({
            data: {
                status: 'committed',
                serverSeed, // Stored but NOT revealed until after game
                nonce,
                commitHex,
            },
        });

        // Return commitment (NOT the serverSeed!)
        return NextResponse.json({
            roundId: round.id,
            commitHex: round.commitHex,
            nonce: round.nonce,
        });
    } catch (error) {
        console.error('Error creating round:', error);
        return NextResponse.json(
            { error: 'Failed to create round' },
            { status: 500 }
        );
    }
}
