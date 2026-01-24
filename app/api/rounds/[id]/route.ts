/**
 * GET /api/rounds/:id
 * 
 * Returns full round details.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

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

        // Only include serverSeed if round is revealed
        const response = {
            id: round.id,
            createdAt: round.createdAt,
            status: round.status,
            nonce: round.nonce,
            commitHex: round.commitHex,
            serverSeed: round.status === 'revealed' ? round.serverSeed : undefined,
            clientSeed: round.clientSeed,
            combinedSeed: round.status === 'revealed' ? round.combinedSeed : undefined,
            pegMapHash: round.pegMapHash,
            rows: round.rows,
            dropColumn: round.dropColumn,
            binIndex: round.binIndex,
            payoutMultiplier: round.payoutMultiplier,
            betCents: round.betCents,
            path: round.pathJson ? JSON.parse(round.pathJson) : undefined,
            revealedAt: round.revealedAt,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error getting round:', error);
        return NextResponse.json(
            { error: 'Failed to get round' },
            { status: 500 }
        );
    }
}
