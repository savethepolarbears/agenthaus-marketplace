export interface ChangeGuardInput {
  destructive: boolean;
  explicitApproval: boolean;
  targetSummary: string;
}

export function assertChangeAllowed(input: ChangeGuardInput): void {
  if (input.destructive && !input.explicitApproval) {
    throw new Error(
      `Blocked destructive change for target: ${input.targetSummary}. Explicit approval is required.`,
    );
  }
}