export interface MLClassificationResult {
  intent: "purchase_intent" | "pricing_inquiry" | "partnership" | "support_request" | "general_query";
  leadScore: number; // 0 to 100
  urgency: number; // 1 to 10
  sentiment: "positive" | "neutral" | "urgent" | "negative";
  budgetTier: "Enterprise ($10k+)" | "Mid-Market ($2k-$10k)" | "Starter (<$2k)" | "Unspecified";
  detectedEntities: {
    services: string[];
    timeline?: string;
    budgetMentioned?: string;
  };
  recommendedAction: "Instant Sales Handoff" | "Trigger In-Chat Checkout" | "Schedule Discovery Call" | "Standard AI Response";
}

const HIGH_INTENT_SIGNALS = [
  "hire", "quote", "cost", "pricing", "contract", "proposal", "start project",
  "develop", "build", "integrate", "looking for team", "budget", "timeline",
  "ready to start", "asap", "deadline", "payment"
];

const SERVICE_ENTITIES: Record<string, string[]> = {
  "AI & Automation": ["ai", "llm", "automation", "rag", "chatbot", "workflow", "n8n"],
  "E-commerce & Shopify": ["shopify", "e-commerce", "storefront", "checkout", "magento"],
  "Web & Mobile App": ["next.js", "react", "flutter", "mobile app", "ios", "android", "web app"],
  "Cloud & DevOps": ["aws", "kubernetes", "docker", "devops", "cloud", "infra"]
};

/**
 * Real-Time ML Intent & Lead Qualification Classifier
 */
export function classifyCustomerIntent(messages: Array<{ role: string; content: string }>): MLClassificationResult {
  const allText = messages.map(m => m.content).join(" ").toLowerCase();
  const latestMessage = messages.at(-1)?.content.toLowerCase() ?? "";

  // 1. Detect Services
  const detectedServices: string[] = [];
  for (const [service, keywords] of Object.entries(SERVICE_ENTITIES)) {
    if (keywords.some(k => allText.includes(k))) {
      detectedServices.push(service);
    }
  }

  // 2. Detect Budget & Currency Signals
  let budgetTier: MLClassificationResult["budgetTier"] = "Unspecified";
  let budgetMentioned: string | undefined;

  const budgetMatch = allText.match(/(?:[$₹€]|usd|inr|eur)\s*(\d+[\d,]*\s*(?:k|lakh|thousand)?)/i);
  if (budgetMatch) {
    budgetMentioned = budgetMatch[0];
    const rawVal = budgetMatch[1].replace(/,/g, "");
    if (/k|thousand/i.test(rawVal) && parseInt(rawVal) >= 10) {
      budgetTier = "Enterprise ($10k+)";
    } else if (/k|thousand/i.test(rawVal) && parseInt(rawVal) >= 2) {
      budgetTier = "Mid-Market ($2k-$10k)";
    } else {
      budgetTier = "Starter (<$2k)";
    }
  }

  // 3. Urgency Scoring (1-10)
  let urgency = 3;
  if (/urgent|emergency|critical|immediate|today|asap|now/i.test(allText)) urgency += 4;
  if (/this week|next week|within a month|deadline/i.test(allText)) urgency += 2;
  urgency = Math.min(10, urgency);

  // 4. Intent Classification
  let intent: MLClassificationResult["intent"] = "general_query";
  if (/price|pricing|cost|budget|rates|fee|how much/i.test(latestMessage)) {
    intent = "pricing_inquiry";
  } else if (/hire|build for us|start project|want to develop|sign contract|purchase|buy/i.test(allText)) {
    intent = "purchase_intent";
  } else if (/partner|collaborate|agency|resell/i.test(allText)) {
    intent = "partnership";
  } else if (/bug|issue|broken|help with login|error|support/i.test(allText)) {
    intent = "support_request";
  }

  // 5. Compute Lead Score (0 - 100)
  let score = 20; // baseline
  if (intent === "purchase_intent") score += 35;
  if (intent === "pricing_inquiry") score += 25;
  if (detectedServices.length > 0) score += 15;
  if (budgetTier !== "Unspecified") score += 20;
  if (urgency >= 6) score += 10;
  score = Math.min(100, Math.max(0, score));

  // 6. Sentiment
  let sentiment: MLClassificationResult["sentiment"] = "neutral";
  if (urgency >= 7) sentiment = "urgent";
  else if (/great|awesome|love|impressive|thanks|interested/i.test(allText)) sentiment = "positive";
  else if (/frustrated|bad|poor|slow|terrible/i.test(allText)) sentiment = "negative";

  // 7. Recommended Action
  let recommendedAction: MLClassificationResult["recommendedAction"] = "Standard AI Response";
  if (score >= 75) recommendedAction = "Instant Sales Handoff";
  else if (intent === "pricing_inquiry" || intent === "purchase_intent") recommendedAction = "Trigger In-Chat Checkout";
  else if (score >= 50) recommendedAction = "Schedule Discovery Call";

  return {
    intent,
    leadScore: score,
    urgency,
    sentiment,
    budgetTier,
    detectedEntities: {
      services: detectedServices,
      budgetMentioned
    },
    recommendedAction
  };
}
