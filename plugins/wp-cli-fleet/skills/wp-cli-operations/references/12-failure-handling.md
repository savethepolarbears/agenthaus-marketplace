## Failure Handling

If a command fails:

1. **Capture everything**: stdout, stderr, and exit code
2. **No auto-retry on mutations**: Do not automatically retry mutating operations more than once
3. **Narrow next check**: Suggest the most specific diagnostic command
4. **Keep fleet running**: Continue processing remaining sites unless `--fail-fast` was set

