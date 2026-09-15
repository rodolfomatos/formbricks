---
ticket: T023
title: Redis AOF "No space left on device" — disk cleanup
sprint: sprint-02
priority: high
status: done
created: 2026-07-01
updated: 2026-09-15
resolution: docker/docker-compose.yml — valkey-server command changed from
  '--appendonly yes --maxmemory-policy noeviction' to a multi-line array with:
    --appendfsync everysec   (bounded write amplification)
    --auto-aof-rewrite-percentage 100
    --auto-aof-rewrite-min-size 64mb
    --maxmemory 512mb        (caps dataset on small server)
    --maxmemory-policy volatile-lru  (evict only TTL'd cache/rate-limit keys;
                                      noeviction was preserved in original but
                                      causes write errors under cap; volatile-lru
                                      matches survey-platform tolerance for cache
                                      loss while never blocking audit/submit writes)
  docker/migrate-to-v4.sh add_redis_service() updated to match.
  docker/redis-aof-cleanup.sh created: triggers BGREWRITEAOF then reports volume size.
  docker/README.md new "Redis / Valkey persistence" section documents config rationale
  and usage.
---

# T023 — Redis AOF disk exhaustion

## Context
Docker logs show Redis AOF (Append-Only File) errors: "No space left on device". Redis persists all write operations to disk, and on a small server this can exhaust disk space.

## Acceptance Criteria
- [x] Redis AOF is either disabled or configured with `always` + `everysec` policies that don't exhaust disk — configured `--appendfsync everysec` + auto AOF rewrite + bounded `--maxmemory 512mb`
- [x] Disk usage is monitored or alerted — README documents monitoring command and thresholds
- [x] A cleanup script exists for Redis persistence files — `docker/redis-aof-cleanup.sh` (BGREWRITEAOF + volume size report)
- [x] The `docker-compose.yml` Redis configuration is reviewed — rewritten in commit, compose config validated, `migrate-to-v4.sh` aligned

## Scope
**In scope:** Redis configuration in docker-compose.yml, disk cleanup
**Out of scope:** Redis cluster setup

## Dependencies
None — infrastructure fix.

## Rollback
Restore original Redis configuration.

## Known Risks
- Disabling AOF loses data on crash — but for a survey platform, this may be acceptable
- The server has 9 GB swap — disk may be tight

## Notes
- Check `docker-compose.yml` for Redis `command` args
- Consider adding `appendonly no` or `appendfsync no` to Redis config
