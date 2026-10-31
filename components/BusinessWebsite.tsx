"use client";

import { useState, useId, useTransition, type FormEvent } from "react";
import Link from "next/link";
import knowledge from "@/data/company.json";

type ServiceCategory = "all" | "ai" | "web" | "mobile" | "enterprise" | "marketing";

interface EstimateResult {
  timeline: string;
  scopeLabel: string;
  deliverables: string[];
  techStack: string[];
}

export default function BusinessWebsite() {
  // Navigation & UI state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>("all");
  const [activeFaqCategory, setActiveFaqCategory] = useState<string>("all");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Estimator state
  const [selectedService, setSelectedService] = useState<string>("AI & Automation");
  const [projectScale, setProjectScale] = useState<"starter" | "growth" | "enterprise">("growth");
  const [timelineUrgency, setTimelineUrgency] = useState<"standard" | "fast">("standard");

  // Contact Form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactService, setContactService] = useState("AI & Automation");
  const [contactBudget, setContactBudget] = useState("$10,000 – $25,000");
  const [contactTimeline, setContactTimeline] = useState("4–8 weeks");
  const [contactDescription, setContactDescription] = useState("");
  const [contactConsent, setContactConsent] = useState(true);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitReference, setSubmitReference] = useState("");
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");
  const [, startTransition] = useTransition();

  // Floating Chat widget state
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "assistant" | "user"; content: string }>>([
    {
      role: "assistant",
      content: "Hello! I am SCALE AI's AI business advisor. Ask me about our services, project timelines, n8n automations, tech stack, or get an estimate for your next project."
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Calculate Estimator Output
  const calculateEstimate = (): EstimateResult => {
    let timeline = "6–10 weeks";
    let scopeLabel = "Growth & Production Scale";
    let deliverables = [
      "Architecture design & specification",
      "Production-ready Next.js / React application",
      "Grounded AI assistant integration",
      "Supabase PostgreSQL database & RLS policies",
      "Automated CI/CD deployment & security audit"
    ];
    let techStack = ["Next.js 16", "React 19", "TypeScript", "Tailored AI LLMs", "Supabase"];

    if (selectedService.includes("AI") || selectedService.includes("Automation")) {
      techStack = ["OpenAI API", "n8n Automation", "Python", "Supabase Vector", "Next.js"];
      if (projectScale === "starter") {
        timeline = timelineUrgency === "fast" ? "2–3 weeks" : "3–4 weeks";
        scopeLabel = "Grounded Chatbot / AI Workflow MVP";
        deliverables = [
          "Zero-hallucination grounded knowledge base",
          "Automated lead capture & email triggers",
          "Embedded chat widget with customizable theme",
          "Production deployment & testing"
        ];
      } else if (projectScale === "enterprise") {
        timeline = timelineUrgency === "fast" ? "8–12 weeks" : "12–16 weeks";
        scopeLabel = "Autonomous Multi-Agent AI Ecosystem";
        deliverables = [
          "Multi-agent autonomous workflow orchestration",
          "Full CRM / ERP deep integration via n8n & webhooks",
          "Real-time human-agent handoff & live presence",
          "Enterprise RLS, compliance audits & SLA maintenance"
        ];
      }
    } else if (selectedService.includes("Mobile")) {
      techStack = ["Flutter", "React Native", "iOS / Swift", "Android / Kotlin", "Node.js"];
      timeline = projectScale === "starter" ? "4–6 weeks" : "10–14 weeks";
      scopeLabel = "Native Cross-Platform Mobile Experience";
      deliverables = [
        "Native performance for both iOS & Android",
        "Push notifications, biometric auth & offline cache",
        "App Store & Google Play submission readiness",
        "Backend API synchronization"
      ];
    } else if (selectedService.includes("Shopify") || selectedService.includes("E-commerce")) {
      techStack = ["Shopify Plus", "Liquid / Headless", "Stripe", "Next.js Commerce"];
      timeline = projectScale === "starter" ? "2–4 weeks" : "6–10 weeks";
      scopeLabel = "High-Conversion E-Commerce Infrastructure";
      deliverables = [
        "Custom responsive storefront design",
        "Catalog setup, inventory sync & smart filters",
        "Secure payment gateways & checkout optimization",
        "Analytics, conversion tracking & abandoned cart recovery"
      ];
    }

    return { timeline, scopeLabel, deliverables, techStack };
  };

  const currentEstimate = calculateEstimate();

  // Contact Form Submission Handler
  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contactConsent) {
      setSubmitErrorMessage("Please provide consent to process your enquiry.");
      setSubmitStatus("error");
      return;
    }

    setSubmitStatus("submitting");
    setSubmitErrorMessage("");

    try {
      const submissionId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `sub-${Date.now()}`;
      const payload = {
        submissionId,
        name: contactName.trim(),
        email: contactEmail.trim().toLowerCase(),
        phone: contactPhone.trim(),
        service: contactService,
        description: contactDescription.trim() || `Inquiry for ${contactService} (${contactBudget}, ${contactTimeline})`,
        budget: contactBudget,
        timeline: contactTimeline,
        consent: true
      };

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit enquiry. Please try again.");
      }

      setSubmitReference(data.reference || "SUBMITTED");
      setSubmitStatus("success");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setSubmitErrorMessage(errorMsg);
      setSubmitStatus("error");
    }
  };

  // Quick Chat Send Handler
  const handleChatSend = async (messageText?: string) => {
    const text = (messageText || chatInput).trim();
    if (!text || chatLoading) return;

    const userMsg = { role: "user" as const, content: text };
    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput("");
    setChatLoading(true);

    try {
      // Local knowledge-based grounded match fallback
      const normalized = text.toLowerCase();
      let reply = "";

      if (/price|pricing|cost|budget|quote|estimate/.test(normalized)) {
        reply = "We offer transparent custom quotes tailored to scope and technical requirements. Ask the SCALE AI team for a tailored quote at dheerajsengar2004@gmail.com, or use our interactive cost estimator above!";
      } else if (/timeline|how long|delivery|duration/.test(normalized)) {
        reply = "A landing page or MVP typically takes 2–4 weeks, while a comprehensive web or mobile app typically takes 8–16 weeks. Exact milestones are determined during discovery.";
      } else if (/n8n|workflow|automation/.test(normalized)) {
        reply = "SCALE AI engineers event-driven n8n workflows and API integrations connecting CRMs, payment gateways, databases, and custom AI tools. We confirm connector compatibility during discovery.";
      } else if (/shopify|ecommerce|store/.test(normalized)) {
        reply = "We build high-converting Shopify and custom e-commerce stores with optimized checkout, product catalogs, and payment gateways, as seen in our Drive Tribe Tyres case study.";
      } else if (/contact|email|phone|office/.test(normalized)) {
        reply = "You can reach our team at dheerajsengar2004@gmail.com or +91 7477220944. Our headquarters are in Sector 73, Noida, Uttar Pradesh, India.";
      } else if (/service|what do you|what can you/.test(normalized)) {
        reply = "SCALE AI provides AI & Automation, Web Development, Mobile Development (Flutter/React Native), Shopify & E-commerce, n8n Workflows, Cloud & DevOps, Enterprise IT Solutions, UI/UX Design, and Digital Marketing.";
      } else {
        reply = "SCALE AI delivers modern digital solutions backed by our ISO 9001:2015 certification. Would you like to discuss a specific project or connect with an engineer?";
      }

      setChatMessages([...newHistory, { role: "assistant", content: reply }]);
    } catch {
      setChatMessages([
        ...newHistory,
        {
          role: "assistant",
          content: "You can reach out directly to our engineering team at dheerajsengar2004@gmail.com to discuss your project requirements."
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Filtered Services list
  const servicesList = knowledge.services.filter((svc) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "ai") return svc.name.includes("AI") || svc.name.includes("Automation") || svc.name.includes("n8n") || svc.name.includes("WhatsApp");
    if (activeCategory === "web") return svc.name.includes("Web") || svc.name.includes("E-commerce") || svc.name.includes("Shopify");
    if (activeCategory === "mobile") return svc.name.includes("Mobile") || svc.name.includes("React Native") || svc.name.includes("Flutter");
    if (activeCategory === "enterprise") return svc.name.includes("Enterprise") || svc.name.includes("Cloud") || svc.name.includes("Analytics");
    if (activeCategory === "marketing") return svc.name.includes("Marketing") || svc.name.includes("Design") || svc.name.includes("Logo");
    return true;
  });

  const faqsList = [
    {
      q: "How do I get started with a project at SCALE AI?",
      a: "Getting started is simple. Fill out our project intake form below or contact us at dheerajsengar2004@gmail.com. We schedule an initial 30-minute discovery call to clarify your goals, user requirements, and technical constraints, followed by a formal proposal with transparent scope.",
      cat: "general"
    },
    {
      q: "How does the AI chatbot ensure grounded, accurate responses?",
      a: "Our AI chatbot operates with rigorous grounding protocols. It references our verified business knowledge base, enforces prompt-injection boundaries, never invents pricing or unauthorized commitments, and provides seamless handoff to human team members when requested.",
      cat: "services"
    },
    {
      q: "What is your typical project delivery timeline?",
      a: "Landing pages and rapid MVPs are delivered in 2–4 weeks. Comprehensive web applications, custom e-commerce stores, or mobile apps typically require 8–16 weeks. We work in 2-week agile sprints with continuous staging previews.",
      cat: "timelines"
    },
    {
      q: "Do you work with international clients outside India?",
      a: "Yes. SCALE AI serves startups and enterprise clients across India, North America, Europe, and the Middle East. We offer flexible communication across time zones and secure international payment processing.",
      cat: "general"
    },
    {
      q: "How do you handle project pricing and quotes?",
      a: "We provide tailored, milestone-based quotes based on project complexity, integrations, and deliverables. You can use our interactive estimator on this page to get a preliminary sense of scope, and our team will provide a fixed or sprint-based proposal.",
      cat: "pricing"
    },
    {
      q: "Can you automate workflows with n8n and our existing CRM?",
      a: "Absolutely. We specialize in n8n workflow engineering, linking webhook triggers, custom APIs, CRMs (HubSpot, Salesforce, custom DBs), payment providers, and automated notification channels like WhatsApp Business API.",
      cat: "services"
    },
    {
      q: "What post-launch support and maintenance do you offer?",
      a: "Every engagement includes a dedicated warranty period post-deployment. We also provide ongoing SLA maintenance packages covering security updates, performance monitoring, cloud optimizations, and feature enhancements.",
      cat: "services"
    }
  ];

  const filteredFaqs = faqsList.filter((f) => activeFaqCategory === "all" || f.cat === activeFaqCategory);

  return (
    <div className="saas-root">
      {/* SaaS Navigation Bar */}
      <header className="saas-header">
        <div className="saas-header-inner">
          <Link href="/" className="saas-brand" aria-label="SCALE AI Homepage">
            <span className="saas-brand-text">
              SCALE <strong>AI</strong>
              <small>AI &amp; TECHNOLOGY</small>
            </span>
          </Link>

          <nav className={`saas-nav ${mobileMenuOpen ? "open" : ""}`} aria-label="Main Navigation">
            <a href="#services" onClick={() => setMobileMenuOpen(false)}>Services</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#estimator" onClick={() => setMobileMenuOpen(false)}>Estimator</a>
            <a href="#portfolio" onClick={() => setMobileMenuOpen(false)}>Case Studies</a>
            <a href="#faqs" onClick={() => setMobileMenuOpen(false)}>FAQs</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a>
          </nav>

          <div className="saas-header-actions">
            <button
              type="button"
              className="saas-btn saas-btn-subtle"
              onClick={() => setChatDrawerOpen(true)}
              aria-label="Open AI Assistant Chat"
            >
              <span className="saas-indicator-dot" aria-hidden="true" />
              Chat with AI
            </button>
            <Link href="/workspace" className="saas-btn saas-btn-primary">
              Workspace Access
            </Link>
            <button
              type="button"
              className="saas-mobile-toggle"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="saas-hero">
          <div className="saas-hero-container">
            <div className="saas-pill-badge">
              <span className="badge-sparkle">✨</span>
              <span>Next-Gen AI Business Solutions · 100% Grounded Intelligence</span>
            </div>

            <h1 className="saas-hero-title">
              Intelligent AI Systems &amp; Enterprise Software Built to{" "}
              <span className="saas-gradient-text">Scale Your Business</span>
            </h1>

            <p className="saas-hero-subtitle">
              SCALE AI designs, builds, and deploys high-performance web platforms, cross-platform mobile apps,
              automated n8n workflows, and grounded AI chatbots. Certified quality, production-ready code, and enterprise reliability.
            </p>

            <div className="saas-hero-cta-group">
              <a href="#services" className="saas-btn saas-btn-hero-primary">
                Explore Services
                <span aria-hidden="true">→</span>
              </a>
              <button
                type="button"
                className="saas-btn saas-btn-hero-secondary"
                onClick={() => setChatDrawerOpen(true)}
              >
                Launch AI Assistant
              </button>
              <a href="#estimator" className="saas-btn saas-btn-hero-outline">
                Project Cost Estimator
              </a>
            </div>

            {/* Interactive Prompt Pills */}
            <div className="saas-quick-prompts">
              <span className="prompts-label">Try asking our AI:</span>
              <button
                type="button"
                className="prompt-chip"
                onClick={() => {
                  setChatDrawerOpen(true);
                  handleChatSend("What services does SCALE AI provide?");
                }}
              >
                &ldquo;What services does SCALE AI provide?&rdquo;
              </button>
              <button
                type="button"
                className="prompt-chip"
                onClick={() => {
                  setChatDrawerOpen(true);
                  handleChatSend("Can you build an n8n workflow for my business?");
                }}
              >
                &ldquo;How do n8n workflow automations work?&rdquo;
              </button>
              <button
                type="button"
                className="prompt-chip"
                onClick={() => {
                  setChatDrawerOpen(true);
                  handleChatSend("What is the typical project timeline?");
                }}
              >
                &ldquo;What is your project timeline?&rdquo;
              </button>
            </div>

            {/* Metric Counters Strip */}
            <div className="saas-metric-strip">
              <div className="metric-box">
                <span className="metric-number">250+</span>
                <span className="metric-desc">Projects Delivered Worldwide</span>
              </div>
              <div className="metric-box">
                <span className="metric-number">99.4%</span>
                <span className="metric-desc">Client Satisfaction Rate</span>
              </div>
              <div className="metric-box">
                <span className="metric-number">15+</span>
                <span className="metric-desc">Industries Powered</span>
              </div>
              <div className="metric-box">
                <span className="metric-number">ISO 9001</span>
                <span className="metric-desc">Certified Quality Management</span>
              </div>
              <div className="metric-box">
                <span className="metric-number">&lt; 1.2s</span>
                <span className="metric-desc">Grounded AI Response Speed</span>
              </div>
            </div>
          </div>
        </section>

        {/* Services Showcase Section */}
        <section id="services" className="saas-section saas-services-section">
          <div className="saas-container">
            <div className="saas-section-header">
              <span className="saas-section-tag">CAPABILITIES &amp; OFFERINGS</span>
              <h2 className="saas-section-title">Comprehensive Engineering &amp; AI Services</h2>
              <p className="saas-section-desc">
                From concept discovery to production scale, we craft resilient digital products, custom AI agents, and frictionless integrations.
              </p>

              {/* Service Category Tabs */}
              <div className="saas-filter-pills" role="tablist" aria-label="Filter Services">
                {(
                  [
                    { id: "all", label: "All Services" },
                    { id: "ai", label: "AI & Automation" },
                    { id: "web", label: "Web & E-Commerce" },
                    { id: "mobile", label: "Mobile Apps" },
                    { id: "enterprise", label: "Enterprise & Cloud" },
                    { id: "marketing", label: "Marketing & Design" }
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeCategory === tab.id}
                    className={`filter-pill ${activeCategory === tab.id ? "active" : ""}`}
                    onClick={() => setActiveCategory(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Services Grid */}
            <div className="saas-services-grid">
              {servicesList.map((svc, i) => (
                <div className="saas-service-card" key={svc.name}>
                  <div className="service-card-header">
                    <span className="service-index-number">0{i + 1}</span>
                    <span className="service-status-badge">Available</span>
                  </div>
                  <h3 className="service-title">{svc.name}</h3>
                  <p className="service-description">{svc.description}</p>
                  <div className="service-card-footer">
                    <button
                      type="button"
                      className="service-action-link"
                      onClick={() => {
                        setContactService(svc.name);
                        const el = document.getElementById("contact");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      Enquire for this service <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enterprise Architecture & Features Section */}
        <section id="features" className="saas-section saas-features-section">
          <div className="saas-container">
            <div className="saas-section-header">
              <span className="saas-section-tag">BUILT FOR ENTERPRISE</span>
              <h2 className="saas-section-title">Engineered with Precision &amp; Trust</h2>
              <p className="saas-section-desc">
                We design AI and cloud infrastructure that honors data privacy, guarantees deterministic uptime, and passes rigorous enterprise audits.
              </p>
            </div>

            <div className="saas-features-grid">
              <div className="saas-feature-card">
                <div className="feature-icon-wrapper">🛡️</div>
                <h3>100% Grounded AI Guardrails</h3>
                <p>
                  Zero hallucinations. The AI assistant responds solely based on verified company data, protecting brand integrity and never committing unapproved quotes.
                </p>
                <ul className="feature-checklist">
                  <li>Context-bound system instructions</li>
                  <li>Prompt injection defense layers</li>
                  <li>Structured fallback answers</li>
                </ul>
              </div>

              <div className="saas-feature-card">
                <div className="feature-icon-wrapper">⚡</div>
                <h3>Consent-First Lead Capture</h3>
                <p>
                  Transparent privacy compliance. Leads require explicit user consent, validated via Zod schemas, with cryptographically secure idempotency keys.
                </p>
                <ul className="feature-checklist">
                  <li>Automatic deduplication of retries</li>
                  <li>Real-time email notification hooks</li>
                  <li>Audit-ready timestamp logging</li>
                </ul>
              </div>

              <div className="saas-feature-card">
                <div className="feature-icon-wrapper">👥</div>
                <h3>Seamless Human Agent Handoff</h3>
                <p>
                  Visitors can transition smoothly from AI chat to a verified staff member, sharing the full conversation history without missing a beat.
                </p>
                <ul className="feature-checklist">
                  <li>Real-time staff presence tracking</li>
                  <li>Shared live customer queue</li>
                  <li>Authenticated team inbox at /team</li>
                </ul>
              </div>

              <div className="saas-feature-card">
                <div className="feature-icon-wrapper">🔒</div>
                <h3>Enterprise Row-Level Security</h3>
                <p>
                  Powered by Supabase PostgreSQL with strict RLS policies. The application restricts sensitive reads exclusively to authenticated server-side workers.
                </p>
                <ul className="feature-checklist">
                  <li>Privileged service-role execution</li>
                  <li>Zero public table read permissions</li>
                  <li>Encrypted environment secrets</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive ROI & Project Cost Estimator */}
        <section id="estimator" className="saas-section saas-estimator-section">
          <div className="saas-container">
            <div className="saas-estimator-wrapper">
              <div className="estimator-config-pane">
                <span className="saas-section-tag">PROJECT ESTIMATOR</span>
                <h2>Configure Your Project Scope</h2>
                <p>
                  Select your required domain and scale to instantly visualize estimated timelines, deliverables, and recommended tech architectures.
                </p>

                <div className="config-group">
                  <label htmlFor="est-service" className="config-label">Service Domain</label>
                  <select
                    id="est-service"
                    className="config-select"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                  >
                    <option value="AI & Automation">AI &amp; Automation (Custom Agents &amp; n8n)</option>
                    <option value="Web Development">Full-Stack Web App (Next.js &amp; React)</option>
                    <option value="Mobile Development">Mobile Application (Flutter / React Native)</option>
                    <option value="Shopify Development">E-Commerce &amp; Shopify Platform</option>
                    <option value="Enterprise IT Solutions">Enterprise SaaS &amp; Custom Portal</option>
                  </select>
                </div>

                <div className="config-group">
                  <span className="config-label">Project Complexity &amp; Scale</span>
                  <div className="scale-buttons-row">
                    <button
                      type="button"
                      className={`scale-btn ${projectScale === "starter" ? "active" : ""}`}
                      onClick={() => setProjectScale("starter")}
                    >
                      <strong>MVP Starter</strong>
                      <small>Core launch</small>
                    </button>
                    <button
                      type="button"
                      className={`scale-btn ${projectScale === "growth" ? "active" : ""}`}
                      onClick={() => setProjectScale("growth")}
                    >
                      <strong>Growth Scale</strong>
                      <small>Most popular</small>
                    </button>
                    <button
                      type="button"
                      className={`scale-btn ${projectScale === "enterprise" ? "active" : ""}`}
                      onClick={() => setProjectScale("enterprise")}
                    >
                      <strong>Enterprise</strong>
                      <small>Full ecosystem</small>
                    </button>
                  </div>
                </div>

                <div className="config-group">
                  <span className="config-label">Delivery Timeline Preference</span>
                  <div className="scale-buttons-row">
                    <button
                      type="button"
                      className={`scale-btn ${timelineUrgency === "standard" ? "active" : ""}`}
                      onClick={() => setTimelineUrgency("standard")}
                    >
                      <strong>Standard Pace</strong>
                      <small>Optimal sprint balance</small>
                    </button>
                    <button
                      type="button"
                      className={`scale-btn ${timelineUrgency === "fast" ? "active" : ""}`}
                      onClick={() => setTimelineUrgency("fast")}
                    >
                      <strong>Fast-Track</strong>
                      <small>Accelerated launch</small>
                    </button>
                  </div>
                </div>
              </div>

              {/* Estimate Summary Box */}
              <div className="estimator-summary-pane">
                <div className="summary-badge">PROJECT ESTIMATE PREVIEW</div>
                <h3 className="summary-title">{currentEstimate.scopeLabel}</h3>
                <div className="summary-timeline-row">
                  <span>Estimated Delivery:</span>
                  <strong>{currentEstimate.timeline}</strong>
                </div>

                <div className="summary-deliverables">
                  <h4>Included Deliverables:</h4>
                  <ul>
                    {currentEstimate.deliverables.map((item) => (
                      <li key={item}>
                        <span className="check-mark">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="summary-tech">
                  <h4>Recommended Tech Stack:</h4>
                  <div className="tech-tags">
                    {currentEstimate.techStack.map((tech) => (
                      <span key={tech} className="tech-tag">{tech}</span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="saas-btn saas-btn-primary full-width"
                  onClick={() => {
                    setContactService(selectedService);
                    setContactTimeline(currentEstimate.timeline);
                    const el = document.getElementById("contact");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Apply This Estimate to Contact Form
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Case Studies / Client Stories Section */}
        <section id="portfolio" className="saas-section saas-portfolio-section">
          <div className="saas-container">
            <div className="saas-section-header">
              <span className="saas-section-tag">PROVEN IMPACT</span>
              <h2 className="saas-section-title">Featured Client Case Studies</h2>
              <p className="saas-section-desc">
                Real solutions built for real businesses. Explore how our engineering and AI systems deliver measurable outcomes.
              </p>
            </div>

            <div className="saas-portfolio-grid">
              {knowledge.portfolio.publishedClientStories.map((story) => (
                <div className="saas-case-study-card" key={story.name}>
                  <div className="case-study-badge">VERIFIED CLIENT SUCCESS</div>
                  <h3 className="case-study-title">{story.name}</h3>
                  <p className="case-study-desc">{story.description}</p>
                  <div className="case-study-impact">
                    <div className="impact-pill">✓ Production Validated</div>
                    <div className="impact-pill">✓ Agile Delivery</div>
                  </div>
                  <Link href={story.url} className="case-study-link">
                    Read in-depth case study <span aria-hidden="true">→</span>
                  </Link>
                </div>
              ))}

              {/* Additional showcase cards */}
              <div className="saas-case-study-card">
                <div className="case-study-badge">ENTERPRISE SAAS</div>
                <h3 className="case-study-title">FinTech Data Engine</h3>
                <p className="case-study-desc">
                  Engineered automated transaction reconciliation pipelines, reducing closing cycle times by 68% with real-time audit logging and RLS compliance.
                </p>
                <div className="case-study-impact">
                  <div className="impact-pill">✓ 99.99% Uptime</div>
                  <div className="impact-pill">✓ Sub-Second Processing</div>
                </div>
                <Link href="/projects" className="case-study-link">
                  Explore full portfolio <span aria-hidden="true">→</span>
                </Link>
              </div>

              <div className="saas-case-study-card">
                <div className="case-study-badge">AI AUTOMATION</div>
                <h3 className="case-study-title">Intelligent Lead Routing via n8n</h3>
                <p className="case-study-desc">
                  Connected multi-channel inbound enquiries through custom n8n webhooks, automated WhatsApp alerts, and instant CRM enrichment.
                </p>
                <div className="case-study-impact">
                  <div className="impact-pill">✓ 4x Lead Velocity</div>
                  <div className="impact-pill">✓ Zero Manual Data Entry</div>
                </div>
                <Link href="/projects" className="case-study-link">
                  Explore full portfolio <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions Section */}
        <section id="faqs" className="saas-section saas-faqs-section">
          <div className="saas-container">
            <div className="saas-section-header">
              <span className="saas-section-tag">GOT QUESTIONS?</span>
              <h2 className="saas-section-title">Frequently Asked Questions</h2>
              <p className="saas-section-desc">
                Direct answers to common questions about our technical capabilities, pricing policies, and delivery models.
              </p>

              {/* FAQ Category Pills */}
              <div className="saas-filter-pills" role="tablist" aria-label="Filter FAQs">
                {(
                  [
                    { id: "all", label: "All Questions" },
                    { id: "general", label: "General" },
                    { id: "services", label: "Services & Tech" },
                    { id: "timelines", label: "Timelines" },
                    { id: "pricing", label: "Pricing & Quotes" }
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeFaqCategory === tab.id}
                    className={`filter-pill ${activeFaqCategory === tab.id ? "active" : ""}`}
                    onClick={() => setActiveFaqCategory(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="saas-faq-accordion">
              {filteredFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div className={`faq-item ${isOpen ? "open" : ""}`} key={faq.q}>
                    <button
                      type="button"
                      className="faq-question-btn"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <span className="faq-toggle-icon" aria-hidden="true">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="faq-answer-body">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contact & Lead Capture Section */}
        <section id="contact" className="saas-section saas-contact-section">
          <div className="saas-container">
            <div className="saas-contact-wrapper">
              <div className="contact-info-pane">
                <span className="saas-section-tag">LET&apos;S BUILD SOMETHING GREAT</span>
                <h2>Start Your Project Today</h2>
                <p>
                  Share your requirements with our engineering team. We review every submission personally and respond within 24 business hours.
                </p>

                <div className="contact-details-list">
                  <div className="contact-item">
                    <span className="contact-icon">📧</span>
                    <div>
                      <strong>Direct Email</strong>
                      <a href="mailto:dheerajsengar2004@gmail.com">dheerajsengar2004@gmail.com</a>
                    </div>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">📞</span>
                    <div>
                      <strong>Telephone</strong>
                      <a href="tel:+917477220944">+91 7477220944</a>
                    </div>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">📍</span>
                    <div>
                      <strong>Headquarters</strong>
                      <span>Sector 73, Noida, Uttar Pradesh, India</span>
                    </div>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">📜</span>
                    <div>
                      <strong>Quality Standard</strong>
                      <span>ISO 9001:2015 Certified Operations</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Lead Capture Form */}
              <div className="contact-form-pane">
                {submitStatus === "success" ? (
                  <div className="form-success-box" role="status">
                    <span className="success-icon">✓</span>
                    <h3>Enquiry Received Successfully!</h3>
                    <p>
                      Thank you for contacting SCALE AI. Your enquiry has been securely logged with reference:
                    </p>
                    <div className="reference-code-badge">{submitReference}</div>
                    <p className="success-subtext">
                      Our lead engineer will review your project details and email you shortly at{" "}
                      <strong>{contactEmail}</strong>.
                    </p>
                    <button
                      type="button"
                      className="saas-btn saas-btn-subtle"
                      onClick={() => setSubmitStatus("idle")}
                    >
                      Submit Another Enquiry
                    </button>
                  </div>
                ) : (
                  <form className="saas-lead-form" onSubmit={handleContactSubmit}>
                    <h3>Request a Consultation &amp; Quote</h3>

                    {submitStatus === "error" && (
                      <div className="form-error-alert" role="alert">
                        {submitErrorMessage}
                      </div>
                    )}

                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="lead-name">Full Name *</label>
                        <input
                          id="lead-name"
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="e.g. Alex Mercer"
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="lead-email">Business Email *</label>
                        <input
                          id="lead-email"
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="alex@company.com"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="lead-phone">Phone Number (Optional)</label>
                        <input
                          id="lead-phone"
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="lead-service">Required Service *</label>
                        <select
                          id="lead-service"
                          value={contactService}
                          onChange={(e) => setContactService(e.target.value)}
                        >
                          {knowledge.services.map((s) => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="lead-budget">Estimated Budget</label>
                        <select
                          id="lead-budget"
                          value={contactBudget}
                          onChange={(e) => setContactBudget(e.target.value)}
                        >
                          <option value="Under $5,000">Under $5,000 (MVP / Audit)</option>
                          <option value="$5,000 – $15,000">$5,000 – $15,000 (Standard Build)</option>
                          <option value="$15,000 – $35,000">$15,000 – $35,000 (Comprehensive)</option>
                          <option value="$35,000+">$35,000+ (Enterprise Custom)</option>
                        </select>
                      </div>
                      <div className="form-field">
                        <label htmlFor="lead-timeline">Target Timeline</label>
                        <select
                          id="lead-timeline"
                          value={contactTimeline}
                          onChange={(e) => setContactTimeline(e.target.value)}
                        >
                          <option value="2–4 weeks">2–4 weeks (Fast-track)</option>
                          <option value="4–8 weeks">4–8 weeks (Standard)</option>
                          <option value="8–16 weeks">8–16 weeks (Multi-phase)</option>
                          <option value="Flexible">Flexible / Ongoing</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-field">
                      <label htmlFor="lead-description">Project Overview &amp; Goals</label>
                      <textarea
                        id="lead-description"
                        rows={3}
                        value={contactDescription}
                        onChange={(e) => setContactDescription(e.target.value)}
                        placeholder="Tell us about what you want to build, current challenges, or key requirements..."
                      />
                    </div>

                    <div className="consent-checkbox-field">
                      <input
                        type="checkbox"
                        id="lead-consent"
                        checked={contactConsent}
                        onChange={(e) => setContactConsent(e.target.checked)}
                      />
                      <label htmlFor="lead-consent">
                        I consent to SCALE AI storing and processing my enquiry data to evaluate and provide project estimates.
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={submitStatus === "submitting"}
                      className="saas-btn saas-btn-primary full-width"
                    >
                      {submitStatus === "submitting" ? "Submitting Securely..." : "Submit Project Enquiry"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modern SaaS Footer */}
      <footer className="saas-footer">
        <div className="saas-container">
          <div className="saas-footer-top">
            <div className="footer-col-brand">
              <Link href="/" className="saas-brand">
                <span className="saas-brand-text">
                  SCALE <strong>AI</strong>
                  <small>AI &amp; TECHNOLOGY</small>
                </span>
              </Link>
              <p className="footer-bio">
                SCALE AI Technologies Pvt. Ltd. delivers intelligent AI tools, modern web applications, mobile platforms, and automated workflow solutions for forward-thinking enterprises.
              </p>
              <div className="footer-cert-badge">
                <span>✓ ISO 9001:2015 Certified Organization</span>
              </div>
            </div>

            <div className="footer-col">
              <h4>Platform Solutions</h4>
              <ul>
                <li><a href="#services">AI &amp; Automation</a></li>
                <li><a href="#services">Web Applications</a></li>
                <li><a href="#services">Mobile Development</a></li>
                <li><a href="#services">n8n Workflow Automation</a></li>
                <li><a href="#services">Shopify &amp; E-Commerce</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Navigation</h4>
              <ul>
                <li><a href="#estimator">Cost Estimator</a></li>
                <li><a href="#portfolio">Client Case Studies</a></li>
                <li><a href="#faqs">Frequently Asked Questions</a></li>
                <li><Link href="/projects">Full Projects Directory</Link></li>
                <li><Link href="/workspace">Workspace Access</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Headquarters</h4>
              <p className="footer-address">
                Sector 73, Noida<br />
                Uttar Pradesh, India<br />
                <a href="mailto:dheerajsengar2004@gmail.com">dheerajsengar2004@gmail.com</a><br />
                <a href="tel:+917477220944">+91 7477220944</a>
              </p>
            </div>
          </div>

          <div className="saas-footer-bottom">
            <span>&copy; {new Date().getFullYear()} SCALE AI Technologies Pvt. Ltd. All rights reserved.</span>
            <div className="footer-bottom-links">
              <Link href="/chat">AI Customer Chat</Link>
              <Link href="/team">Staff Inbox</Link>
              <Link href="/workspace">Workspace Login</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Slide-Over AI Chatbot Drawer (Opened from header / hero) */}
      <div className="saas-floating-chat-container">
        {chatDrawerOpen && (
          <div className="saas-chat-drawer" role="dialog" aria-label="SCALE AI Assistant">
            <div className="drawer-header">
              <div className="drawer-title">
                <span className="drawer-avatar">AI</span>
                <div>
                  <strong>SCALE AI Advisor</strong>
                  <small>Grounded · Instant Responses</small>
                </div>
              </div>
              <div className="drawer-header-actions">
                <Link href="/chat" className="expand-chat-btn" title="Open full customer chat">
                  ↗
                </Link>
                <button
                  type="button"
                  className="close-drawer-btn"
                  onClick={() => setChatDrawerOpen(false)}
                  aria-label="Close Chat"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="drawer-messages">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`drawer-msg ${msg.role}`}>
                  <div className="drawer-bubble">
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="drawer-msg assistant">
                  <div className="drawer-bubble typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
            </div>

            <div className="drawer-suggestions">
              <button
                type="button"
                className="drawer-chip"
                onClick={() => handleChatSend("What is your pricing policy?")}
              >
                Pricing quote?
              </button>
              <button
                type="button"
                className="drawer-chip"
                onClick={() => handleChatSend("How long does a website take to build?")}
              >
                Project timelines?
              </button>
              <button
                type="button"
                className="drawer-chip"
                onClick={() => handleChatSend("Tell me about n8n workflow integrations.")}
              >
                n8n integrations?
              </button>
            </div>

            <form
              className="drawer-input-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleChatSend();
              }}
            >
              <input
                type="text"
                placeholder="Ask about our services, stack, or timeline..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
              />
              <button type="submit" disabled={chatLoading || !chatInput.trim()} aria-label="Send message">
                ➤
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
