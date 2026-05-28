import { readAnchor, writeContribution, evictAnchor } from '../lib/anchor';
import { librarianWrite, LibrarianError } from '../lib/librarian-write';
import { AnchorContribution } from '../schemas/anchor';

export interface LibrarianRunResult {
  entries_written: number;
  entries_failed: number;
  address_key: string;
  anchor_evicted: boolean;
  anchor_contribution: AnchorContribution;
}

export async function runLibrarian(
  sessionId: string,
  brainId: string,
  addressKey: string,
  domain: string
): Promise<LibrarianRunResult> {
  const anchor = await readAnchor(sessionId).catch(() => null);
  let entries_written = 0;
  let entries_failed = 0;

  for (const contribution of (anchor?.contributions ?? [])) {
    if (contribution.status === 'complete' && contribution.payload) {
      try {
        await librarianWrite({
          brain_id: brainId,
          address_key: addressKey,
          content: contribution.payload,
          source: 'chain',
          entry_level: 'leaf',
          confidence: 75,
          superseded_by: null,
          created_at: new Date().toISOString()
        });
        entries_written++;
      } catch (error) {
        console.warn(`Failed to write entry for session ${sessionId}: ${error}`);
        entries_failed++;
      }
    }
  }

  const librarianContribution: AnchorContribution = {
    role: 'librarian',
    status: 'complete',
    written_at: new Date().toISOString(),
    payload: {
      entries_written,
      entries_failed,
      address_key: addressKey
    }
  };

  if (anchor !== null) {
    await writeContribution(sessionId, librarianContribution);
  }

  let anchor_evicted = false;
  try {
    await evictAnchor(sessionId);
    anchor_evicted = true;
  } catch (error) {
    console.warn(`Failed to evict anchor for session ${sessionId}: ${error}`);
  }

  return {
    entries_written,
    entries_failed,
    address_key: addressKey,
    anchor_evicted,
    anchor_contribution: librarianContribution
  };
}