"use client";

import { useState } from "react";

interface SaaSDashboardProps {
  orgId?: string;
  userEmail?: string;
}

export default function SaaSDashboard({ orgId = "aaa99f15-004b-4a53-a422-3d93017bbe01", userEmail = "dheerajsengar2004@gmail.com" }: SaaSDashboardProps) {
  const [activeTab, setActiveTab] = useState<"billing" | "upload" | "ai_leads">("billing");
  
  // Billing State
  const [currentPlan, setCurrentPlan] = useState<"starter" | "pro" | "enterprise">("starter");
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  // Upload State
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Upgrade Plan handler
  async function handleUpgrade(tier: "pro" | "enterprise", amount: number) {
    setPaymentBusy(true);
    setPaymentStatus(null);
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          amount,
          currency: "INR",
          itemDescription: `AI Business Chatbot ${tier.toUpperCase()} Subscription Plan`,
          gateway: "mock" // sandbox simulator
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Verify and settle payment
      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: data.order.orderId,
          gatewayPaymentId: `pay_${Date.now()}`,
          gateway: "mock"
        })
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) throw new Error(verifyData.error);

      setCurrentPlan(tier);
      setPaymentStatus(`🎉 Successfully upgraded to ${tier.toUpperCase()} Plan! Subscriptions active.`);
    } catch (err: any) {
      setPaymentStatus(`❌ Payment failed: ${err.message}`);
    } finally {
      setPaymentBusy(false);
    }
  }

  // Document Upload handler
  async function handleDocUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!docTitle || !docContent) return;
    setUploadBusy(true);
    setUploadMessage(null);
    try {
      const formData = new FormData();
      formData.append("orgId", orgId);
      formData.append("fileName", docTitle.endsWith(".md") ? docTitle : `${docTitle}.md`);
      formData.append("text", docContent);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setUploadMessage(`✅ Successfully ingested ${data.chunksInserted} chunks into vector database!`);
      setDocTitle("");
      setDocContent("");
    } catch (err: any) {
      setUploadMessage(`❌ Ingestion error: ${err.message}`);
    } finally {
      setUploadBusy(false);
    }
  }

  return (
    <div style={{
      maxWidth: "1080px",
      margin: "2rem auto",
      padding: "2rem",
      backgroundColor: "#0d1117",
      color: "#e6edf3",
      borderRadius: "16px",
      border: "1px solid #30363d",
      boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #21262d", paddingBottom: "1.2rem", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ margin: "0 0 0.4rem 0", fontSize: "1.6rem", background: "linear-gradient(90deg, #58a6ff, #a371f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            AI Business Chatbot • Enterprise Client Hub
          </h2>
          <p style={{ margin: 0, color: "#8b949e", fontSize: "0.9rem" }}>
            Tenant: <strong>{userEmail}</strong> | Org ID: <code style={{ color: "#79c0ff" }}>{orgId.substring(0, 18)}...</code>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setActiveTab("billing")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "1px solid",
              borderColor: activeTab === "billing" ? "#58a6ff" : "#30363d",
              background: activeTab === "billing" ? "#1f6feb22" : "transparent",
              color: activeTab === "billing" ? "#58a6ff" : "#8b949e",
              cursor: "pointer",
              fontWeight: 600
            }}>
            💳 Subscriptions & Payments
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "1px solid",
              borderColor: activeTab === "upload" ? "#a371f7" : "#30363d",
              background: activeTab === "upload" ? "#8957e522" : "transparent",
              color: activeTab === "upload" ? "#d2a8ff" : "#8b949e",
              cursor: "pointer",
              fontWeight: 600
            }}>
            📂 Neural Knowledge Upload
          </button>
          <button
            onClick={() => setActiveTab("ai_leads")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "1px solid",
              borderColor: activeTab === "ai_leads" ? "#3fb950" : "#30363d",
              background: activeTab === "ai_leads" ? "#23863622" : "transparent",
              color: activeTab === "ai_leads" ? "#3fb950" : "#8b949e",
              cursor: "pointer",
              fontWeight: 600
            }}>
            🧠 ML Lead Intelligence
          </button>
        </div>
      </div>

      {/* TAB 1: BILLING & PAYMENT GATEWAY */}
      {activeTab === "billing" && (
        <div>
          {paymentStatus && (
            <div style={{ padding: "0.8rem 1rem", borderRadius: "8px", marginBottom: "1.5rem", backgroundColor: paymentStatus.includes("🎉") ? "#23863633" : "#da363333", border: "1px solid", borderColor: paymentStatus.includes("🎉") ? "#2ea043" : "#f85149" }}>
              {paymentStatus}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", marginBottom: "1.5rem" }}>
            {/* Starter */}
            <div style={{ padding: "1.5rem", borderRadius: "12px", border: currentPlan === "starter" ? "2px solid #58a6ff" : "1px solid #30363d", background: "#161b22" }}>
              <div style={{ color: "#8b949e", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>Free Tier</div>
              <h3 style={{ margin: "0.5rem 0", fontSize: "1.8rem" }}>₹0 <span style={{ fontSize: "0.9rem", color: "#8b949e" }}>/ mo</span></h3>
              <p style={{ fontSize: "0.9rem", color: "#8b949e" }}>Basic access for exploration and testing.</p>
              <ul style={{ paddingLeft: "1.2rem", fontSize: "0.85rem", color: "#c9d1d9", lineHeight: "1.8" }}>
                <li>100 Vector Queries / month</li>
                <li>5 Knowledge Files</li>
                <li>Standard Support</li>
              </ul>
              <button disabled style={{ width: "100%", padding: "0.6rem", borderRadius: "8px", background: currentPlan === "starter" ? "#21262d" : "#30363d", color: "#8b949e", border: "none" }}>
                {currentPlan === "starter" ? "Current Plan" : "Downgrade"}
              </button>
            </div>

            {/* Pro */}
            <div style={{ padding: "1.5rem", borderRadius: "12px", border: currentPlan === "pro" ? "2px solid #58a6ff" : "1px solid #30363d", background: "#161b22", position: "relative" }}>
              <span style={{ position: "absolute", top: "12px", right: "12px", backgroundColor: "#1f6feb", color: "#fff", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>MOST POPULAR</span>
              <div style={{ color: "#58a6ff", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>Pro Tier</div>
              <h3 style={{ margin: "0.5rem 0", fontSize: "1.8rem" }}>₹3,999 <span style={{ fontSize: "0.9rem", color: "#8b949e" }}>/ mo</span></h3>
              <p style={{ fontSize: "0.9rem", color: "#8b949e" }}>For growing teams and active deployments.</p>
              <ul style={{ paddingLeft: "1.2rem", fontSize: "0.85rem", color: "#c9d1d9", lineHeight: "1.8" }}>
                <li>5,000 Vector Queries / month</li>
                <li>50 Knowledge Files</li>
                <li>Neural Overlap Chunking</li>
                <li>Cross-Encoder Re-Ranking</li>
              </ul>
              <button
                onClick={() => handleUpgrade("pro", 3999)}
                disabled={paymentBusy || currentPlan === "pro"}
                style={{ width: "100%", padding: "0.6rem", borderRadius: "8px", background: currentPlan === "pro" ? "#238636" : "#1f6feb", color: "#fff", border: "none", cursor: currentPlan === "pro" ? "default" : "pointer", fontWeight: 600 }}>
                {currentPlan === "pro" ? "Active Plan" : paymentBusy ? "Processing..." : "Upgrade to Pro"}
              </button>
            </div>

            {/* Enterprise */}
            <div style={{ padding: "1.5rem", borderRadius: "12px", border: currentPlan === "enterprise" ? "2px solid #a371f7" : "1px solid #30363d", background: "#161b22" }}>
              <div style={{ color: "#a371f7", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>Enterprise</div>
              <h3 style={{ margin: "0.5rem 0", fontSize: "1.8rem" }}>₹14,999 <span style={{ fontSize: "0.9rem", color: "#8b949e" }}>/ mo</span></h3>
              <p style={{ fontSize: "0.9rem", color: "#8b949e" }}>Unlimited power, dedicated isolation & SLAs.</p>
              <ul style={{ paddingLeft: "1.2rem", fontSize: "0.85rem", color: "#c9d1d9", lineHeight: "1.8" }}>
                <li>50,000+ Queries / month</li>
                <li>Unlimited Knowledge Files</li>
                <li>Custom BM25 Hybrid Tuning</li>
                <li>24/7 Dedicated Live Agent Support</li>
              </ul>
              <button
                onClick={() => handleUpgrade("enterprise", 14999)}
                disabled={paymentBusy || currentPlan === "enterprise"}
                style={{ width: "100%", padding: "0.6rem", borderRadius: "8px", background: currentPlan === "enterprise" ? "#238636" : "#8957e5", color: "#fff", border: "none", cursor: currentPlan === "enterprise" ? "default" : "pointer", fontWeight: 600 }}>
                {currentPlan === "enterprise" ? "Active Plan" : paymentBusy ? "Processing..." : "Upgrade to Enterprise"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NEURAL KNOWLEDGE UPLOAD */}
      {activeTab === "upload" && (
        <form onSubmit={handleDocUpload} style={{ background: "#161b22", padding: "1.5rem", borderRadius: "12px", border: "1px solid #30363d" }}>
          <h3 style={{ margin: "0 0 0.8rem 0", color: "#d2a8ff" }}>Ingest New Knowledge Document</h3>
          <p style={{ color: "#8b949e", fontSize: "0.9rem", marginTop: 0 }}>
            Uploaded text is automatically chunked with 15% overlap, embedded using local neural transformers, and isolated to your tenant organization.
          </p>

          {uploadMessage && (
            <div style={{ padding: "0.8rem 1rem", borderRadius: "8px", marginBottom: "1rem", backgroundColor: uploadMessage.includes("✅") ? "#23863633" : "#da363333", border: "1px solid", borderColor: uploadMessage.includes("✅") ? "#2ea043" : "#f85149" }}>
              {uploadMessage}
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "#c9d1d9", marginBottom: "0.4rem" }}>Document Title / File Name</label>
            <input
              type="text"
              placeholder="e.g. Q4_Refund_Policy_and_SLA.md"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              required
              style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", background: "#0d1117", border: "1px solid #30363d", color: "#fff" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", color: "#c9d1d9", marginBottom: "0.4rem" }}>Document Body Content</label>
            <textarea
              rows={6}
              placeholder="Paste custom enterprise policies, product specifications, or service terms..."
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              required
              style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", background: "#0d1117", border: "1px solid #30363d", color: "#fff", resize: "vertical" }}
            />
          </div>

          <button
            type="submit"
            disabled={uploadBusy}
            style={{ padding: "0.7rem 1.5rem", borderRadius: "8px", background: "#238636", color: "#fff", border: "none", cursor: uploadBusy ? "default" : "pointer", fontWeight: 600 }}>
            {uploadBusy ? "Chunking & Vectorizing..." : "⚡ Vectorize & Ingest Document"}
          </button>
        </form>
      )}

      {/* TAB 3: ML LEAD INTELLIGENCE */}
      {activeTab === "ai_leads" && (
        <div style={{ background: "#161b22", padding: "1.5rem", borderRadius: "12px", border: "1px solid #30363d" }}>
          <h3 style={{ margin: "0 0 0.8rem 0", color: "#3fb950" }}>Live ML Lead Intent & Scoring Stream</h3>
          <p style={{ color: "#8b949e", fontSize: "0.9rem", marginTop: 0 }}>
            Every incoming chatbot interaction is analyzed by our real-time intent classifier, calculating lead propensity scores (0-100) and urgency levels.
          </p>

          <div style={{ display: "grid", gap: "1rem" }}>
            {[
              { company: "Nordic Retail Group", text: "We need migration to a headless Shopify storefront with custom checkout by next month. Budget is $15,000.", score: 95, intent: "purchase_intent", urgency: "High (8/10)", action: "Instant Sales Handoff" },
              { company: "Zenith Global Logistics", text: "Do you build automated n8n workflows connecting shipment tracking to WhatsApp notifications?", score: 85, intent: "purchase_intent", urgency: "Medium (6/10)", action: "Trigger In-Chat Checkout" },
              { company: "Malhotra Capital", text: "Can you develop a proprietary internal CRM dashboard? What are your rates?", score: 75, intent: "pricing_inquiry", urgency: "Medium (5/10)", action: "Send Proposal & Estimate" }
            ].map((lead, idx) => (
              <div key={idx} style={{ padding: "1rem", borderRadius: "8px", background: "#0d1117", border: "1px solid #21262d", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "0.4rem" }}>
                    <strong>{lead.company}</strong>
                    <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", background: "#1f6feb22", color: "#58a6ff" }}>{lead.intent}</span>
                    <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", background: "#da363322", color: "#f85149" }}>Urgency: {lead.urgency}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#8b949e" }}>"{lead.text}"</p>
                </div>
                <div style={{ textAlign: "right", minWidth: "160px" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: lead.score >= 80 ? "#3fb950" : "#d29922" }}>{lead.score} / 100</div>
                  <div style={{ fontSize: "0.75rem", color: "#58a6ff", fontWeight: 600 }}>{lead.action}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
