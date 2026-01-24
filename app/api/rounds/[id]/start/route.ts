/**
 * POST /api/rounds/:id/start
 * 
 * Starts a round with client seed and game parameters.
 * Body: { clientSeed, betCents, dropColumn }
 * Returns: { pegMapHash, rows }
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { computeCombinedSeed } from '@/lib/fairness/hash';
import { createPRNGFromHex } from '@/lib/fairness/prng';
import { generatePegMap, computePegMapHash, simulateDrop, ROWS } from '@/lib/fairness/engine';
import { getPayoutMultiplier } from '@/lib/fairness/payouts';

interface StartBody {
    clientSeed: string;
    betCents: number;
    dropColumn: number;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body: StartBody = await request.json();
        const { clientSeed, betCents, dropColumn } = body;

        // Validate inputs
        if (!clientSeed || typeof clientSeed !== 'string') {
            return NextResponse.json(
                { error: 'clientSeed is required' },
                { status: 400 }
            );
        }

        if (typeof betCents !== 'number' || betCents <= 0) {
            return NextResponse.json(
                { error: 'betCents must be a positive number' },
                { status: 400 }
            );
        }

        if (typeof dropColumn !== 'number' || dropColumn < 0 || dropColumn > ROWS) {
            return NextResponse.json(
                { error: `dropColumn must be between 0 and ${ROWS}` },
                { status: 400 }
            );
        }

        // Get round from database
        const round = await prisma.round.findUnique({
            where: { id },
        });

        if (!round) {
            return NextResponse.json(
                { error: 'Round not found' },
                { status: 404 }
            );
        }

        if (round.status !== 'committed') {
            return NextResponse.json(
                { error: 'Round already started or revealed' },
                { status: 400 }
            );
        }

        // Compute combined seed
        const combinedSeed = await computeCombinedSeed(
            round.serverSeed!,
            clientSeed,
            round.nonce
        );

        // Initialize PRNG from combined seed
        const rand = createPRNGFromHex(combinedSeed);

        // Generate peg map (PRNG order: first peg map)
        const pegMap = generatePegMap(rand, ROWS);
        const pegMapHash = await computePegMapHash(pegMap);

        // Simulate drop (PRNG order: then row decisions)
        const dropResult = simulateDrop(pegMap, dropColumn, rand);

        // Get payout multiplier
        const payoutMultiplier = getPayoutMultiplier(dropResult.binIndex);

        // Update round in database
        await prisma.round.update({
            where: { id },
            data: {
                status: 'started',
                clientSeed,
                combinedSeed,
                pegMapHash,
                dropColumn,
                binIndex: dropResult.binIndex,
                payoutMultiplier,
                betCents,
                pathJson: JSON.stringify(dropResult.path),
            },
        });

        return NextResponse.json({
            pegMapHash,
            rows: ROWS,
        });
    } catch (error) {
        console.error('Error starting round:', error);
        return NextResponse.json(
            { error: 'Failed to start round' },
            { status: 500 }
        );
    }
}
