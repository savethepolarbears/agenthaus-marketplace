import type { RunPlan, TriggerDescriptor } from '../src/types.js';

export function determineRunStrategy(trigger: TriggerDescriptor | undefined): RunPlan {
  const piece = trigger?.pieceName ?? '';
  const triggerName = trigger?.triggerName ?? '';

  if (!piece && !triggerName) {
    return {
      mode: 'dry_run_blueprint',
      rationale: 'No trigger metadata was supplied.',
      executable: false,
      requiresPublish: false,
      requiresEnable: false,
      notes: ['Inspect the flow first and derive the trigger before attempting execution.'],
    };
  }

  if (piece.includes('forms') && triggerName === 'chat_submission') {
    return {
      mode: 'chat_ui',
      rationale: 'Chat UI flows should be executed through the Human Input chat surface.',
      executable: true,
      requiresPublish: true,
      requiresEnable: true,
      notes: ['Return_response should be configured for conversational UX.'],
    };
  }

  if (piece.includes('forms')) {
    return {
      mode: 'form_submission',
      rationale: 'Human Input form flows execute through the published form endpoint.',
      executable: true,
      requiresPublish: true,
      requiresEnable: true,
      notes: ['Submit test payloads through the form instead of claiming manual execution.'],
    };
  }

  if (triggerName.includes('webhook') || piece.includes('webhook')) {
    return {
      mode: 'webhook_submission',
      rationale: 'Webhook-driven flows execute by sending a real webhook request.',
      executable: true,
      requiresPublish: true,
      requiresEnable: true,
      notes: ['Use a real webhook payload or a documented replay path.'],
    };
  }

  return {
    mode: 'schedule_or_event_trigger',
    rationale: 'The trigger appears to be event-driven or scheduled.',
    executable: true,
    requiresPublish: true,
    requiresEnable: true,
    notes: ['Enable the flow and wait for the next event or schedule instead of faking a direct run-now action.'],
  };
}