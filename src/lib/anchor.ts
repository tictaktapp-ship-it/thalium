import { shardA } from './redis';
import { AnchorStateSchema, AnchorContributionSchema, type AnchorState, type AnchorContribution } from '../schemas/anchor';
import { LibrarianError } from './librarian-write';

const ANCHOR_KEY_PREFIX = 'anc_';
const ANCHOR_TTL_SECONDS = 3600;

export async function createAnchor(sessionId: string, brainId: string, addressKey: string): Promise<AnchorState> {
    const now = new Date().toISOString();
    const anchorState: AnchorState = {
        session_id: sessionId,
        brain_id: brainId,
        address_key: addressKey,
        created_at: now,
        last_refreshed_at: now,
        contributions: [],
        paused_at: null,
        pause_timeout_minutes: 10
    };

    try {
        const result = await shardA.set(`${ANCHOR_KEY_PREFIX}${sessionId}`, JSON.stringify(anchorState), { ex: ANCHOR_TTL_SECONDS }
        );

        if (result !== 'OK') {
            throw new LibrarianError('Failed to create anchor', 'WRITE_FAILED');
        }

        return anchorState;
    } catch (error) {
        throw new LibrarianError(
            error instanceof Error ? error.message : 'Unknown Redis error',
            'WRITE_FAILED'
        );
    }
}

export async function readAnchor(sessionId: string): Promise<AnchorState> {
    try {
        const anchorJson = await shardA.get(`${ANCHOR_KEY_PREFIX}${sessionId}`);

        if (!anchorJson) {
            throw new LibrarianError('Anchor not found', 'VALIDATION_FAILED');
        }

        const parsed = JSON.parse(anchorJson);
        return AnchorStateSchema.parse(parsed);
    } catch (error) {
        if (error instanceof LibrarianError) {
            throw error;
        }
        throw new LibrarianError(
            error instanceof Error ? error.message : 'Invalid anchor data',
            'VALIDATION_FAILED'
        );
    }
}

export async function writeContribution(sessionId: string, contribution: AnchorContribution): Promise<AnchorState> {
    const validatedContribution = AnchorContributionSchema.parse(contribution);
    const currentAnchor = await readAnchor(sessionId);

    const updatedAnchor: AnchorState = {
        ...currentAnchor,
        contributions: [...currentAnchor.contributions, validatedContribution],
        last_refreshed_at: new Date().toISOString()
    };

    try {
        const result = await shardA.set(`${ANCHOR_KEY_PREFIX}${sessionId}`, JSON.stringify(updatedAnchor), { ex: ANCHOR_TTL_SECONDS }
        );

        if (result !== 'OK') {
            throw new LibrarianError('Failed to update anchor', 'WRITE_FAILED');
        }

        return updatedAnchor;
    } catch (error) {
        throw new LibrarianError(
            error instanceof Error ? error.message : 'Unknown Redis error',
            'WRITE_FAILED'
        );
    }
}

export async function evictAnchor(sessionId: string): Promise<void> {
    try {
        const deleted = await shardA.del(`${ANCHOR_KEY_PREFIX}${sessionId}`);

        if (deleted === 0) {
            throw new LibrarianError('Anchor not found for eviction', 'WRITE_FAILED');
        }

        console.warn(`Anchor ${sessionId} evicted from Redis. Postgres archiving pending.`);
    } catch (error) {
        throw new LibrarianError(
            error instanceof Error ? error.message : 'Failed to evict anchor',
            'WRITE_FAILED'
        );
    }
}