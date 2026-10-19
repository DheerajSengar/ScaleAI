import fs from 'fs';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.SUPABASE_SECRET_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Supabase credentials missing in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const mockUsersData = [
  {
    name: "Aarav Kapoor",
    email: "aarav.kapoor@finpulse.io",
    company: "FinPulse Analytics",
    service: "AI & Automation",
    query: "Can SCALE AI build an AI pipeline to extract invoice data into our PostgreSQL database?",
    answer: "Yes, SCALE AI builds custom AI automation tools and document parsing workflows using LLMs and computer vision to extract structured invoice data directly into databases."
  },
  {
    name: "Elena Rostova",
    email: "elena.rostova@nordicretail.com",
    company: "Nordic Retail Group",
    service: "E-commerce & CMS",
    query: "We are migrating from Magento to a headless Shopify storefront. Can you handle custom theme and inventory sync?",
    answer: "SCALE AI engineers modern Shopify storefronts with automated catalog sync, payment gateway integration, and high-converting product discovery."
  },
  {
    name: "Rohan Deshmukh",
    email: "rohan.d@zenithlogistics.in",
    company: "Zenith Global Logistics",
    service: "n8n Workflow Automation",
    query: "Do you build automated n8n workflows connecting shipment tracking to WhatsApp notifications?",
    answer: "Yes! SCALE AI integrates n8n event-driven workflows with WhatsApp Business API to dispatch real-time consignment tracking alerts to customers."
  },
  {
    name: "Sophia Martinez",
    email: "sophia.m@veritashealth.org",
    company: "Veritas Health Tech",
    service: "Mobile Development",
    query: "We need a HIPAA-compliant cross-platform mobile app in Flutter for patient appointment scheduling.",
    answer: "SCALE AI builds native-performance iOS and Android healthcare applications using Flutter and React Native with secure authentication and API integrations."
  },
  {
    name: "Vikram Malhotra",
    email: "vikram.m@malhotracapital.com",
    company: "Malhotra Capital",
    service: "Enterprise IT Solutions",
    query: "Can you develop a proprietary internal CRM dashboard for our portfolio managers?",
    answer: "SCALE AI designs custom enterprise solutions like Swagat Suite, HRMS, and Sales CRM tailored specifically to your company's operational workflows."
  },
  {
    name: "Marcus Vance",
    email: "marcus.vance@vancetech.io",
    company: "Vance Technologies",
    service: "Cloud & DevOps",
    query: "We need Kubernetes cluster setup, automated CI/CD via GitHub Actions, and AWS infrastructure hardening.",
    answer: "SCALE AI provides complete Cloud & DevOps engineering, container orchestration, automated release pipelines, and cloud security monitoring."
  },
  {
    name: "Ananya Iyer",
    email: "ananya.iyer@edusmart.ac.in",
    company: "EduSmart Platforms",
    service: "Web Development",
    query: "We want a high-performance Next.js educational portal with interactive course modules and razorpay checkout.",
    answer: "SCALE AI builds scalable Next.js and TypeScript web applications with server-side rendering, fast page loads, and seamless payment gateways."
  },
  {
    name: "David Kim",
    email: "david.kim@seoulb2b.kr",
    company: "Seoul Commerce Hub",
    service: "Digital Marketing",
    query: "Do you offer SEO audits, Google Ads management, and B2B lead generation funnels?",
    answer: "SCALE AI discusses SEO, Google Ads, Meta Ads, and comprehensive performance marketing funnels. Specific deliverables and strategy are confirmed after discovery."
  },
  {
    name: "Pooja Hegde",
    email: "pooja.hegde@luxeinterior.in",
    company: "Luxe Interior Studio",
    service: "UI/UX Design",
    query: "Can your design team create wireframes and Figma design systems for our upcoming home decor marketplace?",
    answer: "Yes, SCALE AI provides end-to-end UI/UX design, user research, wireframing, high-fidelity prototypes, and component design systems."
  },
  {
    name: "Julian Thorne",
    email: "j.thorne@aegiscloud.co.uk",
    company: "Aegis Cyber Systems",
    service: "AI & Automation",
    query: "Can we integrate an intelligent RAG chatbot grounded in our technical product documentation?",
    answer: "SCALE AI specializes in custom RAG (Retrieval-Augmented Generation) knowledge assistants grounded strictly in your proprietary documentation with zero hallucination."
  },
  {
    name: "Neha Singhania",
    email: "neha.s@singhaniafoods.com",
    company: "Singhania Gourmet Foods",
    service: "Shopify Development",
    query: "What is the typical timeline to launch a custom D2C organic food store on Shopify?",
    answer: "A standard custom Shopify storefront typically takes 2 to 4 weeks for initial setup and launch, followed by continuous optimization."
  },
  {
    name: "Tariq Al-Mansoor",
    email: "tariq@gulfproperties.ae",
    company: "Gulf Horizon Realty",
    service: "WhatsApp Business API",
    query: "Can you automate lead intake from Meta Ads directly into WhatsApp with automated booking links?",
    answer: "Yes, SCALE AI connects official WhatsApp Business APIs with Meta Lead Ads to instantly engage prospective buyers and schedule viewings."
  },
  {
    name: "Chloe Dubois",
    email: "chloe.dubois@atelierparis.fr",
    company: "Atelier Parisien",
    service: "Logo & Brand Design",
    query: "Do you design visual brand guidelines, typography standards, and brand logos for premium lifestyle startups?",
    answer: "SCALE AI provides comprehensive brand identity design, logo creation, typography systems, and brand asset guidelines confirmed after initial brand discovery."
  },
  {
    name: "Aditya Verma",
    email: "aditya.v@quickscale.in",
    company: "QuickScale SaaS",
    service: "Web Development",
    query: "What is your stack for building responsive SaaS customer dashboards?",
    answer: "We engineer modern SaaS platforms using Next.js, React, TypeScript, Tailwind/Vanilla CSS, Supabase, and Node.js with secure auth and real-time state management."
  },
  {
    name: "Liam O'Connor",
    email: "liam.oconnor@dublinfintech.ie",
    company: "Emerald Wealth",
    service: "AI & Automation",
    query: "Can an automated AI bot categorize bank statements and calculate cash runway?",
    answer: "Yes, SCALE AI designs financial automation agents that parse statements, categorize expenses, and generate real-time executive summaries."
  },
  {
    name: "Ritu Chawla",
    email: "ritu.chawla@vedichealth.in",
    company: "Vedic Wellness Care",
    service: "Mobile Development",
    query: "Do you support offline data synchronization in mobile apps for remote clinics?",
    answer: "Yes, we implement offline-first data architectures using SQLite and WatermelonDB synchronized seamlessly with cloud backends whenever connectivity resumes."
  },
  {
    name: "Sebastian Krause",
    email: "s.krause@berlinlog.de",
    company: "Krause Supply Chain",
    service: "n8n Workflow Automation",
    query: "We need to connect HubSpot, Slack, and our custom inventory ERP via n8n workflows.",
    answer: "SCALE AI designs fault-tolerant n8n workflows with webhook listeners, retry mechanisms, and error alerting to keep distributed business apps in sync."
  },
  {
    name: "Meera Nambiar",
    email: "meera.nambiar@ecotrends.in",
    company: "EcoTrends Sustainable Living",
    service: "E-commerce & CMS",
    query: "Can you configure multi-currency checkout and international shipping rate calculators?",
    answer: "Yes, SCALE AI implements multi-currency e-commerce gateways with automatic geo-detection and real-time shipping carrier API integrations."
  },
  {
    name: "Carlos Rivera",
    email: "carlos.r@mexicorobotics.mx",
    company: "RoboFlow Latin America",
    service: "Cloud & DevOps",
    query: "Do you help set up automated Docker container deployments with zero downtime?",
    answer: "SCALE AI builds blue-green and rolling deployment strategies using Docker, Kubernetes, and automated health checks ensuring zero customer downtime."
  },
  {
    name: "Deepak Choudhary",
    email: "deepak.c@choudharymotors.in",
    company: "Choudhary Auto Spares",
    service: "Enterprise IT Solutions",
    query: "We need an inventory management tool similar to your Drive Tribe Tyres case study.",
    answer: "SCALE AI built the Drive Tribe Tyres online tyre store with advanced filtering, real-time inventory, and instant checkout. We can deploy a tailored solution for auto parts."
  },
  {
    name: "Hannah Schmidt",
    email: "hannah.s@bavariaenergy.de",
    company: "Bavaria Clean Energy",
    service: "Web Development",
    query: "Can you build an interactive solar ROI calculator embedded in our company website?",
    answer: "Yes, SCALE AI crafts dynamic calculators with real-time tariff calculations, interactive charts, and direct lead capture integrations."
  },
  {
    name: "Sanjay Joshi",
    email: "sanjay.j@joshifinance.in",
    company: "Joshi Financial Advisory",
    service: "AI & Automation",
    query: "Can we install a custom AI assistant for our website that works 24/7 and qualifies client leads?",
    answer: "SCALE AI builds enterprise AI chat agents that qualify leads, collect user requirements with consent, and alert your sales team in real time."
  },
  {
    name: "Grace Hopper-Smith",
    email: "grace@quantumlabs.org",
    company: "Quantum Algorithmics",
    service: "Enterprise IT Solutions",
    query: "Do you provide API documentation and technical training for client development teams?",
    answer: "Yes, SCALE AI delivers comprehensive technical documentation, API specifications, and team handoff sessions for seamless post-launch operations."
  },
  {
    name: "Karan Johar-Bhatia",
    email: "karan.bhatia@urbanstay.in",
    company: "UrbanStay Hospitality",
    service: "WhatsApp Business API",
    query: "Can customers receive automated check-in keys and room service orders over WhatsApp?",
    answer: "SCALE AI integrates WhatsApp Business APIs with PMS (Property Management Systems) to deliver booking confirmations, guest check-ins, and automated room service."
  },
  {
    name: "Nathalie Dupont",
    email: "n.dupont@genevabiotech.ch",
    company: "Geneva BioTech Innovations",
    service: "Cloud & DevOps",
    query: "Can you configure automated database backups and disaster recovery replication?",
    answer: "SCALE AI provisions automated daily backups with point-in-time recovery, multi-region replication, and automated disaster recovery drills."
  },
  {
    name: "Rajesh Kulkarni",
    email: "rajesh.k@kulkarnilaw.in",
    company: "Kulkarni & Associates Legal",
    service: "Web Development",
    query: "We need an authoritative website with appointment booking and secure document submission.",
    answer: "SCALE AI builds secure law firm and professional services portals featuring encrypted file uploads, schedule calendars, and client portals."
  },
  {
    name: "Zoe Althaus",
    email: "zoe.a@viennaart.at",
    company: "Vienna Contemporary Art",
    service: "UI/UX Design",
    query: "Do you design minimalist dark-mode interfaces for digital art galleries?",
    answer: "Yes, SCALE AI crafts bespoke, responsive art and media experiences featuring curated color palettes, smooth micro-animations, and sleek dark modes."
  },
  {
    name: "Manish Agarwal",
    email: "manish.a@agarwaltextiles.in",
    company: "Agarwal Export Textiles",
    service: "Shopify Development",
    query: "Can Shopify handle wholesale B2B tiered pricing for international buyers?",
    answer: "Yes, we implement Shopify Plus B2B portals with quantity-based wholesale discounts, tax exemptions, and custom quotation forms."
  },
  {
    name: "Oliver Queen-Jones",
    email: "oliver@aerosystems.co.uk",
    company: "AeroDynamics UK",
    service: "AI & Automation",
    query: "Can you automate engineering ticket triage using OpenAI models and Jira APIs?",
    answer: "SCALE AI builds ticket routing agents that evaluate severity, categorize technical issues, and assign engineers automatically via Jira and GitHub APIs."
  },
  {
    name: "Sneha Nair",
    email: "sneha.nair@keralatour.in",
    company: "Malabar Eco Escapes",
    service: "Digital Marketing",
    query: "How do you structure localized SEO and Google Ads campaigns for luxury resorts?",
    answer: "SCALE AI strategies focus on high-intent search keywords, geo-targeted Meta campaigns, landing page speed optimization, and direct inquiry funnels."
  },
  {
    name: "Matteo Rossi",
    email: "matteo.rossi@milanodesign.it",
    company: "Milano Casa Design",
    service: "E-commerce & CMS",
    query: "We require 3D product visualization and AR preview on our furniture e-commerce website.",
    answer: "SCALE AI integrates WebGL, Three.js, and augmented reality viewers into modern e-commerce storefronts for interactive 3D product previews."
  },
  {
    name: "Gaurav Bansal",
    email: "gaurav.b@bansalsteel.in",
    company: "Bansal Steel Corp",
    service: "Enterprise IT Solutions",
    query: "Can you connect our legacy SAP database to a modern web portal for distributors?",
    answer: "Yes, SCALE AI constructs secure REST/GraphQL API bridges that modernize legacy ERPs without requiring risky database migrations."
  },
  {
    name: "Kavita Reddy",
    email: "kavita.r@hyderabadpharma.in",
    company: "Zenith Biopharma Labs",
    service: "Mobile Development",
    query: "We want a mobile field app for medical reps to record sample distributions and doctor feedback.",
    answer: "SCALE AI develops intuitive mobile field apps with GPS verification, offline forms, digital signatures, and automated end-of-day reports."
  },
  {
    name: "Simon Becker",
    email: "simon.becker@zurichwealth.ch",
    company: "Alpen Wealth Management",
    service: "Web Development",
    query: "What is your turnaround time for a high-security corporate landing page?",
    answer: "A production corporate landing page is typically delivered within 2 to 4 weeks with complete security hardening, SEO metadata, and ISO-standard code review."
  },
  {
    name: "Ishita Sen",
    email: "ishita.sen@kolkataartisans.in",
    company: "Bengal Craft Collective",
    service: "Logo & Brand Design",
    query: "Can you design bilingual branding and product packaging labels for handcrafted goods?",
    answer: "Yes, our design team produces culturally resonant brand marks, typography guidelines, and packaging ready for print and digital distribution."
  },
  {
    name: "Felipe Santana",
    email: "felipe.s@saopaulolog.br",
    company: "Paulista Freight Tech",
    service: "n8n Workflow Automation",
    query: "Can n8n trigger automated SMS and email alerts when a shipment status changes?",
    answer: "Yes, n8n workflows seamlessly monitor database status changes and dispatch multi-channel SMS, WhatsApp, and email alerts automatically."
  },
  {
    name: "Ankit Trivedi",
    email: "ankit.t@trivediconsulting.in",
    company: "Trivedi Strategy Partners",
    service: "AI & Automation",
    query: "Can we embed SCALE AI's floating chat assistant into our existing web application?",
    answer: "Yes! SCALE AI's chat drawer is modular and lightweight. It embeds into any Next.js, React, or static website with a few lines of code."
  },
  {
    name: "Astrid Lindgren",
    email: "astrid@stockholmapps.se",
    company: "Nordic Audio Works",
    service: "Mobile Development",
    query: "Do you have experience with background audio streaming and podcast playback in React Native?",
    answer: "Yes, we implement native audio background services, lock-screen playback controls, and offline audio caching for streaming apps."
  },
  {
    name: "Harish Pillai",
    email: "harish.p@chennaiship.in",
    company: "Coromandel Maritime Agency",
    service: "Cloud & DevOps",
    query: "Can you migrate our on-premises Windows server workloads to AWS cloud?",
    answer: "SCALE AI manages secure cloud migrations, database synchronization, load balancer configuration, and 24/7 cloud monitoring."
  },
  {
    name: "Yuki Tanaka",
    email: "yuki.tanaka@tokyoecom.jp",
    company: "Ginza Direct Imports",
    service: "Shopify Development",
    query: "Can we connect Shopify to multiple local Japanese courier APIs like Yamato and Sagawa?",
    answer: "Yes, we develop custom private Shopify apps that integrate carrier shipping labels and tracking numbers directly into Shopify order management."
  },
  {
    name: "Pallavi Joshi",
    email: "pallavi.j@puneedtech.in",
    company: "Cognitive Skills Academy",
    service: "Digital Marketing",
    query: "What strategies do you recommend to reduce student acquisition costs on Meta and Google Ads?",
    answer: "We recommend conversion-focused landing pages with sub-second load times, interactive course quizzes, video testimonials, and retargeting funnels."
  },
  {
    name: "Gabriel Santos",
    email: "gabriel.s@lisbontech.pt",
    company: "Lisboa FinTech Labs",
    service: "AI & Automation",
    query: "Can you build an automated customer onboarding verification agent using ID OCR?",
    answer: "Yes, SCALE AI designs automated onboarding flows that extract and verify passport/ID details and run sanctions checks in seconds."
  },
  {
    name: "Shreya Ghoshal-Roy",
    email: "shreya.roy@bengaluruai.in",
    company: "SynthData Solutions",
    service: "Web Development",
    query: "We need a Next.js documentation portal with search and code syntax highlighting.",
    answer: "SCALE AI builds developer-focused portals with Algolia search, interactive code sandboxes, dark mode toggle, and API reference explorers."
  },
  {
    name: "Benjamin Katz",
    email: "b.katz@telavivsec.il",
    company: "Katz Cyber Intelligence",
    service: "Cloud & DevOps",
    query: "Do your deployments include automated security scanning for dependencies and containers?",
    answer: "Yes, we integrate SonarQube, Snyk, and Trivy automated scanning into GitHub Actions pipelines to block vulnerable code before release."
  },
  {
    name: "Divya Nambeesan",
    email: "divya.n@keralafresh.in",
    company: "Kochi Farm Direct",
    service: "E-commerce & CMS",
    query: "Can your e-commerce systems handle same-day delivery time-slot bookings for perishables?",
    answer: "Yes, we build custom checkout flows with delivery slot allocation, cutoff thresholds, and driver dispatch dispatching."
  },
  {
    name: "Lucas Müller",
    email: "lucas.m@austriatools.at",
    company: "Innsbruck Precision Tools",
    service: "Enterprise IT Solutions",
    query: "Can we integrate your proprietary HRMS and Swagat Suite for our staff management?",
    answer: "Yes, SCALE AI deploys Swagat Suite and HRMS with employee records, leave tracking, document vaults, and team permissions."
  },
  {
    name: "Preeti Mahajan",
    email: "preeti.m@delhirecruit.in",
    company: "TalentBridge Executive Search",
    service: "WhatsApp Business API",
    query: "Can candidate resumes be submitted and parsed directly through WhatsApp chat?",
    answer: "Yes, SCALE AI builds WhatsApp chatbots that receive PDF resumes, parse candidate skills via AI, and create candidate profiles automatically."
  },
  {
    name: "Alexander Wright",
    email: "a.wright@melbournetech.au",
    company: "Pacific Cloud Engineering",
    service: "AI & Automation",
    query: "How do you prevent AI models from generating incorrect statements about our services?",
    answer: "We implement strict prompt grounding, context injection defenses, and fallback boundaries so the model answers ONLY from verified company knowledge."
  },
  {
    name: "Naveen Saxena",
    email: "naveen.s@lucknowagri.in",
    company: "Avadh Agro Ventures",
    service: "Mobile Development",
    query: "Can you build a multilingual vernacular app for farmers in Hindi and English?",
    answer: "Yes, SCALE AI builds multilingual applications with voice-to-text queries, dynamic language toggling, and clean visual icons."
  },
  {
    name: "Klara Novak",
    email: "klara.novak@praguemedia.cz",
    company: "Bohemia Digital Studio",
    service: "UI/UX Design",
    query: "What is your design sprint process before commencing frontend engineering?",
    answer: "We run a structured discovery sprint: stakeholder interviews, user journey mapping, wireframing, high-fidelity Figma mockups, and client approval."
  }
];

