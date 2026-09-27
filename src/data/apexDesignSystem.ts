export interface DesignSystemSpec {
  sectionId: string;
  name: string;
  tagline: string;
  rules: string[];
  tokens?: Record<string, string>;
  examples?: {
    label: string;
    description: string;
    previewCode?: string;
  }[];
}

export const APEX_SOCIAL_DESIGN_SYSTEM = {
  version: "2.4.0",
  systemName: "Apex Engineering Social Design System (AES-DS)",
  philosophy: "Precision Editorial Minimalism: Engineering Credibility over Social Media Fluff",
  
  typography: {
    fontFamilies: {
      headline: "Syne / Space Grotesk / Inter Display — Ultra-bold, geometric, uncompromising uppercase or tight title case.",
      monospace: "JetBrains Mono / Space Mono — Technical data readouts, code snippets, timestamps, metrics.",
      body: "Inter / Plus Jakarta Sans — High legibility at small sizes, optimal x-height for mobile carousels."
    },
    hierarchy: [
      { level: "Hero Hook", size: "64px - 72px (1080p)", weight: "900 (Black)", tracking: "-0.04em", leading: "1.05", useCase: "Slide 1 of Carousel, Reel first 3 seconds title card" },
      { level: "Section Header", size: "36px - 44px", weight: "700 (Bold)", tracking: "-0.02em", leading: "1.15", useCase: "Internal carousel slide headers, Static poster main titles" },
      { level: "Editorial Subtext", size: "22px - 26px", weight: "500 (Medium)", tracking: "normal", leading: "1.4", useCase: "Explanatory narrative, customer pain points" },
      { level: "Technical Monospace", size: "14px - 16px", weight: "600 (SemiBold)", tracking: "0.05em", leading: "1.5", useCase: "Data tags, problem codes, status indicators, coordinates" },
      { level: "Footer Signature", size: "13px - 14px", weight: "600 (Uppercase)", tracking: "0.1em", leading: "1.2", useCase: "APEX ENGINEERING / PUNE • WORKING GLOBALLY" }
    ]
  },

  colorSystem: {
    corePalette: [
      { name: "Apex Void Black", hex: "#0A0B0E", role: "Primary dark background, maximum contrast for crisp engineering copy" },
      { name: "Apex Carbon Charcoal", hex: "#14161B", role: "Card surface, container backgrounds, subtle elevated panels" },
      { name: "Apex High-Vis Orange", hex: "#FF4500", role: "Brand signature accent, critical highlights, primary CTA triggers" },
      { name: "Apex Stark Titanium", hex: "#FFFFFF", role: "Primary headlines, high-contrast text, sharp geometric borders" },
      { name: "Apex Subdued Muted Zinc", hex: "#8E95A5", role: "Secondary narrative, metadata, non-active indicators" },
      { name: "Apex Border Steel", hex: "#22252E", role: "1px crisp architectural grid lines, card dividers" }
    ],
    productColorCoding: [
      { product: "Apex Microcommerce", hex: "#F97316", accentBg: "rgba(249, 115, 22, 0.12)", badge: "ECOMMERCE & RETAIL SYSTEMS", description: "Warm terracotta-orange for independent brand commerce & rapid store deployments" },
      { product: "AI Business Systems", hex: "#FF4500", accentBg: "rgba(255, 69, 0, 0.12)", badge: "APPLIED AI & WORKFLOWS", description: "High-voltage electric orange for intelligent automation, lead scoring, and RAG search" },
      { product: "Custom Web Experiences", hex: "#3B82F6", accentBg: "rgba(59, 130, 246, 0.12)", badge: "DIGITAL EXPERIENCES & UX", description: "Precision sapphire blue for bespoke web applications, customer portals, and BRC/Flightpath experiences" },
      { product: "Executive Authority Platforms", hex: "#A855F7", accentBg: "rgba(168, 85, 247, 0.12)", badge: "AUTHORITY & CONSULTING", description: "Deep executive violet for high-ticket consulting platforms like Trikaya Leadership" }
    ],
    speciesCoding: [
      { code: "SPEC-01", name: "Problem-First Deconstruction", color: "#EF4444", description: "Exposing daily operational chaos (e.g. WhatsApp booking leaks, manual spreadsheets)" },
      { code: "SPEC-02", name: "System Architecture Blueprint", color: "#FF4500", description: "Visual schematic of Manual Work → Rules + Data + AI → Automated System" },
      { code: "SPEC-03", name: "Founder Perspective (Amar Pawar)", color: "#10B981", description: "18+ years UX wisdom, 'Why businesses rarely need another screen'" },
      { code: "SPEC-04", name: "Client Production Case Study", color: "#3B82F6", description: "Real-world builds (BRC Pune, Flightpath Aviation, Apex Microcommerce)" },
      { code: "SPEC-05", name: "AI Reality Check / Anti-Slop", color: "#F59E0B", description: "Debunking AI hype with pragmatic business logic" }
    ]
  },

  photographyTreatment: {
    rule: "Authentic engineering realism. Zero generic 3D glossy robot hands or glowing AI brains.",
    specs: [
      "Monochrome or deep duotone grade with Apex Orange key accents",
      "Macro textures: Keyboard switches, high-res code editor diffs, pencil UX wireframe pads, real screen mockups",
      "Human presence: Real candid working postures (hands on keyboard, sketching systemic diagrams, coffee cup beside dual monitors)",
      "High grain, subtle 15% film noise overlay, contrast pushed to +18% to feel tactile and industrial"
    ]
  },

  iconography: {
    rule: "Strict 1.5px stroke geometric stroke icons (Lucide/Feather family). Never use filled comic or 3D cartoon icons.",
    attributes: "Square ends, 24x24 grid, always accompanied by monospace uppercase label."
  },

  logoSafeArea: {
    monogram: "APEX ENGINEERING (With stylized geometric /\ chevron)",
    safePadding: "Minimum 48px margin on all 1080x1350 and 1080x1920 canvas borders",
    placement: "Top-left for Carousels, Top-right for Reels watermark (low opacity 70%), Bottom-center for static posters"
  },

  ctaTreatment: {
    rule: "Anti-pill discipline. Sharp 4px or 0px brutalist pill-less buttons.",
    primary: "Solid Apex Orange (#FF4500) background, Void Black text (#0A0B0E), Font: JetBrains Mono 14px bold, uppercase, trailing arrow 'ENGINEER YOUR SYSTEM →'",
    secondary: "1px border Stark White/Steel (#22252E), transparent background, Stark White text, hover orange glow."
  },

  dataVisualization: {
    standardFlowChart: "Horizontal step pipeline with right-pointing arrows: [MANUAL WORK] ➔ [RULES + DATA + AI] ➔ [AUTOMATED SYSTEM]",
    metricCard: "Large 48px monospace number (e.g. '18+', '84%', '0 MIN') + small 2-line uppercase caption below.",
    comparisonTable: "Clean 2-column matrix: 'WHAT AGENCIES DELIVER' (Static brochure website, no back-end) vs 'WHAT APEX ENGINEERS' (Connected business system, live database, automated follow-ups)."
  },

  carouselGrids: {
    canvasSize: "1080 x 1350 px (4:5 Aspect Ratio — Maximum vertical screen estate on Instagram and LinkedIn)",
    slideProgression: [
      { slide: 1, role: "The Provocative Hook", element: "Huge headline + Problem Code (e.g. 'PROB-03') + 'Swipe for System Architecture →'" },
      { slide: 2, role: "The Silent Cost of Manual Work", element: "Real quotes from clients ('Orders are scattered across WhatsApp...')" },
      { slide: 3, role: "The Architecture Blueprint", element: "Visual schematic showing inputs, database, AI rules, and outputs" },
      { slide: 4, role: "The 3 Pillars of Implementation", element: "Step 01 Understand, Step 02 Connect, Step 03 Automate" },
      { slide: 5, role: "The Business Metric Result", element: "Hours saved, conversion lift, zero lost inquiries" },
      { slide: 6, role: "Founder Signature & Direct Action", element: "Amar Pawar quote card + 'Save this post / DM SYSTEM for the free Miro template'" }
    ]
  },

  videoIntroOutro: {
    introLength: "1.2 seconds maximum",
    introStyle: "Typographic snap cut with quick audio shutter click. Text: 'APEX / AI BUSINESS SYSTEMS'",
    outroLength: "2.5 seconds",
    outroStyle: "Dark card fade with logo watermark: 'experience.engineered. / apex-engineering.co.in / Pune • Global'",
    audioSignature: "Deep industrial sub-bass drop (50Hz) + subtle mechanical click"
  },

  lowerThirds: {
    format: "Dual-deck minimalist HUD anchored 120px from screen bottom",
    topDeck: "AMAR PAWAR — Founder & Systems Designer",
    bottomDeck: "18+ YEARS UX & DIGITAL SYSTEMS • APEX ENGINEERING",
    background: "Blur backdrop (backdrop-filter: blur(12px)) with 1px orange left border"
  },

  expertIdCards: {
    layout: "Editorial passport card style for Amar Pawar and technical leads",
    elements: [
      "Square authentic portrait with subtle duotone grain",
      "Mono title: 'VERIFIED FOUNDER PROFILE'",
      "Name: Amar Pawar",
      "Specialty: UX Architecture, Automation, Pragmatic AI",
      "Stamp: '18+ YEARS IN THE FIELD / PUNE, INDIA'",
      "Quote: 'Businesses rarely need another screen. They need better systems behind those screens.'"
    ]
  },

  subtitleStyle: {
    rule: "Kinetic center-bottom captions rendered in real-time",
    font: "Syne / Inter Heavy (Uppercase, 32px)",
    color: "#FFFFFF",
    highlightWordColor: "#FF4500 (Apex Orange)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.85)",
    animation: "Word-by-word pulse on speech match"
  },

  thumbnailSystem: {
    formats: ["1080 x 1920 (Reels/Shorts)", "1280 x 720 (YouTube Landscape)"],
    rules: [
      "Maximum 3 to 4 words in headline (e.g. 'THE WHATSAPP LEAK', 'STOP MANUAL BOOKINGS', 'AI WITHOUT SLOP')",
      "High contrast: Bright Apex Orange hook against Deep Void Black",
      "Subject on one half, text with 1px border tag on the other half",
      "Consistent 'APEX / SYSTEM #04' badge in upper left"
    ]
  }
};
