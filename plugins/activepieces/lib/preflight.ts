import type { PreflightInput, PreflightResult, ConnectorToolName } from '../src/types.js';

export function preflight(input: PreflightInput): PreflightResult {
  const blocking: string[] = [];
  const warnings: string[] = [];
  const requiredDiscovery = new Set<ConnectorToolName>();

  requiredDiscovery.add('ap_list_connections');
  requiredDiscovery.add('ap_list_pieces');

  if (input.flowId) {
    requiredDiscovery.add('ap_flow_structure');
  } else if (input.operation !== 'create') {
    requiredDiscovery.add('ap_list_flows');
  }

  if (input.destructive && !input.explicitApproval) {
    blocking.push('Destructive change requested without explicit approval.');
  }

  if (input.operation === 'publish' || input.operation === 'enable' || input.operation === 'disable') {
    if (!input.flowId) {
      blocking.push('A flowId is required for publish/enable/disable operations.');
    }
    requiredDiscovery.add('ap_flow_structure');
  }

  if (input.operation === 'run') {
    warnings.push('No direct execute endpoint is assumed; run strategy must be selected from the trigger type.');
  }

  if (input.needsAuthPieces?.length) {
    warnings.push(`Auth must be resolved for ${input.needsAuthPieces.length} piece(s) before configuration.`);
  }

  return {
    ok: blocking.length === 0,
    blocking,
    warnings,
    requiredDiscovery: [...requiredDiscovery],
  };
}