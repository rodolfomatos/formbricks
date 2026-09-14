# T038 Verify — Remove PendingDowngradeBanner dead code

**Date:** 2026-09-11
**Status:** PASS

## Gates Executed

### Gate: single consumer compiles unchanged
- `WorkspaceLayout.tsx:59-63` renders `<PendingDowngradeBanner lastChecked isPendingDowngrade active locale status />`
- Stubbed component keeps identical prop signature → consumer compiles unchanged

### Gate: no misleading downgrade UI reachable
- `pending-downgrade-banner/index.tsx` → `const PendingDowngradeBanner = (_props) => null;` (neutered, same T033-banner approach)
- `pending-downgrade-banner/index.tsx` full body removed (was: corrupt leftover file with markdown fences + duplicated exports inside the TSX)

### Gate: banner file dependency check
- Only `WorkspaceLayout.tsx` imports it (the context-based UI is cloud-only)
- Removed dangling imports: relative path `./banner` resolved to the same neutered index

## Notes
- The upstream banner checks license status and shows a "pending downgrade" toast; with no license in this fork the state is dead UI
- Neutered by render-null (T033-approach) rather than deleted, so the layout consumer stays intact