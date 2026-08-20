#!/usr/bin/env node
/**
 * Create N unique Stellar Testnet demo identities and have each sign at least
 * one real on-chain invoke against the deployed TrustMesh contracts.
 *
 * Keys stay in the local Stellar CLI keystore only. This script never prints
 * or writes secret keys / seed phrases.
 *
 * Usage:
 *   node scripts/demo-users.mjs
 *   node scripts/demo-users.mjs --count 10
 *
 * These are Testnet demo identities, not organic users.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const NETWORK = "testnet";
const FRIENDBOT = "https://friendbot.stellar.org";
const EXPLORER_TX = "https://stellar.expert/explorer/testnet/tx";
const EXPLORER_ACCOUNT = "https://stellar.expert/explorer/testnet/account";
const HASH_RE = /Signing transaction:\s*([0-9a-fA-F]{64})/;

const ORG_TYPES = [
  "Business",
  "Startup",
  "Agency",
  "Freelancer",
  "Vendor",
  "ServiceProvider",
];

function parseCount(argv) {
  const i = argv.indexOf("--count");
  if (i >= 0 && argv[i + 1]) {
    const n = Number(argv[i + 1]);
    if (!Number.isInteger(n) || n < 1) {
      throw new Error("--count must be a positive integer");
    }
    return n;
  }
  return 10;
}

function jsonStr(value) {
  return JSON.stringify(value);
}

function loadDeployments() {
  const path = join(ROOT, "deployments", "testnet.json");
  const data = JSON.parse(readFileSync(path, "utf8"));
  const c = data.contracts;
  if (!c?.organization_registry || !c?.treasury || !c?.review_verification) {
    throw new Error("deployments/testnet.json is missing required contract IDs");
  }
  return c;
}

function runStellar(args, { allowFail = false } = {}) {
  const result = spawnSync("stellar", args, {
    encoding: "utf8",
    windowsHide: true,
  });
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const combined = `${stdout}\n${stderr}`;
  if (!allowFail && result.status !== 0) {
    const err = new Error(
      `stellar ${args.join(" ")} failed (exit ${result.status})\n${combined}`,
    );
    err.combined = combined;
    err.status = result.status;
    throw err;
  }
  return { status: result.status ?? 1, stdout, stderr, combined };
}

function extractHash(combined) {
  const match = combined.match(HASH_RE);
  return match ? match[1].toLowerCase() : null;
}

function keyName(n) {
  return `demo-user-${String(n).padStart(2, "0")}`;
}

function addressOf(name) {
  const { stdout, status, combined } = runStellar(["keys", "address", name], {
    allowFail: true,
  });
  if (status !== 0) {
    throw new Error(`Could not read address for ${name}: ${combined}`);
  }
  const addr = stdout.trim();
  if (!addr.startsWith("G")) {
    throw new Error(`Unexpected address for ${name}: ${addr}`);
  }
  return addr;
}

function ensureIdentity(name) {
  const probe = runStellar(["keys", "address", name], { allowFail: true });
  if (probe.status === 0 && probe.stdout.trim().startsWith("G")) {
    return { created: false, address: probe.stdout.trim() };
  }
  const gen = runStellar(
    ["keys", "generate", name, "--network", NETWORK, "--fund"],
    { allowFail: true },
  );
  const address = addressOf(name);
  return { created: true, address, generateLog: gen.combined };
}

async function friendbot(address) {
  const url = `${FRIENDBOT}/?addr=${encodeURIComponent(address)}`;
  const res = await fetch(url);
  const text = await res.text();
  if (res.ok) {
    return { funded: true, status: res.status };
  }
  // Already funded / duplicate request — Friendbot often returns 400.
  if (res.status === 400) {
    return { funded: false, alreadyFunded: true, status: 400 };
  }
  throw new Error(`Friendbot ${res.status} for ${address}: ${text.slice(0, 400)}`);
}

function invoke(source, contractId, fnAndArgs) {
  const args = [
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
    ...fnAndArgs,
  ];
  const result = runStellar(args, { allowFail: true });
  const hash = extractHash(result.combined);
  return { ...result, hash, contractId, fn: fnAndArgs[0] };
}

function requireHash(row, result) {
  if (!result.hash) {
    throw new Error(
      `No tx hash for ${row.identity} ${row.action}. CLI output:\n${result.combined}`,
    );
  }
  return result.hash;
}

function view(source, contractId, fnAndArgs) {
  return runStellar(
    [
      "contract",
      "invoke",
      "--id",
      contractId,
      "--source",
      source,
      "--network",
      NETWORK,
      "--send=no",
      "--",
      ...fnAndArgs,
    ],
    { allowFail: true },
  );
}

function parseOrgId(stdout) {
  const trimmed = stdout.trim().split(/\s+/).pop();
  const n = Number(trimmed);
  return Number.isInteger(n) ? n : null;
}

function orgIdForOwner(source, registry, owner) {
  const result = view(source, registry, [
    "get_org_by_owner",
    "--owner",
    owner,
  ]);
  if (result.status !== 0) return null;
  const match = result.stdout.match(/"id"\s*:\s*"?(\d+)/) || result.stdout.match(/\bid"?\s*[:=]\s*(\d+)/);
  if (match) return Number(match[1]);
  const n = parseOrgId(result.stdout);
  return n;
}

function profiles(count) {
  const names = [
    "Northwind Supply Co",
    "Helix Labs",
    "Harbor Creative",
    "Ada Patel Studio",
    "Summit Parts",
    "Nimbus Support",
    "Cedar Ledger",
    "Orbit Freight",
    "Willow Analytics",
    "Brightline Review Desk",
  ];
  const roles = [
    "buyer",
    "manufacturer",
    "agency",
    "freelancer",
    "supplier",
    "service_provider",
    "treasury_depositor",
    "treasury_depositor",
    "org_operator",
    "reviewer",
  ];
  return Array.from({ length: count }, (_, i) => ({
    n: i + 1,
    identity: keyName(i + 1),
    role: roles[i] ?? `demo_user_${i + 1}`,
    orgName: `${names[i] ?? `TrustMesh Demo Org ${i + 1}`} ${String(i + 1).padStart(2, "0")}`,
    orgType: ORG_TYPES[i % ORG_TYPES.length],
  }));
}

function record(entry) {
  return {
    identity: entry.identity,
    role: entry.role,
    address: entry.address,
    action: entry.action,
    hash: entry.hash,
    explorerUrl: `${EXPLORER_TX}/${entry.hash}`,
    accountUrl: `${EXPLORER_ACCOUNT}/${entry.address}`,
    timestamp: entry.timestamp,
    contract: entry.contract,
    note: entry.note ?? null,
  };
}

function writeEvidence(rows, contracts) {
  const outDir = join(ROOT, "docs", "evidence");
  mkdirSync(outDir, { recursive: true });
  const payload = {
    label: "Testnet demo identities, not organic users.",
    network: NETWORK,
    generatedAt: new Date().toISOString(),
    contracts,
    interactions: rows,
  };
  writeFileSync(
    join(outDir, "WALLET_INTERACTIONS.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );

  const unique = [];
  const seen = new Set();
  for (const r of rows) {
    if (!seen.has(r.identity)) {
      seen.add(r.identity);
      unique.push(r);
    }
  }
  const rowLine = (r) =>
    `| ${r.identity} | ${r.role} | \`${r.address}\` | ${r.action} | [${r.hash}](${r.explorerUrl}) |`;
  const uniqueTable = [
    "| Identity | Role | Address | Action | Tx |",
    "|---|---|---|---|---|",
    ...unique.map(rowLine),
  ].join("\n");
  const table = [
    "| Identity | Role | Address | Action | Tx |",
    "|---|---|---|---|---|",
    ...rows.map(rowLine),
  ].join("\n");

  const md = `# Wallet interactions (Testnet)

**Testnet demo identities, not organic users.**

These accounts were generated with the official Stellar CLI keystore
(\`stellar keys generate NAME --network testnet --fund\`) and funded via
Friendbot. Each identity signed at least one real invoke against the
already-deployed TrustMesh contracts. Hashes are copied from CLI
\`Signing transaction: <64 hex>\` output. Nothing here is organic
product traffic.

Contracts (\`deployments/testnet.json\`):

- Organization registry: \`${contracts.organization_registry}\`
- Treasury: \`${contracts.treasury}\`
- Review verification: \`${contracts.review_verification}\`

Reproduce:

\`\`\`bash
node scripts/demo-users.mjs --count 10
\`\`\`

Secret keys and seed phrases are **not** stored in this repo. They remain
in the local CLI keystore only.

## Unique demo identities (one G-address each)

${uniqueTable}

## All signed transactions

${table}

Generated at ${payload.generatedAt}.
`;
  writeFileSync(join(outDir, "WALLET_INTERACTIONS.md"), md, "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const count = parseCount(process.argv.slice(2));
  const contracts = loadDeployments();
  const users = profiles(count);

  console.log(`==> Ensuring ${count} demo identities in CLI keystore`);
  for (const user of users) {
    const { created, address } = ensureIdentity(user.identity);
    user.address = address;
    const fb = await friendbot(address);
    console.log(
      `${user.identity} ${address} key=${created ? "created" : "existing"} friendbot=${fb.status}`,
    );
    await sleep(400);
  }

  const orgIds = {};
  const rows = [];

  const registerOrg = (user) => {
    const result = invoke(user.identity, contracts.organization_registry, [
      "register_organization",
      "--owner",
      user.address,
      "--name",
      jsonStr(user.orgName),
      "--org_type",
      jsonStr(user.orgType),
      "--metadata_uri",
      jsonStr(`stellar:demo/${user.identity}`),
    ]);
    if (result.status !== 0 && /AlreadyRegistered|Error\(AlreadyRegistered\)/i.test(result.combined)) {
      const existing = orgIdForOwner(
        user.identity,
        contracts.organization_registry,
        user.address,
      );
      if (existing) orgIds[user.identity] = existing;
      return { skipped: true, result, reason: "AlreadyRegistered" };
    }
    if (result.status !== 0) {
      throw new Error(
        `register_organization failed for ${user.identity}:\n${result.combined}`,
      );
    }
    const id = parseOrgId(result.stdout);
    if (id) orgIds[user.identity] = id;
    return { skipped: false, result };
  };

  const deposit = (user, amount) => {
    const result = invoke(user.identity, contracts.treasury, [
      "deposit",
      "--from",
      user.address,
      "--amount",
      String(amount),
    ]);
    if (result.status !== 0) {
      throw new Error(`deposit failed for ${user.identity}:\n${result.combined}`);
    }
    return result;
  };

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const stamp = new Date().toISOString();
    let action;
    let result;
    let note = null;
    let contract;

    const idx = i % 10;
    if (idx <= 5) {
      action = `register_organization (${user.orgType}: ${user.orgName})`;
      contract = "organization_registry";
      const out = registerOrg(user);
      if (out.skipped) {
        action = `treasury.deposit (${150 + i * 10} stroops accounting; org already registered)`;
        contract = "treasury";
        result = deposit(user, 150 + i * 10);
        note = "Owner already registered; signed a treasury deposit instead.";
      } else {
        result = out.result;
        note = `Returned org id ${orgIds[user.identity] ?? "(see CLI stdout)"}.`;
      }
    } else if (idx === 6 || idx === 7) {
      action = `treasury.deposit (${200 + i * 25} stroops, ledger accounting)`;
      contract = "treasury";
      result = deposit(user, 200 + i * 25);
    } else if (idx === 8) {
      const reg = registerOrg(user);
      if (!reg.skipped) {
        const hash = requireHash(
          { identity: user.identity, action: "register_organization" },
          reg.result,
        );
        rows.push(
          record({
            identity: user.identity,
            role: user.role,
            address: user.address,
            action: `register_organization (${user.orgType}: ${user.orgName})`,
            hash,
            timestamp: new Date().toISOString(),
            contract: "organization_registry",
            note: `Returned org id ${orgIds[user.identity] ?? "(see CLI stdout)"}.`,
          }),
        );
        console.log(`${user.identity} register_organization ${hash}`);
        await sleep(800);
      }
      const orgId =
        orgIds[user.identity] ??
        orgIdForOwner(user.identity, contracts.organization_registry, user.address);
      if (!orgId) {
        throw new Error(`${user.identity} has no org id for register_vendor`);
      }
      orgIds[user.identity] = orgId;
      const vendorAddr = users[0].address;
      action = `register_vendor (org ${orgId} → ${vendorAddr.slice(0, 6)}…)`;
      contract = "organization_registry";
      result = invoke(user.identity, contracts.organization_registry, [
        "register_vendor",
        "--org_id",
        String(orgId),
        "--vendor",
        vendorAddr,
      ]);
      if (result.status !== 0 && /VendorAlreadyExists/i.test(result.combined)) {
        action = `treasury.deposit (350 stroops; vendor already registered)`;
        contract = "treasury";
        result = deposit(user, 350);
        note = "Vendor already registered; signed a treasury deposit instead.";
      } else if (result.status !== 0) {
        throw new Error(`register_vendor failed for ${user.identity}:\n${result.combined}`);
      }
    } else {
      const reg = registerOrg(user);
      if (!reg.skipped) {
        const hash = requireHash(
          { identity: user.identity, action: "register_organization" },
          reg.result,
        );
        rows.push(
          record({
            identity: user.identity,
            role: user.role,
            address: user.address,
            action: `register_organization (${user.orgType}: ${user.orgName})`,
            hash,
            timestamp: new Date().toISOString(),
            contract: "organization_registry",
            note: `Returned org id ${orgIds[user.identity] ?? "(see CLI stdout)"}.`,
          }),
        );
        console.log(`${user.identity} register_organization ${hash}`);
        await sleep(800);
      }
      const reviewerOrg =
        orgIds[user.identity] ??
        orgIdForOwner(user.identity, contracts.organization_registry, user.address);
      const firstRegistrar = users.find((u) => orgIds[u.identity]);
      const revieweeOrg = firstRegistrar ? orgIds[firstRegistrar.identity] : null;
      if (!reviewerOrg || !revieweeOrg || reviewerOrg === revieweeOrg) {
        action = `treasury.deposit (400 stroops; review counterpart unavailable)`;
        contract = "treasury";
        result = deposit(user, 400);
        note = "Could not pair reviewer/reviewee orgs; signed a treasury deposit instead.";
      } else {
        action = `submit_review (org ${reviewerOrg} → org ${revieweeOrg}, rating 5)`;
        contract = "review_verification";
        result = invoke(user.identity, contracts.review_verification, [
          "submit_review",
          "--reviewer",
          user.address,
          "--reviewer_org",
          String(reviewerOrg),
          "--reviewee_org",
          String(revieweeOrg),
          "--relationship_id",
          "1",
          "--rating",
          "5",
          "--comment_hash",
          jsonStr("demo-walkthrough-review-01"),
        ]);
        if (result.status !== 0 && /AlreadySubmitted/i.test(result.combined)) {
          action = `treasury.deposit (400 stroops; review already submitted)`;
          contract = "treasury";
          result = deposit(user, 400);
          note = "Review already submitted; signed a treasury deposit instead.";
        } else if (result.status !== 0) {
          throw new Error(`submit_review failed for ${user.identity}:\n${result.combined}`);
        } else {
          note =
            "User-callable submit_review. verify_review is admin-only and was not called. relationship_id is a contract argument (factory create_relationship requires verified orgs, which is admin).";
        }
      }
    }

    const hash = requireHash({ identity: user.identity, action }, result);
    rows.push(
      record({
        identity: user.identity,
        role: user.role,
        address: user.address,
        action,
        hash,
        timestamp: stamp,
        contract,
        note,
      }),
    );
    console.log(`${user.identity} ${action} ${hash}`);
    await sleep(800);
  }

  const byIdentity = new Map();
  for (const row of rows) {
    if (!byIdentity.has(row.identity)) byIdentity.set(row.identity, row);
  }
  if (byIdentity.size !== count) {
    throw new Error(`Expected ${count} unique identities, got ${byIdentity.size}`);
  }

  writeEvidence(rows, contracts);

  console.log("\n==> Testnet demo identities, not organic users.\n");
  console.log(
    "| Identity | Role | Address | Action | Explorer |",
  );
  console.log("|---|---|---|---|---|");
  for (const row of byIdentity.values()) {
    console.log(
      `| ${row.identity} | ${row.role} | ${row.address} | ${row.action} | ${row.explorerUrl} |`,
    );
  }
  console.log("\nWrote docs/evidence/WALLET_INTERACTIONS.md and .json");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
