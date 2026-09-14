---
ticket: T001
title: "ENTERPRISE_LICENSE_KEY presente em 88 refs / 6 ficheiros; T031 '0 refs' falso"
phase: ticket
status: pending
sprint: backlog
priority: medium
created: '2026-09-14'
requires: []
produces: []
blocked_by: ''
---

# T001 — ENTERPRISE_LICENSE_KEY presente em 88 refs / 6 ficheiros; T031 '0 refs' falso

## Origin

Review finding from aes-peer-review.
- **Type:** BLOCKER
- **Evidence:** peer-review AGPL-AUDIT-T026-T039 findings (M-1)
- **Rubric criterion:** S-01

## Closure Condition

grep -rn 'ENTERPRISE_LICENSE_KEY' . --exclude-dir=node_modules --exclude-dir=.git returns 0 AND e2e.yml has no required:true/exit-1 for the var

This ticket is **done** when the closure condition above is verifiably met.
