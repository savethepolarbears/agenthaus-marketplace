import { RateLimiter } from "../src/lib/rate-limit";

async function runTest() {
  console.log("Testing RateLimiter logic...");

  // 1. Test basic counting
  // Limit: 5 requests per minute
  const limiter = new RateLimiter(5, 60000);
  const ip = "192.168.1.1";

  console.log(`[Test 1] Simulating 5 allowed requests for IP ${ip}...`);
  for (let i = 1; i <= 5; i++) {
    const allowed = limiter.check(ip);
    if (!allowed) {
      console.error(`❌ Request ${i} was blocked unexpectedly.`);
      process.exit(1);
    }
    console.log(`✅ Request ${i}: Allowed`);
  }

  // 6th request should be blocked
  console.log("[Test 1] Simulating 6th request (should be blocked)...");
  const blocked = limiter.check(ip);
  if (blocked) {
    console.error("❌ Request 6 was allowed unexpectedly.");
    process.exit(1);
  } else {
    console.log("✅ Request 6: Blocked correctly");
  }

  // 2. Test different IP
  const otherIp = "10.0.0.1";
  console.log(`[Test 2] Testing different IP ${otherIp}...`);
  if (!limiter.check(otherIp)) {
    console.error("❌ Request from new IP was blocked.");
    process.exit(1);
  }
  console.log("✅ Request from new IP allowed");

  // 3. Test expiration
  console.log("[Test 3] Testing window expiration (using short window)...");
  const shortWindowLimiter = new RateLimiter(1, 100); // 1 req per 100ms
  shortWindowLimiter.check(ip); // Consumes allowance

  if (shortWindowLimiter.check(ip)) {
     console.error("❌ Short window limiter failed to block immediate second request.");
     process.exit(1);
  }
  console.log("✅ Immediate second request blocked");

  await new Promise(resolve => setTimeout(resolve, 150)); // Wait for window to expire

  if (!shortWindowLimiter.check(ip)) {
    console.error("❌ Short window limiter failed to reset after expiration.");
    process.exit(1);
  }
  console.log("✅ Request allowed after window expiration");

  console.log("\n🎉 All rate limiter tests passed!");
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});
