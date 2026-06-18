import type { ConnectionRecord } from '../src/types.js';

/**
 * Request to find a matching connection for a specific Activepieces piece.
 */
export interface ConnectionMatchRequest {
  /** The piece identifier to find a connection for (e.g., 'slack', 'google-sheets'). */
  piece: string;
  /** Optional strings to prefer when multiple connections are available (e.g., matching a project name or user). */
  preferredDisplayNameIncludes?: string[];
}

/**
 * Result of attempting to match a connection request to available connections.
 */
export interface ConnectionMatchResult {
  /** The connection chosen based on the request constraints, if any. */
  selected?: ConnectionRecord;
  /** All valid, ACTIVE connections available for the requested piece. */
  candidates: ConnectionRecord[];
  /** Description of how the selection was made or why a selection could not be uniquely made. */
  reason: string;
}

/**
 * Finds the most appropriate connection for a given piece out of a list of connections.
 * Will attempt to resolve ambiguity using preferred display names if multiple active connections exist.
 *
 * @param request - The matching criteria including the target piece and any preferences.
 * @param connections - The list of all available connection records to search through.
 * @returns A result indicating the selected connection, all candidates, and the reasoning behind the choice.
 */
export function mapConnection(
  request: ConnectionMatchRequest,
  connections: ConnectionRecord[],
): ConnectionMatchResult {
  const candidates = connections.filter(
    (connection) => connection.piece === request.piece && connection.status === 'ACTIVE',
  );

  if (candidates.length === 0) {
    return {
      candidates,
      reason: `No ACTIVE connection found for piece ${request.piece}.`,
    };
  }

  const preferences = request.preferredDisplayNameIncludes ?? [];
  const preferred = candidates.find((candidate) =>
    preferences.some((term) => candidate.displayName.toLowerCase().includes(term.toLowerCase())),
  );

  if (preferred) {
    return {
      selected: preferred,
      candidates,
      reason: 'Selected best match from preferred display-name hints.',
    };
  }

  if (candidates.length === 1) {
    return {
      selected: candidates[0],
      candidates,
      reason: 'Only one ACTIVE candidate exists.',
    };
  }

  return {
    selected: candidates[0],
    candidates,
    reason: 'Multiple ACTIVE candidates found; defaulting to the first candidate. Caller should confirm intent for production use.',
  };
}