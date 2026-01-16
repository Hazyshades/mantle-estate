/**
 * HTTP runner for AMM that works OUTSIDE the Encore runtime.
 *
 * It simply calls the exposed Encore endpoint POST /amm/trade in a loop.
 *
 * Usage:
 *   1) cd backend && encore run
 *   2) In another terminal:
 *      - PowerShell:  $env:ENCORE_API_URL="http://localhost:4000"
 *      - Bash:        export ENCORE_API_URL=http://localhost:4000
 *      bun run scripts/amm/http-run.ts
 */

const API_URL = (process.env.ENCORE_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");
const INTERVAL_MS = Number(process.env.AMM_HTTP_INTERVAL_MS ?? "150000");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tick(): Promise<void> {
  const res = await fetch(`${API_URL}/amm/trade`, { method: "POST" });
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  // endpoint returns JSON; print raw to keep it robust
  console.log(`[AMM HTTP] ${new Date().toISOString()} ${text}`);
}

async function main(): Promise<void> {
  console.log(`[AMM HTTP] Target: ${API_URL}`);
  console.log(`[AMM HTTP] Interval: ${INTERVAL_MS} ms (set AMM_HTTP_INTERVAL_MS to change)`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await tick();
    } catch (err) {
      console.error("[AMM HTTP] Error:", err);
    }
    await sleep(INTERVAL_MS);
  }
}

main().catch((e) => {
  console.error("[AMM HTTP] Fatal:", e);
  process.exit(1);
});

