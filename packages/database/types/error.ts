/**
 * Well-known Prisma error codes mapped to human-readable names so callers can
 * switch on these instead of remembering magic strings.
 */
export enum PrismaErrorType {
  UniqueConstraintViolation = "P2002",
  RecordDoesNotExist = "P2015",
  RelatedRecordDoesNotExist = "P2025",
}
