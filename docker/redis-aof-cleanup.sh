#!/usr/bin/env bash
#
# Trims Valkey/Redis AOF persistence files to reclaim disk space.
# Safe to run while the redis container is up: it triggers a rewrite of
# the append-only file, replacing the accumulated incremental AOF with a
# compacted base file. Then reports reclaimed space per volume.
#
# Usage: docker/redis-aof-cleanup.sh [service-name]
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker/docker-compose.yml}"
SERVICE="${1:-redis}"

if ! docker compose -f "$COMPOSE_FILE" ps --format '{{.Name}}' | grep -q "_${SERVICE}-1$"; then
  echo "Redis service '$SERVICE' not running in '${COMPOSE_FILE}'; nothing to clean." >&2
  exit 0
fi

echo "Triggering AOF rewrite on '$SERVICE'..."
docker compose -f "$COMPOSE_FILE" exec -T "$SERVICE" valkey-cli BGREWRITEAOF

echo "Waiting for rewrite to complete..."
if ! docker compose -f "$COMPOSE_FILE" exec -T "$SERVICE" valkey-cli --raw info persistence \
  | grep -q "aof_rewrite_in_progress:0"; then
  echo "AOF rewrite still in progress; check later with: valkey-cli info persistence" >&2
fi

VOLUME_NAME="$(docker compose -f "$COMPOSE_FILE" config --format json 2>/dev/null \
  | python3 -c 'import json,sys; c=json.load(sys.stdin); print([s["volumes"][0] for s in c["services"]["'"$SERVICE"'"].get("volumes",[]) if s.get("Source")][0])' 2>/dev/null || echo "${PWD##*/}_redis")"

echo "AOF directory size after rewrite:"
sudo du -sh "/var/lib/docker/volumes/${VOLUME_NAME}/_data/appendonlydir" 2>/dev/null \
  || du -sh "./_data/appendonlydir" 2>/dev/null \
  || echo "(volume not inspectable without docker privileges — run with sudo)"

echo "Done."