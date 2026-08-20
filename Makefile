# TrustMesh Makefile
# One-liners for local contract + frontend workflows.

.PHONY: test contracts-test contracts-build frontend-test frontend-dev frontend-build deploy help

help:
	@echo "make test            - cargo workspace tests + frontend vitest"
	@echo "make contracts-test  - cargo test --workspace"
	@echo "make contracts-build - stellar contract build (via scripts)"
	@echo "make frontend-test   - lint, typecheck, vitest"
	@echo "make frontend-dev    - next dev"
	@echo "make frontend-build  - next production build"
	@echo "make deploy          - deploy.sh (SOURCE=deployer NETWORK=testnet)"

contracts-test:
	cargo test --workspace

contracts-build:
	bash scripts/build-contracts.sh

frontend-test:
	cd frontend && npm run lint && npm run typecheck && npm test

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

test: contracts-test frontend-test

deploy:
	bash scripts/deploy.sh --source $${SOURCE:-deployer} --network $${NETWORK:-testnet}
