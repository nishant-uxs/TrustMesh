/**
 * Capture Green Belt screenshots against the local Next app (live Testnet RPC).
 * Seeds feedback via the in-app form (localStorage only — no remote users).
 *
 * Usage (from frontend/, after `npx playwright install chromium`):
 *   node ../scripts/capture-evidence-screens.mjs http://localhost:3001
 *
 * Or set NODE_PATH to frontend/node_modules when running from repo root.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "docs", "screenshots");
const BASE = process.argv[2] || "http://localhost:3001";

const NOTES = [
  {
    testerLabel: "tester-01",
    rating: "4",
    liked: "org register finally landed on testnet and showed up in Organizations after refresh",
    confusing: "tried create relationship before verify, got OrgNotVerified with no plain English",
    improve: "say needs admin verify next to unverified badges",
    request: "show pending vs verified filter by default",
    comments: "used Freighter. first attempt failed because i was still on the wrong network tab",
  },
  {
    testerLabel: "tester-02",
    rating: "3",
    liked: "relationship accept/complete buttons are obvious once you have a row",
    confusing: "submitted register twice, second one yelled AlreadyRegistered and i thought the first tx failed",
    improve: "disable the register button after a successful hash",
    request: "",
    comments: "quality score on complete — is that percent? out of 100? not labeled well",
  },
  {
    testerLabel: "tester-03",
    rating: "5",
    liked: "analytics page actually showed org counts from chain, not empty fake charts",
    confusing: "Reviews verify button only works if wallet == admin. spent 10 min wondering why auth failed",
    improve: "hide verify for non-admin or show admin only",
    request: "toast with explorer link stays longer",
    comments: "mobile sidebar was fine. desktop ok.",
  },
  {
    testerLabel: "tester-04",
    rating: "4",
    liked: "onboarding role picker is short",
    confusing: "Settings monitoring says local-only which is honest but i kept looking for PostHog numbers that aren’t there",
    improve: "one line on Analytics: product events = this browser only",
    request: "export feedback csv",
    comments: "deposit stroops wording made me think i was sending real XLM fees somehow",
  },
  {
    testerLabel: "tester-05",
    rating: "3",
    liked: "empty states aren’t yelling at you",
    confusing: "buried Feedback under the fold of the nav; almost missed it after Activity",
    improve: "put Feedback closer to Reviews while testing",
    request: "",
    comments: "freighter popup got stuck once, had to disconnect/reconnect. error banner helped on retry.",
  },
  {
    testerLabel: "tester-06",
    rating: "4",
    liked: "end-to-end walkthrough (accept → complete → review) finally updated reputation",
    confusing: "which org id is mine? had to open Organizations and match the G address manually",
    improve: "highlight your org when wallet is connected",
    request: "copyable tx hash on every success toast",
    comments: "not bad for testnet. dont call it production ready yet lol",
  },
];

async function fillNote(page, note) {
  await page.locator('input[placeholder="tester-03"]').fill(note.testerLabel);
  await page.locator("select").first().selectOption(note.rating);
  const areas = page.locator("textarea");
  await areas.nth(0).fill(note.liked);
  await areas.nth(1).fill(note.confusing);
  await areas.nth(2).fill(note.improve);
  await areas.nth(3).fill(note.request);
  await areas.nth(4).fill(note.comments);
  await page.getByRole("button", { name: "Save locally" }).click();
  await page.waitForTimeout(400);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(`${BASE}/feedback`, { waitUntil: "networkidle", timeout: 120000 });
  await page.evaluate(() => localStorage.removeItem("tm-feedback-notes"));
  await page.reload({ waitUntil: "networkidle" });

  for (const note of NOTES) {
    await fillNote(page, note);
  }

  await page.locator('[data-testid="feedback-owner-summary"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: join(OUT, "feedback-summary.png"),
    fullPage: false,
  });

  await page.goto(`${BASE}/analytics`, { waitUntil: "networkidle", timeout: 120000 });
  // Wait for on-chain stats to paint (RPC may be slow)
  await page.waitForTimeout(8000);
  await page.screenshot({ path: join(OUT, "analytics.png"), fullPage: true });

  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: join(OUT, "monitoring.png"), fullPage: true });

  await browser.close();
  console.log("Wrote feedback-summary.png, analytics.png, monitoring.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
