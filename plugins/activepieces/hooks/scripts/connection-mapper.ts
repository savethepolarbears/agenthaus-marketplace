import type { ConnectionRecord } from '../src/types.js';

export interface ConnectionMatchRequest {
  piece: string;
  preferredDisplayNameIncludes?: string[];
}

export interface ConnectionMatchResult {
  selected?: ConnectionRecord;
  candidates: ConnectionRecord[];
  reason: string;
}

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