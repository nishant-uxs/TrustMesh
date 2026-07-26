#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Building Soroban WASM packages"
stellar contract build

OUT="$ROOT/target/wasm32v1-none/release"
REQUIRED=(
  organization_registry
  reputation
  treasury
  trust_relationship
  trust_relationship_factory
  review_verification
)

for name in "${REQUIRED[@]}"; do
  wasm="$OUT/${name}.wasm"
  if [[ ! -f "$wasm" ]]; then
    echo "MISSING: $wasm" >&2
    exit 1
  fi
  echo "OK $name ($(wc -c < "$wasm") bytes)"
done

echo "All 6 contract WASM artifacts built."
