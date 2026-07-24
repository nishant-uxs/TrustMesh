# TrustMesh Testnet deployment (PowerShell)
param(
  [string]$Source = "deployer",
  [string]$Network = "testnet"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$WasmDir = Join-Path $Root "target\wasm32v1-none\release"
$Admin = (stellar keys address $Source).Trim()
Write-Host "Admin: $Admin"

function Deploy-Contract([string]$Name) {
  $wasm = Join-Path $WasmDir "$Name.wasm"
  Write-Host "==> Deploying $Name"
  $id = (stellar contract deploy --wasm $wasm --source $Source --network $Network).Trim()
  Write-Host "    $id"
  return $id
}

$OrgRegistry = Deploy-Contract "organization_registry"
$Reputation = Deploy-Contract "reputation"
$Treasury = Deploy-Contract "treasury"
$TrustRel = Deploy-Contract "trust_relationship"
$Factory = Deploy-Contract "trust_relationship_factory"
$Review = Deploy-Contract "review_verification"

Write-Host "==> Initializing"

stellar contract invoke --id $OrgRegistry --source $Source --network $Network -- initialize --admin $Admin
stellar contract invoke --id $Reputation --source $Source --network $Network -- initialize --admin $Admin
stellar contract invoke --id $Treasury --source $Source --network $Network -- initialize --admin $Admin
stellar contract invoke --id $TrustRel --source $Source --network $Network -- initialize --admin $Admin --factory $Factory --reputation $Reputation
stellar contract invoke --id $Factory --source $Source --network $Network -- initialize --admin $Admin --registry $OrgRegistry --relationship $TrustRel --reputation $Reputation --treasury $Treasury
stellar contract invoke --id $Review --source $Source --network $Network -- initialize --admin $Admin --registry $OrgRegistry --reputation $Reputation --treasury $Treasury

Write-Host "==> Authorizing cross-contract callers"
stellar contract invoke --id $Reputation --source $Source --network $Network -- set_authorized --caller $Factory --authorized true
stellar contract invoke --id $Reputation --source $Source --network $Network -- set_authorized --caller $TrustRel --authorized true
stellar contract invoke --id $Reputation --source $Source --network $Network -- set_authorized --caller $Review --authorized true
stellar contract invoke --id $Treasury --source $Source --network $Network -- set_authorized --caller $Factory --authorized true
stellar contract invoke --id $Treasury --source $Source --network $Network -- set_authorized --caller $Review --authorized true

$OutDir = Join-Path $Root "deployments"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$EnvFile = Join-Path $OutDir "testnet.env"

@"
# TrustMesh Stellar Testnet deployment
# Generated $(Get-Date -Format o)

NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_ORGANIZATION_REGISTRY_ID=$OrgRegistry
NEXT_PUBLIC_REPUTATION_ID=$Reputation
NEXT_PUBLIC_TREASURY_ID=$Treasury
NEXT_PUBLIC_TRUST_RELATIONSHIP_ID=$TrustRel
NEXT_PUBLIC_TRUST_RELATIONSHIP_FACTORY_ID=$Factory
NEXT_PUBLIC_REVIEW_VERIFICATION_ID=$Review
"@ | Set-Content -Path $EnvFile -Encoding utf8

Copy-Item $EnvFile (Join-Path $Root "frontend\.env.local") -Force

Write-Host ""
Write-Host "Deployment complete -> $EnvFile"
Get-Content $EnvFile
