export interface ApexCompanyProfile {
  companyName: string;
  tagline: string;
  subheadline: string;
  domain: string;
  location: string;
  globalReach: string;
  founder: {
    name: string;
    role: string;
    experience: string;
    coreQuote: string;
    bio: string;
    photoPlaceholder: string;
  };
  coreIdentity: string[];
  coreStreams: {
    id: string;
    name: string;
    badge: string;
    description: string;
    capabilities: string[];
  }[];
  philosophies: {
    headline: string;
    context: string;
  }[];
  realProjects: {
    client: string;
    category: string;
    tagline: string;
    problemSolved: string;
    outcome: string;
  }[];
  commonProblemsSolved: {
    problemId: string;
    quote: string;
    solutionDomain: string;
    systemFix: string;
  }[];
  contactChannels: {
    website: string;
    linkedin: string;
    behance: string;
    whatsapp: string;
  };
}

export const APEX_COMPANY_DATA: ApexCompanyProfile = {
  companyName: "Apex Engineering",
  tagline: "WE CREATE WEBSITES THAT DO MORE THAN LOOK GOOD",
  subheadline: "Stunning, cutting-edge digital experiences — tailored around your business, your customers and the problems they need solved.",
  domain: "apex-engineering.co.in",
  location: "Pune, Maharashtra, India",
  globalReach: "Working Globally",
  founder: {
    name: "Amar Pawar",
    role: "Founder & Principal Systems Designer",
    experience: "18+ Years of UX & Digital Experience",
    coreQuote: "Built by a designer who started with a simple question: 'Why are businesses still doing so much manually?'",
    bio: "I've spent most of my career designing digital experiences. But over time, I realised something: Businesses rarely need another screen. They need better systems behind those screens. That's why I started Apex Engineering. We combine UX, engineering, AI and automation to solve the actual problem — not simply deliver another website.",
    photoPlaceholder: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80"
  },
  coreIdentity: [
    "WEBSITES",
    "APPS",
    "ECOMMERCE",
    "AI",
    "AUTOMATION",
    "BUSINESS SYSTEMS"
  ],
  coreStreams: [
    {
      id: "digital_experiences",
      name: "Digital Experiences",
      badge: "STREAM 01",
      description: "Customer-facing and internal experiences designed around what people need to do.",
      capabilities: [
        "Websites",
        "Web Apps",
        "Mobile Apps",
        "UX/UI Design",
        "Customer Portals",
        "Dashboards",
        "Internal Tools",
        "Business Applications",
        "AI Products",
        "AI Assistants"
      ]
    },
    {
      id: "commerce_operations",
      name: "Commerce & Business Operations",
      badge: "STREAM 02",
      description: "Connected systems that help businesses sell, serve customers, and run everyday operations seamlessly.",
      capabilities: [
        "Ecommerce",
        "Apex Microcommerce",
        "Orders & Inventory",
        "Automated Payments",
        "Appointment Booking",
        "WhatsApp Automation",
        "CRM Integration",
        "Business Analytics"
      ]
    },
    {
      id: "applied_ai",
      name: "AI Where It Actually Makes Sense",
      badge: "STREAM 03",
      description: "AI is not the product. The business problem is. Embedding practical AI into daily business mechanics.",
      capabilities: [
        "AI Assistants & Copilots",
        "Intelligent Lead Qualification",
        "Automated Document Processing",
        "Content & Media Workflows",
        "Internal Knowledge RAG",
        "AI-Powered Smart Search",
        "Predictive Business Insights"
      ]
    },
    {
      id: "automation_systems",
      name: "Autonomous Business Systems",
      badge: "STREAM 04",
      description: "If your business does it every day, we should ask why it's still manual. Formula: Manual Work → Rules + Data + AI → Automated System.",
      capabilities: [
        "Lead Follow-Up Sequences",
        "Booking Reminders & SMS/WhatsApp",
        "Payment Tracking & Reconciliation",
        "Customer Support Auto-Triaging",
        "Automated Business Reports",
        "Internal Multi-Stage Approvals"
      ]
    }
  ],
  philosophies: [
    {
      headline: "AI is not the product. The business problem is.",
      context: "Everyone is rushing to add generic chatbots that frustrate users. Real value happens when AI is quietly embedded into lead capture, order reconciliation, and operational workflows."
    },
    {
      headline: "Businesses rarely need another screen. They need better systems behind those screens.",
      context: "A beautiful website that dumps leads into a messy WhatsApp chat or an unorganized spreadsheet is broken. The entire journey from first touch to cash flow must be engineered."
    },
    {
      headline: "We don't start with technology.",
      context: "Our 6-step method: 01 Understand → 02 Design → 03 Engineer → 04 Connect → 05 Automate → 06 Improve."
    },
    {
      headline: "18+ Years of UX & Digital Experience.",
      context: "Human-centric design principles honed over nearly two decades, built around real human behavior and high conversion ergonomics."
    }
  ],
  realProjects: [
    {
      client: "BRC Pune",
      category: "Digital Live Website / Community Platform",
      tagline: "JUST RIDE. REST ALL FOLLOW.",
      problemSolved: "Passionate Pune-based motorcycle community needed an energetic, high-impact digital presence with ride coordination and member engagement.",
      outcome: "High-retention digital clubhouse with live ride schedules and community registration."
    },
    {
      client: "Apex Microcommerce",
      category: "E-Commerce Platform / Proprietary Product",
      tagline: "YOUR BUSINESS. YOUR STORE. ONLINE.",
      problemSolved: "Small businesses, home sellers, and independent brands struggle with complex, expensive enterprise ecommerce software.",
      outcome: "Accessible, narrative-driven digital storefronts enabling independent brands to launch and sell online within 48 hours without high monthly overheads."
    },
    {
      client: "Flightpath Aviation Consultants",
      category: "Digital Authority Web Experience",
      tagline: "TRANSFORMING SKY EXPERTISE INTO BUSINESS TRUST",
      problemSolved: "Translating high-stakes aviation consulting and deep advisory expertise into an elite, credible digital presence for global aerospace leaders.",
      outcome: "Authoritative B2B experience driving international airline and fleet advisory contracts."
    },
    {
      client: "Trikaya Leadership",
      category: "Brand Experience / Executive Web Platform",
      tagline: "THE THREE DIMENSIONS OF LEADERSHIP",
      problemSolved: "Bespoke narrative digital platform for premier executive leadership consulting and organizational transformation.",
      outcome: "Elevated C-suite engagement and high-ticket executive coaching applications."
    }
  ],
  commonProblemsSolved: [
    {
      problemId: "PROB-01",
      quote: "Customers keep messaging us on WhatsApp.",
      solutionDomain: "Customer communication + automation",
      systemFix: "Multi-branch WhatsApp conversational booking bot connected directly to Google Sheets / CRM with payment links."
    },
    {
      problemId: "PROB-02",
      quote: "We're still taking bookings manually.",
      solutionDomain: "Booking + payments + reminders",
      systemFix: "Automated self-serve appointment calendar with instant UPI/Stripe deposit collection and WhatsApp reminder sequences."
    },
    {
      problemId: "PROB-03",
      quote: "Orders are scattered across WhatsApp and spreadsheets.",
      solutionDomain: "Connected commerce",
      systemFix: "Apex Microcommerce unified storefront where customer orders sync in real-time to inventory and logistics with 0 manual copying."
    },
    {
      problemId: "PROB-04",
      quote: "We spend hours following up with leads.",
      solutionDomain: "Lead management + automation",
      systemFix: "AI-qualified lead intake pipeline that auto-scores buyer intent and triggers personalized WhatsApp and email drip nurture."
    },
    {
      problemId: "PROB-05",
      quote: "Our website isn't helping the business.",
      solutionDomain: "UX + customer journey + conversion",
      systemFix: "Complete UX architecture overhaul replacing static marketing fluff with high-converting buyer journeys and clear value propositions."
    },
    {
      problemId: "PROB-06",
      quote: "We want AI but don't know where it actually fits.",
      solutionDomain: "Practical AI strategy",
      systemFix: "Pragmatic AI audit identifying the exact 2-3 operational choke points where LLMs or OCR save 15+ hours/week."
    }
  ],
  contactChannels: {
    website: "https://apex-engineering.co.in",
    linkedin: "https://linkedin.com/company/apex-engineering-studio",
    behance: "https://behance.net/amarpawar",
    whatsapp: "https://wa.me/919800000000"
  }
};
