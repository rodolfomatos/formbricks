export const bulkContactPaths: Record<string, unknown> = {
  "/management/contacts/bulk": {
    put: {
      tags: ["Management API - Contacts"],
      summary: "Bulk upsert contacts",
      description: "Creates or updates multiple contacts in a single request.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                workspaceId: { type: "string" },
                contacts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      externalId: { type: "string" },
                      attributes: { type: "object", additionalProperties: { type: "string" } },
                    },
                  },
                },
              },
              required: ["workspaceId", "contacts"],
            },
          },
        },
      },
      responses: {
        "200": { description: "Bulk upsert completed" },
        "400": { description: "Invalid input" },
      },
    },
  },
};
