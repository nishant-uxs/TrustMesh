#!/usr/bin/env node
/**
 * One real end-to-end TrustMesh Testnet walkthrough (deployer + two demo users).
 * Hashes are taken only from CLI "Signing transaction: <64 hex>" lines.
 *
 * Flow: verify orgs → create_relationship → accept → complete → submit_review → verify_review
 * (This product has no separate milestone/release methods; accept/complete is the lifecycle.)
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const NETWORK = "testnet";
const EXPLORER_TX = "https://stellar.expert/explorer/testnet/tx";
const HASH_RE = /Signing transaction:\s*([0-9a-fA-F]{64})/;

const ORG_A = 3;
const ORG_B = 4;
const PARTY_A = "demo-user-01";
const PARTY_B = "demo-user-02";
const ADMIN = "deployer";

function loadContracts() {
  return JSON.parse(readFileSync(join(ROOT, "deployments", "testnet.json"), "utf8"))
    .contracts;
}

function run(args, { allowFail = false } = {}) {
  const result = spawnSync("stellar", args, { encoding: "utf8", windowsHide: true });
  const combined = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (!allowFail && (result.status ?? 1) !== 0) {
    throw new Error(`stellar ${args.join(" ")} failed\n${combined}`);
  }
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    combined,
    hash: (combined.match(HASH_RE) || [])[1]?.toLowerCase() ?? null,
  };
}

function addressOf(name) {
  const r = run(["keys", "address", name]);
  return r.stdout.trim();
}

function invoke(source, contractId, fnArgs) {
  return run(
    [
      "contract",
      "invoke",
      "--id",
      contractId,
      "--source",
      source,
      "--network",
      NETWORK,
      "--send=yes",
      "--",
      ...fnArgs,
    ],
    { allowFail: true },
  );
}

function requireHash(step, result) {
  if (!result.hash) {
    throw new Error(`No hash for ${step}\n${result.combined}`);
  }
  if (result.status !== 0) {
    throw new Error(`${step} failed (exit ${result.status})\n${result.combined}`);
  }
  return result.hash;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const c = loadContracts();
  const addrA = addressOf(PARTY_A);
  const addrB = addressOf(PARTY_B);
  const steps = [];

  const push = (step, actor, action, result, note) => {
    const hash = requireHash(step, result);
    steps.push({
      step,
      actor,
      action,
      hash,
      explorerUrl: `${EXPLORER_TX}/${hash}`,
      timestamp: new Date().toISOString(),
      note: note ?? null,
    });
    console.log(`${step}: ${hash}`);
  };

  // Admin verifies both orgs so factory create_relationship can succeed.
  for (const orgId of [ORG_A, ORG_B]) {
    const r = invoke(ADMIN, c.organization_registry, [
      "verify_organization",
      "--org_id",
      String(orgId),
    ]);
    if (r.status !== 0 && /AlreadyVerified/i.test(r.combined)) {
      console.log(`org ${orgId} already verified`);
    } else {
      push(
        `verify_org_${orgId}`,
        ADMIN,
        `verify_organization(${orgId})`,
        r,
        "Admin-only step required before create_relationship.",
      );
      await sleep(900);
    }
  }

  let create = invoke(PARTY_A, c.trust_relationship_factory, [
    "create_relationship",
    "--creator",
    addrA,
    "--org_a",
    String(ORG_A),
    "--org_b",
    String(ORG_B),
    "--title",
    JSON.stringify("Q3 parts supply walkthrough"),
  ]);
  push("create_relationship", PARTY_A, "factory.create_relationship", create);
  const relIdMatch = create.stdout.trim().match(/\d+/);
  const relId = relIdMatch ? Number(relIdMatch[0]) : null;
  if (!relId) {
    throw new Error(`Could not parse relationship id from:\n${create.stdout}`);
  }
  await sleep(900);

  for (const [party, addr] of [
    [PARTY_A, addrA],
    [PARTY_B, addrB],
  ]) {
    const r = invoke(party, c.trust_relationship, [
      "accept",
      "--actor",
      addr,
      "--relationship_id",
      String(relId),
    ]);
    push(`${party}_accept`, party, `accept(relationship ${relId})`, r);
    await sleep(900);
  }

  for (const [party, addr, score] of [
    [PARTY_A, addrA, "88"],
    [PARTY_B, addrB, "90"],
  ]) {
    const r = invoke(party, c.trust_relationship, [
      "complete",
      "--actor",
      addr,
      "--relationship_id",
      String(relId),
      "--quality_score",
      score,
    ]);
    push(
      `${party}_complete`,
      party,
      `complete(relationship ${relId}, quality ${score})`,
      r,
      "Both parties must complete; second call marks Completed and updates reputation.",
    );
    await sleep(900);
  }

  const review = invoke(PARTY_A, c.review_verification, [
    "submit_review",
    "--reviewer",
    addrA,
    "--reviewer_org",
    String(ORG_A),
    "--reviewee_org",
    String(ORG_B),
    "--relationship_id",
    String(relId),
    "--rating",
    "4",
    "--comment_hash",
    JSON.stringify("e2e-demo-review-parts-supply"),
  ]);
  push("submit_review", PARTY_A, "submit_review", review);
  const reviewIdMatch = review.stdout.trim().match(/\d+/);
  const reviewId = reviewIdMatch ? Number(reviewIdMatch[0]) : null;
  if (!reviewId) {
    throw new Error(`Could not parse review id from:\n${review.stdout}`);
  }
  await sleep(900);

  const verify = invoke(ADMIN, c.review_verification, [
    "verify_review",
    "--review_id",
    String(reviewId),
  ]);
  push(
    "verify_review",
    ADMIN,
    `verify_review(${reviewId})`,
    verify,
    "Admin-only reputation promotion after user submit_review.",
  );

  const outDir = join(ROOT, "docs", "evidence");
  mkdirSync(outDir, { recursive: true });
  const payload = {
    label: "Testnet demo end-to-end walkthrough (not organic product traffic).",
    network: NETWORK,
    generatedAt: new Date().toISOString(),
    relationshipId: relId,
    reviewId,
    parties: { partyA: { identity: PARTY_A, address: addrA, orgId: ORG_A }, partyB: { identity: PARTY_B, address: addrB, orgId: ORG_B }, admin: ADMIN },
    steps,
  };
  writeFileSync(join(outDir, "DEMO_ACTIVITY.json"), `${JSON.stringify(payload, null, 2)}\n`);

  const table = [
    "| Step | Actor | Action | Tx |",
    "|---|---|---|---|",
    ...steps.map(
      (s) =>
        `| ${s.step} | ${s.actor} | ${s.action} | [${s.hash}](${s.explorerUrl}) |`,
    ),
  ].join("\n");

  const md = `# Demo activity (Testnet end-to-end)

**Testnet demo walkthrough, not organic users.**

One real product path against the already-deployed TrustMesh contracts:

\`verify_organization\` → \`create_relationship\` → \`accept\` (both) → \`complete\` (both) → \`submit_review\` → \`verify_review\`.

This product does not expose separate milestone / escrow-release methods; **accept → complete** is the lifecycle. Hashes are copied from Stellar CLI \`Signing transaction\` output only.

- Relationship id: **${relId}**
- Review id: **${reviewId}**
- Party A: \`${PARTY_A}\` / \`${addrA}\` (org ${ORG_A})
- Party B: \`${PARTY_B}\` / \`${addrB}\` (org ${ORG_B})
- Admin: \`${ADMIN}\`

Reproduce:

\`\`\`bash
node scripts/demo-activity.mjs
\`\`\`

## Steps

${table}

Generated at ${payload.generatedAt}.
`;
  writeFileSync(join(outDir, "DEMO_ACTIVITY.md"), md);
  console.log("\nWrote docs/evidence/DEMO_ACTIVITY.md and .json");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
