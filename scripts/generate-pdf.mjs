import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// 1. Read Markdown
const mdPath = path.resolve("DOCUMENTATION.md");
const mdContent = fs.readFileSync(mdPath, "utf-8");

// 2. Generate raw HTML with marked CLI
const rawHtmlPath = path.resolve("temp_raw.html");
execSync(`npx --yes marked -i "${mdPath}" -o "${rawHtmlPath}" --gfm`, { stdio: "inherit" });

let bodyHtml = fs.readFileSync(rawHtmlPath, "utf-8");
fs.unlinkSync(rawHtmlPath);

// 3. Transform GitHub alerts into beautiful callout cards
bodyHtml = bodyHtml.replace(
  /<blockquote>\s*<p>\[!NOTE\]([\s\S]*?)<\/p>\s*<\/blockquote>/gi,
  '<div class="callout callout-note"><div class="callout-header"><span class="callout-icon">ℹ️</span> NOTE</div><div class="callout-body">$1</div></div>'
);
bodyHtml = bodyHtml.replace(
  /<blockquote>\s*<p>\[!TIP\]([\s\S]*?)<\/p>\s*<\/blockquote>/gi,
  '<div class="callout callout-tip"><div class="callout-header"><span class="callout-icon">💡</span> PRO TIP</div><div class="callout-body">$1</div></div>'
);
bodyHtml = bodyHtml.replace(
  /<blockquote>\s*<p>\[!IMPORTANT\]([\s\S]*?)<\/p>\s*<\/blockquote>/gi,
  '<div class="callout callout-important"><div class="callout-header"><span class="callout-icon">⚡</span> IMPORTANT REQUIREMENT</div><div class="callout-body">$1</div></div>'
);
bodyHtml = bodyHtml.replace(
  /<blockquote>\s*<p>\[!WARNING\]([\s\S]*?)<\/p>\s*<\/blockquote>/gi,
  '<div class="callout callout-warning"><div class="callout-header"><span class="callout-icon">⚠️</span> ARCHITECTURAL WARNING</div><div class="callout-body">$1</div></div>'
);
bodyHtml = bodyHtml.replace(
  /<blockquote>\s*<p>\[!CAUTION\]([\s\S]*?)<\/p>\s*<\/blockquote>/gi,
  '<div class="callout callout-caution"><div class="callout-header"><span class="callout-icon">🛑</span> SECURITY CAUTION</div><div class="callout-body">$1</div></div>'
);

// 4. Style Mermaid blocks with nice titles and clear code frames
bodyHtml = bodyHtml.replace(
  /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/gi,
  (match, code) => {
    let diagramType = "Architecture & Workflow Diagram";
    if (code.includes("sequenceDiagram")) diagramType = "Sequence & Event Interaction Flow";
    else if (code.includes("erDiagram")) diagramType = "Relational Entity-Relationship (ER) Schema";
    else if (code.includes("flowchart")) diagramType = "System Component Topology Flowchart";
    
    return `<div class="diagram-container">
      <div class="diagram-header"><span class="badge">MERMAID SPECIFICATION</span> <strong>${diagramType}</strong></div>
      <pre class="diagram-code"><code>${code.trim()}</code></pre>
    </div>`;
  }
);