async function seedDatabase() {
  console.log('Starting seed of 50 users into Supabase...');

  const createdSummary = [];
  const defaultPassword = 'ScaleAiUser2026!';

  for (let i = 0; i < mockUsersData.length; i++) {
    const item = mockUsersData[i];
    console.log(`[${i + 1}/50] Processing ${item.name} (${item.email})...`);

    // 1. Check or Create Auth User
    let userId = null;
    try {
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: item.email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: { full_name: item.name, company: item.company }
      });

      if (createError) {
        if (createError.message.includes('already registered') || createError.code === 'email_exists') {
          // Find existing user
          const { data: listData } = await supabase.auth.admin.listUsers();
          const existing = listData?.users?.find(u => u.email === item.email);
          if (existing) {
            userId = existing.id;
          }
        } else {
          console.error(`Error creating user ${item.email}:`, createError.message);
        }
      } else if (createData?.user) {
        userId = createData.user.id;
      }
    } catch (err) {
      console.error(`Exception creating user ${item.email}:`, err);
    }

    if (!userId) {
      console.warn(`Could not get userId for ${item.email}, skipping.`);
      continue;
    }

    // 2. Upsert Customer Profile
    const daysAgo = Math.floor(Math.random() * 25) + 1;
    const createdAt = new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString();

    const { error: profileError } = await supabase
      .from('customer_profiles')
      .upsert({
        user_id: userId,
        full_name: item.name,
        created_at: createdAt
      }, { onConflict: 'user_id' });

    if (profileError) {
      console.error(`Error saving profile for ${item.name}:`, profileError.message);
    }

    // 3. Insert Customer Queries
    const conversationId = randomUUID();
    const queryTimestamp = new Date(new Date(createdAt).getTime() + 15 * 60 * 1000).toISOString();

    // Check if query already exists to prevent duplicate spam
    const { data: existingQueries } = await supabase
      .from('customer_queries')
      .select('id')
      .eq('customer_id', userId)
      .limit(1);

    if (!existingQueries || existingQueries.length === 0) {
      const { error: queryError } = await supabase
        .from('customer_queries')
        .insert({
          customer_id: userId,
          conversation_id: conversationId,
          question: item.query,
          answer: item.answer,
          created_at: queryTimestamp
        });

      if (queryError) {
        console.error(`Error inserting query for ${item.name}:`, queryError.message);
      }
    }

    createdSummary.push({
      id: userId,
      name: item.name,
      email: item.email,
      company: item.company,
      service: item.service,
      query: item.query
    });
  }

  // Save JSON summary of the 50 users to data/users-50.json for reference
  fs.writeFileSync('data/users-50.json', JSON.stringify(createdSummary, null, 2), 'utf8');

  console.log(`\n✅ Successfully completed seeding ${createdSummary.length} users into Supabase!`);
  console.log(`Summary saved to data/users-50.json`);
}

seedDatabase().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
