const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const PER_IP_HOURLY_LIMIT = 8;
const PER_IP_DAILY_LIMIT = 25;
const GLOBAL_DAILY_LIMIT = 150;

type Counter = { count: number; resetAt: number };

// In-memory only — resets on cold start / restart and isn't shared across
// serverless instances. Fine for blocking casual spam on a low-traffic
// portfolio site; not a durable guarantee. Upgrade to Redis/Vercel KV if
// this ever needs to hold under real abuse.
const perIpHourly = new Map<string, Counter>();
const perIpDaily = new Map<string, Counter>();
let globalDaily: Counter = { count: 0, resetAt: Date.now() + DAY_MS };

// Without eviction, one entry per unique IP accumulates for the life of the
// process — a crawler cycling addresses could grow these maps without bound.
function pruneExpired(map: Map<string, Counter>, now: number): void {
  for (const [key, counter] of map) {
    if (now >= counter.resetAt) map.delete(key);
  }
}

function checkAndIncrement(map: Map<string, Counter>, key: string, windowMs: number, limit: number): boolean {
  const now = Date.now();
  if (map.size > 1000) pruneExpired(map, now);
  const existing = map.get(key);

  if (!existing || now >= existing.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= limit) return false;

  existing.count += 1;
  return true;
}

export type RateLimitResult = { allowed: boolean; reason?: "hourly" | "daily" | "global" };

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  if (now >= globalDaily.resetAt) {
    globalDaily = { count: 0, resetAt: now + DAY_MS };
  }
  if (globalDaily.count >= GLOBAL_DAILY_LIMIT) {
    return { allowed: false, reason: "global" };
  }

  if (!checkAndIncrement(perIpDaily, ip, DAY_MS, PER_IP_DAILY_LIMIT)) {
    return { allowed: false, reason: "daily" };
  }

  if (!checkAndIncrement(perIpHourly, ip, HOUR_MS, PER_IP_HOURLY_LIMIT)) {
    return { allowed: false, reason: "hourly" };
  }

  globalDaily.count += 1;
  return { allowed: true };
}
