/**
 * Database module — Prisma ORM client with connection pooling, JSON type
 * augmentation, and browser-compatible entry points.
 *
 * @example
 * ```typescript
 * import { prisma } from "@formbricks/database";
 * const surveys = await prisma.survey.findMany();
 * ```
 */
import "../json-types";

export * from "./client";
