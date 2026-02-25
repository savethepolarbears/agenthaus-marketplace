
import { RateLimiter } from '../src/lib/rate-limit';

async function run() {
  console.log('Testing Rate Limit Robustness (Cleanup Logic)...');

  // Mock Date.now
  let currentTime = 1000;
  const originalDateNow = Date.now;
  Date.now = () => currentTime;

  try {
    // Limit 2, window 1000ms
    const limiter = new RateLimiter(2, 1000);

    // 1. Fill with 9990 entries that will expire
    // These represent "old traffic"
    console.log('Adding 9990 filler entries at t=1000...');
    for (let i = 0; i < 9990; i++) {
      limiter.check(`old-ip-${i}`);
    }

    // 2. Advance time to expire them
    currentTime = 3000; // t=3000. Old entries (t=1000+1000=2000) are expired.
    console.log('Time advanced to t=3000. Old entries expired.');

    // 3. Add attacker (active)
    // Attacker consumes their limit at t=3000
    console.log('Attacker acting at t=3000...');
    limiter.check('attacker'); // 1
    limiter.check('attacker'); // 2
    const blocked = !limiter.check('attacker'); // 3 -> Blocked

    if (!blocked) {
      console.error('❌ Setup failed: Attacker should be blocked initially.');
      process.exit(1);
    }
    console.log('✅ Attacker is initially blocked.');

    // 4. Add more entries to trigger cleanup (size > 10000)
    // We have 9990 (expired) + 1 (attacker) = 9991 entries.
    // Add 20 more fresh entries to push size over 10000.
    console.log('Adding fresh entries to trigger cleanup...');
    for (let i = 0; i < 20; i++) {
      limiter.check(`fresh-ip-${i}`);
    }

    // 5. Check attacker status
    // Logic:
    // - Before fix: cleanup() cleared ALL entries (including attacker). Result: Attacker unblocked (check returns true).
    // - After fix: cleanup() cleared ONLY expired entries. Attacker (fresh) remains. Result: Attacker blocked (check returns false).
    const isAllowed = limiter.check('attacker');

    if (isAllowed) {
       console.error('❌ VULNERABILITY DETECTED: Attacker was unblocked after cleanup!');
       process.exit(1);
    } else {
       console.log('✅ SAFE: Attacker remains blocked after cleanup.');
    }

  } finally {
    Date.now = originalDateNow;
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
