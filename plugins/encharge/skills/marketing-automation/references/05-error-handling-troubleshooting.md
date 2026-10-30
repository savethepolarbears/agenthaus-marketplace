## Error Handling & Troubleshooting

**Common Errors & Solutions:**

| Error | Cause | Fix |
| ------- | ------- | ----- |
| "Invalid email" | Bad format | Validate: `^[^\s@]+@[^\s@]+\.[^\s@]+$` |
| "Contact not found" | Email doesn't exist | Create with `encharge_create_update_people` |
| "Tag already exists" | Duplicate name | Check spelling (case-sensitive) |
| "Rate limit exceeded" | Too many concurrent requests | Reduce batch size, add backoff |
| "Account not accessible" | API key invalid | Verify ENCHARGE_API_KEY env var |
| "Segment empty" | Wrong criteria | Review segment definition in UI |
| "Custom field not found" | Wrong field ID | Get schema with `encharge_get_custom_object_schema` |

