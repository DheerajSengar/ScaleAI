import { createPaymentOrder } from "@/lib/payments";

export interface AIToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface AIToolResult {
  tool: string;
  success: boolean;
  data: any;
  uiComponent?: {
    type: "payment_card" | "quote_card" | "meeting_card";
    payload: Record<string, any>;
  };
}

export const AI_TOOL_DEFINITIONS = [
  {
    name: "create_payment_link",
    description: "Generates a direct checkout link or invoice card for a client when they want to pay or start a project/subscription.",
    parameters: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Payment amount (e.g. 49 for Pro Plan, or custom deposit)" },
        currency: { type: "string", enum: ["INR", "USD", "EUR"], default: "INR" },
        serviceName: { type: "string", description: "Name of the service or subscription plan" }
      },
      required: ["amount", "serviceName"]
    }
  },
  {
    name: "calculate_project_quote",
    description: "Calculates an estimated price range and delivery timeline based on requested technology and scope.",
    parameters: {
      type: "object",
      properties: {
        serviceCategory: { type: "string", description: "Category such as AI & Automation, Shopify, Mobile App, Web App" },
        complexity: { type: "string", enum: ["standard", "advanced", "enterprise"] },
        expectedWeeks: { type: "number", description: "Desired completion time in weeks" }
      },
      required: ["serviceCategory"]
    }
  }
];

export async function executeAITool(toolCall: AIToolCall, orgId: string): Promise<AIToolResult> {
  const { name, arguments: args } = toolCall;

  if (name === "create_payment_link") {
    try {
      const order = await createPaymentOrder({
        orgId,
        amount: Number(args.amount) || 49,
        currency: args.currency || "INR",
        itemDescription: args.serviceName || "SCALE AI Service Deposit"
      });

      return {
        tool: name,
        success: true,
        data: order,
        uiComponent: {
          type: "payment_card",
          payload: {
            orderId: order.orderId,
            gatewayOrderId: order.gatewayOrderId,
            amount: order.amount,
            currency: order.currency,
            description: args.serviceName,
            gateway: order.gateway
          }
        }
      };
    } catch (err: any) {
      return { tool: name, success: false, data: { error: err.message } };
    }
  }

  if (name === "calculate_project_quote") {
    const category = String(args.serviceCategory || "Web Development");
    const complexity = args.complexity || "standard";
    const weeks = Number(args.expectedWeeks) || 3;

    let baseRate = 1500;
    if (category.toLowerCase().includes("ai")) baseRate = 3500;
    else if (category.toLowerCase().includes("shopify")) baseRate = 2000;
    else if (category.toLowerCase().includes("mobile")) baseRate = 3000;

    const multiplier = complexity === "enterprise" ? 2.5 : complexity === "advanced" ? 1.6 : 1.0;
    const estimatedCost = Math.round(baseRate * multiplier);

    return {
      tool: name,
      success: true,
      data: {
        serviceCategory: category,
        estimatedCostUSD: estimatedCost,
        estimatedCostINR: estimatedCost * 85,
        estimatedDeliveryWeeks: weeks,
        complexity
      },
      uiComponent: {
        type: "quote_card",
        payload: {
          category,
          costUSD: estimatedCost,
          costINR: estimatedCost * 85,
          weeks,
          complexity
        }
      }
    };
  }

  return { tool: name, success: false, data: { error: "Unknown tool call" } };
}
