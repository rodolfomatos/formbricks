/**
 * PendingDowngradeBanner
 *
 * Upstream shows this toast when a license check fails and the instance is scheduled
 * to be downgraded from Enterprise to Community Edition. In this AGPL fork there is
 * no license and no downgrade path, so a "your license will expire" warning is dead
 * and misleading UI.
 *
 * Neutering approach (same as T026 telemetry, and the T033 modal-neutralizing stub):
 * the component keeps its full prop signature so WorkspaceLayout.tsx compiles
 * unchanged, but the render is a no-op conditional that always resolves to null —
 * the fork never produces isPendingDowngrade=true.
 */
"use client";

import { PendingDowngradeBannerProps } from "./types";

export const PendingDowngradeBanner = (_props: PendingDowngradeBannerProps) => null;
