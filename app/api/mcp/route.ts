import { authenticateMcpToken } from "../../../src/mcp/authorization";
import { handleMcpRequest } from "../../../src/mcp/server";
import type { Role } from "../../../src/domain/types";

async function handle(request: Request): Promise<Response> {
  if (process.env.MCP_ENABLED !== "true") {
    return Response.json({ error: "MCP_NOT_ENABLED" }, { status: 404 });
  }
  const provided = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!(await authenticateMcpToken(provided, process.env.MCP_AUTH_TOKEN))) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const role = (process.env.MCP_ROLE ?? "ADMIN") as Role;
  return handleMcpRequest(request, role);
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
