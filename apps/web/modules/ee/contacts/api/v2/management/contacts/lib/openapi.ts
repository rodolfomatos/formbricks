export const contactPaths: Record<string, unknown> = {
  "/management/contacts": {
    get: {
      tags: ["Management API - Contacts"],
      summary: "List contacts",
      description: "Returns a paginated list of contacts in the workspace.",
      parameters: [
        { name: "workspaceId", in: "query", required: true, schema: { type: "string" } },
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
      ],
      responses: {
        "200": { description: "Paginated list of contacts" },
        "400": { description: "Missing workspaceId" },
      },
    },
    post: {
      tags: ["Management API - Contacts"],
      summary: "Create a contact",
      description: "Creates a new contact in the specified workspace.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                workspaceId: { type: "string" },
                attributes: { type: "object", additionalProperties: { type: "string" } },
              },
              required: ["workspaceId"],
            },
          },
        },
      },
      responses: {
        "201": { description: "Contact created" },
        "400": { description: "Invalid input" },
      },
    },
  },
};
