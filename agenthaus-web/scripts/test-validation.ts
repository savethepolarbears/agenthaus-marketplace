import { sanitizeQuery } from "../src/lib/validation";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log("Testing sanitizeQuery...");

// Test 1: Basic string
assert(sanitizeQuery("hello") === "hello", "Basic string should remain unchanged");

// Test 2: Trimming
assert(sanitizeQuery("  hello  ") === "hello", "String should be trimmed");

// Test 3: Null bytes
assert(sanitizeQuery("hello\u0000world") === "helloworld", "Null bytes should be removed");

// Test 4: Control characters
assert(sanitizeQuery("hello\u0001world") === "helloworld", "Control characters should be removed");

// Test 5: Newlines (control char 10)
assert(sanitizeQuery("hello\nworld") === "helloworld", "Newlines should be removed");

// Test 6: Tabs (control char 9)
assert(sanitizeQuery("hello\tworld") === "helloworld", "Tabs should be removed");

// Test 7: DEL (127)
assert(sanitizeQuery("hello\u007Fworld") === "helloworld", "DEL should be removed");

// Test 8: Empty string
assert(sanitizeQuery("") === "", "Empty string should return empty string");

// Test 9: Null input
assert(sanitizeQuery(null as any) === "", "Null input should return empty string");

// Test 10: Undefined input
assert(sanitizeQuery(undefined as any) === "", "Undefined input should return empty string");

console.log("All tests passed!");
