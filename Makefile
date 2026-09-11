SHELL := /bin/bash
.PHONY: help build docker-build docker-up docker-down logs clean-disk clean-docker clean-pnpm clean-all rebuild lint test dev

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Build ──────────────────────────────────────────────────────────────────

dev: ## Start dev servers (all packages)
	pnpm dev

build: ## Build web app (requires env vars set)
	cd apps/web && npx next build

build-docker: ## Build inside Docker (isolated, no host env needed)
	docker run --rm \
		-v $(PWD):/app \
		-e CI=true \
		-e NODE_OPTIONS="--max-old-space-size=4096" \
		--env-file docker/.env \
		node:24-alpine3.23 \
		sh -c 'apk add --no-cache cmake g++ gcc jq make openssl-dev python3 >/dev/null && \
			npm install --ignore-scripts -g corepack@0.35.0 >/dev/null && \
			corepack enable && corepack prepare pnpm@11.7.0 --activate >/dev/null && \
			cd /app && \
			pnpm install --ignore-scripts --frozen-lockfile && \
			pnpm build --filter=@formbricks/database && \
			pnpm build --filter=@formbricks/web'

# ── Docker Compose ─────────────────────────────────────────────────────────

docker-up: ## Start all services
	docker compose -f docker/docker-compose.yml --env-file docker/.env up -d

docker-down: ## Stop all services
	docker compose -f docker/docker-compose.yml down

docker-logs: ## Tail logs from running services
	docker compose -f docker/docker-compose.yml logs -f

docker-restart: docker-down docker-up ## Restart all services

docker-restart-web: ## Restart only the web container
	docker compose -f docker/docker-compose.yml restart formbricks

docker-recreate-web: ## Recreate web container from current image
	docker compose -f docker/docker-compose.yml up -d --force-recreate formbricks

# ── Hot-patch (no rebuild needed) ──────────────────────────────────────────

patch: ## Copy source changes into running container (dev workflow)
	@echo "Use: docker cp /path/to/file docker-formbricks-1:/home/nextjs/apps/web/path/to/file"
	@echo "Then restart: make docker-restart-web"

# ── Database ───────────────────────────────────────────────────────────────

db-migrate: ## Run Prisma migrations
	docker exec docker-formbricks-1 /home/nextjs/start.sh --skip-migrations 2>/dev/null; \
	docker exec docker-formbricks-1 npx prisma migrate deploy

db-studio: ## Open Prisma Studio (requires DB tunnel)
	npx prisma studio

# ── Quality ────────────────────────────────────────────────────────────────

lint: ## Run linter
	pnpm lint

test: ## Run unit tests
	pnpm test

typecheck: ## Run TypeScript check
	pnpm typecheck

# ── Disk / Docker Cleanup ──────────────────────────────────────────────────

clean-disk: ## Show disk usage
	@echo "=== Disk ==="
	df -h /
	@echo "=== Docker disk ==="
	docker system df
	@echo "=== Largest dirs ==="
	@du -sh /opt/* 2>/dev/null | sort -rh | head -5

clean-docker: ## Prune unused Docker resources (images, cache, volumes)
	docker builder prune --all --force
	docker image prune -af
	docker container prune -f
	docker volume prune -f

clean-pnpm: ## Prune pnpm store and remove download cache
	pnpm store prune
	rm -rf $$HOME/.cache/pnpm
	@echo "pnpm store + cache cleaned"

clean-all: clean-docker clean-pnpm ## Full cleanup: Docker + temp + cache + pnpm
	rm -rf /tmp/node-compile-cache 2>/dev/null
	rm -rf $$HOME/.npm/_cacache 2>/dev/null
	df -h /

# ── Diagnostics ────────────────────────────────────────────────────────────

status: ## Show service status
	@echo "=== Containers ==="
	docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
	@echo "=== Disk ==="
	df -h /

logs-web: ## Show web container logs
	docker logs --tail 100 docker-formbricks-1

logs-web-follow: ## Follow web container logs
	docker logs -f docker-formbricks-1

exec: ## Open shell in web container
	docker exec -it docker-formbricks-1 sh

# ── AES (Engineering System) ───────────────────────────────────────────────

aes-init: ## Initialize AES project structure
	mkdir -p aes/tickets aes/sprints docs

aes-plan: ## Run AES plan phase
	@echo "Use: /aes-plan or define a ticket in aes/tickets/"

aes-learn: ## Run AES learn phase
	@echo "Use: /aes-learn or check aes/tickets/ for completed tickets"

# ── Image Build (Dockerfile) ───────────────────────────────────────────────

image-build: ## Build the production Docker image (may OOM on small servers)
	docker build -f apps/web/Dockerfile -t formbricks-fork:latest .

image-build-nocache: ## Build with no cache (clean rebuild)
	docker build --no-cache -f apps/web/Dockerfile -t formbricks-fork:latest .

image-save: ## Export image to tarball
	docker save formbricks-fork:latest | gzip > formbricks-fork-$$(date +%Y%m%d).tar.gz

image-load: ## Load image from tarball (usage: make image-load FILE=formbricks-fork-20260701.tar.gz)
	gunzip -c $(FILE) | docker load

# ── Secrets ────────────────────────────────────────────────────────────────

secrets-edit: ## Edit docker/.env file (contains secrets)
	@echo "Edit docker/.env for secrets; nano or vim available"
	@ls -la docker/.env

.PHONY: help dev build build-docker docker-up docker-down docker-logs docker-restart docker-restart-web docker-recreate-web patch db-migrate db-studio lint test typecheck clean-disk clean-docker clean-pnpm clean-all status logs-web logs-web-follow exec aes-init aes-plan aes-learn image-build image-build-nocache image-save image-load secrets-edit