// 5. Wrap in an executive PDF template
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SCALE AI & SurfSync Intelligent Business Platform — Enterprise Documentation</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 20mm 16mm;
    }
    
    * {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.6;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }

    /* Cover Page */
    .cover-page {
      padding: 60px 40px 40px 40px;
      min-height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 2px solid #0f172a;
      border-radius: 8px;
      background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
    }

    .cover-top {
      margin-bottom: auto;
    }

    .cover-tag {
      display: inline-block;
      background: #0f172a;
      color: #38bdf8;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      padding: 6px 14px;
      border-radius: 4px;
      margin-bottom: 24px;
    }

    .cover-title {
      font-size: 28pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      margin: 0 0 16px 0;
    }

    .cover-subtitle {
      font-size: 13pt;
      font-weight: 500;
      color: #475569;
      line-height: 1.5;
      margin: 0 0 32px 0;
    }

    .cover-divider {
      height: 4px;
      width: 80px;
      background: #0284c7;
      border-radius: 2px;
      margin-bottom: 40px;
    }

    .cover-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: #f1f5f9;
      padding: 24px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      margin-bottom: 30px;
    }

    .meta-box {
      margin-bottom: 8px;
    }

    .meta-label {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      display: block;
      margin-bottom: 4px;
    }

    .meta-val {
      font-size: 10pt;
      font-weight: 600;
      color: #0f172a;
    }

    .cover-footer {
      font-size: 8pt;
      font-weight: 600;
      color: #94a3b8;
      text-align: center;
      letter-spacing: 1px;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
    }

    .page-break {
      page-break-after: always;
      break-after: page;
    }

    /* Document Structure */
    .content-container {
      padding-top: 10px;
    }

    h1, h2, h3, h4 {
      color: #0f172a;
      font-weight: 700;
      page-break-after: avoid;
    }

    h1 {
      font-size: 20pt;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-top: 0;
    }

    h2 {
      font-size: 14pt;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 6px;
      margin-top: 28px;
      margin-bottom: 14px;
      color: #0369a1;
    }

    h3 {
      font-size: 11.5pt;
      margin-top: 20px;
      margin-bottom: 8px;
      color: #1e293b;
    }

    p {
      margin: 0 0 10px 0;
      text-align: justify;
    }

    ul, ol {
      margin: 0 0 12px 0;
      padding-left: 24px;
    }

    li {
      margin-bottom: 4px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0 20px 0;
      font-size: 9pt;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
    }

    th {
      background-color: #0f172a;
      color: #ffffff;
      font-weight: 600;
      font-size: 8.5pt;
      letter-spacing: 0.5px;
    }

    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    /* Code & Technical Blocks */
    pre {
      background-color: #0d1117;
      color: #e6edf3;
      padding: 12px 14px;
      border-radius: 6px;
      border: 1px solid #30363d;
      font-family: "Cascadia Code", "Fira Code", Consolas, "Courier New", monospace;
      font-size: 8pt;
      line-height: 1.45;
      overflow-x: auto;
      margin: 12px 0 16px 0;
      page-break-inside: avoid;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    code {
      font-family: "Cascadia Code", "Fira Code", Consolas, "Courier New", monospace;
      font-size: 8.5pt;
      background-color: #f1f5f9;
      color: #0369a1;
      padding: 2px 5px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    pre code {
      background-color: transparent;
      color: inherit;
      padding: 0;
      border: none;
      font-size: 8pt;
    }

    /* Callouts / Alerts */
    .callout {
      border-left: 4px solid;
      border-radius: 0 6px 6px 0;
      padding: 12px 16px;
      margin: 14px 0 18px 0;
      page-break-inside: avoid;
    }

    .callout-header {
      font-weight: 700;
      font-size: 8.5pt;
      letter-spacing: 0.8px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .callout-body p {
      margin: 0;
      font-size: 9.5pt;
      text-align: left;
    }

    .callout-note {
      border-color: #0284c7;
      background-color: #f0f9ff;
      color: #0369a1;
    }
    .callout-note .callout-header { color: #0284c7; }

    .callout-tip {
      border-color: #16a34a;
      background-color: #f0fdf4;
      color: #15803d;
    }
    .callout-tip .callout-header { color: #16a34a; }

    .callout-important {
      border-color: #9333ea;
      background-color: #faf5ff;
      color: #7e22ce;
    }
    .callout-important .callout-header { color: #9333ea; }

    .callout-warning {
      border-color: #d97706;
      background-color: #fffbeb;
      color: #b45309;
    }
    .callout-warning .callout-header { color: #d97706; }

    .callout-caution {
      border-color: #dc2626;
      background-color: #fef2f2;
      color: #b91c1c;
    }
    .callout-caution .callout-header { color: #dc2626; }

    /* Diagram Styling */
    .diagram-container {
      margin: 14px 0 18px 0;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      page-break-inside: avoid;
      background: #f8fafc;
    }

    .diagram-header {
      background: #e2e8f0;
      padding: 8px 12px;
      font-size: 8.5pt;
      font-weight: 600;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .diagram-header .badge {
      background: #0f172a;
      color: #38bdf8;
      font-size: 7.5pt;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: 700;
    }

    .diagram-code {
      margin: 0 !important;
      border: none !important;
      border-radius: 0 !important;
      background: #0f172a !important;
    }

    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 24px 0;
    }

    a {
      color: #0284c7;
      text-decoration: none;
    }

    /* Print header & footer */
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-top">
      <div class="cover-tag">ENTERPRISE SYSTEM ARCHITECTURE &amp; SPECIFICATION</div>
      <div class="cover-title">SCALE AI &amp; SurfSync Intelligent Platform</div>
      <div class="cover-subtitle">Complete Architecture Blueprint, Multi-Tenant Hybrid RAG Engine, Real-Time Intent Classifier, Multi-Gateway Monetization &amp; Operational Manual</div>
      <div class="cover-divider"></div>
      
      <div class="cover-grid">
        <div class="meta-item">
          <span class="meta-label">DOCUMENT VERSION</span>
          <span class="meta-val">2.0.0 (Production Release)</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">SYSTEM STATUS</span>
          <span class="meta-val">Verified &amp; Production Ready</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">TECH STACK</span>
          <span class="meta-val">Next.js 16.4 | React 19.2 | Node 22 | TypeScript 5.9</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">DATABASE &amp; VECTORS</span>
          <span class="meta-val">Supabase PostgreSQL + pgvector (HNSW)</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">AI &amp; EMBEDDINGS</span>
          <span class="meta-val">OpenAI GPT-4o-mini / Xenova ONNX Transformers</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">PUBLICATION DATE</span>
          <span class="meta-val">October 2026</span>
        </div>
      </div>
    </div>
    
    <div class="cover-footer">
      CONFIDENTIAL &amp; PROPRIETARY — SURFSYNC INFOTECH &amp; SCALE AI SYSTEMS GROUP
    </div>
  </div>

  <div class="page-break"></div>

  <!-- Document Content -->
  <div class="content-container">
    ${bodyHtml}
  </div>

</body>
</html>
`;

// 6. Save formatted HTML
const printableHtmlPath = path.resolve("printable_documentation.html");
fs.writeFileSync(printableHtmlPath, fullHtml, "utf-8");
console.log("✅ Created printable HTML:", printableHtmlPath);

// 7. Invoke Edge headless to generate PDF
const tempPdfPath = "D:\\temp_scale_ai_docs.pdf";
const finalPdfPath = path.resolve("SCALE_AI_Platform_Documentation.pdf");

console.log("🖨️ Generating PDF via Microsoft Edge Headless...");
const edgeExe = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const htmlUrl = `file:///${printableHtmlPath.replace(/\\/g, "/")}`;

import { execFileSync } from "child_process";
try {
  execFileSync(edgeExe, [
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    `--print-to-pdf=${tempPdfPath}`,
    htmlUrl
  ], { stdio: "inherit" });
} catch (e) {
  console.log("Edge finished with code or signal:", e.message);
}

if (fs.existsSync(tempPdfPath)) {
  fs.copyFileSync(tempPdfPath, finalPdfPath);
  fs.unlinkSync(tempPdfPath);
  console.log("🎉 PDF Generated Successfully!");
  console.log("📄 Saved to:", finalPdfPath);
  const stats = fs.statSync(finalPdfPath);
  console.log(`📊 File Size: ${(stats.size / 1024).toFixed(1)} KB`);
} else {
  console.error("❌ Failed to generate PDF.");
}
