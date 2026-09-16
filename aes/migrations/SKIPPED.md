# Intentionally Skipped Migrations

This file documents migrations that exist in the filesystem but are not tracked in `_prisma_migrations`. These were skipped because the database was initialized from a schema dump (or equivalent) rather than running all historical migrations.

## Context

- **Filesystem schema migrations:** 174
- **Applied in `_prisma_migrations`:** 153
- **Drift:** 21 missing migrations

The missing migrations (2023-2025) correspond to the original Formbricks schema evolution before the AGPL rewrite. The database was provisioned with a current schema state, so these historical migrations are not needed for runtime correctness.

## Missing Migrations (21)

| Migration | Description | Reason Skipped |
|-----------|-------------|----------------|
| 20230329205933_init | Initial schema | Schema already exists |
| 20230405105937_add_api_keys_to_environments | API keys | Tables exist |
| 20230406124657_person_id_optional_in_response | Person ID optional | Columns exist |
| 20230412100209_add_thankyoucard | Thank you card | Tables exist |
| 20230418074110_add_survey_types | Survey types | Columns exist |
| 20230418084158_display_person_optional | Display person optional | Columns exist |
| 20230419181441_add_onboarding_displayed_property_with_default_of_true | Onboarding displayed | Columns exist |
| 20230503105347_add_onboarding | Onboarding | Tables exist |
| 20230503132723_rename_onboarding_flag | Rename flag | Done in schema |
| 20230505085230_add_webhooks | Webhooks | Tables exist |
| 20230515101242_add_attribute_filter | Attribute filter | Tables exist |
| 20230517145313_change_brand_color_default | Brand color default | Schema exists |
| 20230519120218_add_notification_settings_to_user | Notification settings | Columns exist |
| 20230523125921_add_formbricks_signature_to_product | Formbricks signature | Columns exist |
| 20230529092700_add_formbricks_signature_to_product | Duplicate? | Duplicate |
| 20230529092737_make_formbricks_signature_default | Signature default | Done |
| 20230529101210_add_autoclose | Autoclose | Columns exist |
| 20230531143258_remove_user_attributes_from_response | Remove user attrs | Done in schema |
| 20230608112129_add_survey_delay | Survey delay | Columns exist |
| 20230613035154_add_archived_to_attribute_class | Archived attr class | Columns exist |
| 20230613074826_add_response_notes | Response notes | Tables exist |

## Resolution

These migrations are intentionally skipped because:
1. The database was provisioned with a complete current schema (via `prisma db push` or schema dump)
2. All tables, columns, indexes, and constraints already exist
3. Running these migrations would fail (duplicate tables/columns) or be no-ops

The migration runner's drift detection (added in T060) will warn if drift exceeds threshold but will not block deployment since the schema is current.

## Future Migrations

All new migrations after `20260915000000_add_audit_log` must be applied normally and will be tracked in `_prisma_migrations`.