---
ticket: T023
title: Redis AOF "No space left on device" — disk cleanup
sprint: sprint-02
priority: high
status: backlog
created: 2026-07-01
---

# T023 — Redis AOF disk exhaustion

## Context
Docker logs show Redis AOF (Append-Only File) errors: "No space left on device". Redis persists all write operations to disk, and on a small server this can exhaust disk space.

## Acceptance Criteria
- [ ] Redis AOF is either disabled or configured with `always` + `everysec` policies that don't exhaust disk
- [ ] Disk usage is monitored or alerted
- [ ] A cleanup script exists for Redis persistence files
- [ ] The `docker-compose.yml` Redis configuration is reviewed

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
