import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import type { Role } from "../domain/types";
import { authorizeMcpTool, type McpToolName } from "./authorization";
import { executeMcpTool } from "./tools";

const toolDefinitions: Array<{
  name: McpToolName;
  description: string;
  inputSchema: Record<string, z.ZodType>;
}> = [
  {
    name: "create_pix_sale",
    description: "Cria uma venda Pix usando os serviços internos autorizados.",
    inputSchema: {
      customerName: z.string().min(2),
      description: z.string().min(2),
      amount: z.number().int().positive(),
      sellerId: z.string().optional(),
    },
  },
  {
    name: "get_sale",
    description: "Consulta uma venda pelo ID ou referência.",
    inputSchema: { id: z.string() },
  },
  {
    name: "get_sale_payment_status",
    description: "Consulta o estado financeiro verificado de uma venda.",
    inputSchema: { id: z.string() },
  },
  {
    name: "list_pending_sales",
    description: "Lista cobranças que aguardam pagamento.",
    inputSchema: {},
  },
  {
    name: "list_paid_sales",
    description: "Lista vendas com pagamento confirmado.",
    inputSchema: {},
  },
  {
    name: "list_ambiguous_payments",
    description: "Lista pagamentos em conciliação.",
    inputSchema: {},
  },
  {
    name: "get_payment_details",
    description: "Obtém detalhes sanitizados de um pagamento.",
    inputSchema: { id: z.string() },
  },
  {
    name: "retry_payment_verification",
    description: "Agenda uma nova verificação junto ao provedor.",
    inputSchema: { id: z.string() },
  },
  {
    name: "manually_reconcile_payment",
    description: "Resolve uma conciliação com permissão administrativa.",
    inputSchema: { id: z.string(), resolution: z.string().min(3) },
  },
  {
    name: "list_sellers",
    description: "Lista vendedores autorizados da loja.",
    inputSchema: {},
  },
  {
    name: "get_seller_performance",
    description: "Retorna o desempenho agregado dos vendedores.",
    inputSchema: {},
  },
  {
    name: "get_daily_sales_summary",
    description: "Retorna o resumo diário da loja.",
    inputSchema: {},
  },
  {
    name: "get_integration_health",
    description: "Retorna a saúde das integrações.",
    inputSchema: {},
  },
];

export function createMcpServer(role: Role): McpServer {
  const server = new McpServer({
    name: "notifica-ai",
    version: "1.0.0",
  });

  for (const definition of toolDefinitions) {
    server.registerTool(
      definition.name,
      {
        description: definition.description,
        inputSchema: definition.inputSchema,
        annotations: {
          readOnlyHint: ![
            "create_pix_sale",
            "retry_payment_verification",
            "manually_reconcile_payment",
          ].includes(definition.name),
          openWorldHint: false,
        },
      },
      async (input) => {
        if (!authorizeMcpTool(role, definition.name)) {
          return {
            isError: true,
            content: [{ type: "text", text: "FORBIDDEN" }],
          };
        }
        const result = await executeMcpTool(
          definition.name,
          input as Record<string, unknown>,
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      },
    );
  }
  return server;
}

export async function handleMcpRequest(
  request: Request,
  role: Role,
): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const server = createMcpServer(role);
  await server.connect(transport);
  return transport.handleRequest(request);
}
