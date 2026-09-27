import { SocialAsset, AnnualQuarterPlan, Campaign } from '../types/campaign';

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: "cmp-q1-manifesto",
    campaignCode: "CMP-2026-001",
    name: "The Anti-Manual Manifesto & Microcommerce Launch",
    brief: "Promote Apex Microcommerce to small Indian businesses currently taking orders on WhatsApp. Focus on affordability, simplicity and eliminating manual order management.",
    objective: "50,000+ targeted reach, 15 qualified inbound inquiries for Apex Microcommerce and Custom AI Systems across SMBs.",
    status: "ACTIVE",
    platforms: ["instagram", "linkedin", "youtube", "twitter"],
    formats: ["carousel", "reel_short", "static_poster"],
    languages: ["English", "Hindi + English"],
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    createdAt: "2026-09-01T09:00:00.000Z",
    updatedAt: "2026-09-26T10:00:00.000Z",
    assetCount: 16,
    strategy: {
      objectiveSummary: "Dismantle spreadsheet chaos for SMBs in Pune & India and establish Apex as the premier AI & UX systems engineering studio.",
      targetAudience: "Indian SMB founders, boutique retailers, clinics & service businesses taking orders over WhatsApp.",
      buyerPersonas: ["SMB Founders", "Operations Leads", "Retail Boutique Owners", "B2B Service Providers"],
      coreInsight: "Businesses don't need another generic website; they need automated systems that turn customer WhatsApp messages into completed orders and bank deposits without human intervention.",
      valueProposition: "Live automated storefront in 48 hours with 1-click UPI checkout and instant WhatsApp order logging.",
      contentPillars: [
        "The WhatsApp Order Leak Teardown",
        "Apex Microcommerce: Your Store Live in 48 Hours",
        "18 Years of UX: Why Another Screen Won't Save Your Business"
      ],
      contentStreams: ["commerce_operations", "automation_systems", "founder_philosophy"],
      speciesCodes: ["SPEC-01_PROBLEM_FIRST", "SPEC-02_SYSTEM_BLUEPRINT", "SPEC-03_FOUNDER_PERSPECTIVE"],
      formatMix: ["Carousels (60%)", "Reels (30%)", "Static Posters (10%)"],
      postingSequence: "Hook with WhatsApp bottleneck teardown (Mon/Tue) -> Deep-dive system architecture (Wed/Thu) -> Founder perspective & CTA (Fri/Sat)",
      recommendedPostingSchedule: "Tuesday and Thursday at 11:30 AM IST & 4:45 PM IST"
    }
  },
  {
    id: "cmp-q2-anti-slop",
    campaignCode: "CMP-2026-002",
    name: "AI Where It Actually Makes Sense (Anti-Slop Era)",
    brief: "Cutting through generic AI buzzwords with practical business architectures (RAG internal search, automated invoice extraction, lead qualification pipelines).",
    objective: "Establish viral thought leadership on LinkedIn & YouTube with deep-dive technical schematics and live working demos.",
    status: "ACTIVE",
    platforms: ["linkedin", "youtube", "twitter"],
    formats: ["carousel", "infographic_flyer", "static_poster"],
    languages: ["English"],
    startDate: "2026-10-01",
    endDate: "2026-10-31",
    createdAt: "2026-09-15T09:00:00.000Z",
    updatedAt: "2026-09-26T10:00:00.000Z",
    assetCount: 6,
    strategy: {
      objectiveSummary: "Position Apex Engineering as the pragmatic anti-hype voice in enterprise AI engineering.",
      targetAudience: "CTOs, Technical Product Managers, Engineering Directors, Bootstrapped Tech Founders.",
      buyerPersonas: ["CTOs", "Product Managers", "Technical Founders"],
      coreInsight: "AI is not the product; the business problem is. Highlighting real data plumbing and eliminating manual work.",
      valueProposition: "Zero-slop system architectures connecting WhatsApp, Google Sheets, and Gemini in production.",
      contentPillars: [
        "AI is Not the Product, The Business Problem Is",
        "Behind the Scenes: Engineering BRC Pune's Live Community Engine",
        "Zero-Cost AI Business Stack (₹0/Month)"
      ],
      contentStreams: ["applied_ai", "automation_systems"],
      speciesCodes: ["SPEC-02_SYSTEM_BLUEPRINT", "SPEC-05_AI_REALITY_CHECK"],
      formatMix: ["Carousels (50%)", "Infographics (30%)", "Static Posters (20%)"],
      postingSequence: "Thought leadership debunking AI hype (Wed) -> Real architecture blueprint with code (Fri)",
      recommendedPostingSchedule: "Wednesday at 12:00 PM IST"
    }
  },
  {
    id: "cmp-q3-executive",
    campaignCode: "CMP-2026-003",
    name: "Executive Authority & High-Ticket Transformation",
    brief: "Showcase high-stakes web platforms (Flightpath Aviation Consultants, Trikaya Leadership) and prove ROI for C-Suite founders.",
    objective: "Sign 3 high-ticket advisory or enterprise systems engineering retainers ($10k+ / ₹8L+).",
    status: "DRAFT",
    platforms: ["linkedin", "twitter"],
    formats: ["founder_card", "carousel"],
    languages: ["English"],
    startDate: "2026-11-01",
    endDate: "2026-11-30",
    createdAt: "2026-09-20T09:00:00.000Z",
    updatedAt: "2026-09-26T10:00:00.000Z",
    assetCount: 0,
    strategy: {
      objectiveSummary: "High-ticket enterprise credibility showcasing deep transformation for leadership consultancies and aviation.",
      targetAudience: "Founders, Managing Partners, Enterprise Executives, High-growth Startups.",
      buyerPersonas: ["Managing Directors", "C-Suite Executives"],
      coreInsight: "High-value clients judge digital platforms not by buzzwords, but by conversion ergonomics and clarity of execution.",
      valueProposition: "Engineered web ecosystems that build instant institutional trust.",
      contentPillars: ["Aviation Consulting Digital Trust Case Study", "Designing for Real Humans", "The 6-Step Method"],
      contentStreams: ["digital_experiences", "founder_philosophy"],
      speciesCodes: ["SPEC-03_FOUNDER_PERSPECTIVE", "SPEC-04_CASE_STUDY"],
      formatMix: ["Founder Cards (50%)", "Carousels (50%)"],
      postingSequence: "Bi-weekly executive breakdowns on LinkedIn",
      recommendedPostingSchedule: "Monday and Thursday at 09:30 AM IST"
    }
  }
];

export const ANNUAL_QUARTER_PLANS: AnnualQuarterPlan[] = [
  {
    quarter: "Q1",
    title: "The Anti-Manual Manifesto & Microcommerce Launch",
    theme: "'Why are businesses still doing so much manually?' — Dismantling spreadsheet chaos and establishing Apex as Pune's premier AI & UX systems engineering studio.",
    targetMonthlyAssets: 22,
    quarterlyGoal: "50,000+ targeted reach across Pune, Bangalore, Mumbai, and global founders; 15 qualified inbound inquiries for Apex Microcommerce and Custom AI Systems.",
    focusStreams: ["commerce_operations", "automation_systems", "founder_philosophy"],
    keyCampaigns: [
      "The WhatsApp Order Leak Teardown",
      "Apex Microcommerce: Your Store Live in 48 Hours",
      "18 Years of UX: Why Another Screen Won't Save Your Business"
    ]
  },
  {
    quarter: "Q2",
    title: "AI Where It Actually Makes Sense (Anti-Slop Era)",
    theme: "Cutting through generic AI buzzwords with practical business architectures (RAG internal search, automated invoice extraction, lead qualification pipelines).",
    targetMonthlyAssets: 20,
    quarterlyGoal: "Establish viral thought leadership on LinkedIn & YouTube with deep-dive technical schematics and live working demos.",
    focusStreams: ["applied_ai", "digital_experiences"],
    keyCampaigns: [
      "AI is Not the Product, The Business Problem Is",
      "Behind the Scenes: Engineering BRC Pune's Live Community Engine",
      "How to Connect Google Sheets + WhatsApp + AI in 3 Steps"
    ]
  },
  {
    quarter: "Q3",
    title: "Executive Authority & High-Ticket Transformation",
    theme: "Showcasing high-stakes web platforms (Flightpath Aviation Consultants, Trikaya Leadership) and proving ROI for C-Suite founders.",
    targetMonthlyAssets: 21,
    quarterlyGoal: "Sign 3 high-ticket advisory or enterprise systems engineering retainers ($10k+ / ₹8L+).",
    focusStreams: ["digital_experiences", "founder_philosophy"],
    keyCampaigns: [
      "Aviation Consulting Digital Trust Case Study",
      "Designing for Real Humans: Conversion Ergonomics",
      "The 6-Step Method: Understand, Design, Engineer, Connect, Automate, Improve"
    ]
  },
  {
    quarter: "Q4",
    title: "The Autonomous Business Machine (Year-End Scale)",
    theme: "Year-end operational audit for businesses looking to scale without hiring 10 more ops coordinators for 2027.",
    targetMonthlyAssets: 22,
    quarterlyGoal: "Annual review, community benchmarks, and launching the Apex Autonomous Business Blueprint 2027.",
    focusStreams: ["automation_systems", "commerce_operations", "applied_ai"],
    keyCampaigns: [
      "The 2027 Business Automation Checklist",
      "Microcommerce Holiday Rush Stress Test",
      "From Manual Work to Automated System: The Year in Review"
    ]
  }
];

export const INITIAL_MONTH_ASSETS: SocialAsset[] = [
  // --- 01: CAROUSEL (SPEC-01 Problem-First)
  {
    id: "APEX-M01-001",
    assetCode: "APEX-2026-M01-001",
    title: "The WhatsApp Lead Leak: Why 60% of Your Inquiries Disappear",
    targetDate: "2026-09-26",
    postTimeIST: "11:30 AM",
    platform: "instagram",
    secondaryPlatforms: ["linkedin"],
    format: "carousel",
    stream: "commerce_operations",
    speciesCode: "SPEC-01_PROBLEM_FIRST",
    status: "scheduled",
    productionStatus: "NOT_GENERATED",
    hook: "You're spending money on marketing, but your sales are dying inside unread WhatsApp messages.",
    caption: `If your business relies on customers messaging you on WhatsApp, you already know the sinking feeling:

A lead asks "What's the price?" at 9:45 PM.
Nobody replies until 10:30 AM the next morning.
By then, they’ve bought from someone else.

Or worse: orders are scattered between phone chats, sticky notes, and three different spreadsheets.

At Apex Engineering, we don't build "another website". We engineer connected commerce systems where WhatsApp leads convert automatically, inventory updates in real time, and you never copy-paste an address again.

Swipe through for the complete architecture diagram. 👉

Comment 'LEAK' and our automated workflow will send you our diagnostic checklist.

#ApexEngineering #BusinessAutomation #WhatsAppMarketing #UXDesign #PuneBusiness #EcommerceSystems`,
    hashtags: ["ApexEngineering", "BusinessAutomation", "WhatsAppMarketing", "UXDesign", "PuneBusiness", "EcommerceSystems"],
    callToAction: "Comment 'LEAK' for the free diagnostic checklist or visit apex-engineering.co.in",
    viralityScore: 92,
    targetReach: 14000,
    estimatedImpressions: 22500,
    expectedLeads: 8,
    targetBuyerPersona: "SMB Founders, Home Brands, Clinic Owners & Service Businesses in India",
    designSystemVerified: true,
    colorScheme: "carbon_orange",
    slides: [
      {
        slideNumber: 1,
        layout: "title_hook",
        badge: "PROBLEM #01 // DIAGNOSTIC",
        headline: "THE WHATSAPP LEAD LEAK.",
        subtext: "Why 60% of your business inquiries die in unread chats (and how to fix the plumbing).",
        body: ["Swipe to inspect the system breakdown 👉"]
      },
      {
        slideNumber: 2,
        layout: "problem_agitation",
        badge: "THE SYMPTOMS",
        headline: "DOES YOUR DAY LOOK LIKE THIS?",
        body: [
          "• Customers ping at midnight, no one responds, deal lost.",
          "• Pricing is copied manually from an old PDF catalog.",
          "• Payment screenshots get lost in 40 unread chat threads.",
          "• You hire another intern just to copy addresses into Excel."
        ]
      },
      {
        slideNumber: 3,
        layout: "diagram_architecture",
        badge: "THE APEX SYSTEM",
        headline: "FROM CHAT CHAOS TO CONNECTED ENGINE",
        body: [
          "[INCOMING WHATSAPP PING]",
          "        ↓",
          "[AI INTENT QUALIFIER: Product? Pricing? Booking?]",
          "        ↓",
          "[INSTANT INTERACTIVE CATALOG + UPI PAYMENT LINK]",
          "        ↓",
          "[AUTO-ORDER LOGGED TO MASTER DATABASE & WAREHOUSE]"
        ]
      },
      {
        slideNumber: 4,
        layout: "breakdown_steps",
        badge: "THE THREE PILLARS",
        headline: "HOW WE SOLVE IT AT APEX",
        body: [
          "01 UNDERSTAND: Map the real friction points in your customer journey.",
          "02 CONNECT: Hook WhatsApp Cloud API directly into your backend.",
          "03 AUTOMATE: Set clear rules so 80% of repetitive questions resolve in 4 seconds."
        ]
      },
      {
        slideNumber: 5,
        layout: "proof_quote",
        badge: "THE PHILOSOPHY",
        headline: "'AI IS NOT THE PRODUCT. THE BUSINESS PROBLEM IS.'",
        body: [
          "Don't buy technology because it's trendy.",
          "Buy it because it eliminates manual human grunt work and protects your revenue."
        ]
      },
      {
        slideNumber: 6,
        layout: "cta_system",
        badge: "ENGINEER YOUR SYSTEM",
        headline: "WHAT IS YOUR BUSINESS TRYING TO SOLVE?",
        body: [
          "Comment 'LEAK' below to receive our 1-page WhatsApp Automation Blueprint.",
          "Or book a 1-on-1 systems diagnosis at apex-engineering.co.in"
        ]
      }
    ]
  },

  // --- 02: REEL / YOUTUBE SHORT (SPEC-03 Founder Perspective)
  {
    id: "APEX-M01-002",
    assetCode: "APEX-2026-M01-002",
    title: "Why Businesses Rarely Need Another Screen | Amar Pawar",
    targetDate: "2026-09-26",
    postTimeIST: "04:45 PM",
    platform: "instagram",
    secondaryPlatforms: ["youtube", "linkedin"],
    format: "reel_short",
    stream: "founder_philosophy",
    speciesCode: "SPEC-03_FOUNDER_PERSPECTIVE",
    status: "approved",
    productionStatus: "NOT_GENERATED",
    hook: "I've spent 18+ years designing digital experiences. Here is the uncomfortable truth most agencies will never tell you.",
    caption: `Most agencies will happily charge you ₹3,00,000 to redesign your website with pretty animations.

3 months later, your revenue hasn't moved an inch.

Why? Because businesses rarely need another screen. They need better systems behind those screens.

If your beautiful new website still dumps leads into an unmonitored inbox or forces you to copy orders manually into an Excel sheet, you don't have a website problem. You have a system plumbing problem.

That is why we started Apex Engineering. We build UX that does more than look good.

What part of your business is still painfully manual? Drop it in the comments.

#AmarPawar #ApexEngineering #UXStrategy #SystemsThinking #WebDesignTruth #Automation #PuneTech`,
    hashtags: ["AmarPawar", "ApexEngineering", "UXStrategy", "SystemsThinking", "WebDesignTruth", "Automation"],
    callToAction: "Follow @apex_engineering for systems thinking or visit apex-engineering.co.in",
    viralityScore: 96,
    targetReach: 32000,
    estimatedImpressions: 54000,
    expectedLeads: 14,
    targetBuyerPersona: "Founders, CTOs, Agency owners, D2C Entrepreneurs",
    designSystemVerified: true,
    colorScheme: "carbon_orange",
    audioTrackRecommendation: "Subtle rhythmic Lo-Fi hip hop with punchy kicks (35% volume)",
    videoScenes: [
      {
        sceneNumber: 1,
        timestamp: "0:00 - 0:03",
        hookText: "YOUR WEBSITE LOOKS GOOD. BUT IT'S BROKEN.",
        bRollPrompt: "Macro close-up shot of hands typing code on mechanical keyboard, transitioning to an unread WhatsApp inbox with 80+ badge alerts.",
        narrationVoiceover: "I've spent over 18 years in UX design, and here is an uncomfortable truth most web agencies won't tell you.",
        onScreenCaption: "18+ YEARS IN UX: THE BRUTAL TRUTH",
        visualFocus: "High contrast monochrome footage with vivid Apex Orange highlight boxes."
      },
      {
        sceneNumber: 2,
        timestamp: "0:03 - 0:08",
        hookText: "BUSINESSES RARELY NEED ANOTHER SCREEN.",
        bRollPrompt: "Amar Pawar speaking directly to camera in modern minimalist design studio, Pune backdrop, clean typography overlay.",
        narrationVoiceover: "Businesses rarely need another screen. They need better systems behind those screens.",
        onScreenCaption: "YOU DON'T NEED ANOTHER SCREEN.",
        visualFocus: "Lower-third: AMAR PAWAR // FOUNDER, APEX ENGINEERING"
      },
      {
        sceneNumber: 3,
        timestamp: "0:08 - 0:15",
        hookText: "THE DIRTY SECRET OF FANCY SITES",
        bRollPrompt: "Split screen: On left, a gorgeous high-end website mockup. On right, a chaotic spreadsheet with red error cells and missed customer names.",
        narrationVoiceover: "If your stunning new website still dumps leads into an Excel sheet that nobody checks, you just bought an expensive brochure.",
        onScreenCaption: "BROCHURE SITE VS AUTOMATED ENGINE",
        visualFocus: "Red versus Orange visual data contrast."
      },
      {
        sceneNumber: 4,
        timestamp: "0:15 - 0:23",
        hookText: "WHAT REAL ENGINEERING LOOKS LIKE",
        bRollPrompt: "Animated clean node diagram showing: Website Lead ➔ AI Qualification ➔ Instant Payment Link ➔ Auto CRM Sync.",
        narrationVoiceover: "At Apex, we connect UX, engineering, AI, and automation so the actual work happens automatically.",
        onScreenCaption: "MANUAL WORK ➔ RULES + DATA + AI ➔ SYSTEM",
        visualFocus: "Geometric line arrows and smooth node transitions."
      },
      {
        sceneNumber: 5,
        timestamp: "0:23 - 0:30",
        hookText: "WHAT'S NOT WORKING IN YOUR BUSINESS?",
        bRollPrompt: "Amar Pawar with Apex Engineering monogram logo on dark slate background, URL displayed with high legibility.",
        narrationVoiceover: "You bring the business problem. We engineer the system. Link in bio.",
        onScreenCaption: "YOU BRING THE PROBLEM. WE ENGINEER THE SYSTEM.",
        visualFocus: "Clean outro card: apex-engineering.co.in"
      }
    ]
  },

  // --- 03: STATIC POSTER (SPEC-02 System Blueprint)
  {
    id: "APEX-M01-003",
    assetCode: "APEX-2026-M01-003",
    title: "The Apex Equation: Manual Work → Rules + Data + AI → Automated System",
    targetDate: "2026-09-26",
    postTimeIST: "10:00 AM",
    platform: "linkedin",
    secondaryPlatforms: ["twitter", "instagram"],
    format: "static_poster",
    stream: "automation_systems",
    speciesCode: "SPEC-02_SYSTEM_BLUEPRINT",
    status: "approved",
    productionStatus: "NOT_GENERATED",
    hook: "If your business does it every day, we should ask why it's still manual.",
    caption: `Look at the tasks your team did this week:
- Following up on unanswered leads
- Sending booking reminders
- Checking whether an order was paid
- Manually copying data from forms into spreadsheets

Every single one of these tasks obeys strict mathematical rules.
And anything with rules should be automated.

The Apex Engineering Formula:
1. MANUAL WORK (Identify the repetitive friction)
2. RULES + DATA + AI (Define triggers, structured records, and intent models)
3. AUTOMATED SYSTEM (Zero humans required for the mechanical step)

Save this infographic. Next time your team is drowning in manual work, run it through this formula.

#SystemArchitecture #BusinessAutomation #ApexEngineering #Productivity #EngineeringMindset`,
    hashtags: ["SystemArchitecture", "BusinessAutomation", "ApexEngineering", "Productivity", "EngineeringMindset"],
    callToAction: "Save this blueprint or visit apex-engineering.co.in",
    viralityScore: 88,
    targetReach: 9500,
    estimatedImpressions: 16000,
    expectedLeads: 5,
    targetBuyerPersona: "Operations Managers, COOs, B2B Founders",
    designSystemVerified: true,
    colorScheme: "clean_white",
    posterLayoutType: "architecture_diagram",
    posterVisualPrompt: "Ultra-crisp editorial poster, stark white canvas, bold black technical typography 'IF YOUR BUSINESS DOES IT EVERY DAY, WE SHOULD ASK WHY IT'S STILL MANUAL.', three-step horizontal pipeline with Apex Orange glowing node markers, precision monospace table of automated vs manual tasks, Apex Engineering monogram at footer."
  },

  // --- 04: CAROUSEL (SPEC-04 Client Case Study - BRC Pune)
  {
    id: "APEX-M01-004",
    assetCode: "APEX-2026-M01-004",
    title: "Case Study: How We Built BRC Pune's High-Octane Digital Platform",
    targetDate: "2026-10-06",
    postTimeIST: "11:30 AM",
    platform: "instagram",
    secondaryPlatforms: ["linkedin"],
    format: "carousel",
    stream: "digital_experiences",
    speciesCode: "SPEC-04_CASE_STUDY",
    status: "approved",
    hook: "How to turn a 500+ rider motorcycle community into a unified digital experience. 'JUST RIDE. REST ALL FOLLOW.'",
    caption: `When you're building for a passionate motorcycle community like BRC Pune, a generic WordPress theme doesn't cut it.

Riders don't want corporate menus. They want:
- Instant upcoming ride routes and elevation maps
- Lightning-fast member registration without 10-step forms
- Pure throttle aesthetic that matches the adrenaline of the road

Here is how Apex Engineering approached the UX architecture:
1. Emotion-First Visuals: Dark brutalist layout, high-contrast imagery, cinematic typography.
2. Route Telemetry: Embedded GPS coordinates and safety briefing checkpoints.
3. Zero-Friction Community Hub: Connected registration that syncs directly with rider rosters.

Swipe through for the full project breakdown and UX design decisions. 👉

#BRCPune #MotorcycleCommunity #ApexEngineering #CaseStudy #UXDesign #WebDevelopment #Pune`,
    hashtags: ["BRCPune", "MotorcycleCommunity", "ApexEngineering", "CaseStudy", "UXDesign", "WebDevelopment", "Pune"],
    callToAction: "Explore the live build at apex-engineering.co.in/work",
    viralityScore: 90,
    targetReach: 18000,
    estimatedImpressions: 29000,
    expectedLeads: 7,
    targetBuyerPersona: "Lifestyle brand owners, community builders, sports & leisure founders",
    designSystemVerified: true,
    colorScheme: "carbon_orange",
    slides: [
      {
        slideNumber: 1,
        layout: "title_hook",
        badge: "CASE STUDY // DIGITAL EXPERIENCE",
        headline: "JUST RIDE. REST ALL FOLLOW.",
        subtext: "Engineering an energetic, high-impact digital platform for Pune's premier motorcycle community.",
        body: ["BRC Pune x Apex Engineering"]
      },
      {
        slideNumber: 2,
        layout: "problem_agitation",
        badge: "THE CHALLENGE",
        headline: "RIDERS DON'T WANT CORPORATE TEMPLATES",
        body: [
          "• Ride announcements were scattered across WhatsApp chats.",
          "• Safety forms and emergency contacts were gathered manually.",
          "• New riders had no single source of truth for club ethos and gear standards."
        ]
      },
      {
        slideNumber: 3,
        layout: "diagram_architecture",
        badge: "THE DESIGN SYSTEM",
        headline: "HIGH-CONTRAST, ADRENALINE-FUELED UX",
        body: [
          "[DARK MODE BRUTALISM: Raw asphalt tones + high-vis red accents]",
          "[DYNAMIC RIDE TICKER: Next ride countdown + distance counter]",
          "[ONE-TAP RSVP: Automated safety checklist & emergency contact intake]"
        ]
      },
      {
        slideNumber: 4,
        layout: "breakdown_steps",
        badge: "TECHNICAL EXECUTION",
        headline: "PERFORMANCE UNDER MOBILE CONSTRAINTS",
        body: [
          "• Sub-1s page load even on spotty highway 4G networks.",
          "• Mobile-first navigation built for one-handed thumb interaction.",
          "• Integrated media gallery showing raw, unfiltered ride captures."
        ]
      },
      {
        slideNumber: 5,
        layout: "cta_system",
        badge: "RESULTS",
        headline: "100% DIGITAL REGISTRATION FOR ALL EXPEDITIONS",
        body: [
          "Want a digital experience that actually resonates with your community?",
          "Check out the project at apex-engineering.co.in"
        ]
      }
    ]
  },

  // --- 05: REEL / SHORT (SPEC-01 Problem-First)
  {
    id: "APEX-M01-005",
    assetCode: "APEX-2026-M01-005",
    title: "Stop Taking Bookings Manually (You Are Burning Money)",
    targetDate: "2026-10-08",
    postTimeIST: "05:15 PM",
    platform: "instagram",
    secondaryPlatforms: ["youtube"],
    format: "reel_short",
    stream: "commerce_operations",
    speciesCode: "SPEC-01_PROBLEM_FIRST",
    status: "approved",
    hook: "Are you still texting clients back and forth 14 times just to schedule one 30-minute appointment?",
    caption: `"Are you free Tuesday at 3?"
"No, how about Wednesday at 5?"
"Sorry, Wednesday is booked. Thursday morning?"

If this is how your business schedules clients, you are losing 30% of your potential revenue to friction.

Watch how we automate this with an Apex Booking Engine:
1. Client selects slot in 3 taps
2. UPI / Card deposit collected automatically
3. Calendar auto-blocked + Google Meet link generated
4. Automated WhatsApp reminder 2 hours before the session

No ping-pong messages. Zero no-shows. 

Comment 'BOOK' to see a live demo of this exact system.

#BookingAutomation #ApexEngineering #ProductivityHacks #DoctorAppointments #Consulting #PuneStartups`,
    hashtags: ["BookingAutomation", "ApexEngineering", "ProductivityHacks", "DoctorAppointments", "Consulting", "PuneStartups"],
    callToAction: "Comment 'BOOK' for demo link",
    viralityScore: 94,
    targetReach: 28000,
    estimatedImpressions: 46000,
    expectedLeads: 16,
    targetBuyerPersona: "Doctors, Lawyers, Financial Advisors, Studio Owners, Consultants",
    designSystemVerified: true,
    colorScheme: "slate_electric",
    audioTrackRecommendation: "Upbeat rhythmic synth groove with crisp snare",
    videoScenes: [
      {
        sceneNumber: 1,
        timestamp: "0:00 - 0:03",
        hookText: "STOP TEXTING CLIENTS TO SCHEDULE MEETINGS",
        bRollPrompt: "Fast-motion animation of 10 incoming WhatsApp notifications asking 'Are you free tomorrow?' piling up on an iPhone lock screen.",
        narrationVoiceover: "If you're still texting clients 14 times just to fix one appointment, you are burning your own money.",
        onScreenCaption: "THE MANUAL BOOKING TRAP",
        visualFocus: "Red notification bubbles multiplying rapidly."
      },
      {
        sceneNumber: 2,
        timestamp: "0:03 - 0:10",
        hookText: "THE 4-STEP APEX BOOKING ENGINE",
        bRollPrompt: "Screen recording of clean, bespoke Apex booking interface: User picks date, selects time slot, enters name.",
        narrationVoiceover: "Here is what happens when you engineer the system properly: The client picks an open slot in 3 seconds.",
        onScreenCaption: "STEP 1: 3-TAP SLOT SELECTION",
        visualFocus: "Smooth micro-interactions and instant feedback."
      },
      {
        sceneNumber: 3,
        timestamp: "0:10 - 0:17",
        hookText: "AUTO-DEPOSIT = ZERO NO-SHOWS",
        bRollPrompt: "Instant UPI QR code appears on screen, payment completes with green checkmark.",
        narrationVoiceover: "Instant UPI deposit or fee is collected right there. No-shows drop to zero.",
        onScreenCaption: "STEP 2: INSTANT UPI DEPOSIT",
        visualFocus: "Apex Orange accent on payment completion."
      },
      {
        sceneNumber: 4,
        timestamp: "0:17 - 0:25",
        hookText: "AUTO WHATSAPP REMINDER",
        bRollPrompt: "WhatsApp message arrives: 'Hi Rahul, your appointment with Dr. Sharma is in 2 hours. Here is the location map.'",
        narrationVoiceover: "A calendar invite and WhatsApp reminder fire automatically. Zero manual effort from your staff.",
        onScreenCaption: "STEP 3: AUTOMATED REMINDERS",
        visualFocus: "Clean notification HUD preview."
      },
      {
        sceneNumber: 5,
        timestamp: "0:25 - 0:30",
        hookText: "GET THE SYSTEM FOR YOUR BUSINESS",
        bRollPrompt: "Amar Pawar in studio with typography card 'APEX ENGINEERING / AI BUSINESS SYSTEMS'.",
        narrationVoiceover: "Comment 'BOOK' below and I will send you the interactive demo link.",
        onScreenCaption: "COMMENT 'BOOK' FOR LIVE DEMO",
        visualFocus: "Apex Engineering outro card."
      }
    ]
  },

  // --- 06: INFOGRAPHIC FLYER (SPEC-05 AI Reality Check)
  {
    id: "APEX-M01-006",
    assetCode: "APEX-2026-M01-006",
    title: "AI Where It Actually Makes Sense: The Practical Matrix",
    targetDate: "2026-10-10",
    postTimeIST: "12:00 PM",
    platform: "linkedin",
    secondaryPlatforms: ["twitter"],
    format: "infographic_flyer",
    stream: "applied_ai",
    speciesCode: "SPEC-05_AI_REALITY_CHECK",
    status: "approved",
    hook: "AI is not the product. The business problem is. Here is what works vs what is pure marketing slop.",
    caption: `Every software vendor in 2026 is slapping 'AI-powered' on their pitch deck.

Most of it is pure marketing slop:
❌ Generic floating chatbots that hallucinate and annoy your visitors
❌ "AI poetry generators" for B2B industrial companies
❌ Complex multi-agent systems when a simple SQL query would do the job

Here is where AI actually makes commercial sense for real businesses:
✅ AI Lead Qualification: Instantly reading incoming project briefs and scoring budget + urgency.
✅ Document & Invoice Extraction: Reading unstructured PDFs/bills and updating your ledger in 2 seconds.
✅ Semantic Internal Search: An internal copilot that lets your staff ask questions about your company's SOPs and get exact citations.

Swipe to see the full Practical AI Matrix by Apex Engineering.

#AppliedAI #PragmaticAI #SystemsEngineering #ApexEngineering #BusinessIntelligence #NoFluff`,
    hashtags: ["AppliedAI", "PragmaticAI", "SystemsEngineering", "ApexEngineering", "BusinessIntelligence", "NoFluff"],
    callToAction: "Download high-res PDF matrix at apex-engineering.co.in/ai",
    viralityScore: 91,
    targetReach: 16500,
    estimatedImpressions: 27000,
    expectedLeads: 9,
    targetBuyerPersona: "CEOs, Directors of IT, Product Managers, Tech Founders",
    designSystemVerified: true,
    colorScheme: "carbon_orange",
    posterLayoutType: "stat_grid",
    posterVisualPrompt: "Technical 2x2 matrix poster with dark titanium grid lines: Vertical axis 'Business Value (High to Low)', Horizontal axis 'Implementation Feasibility'. Upper right quadrant highlighted in Apex Orange containing 'Lead Auto-Qualification', 'Document Processing', 'Internal SOP Search'. Lower left quadrant marked in muted grey 'Generic Chatbots', 'AI Horoscope'. Header: 'AI WHERE IT ACTUALLY MAKES SENSE' with Apex Engineering signature."
  },

  // --- 07: CAROUSEL (SPEC-04 Apex Microcommerce)
  {
    id: "APEX-M01-007",
    assetCode: "APEX-2026-M01-007",
    title: "Why Indian Home Brands Are Ditching Shopify for Apex Microcommerce",
    targetDate: "2026-10-12",
    postTimeIST: "11:30 AM",
    platform: "instagram",
    secondaryPlatforms: ["linkedin"],
    format: "carousel",
    stream: "commerce_operations",
    speciesCode: "SPEC-04_CASE_STUDY",
    status: "approved",
    hook: "Shopify was built for 10,000-SKU American retailers with $50,000 budgets. It wasn't built for a boutique bakery in Pune.",
    caption: `If you're an independent brand, boutique, home seller, or artisan in India, you've probably faced this:

1. You install Shopify.
2. Suddenly you need $40/month plugins just for WhatsApp checkout, UPI QR codes, and pincode checkers.
3. Your monthly app fees cost more than your actual hosting.
4. Half your customers abandon their carts because the checkout has 6 complicated screens.

That is exactly why we engineered Apex Microcommerce.
'YOUR BUSINESS. YOUR STORE. ONLINE.'

Affordable, narrative digital storefronts:
- Built for WhatsApp-first Indian consumers
- 1-click UPI payments (GPay, PhonePe, Paytm)
- Direct WhatsApp order confirmation
- Zero bloated app subscriptions

Swipe to see how Microcommerce compares with legacy platforms. 👉

#ApexMicrocommerce #D2CIndia #SmallBusinessIndia #ShopifyAlternative #PuneMakers #EcommerceDesign`,
    hashtags: ["ApexMicrocommerce", "D2CIndia", "SmallBusinessIndia", "ShopifyAlternative", "PuneMakers", "EcommerceDesign"],
    callToAction: "Launch your store at apex-engineering.co.in/microcommerce",
    viralityScore: 95,
    targetReach: 24000,
    estimatedImpressions: 39000,
    expectedLeads: 19,
    targetBuyerPersona: "Boutique owners, D2C founders, artisan food makers, handmade jewelry brands",
    designSystemVerified: true,
    colorScheme: "carbon_orange",
    slides: [
      {
        slideNumber: 1,
        layout: "title_hook",
        badge: "COMMERCE RE-ENGINEERED",
        headline: "YOUR BUSINESS. YOUR STORE. ONLINE.",
        subtext: "Why indie brands in India are replacing bloated enterprise software with Apex Microcommerce.",
        body: ["Swipe for the honest comparison 👉"]
      },
      {
        slideNumber: 2,
        layout: "problem_agitation",
        badge: "THE SHOPIFY TAX",
        headline: "WHY TRADITIONAL ECOMMERCE IS OVERKILL",
        body: [
          "• Monthly base fee in USD that increases when the rupee drops.",
          "• Paying ₹2,500/mo just for an Indian pincode verification app.",
          "• Complex multi-page checkout where 70% of Indian buyers abandon.",
          "• Nobody answers support tickets."
        ]
      },
      {
        slideNumber: 3,
        layout: "diagram_architecture",
        badge: "THE MICROCOMMERCE WAY",
        headline: "PURPOSE-BUILT FOR THE INDIAN BUYER",
        body: [
          "[BEAUTIFUL NARRATIVE STOREFRONT]",
          "           ↓",
          "[NATIVE 1-CLICK UPI CHECKOUT (No OTP friction)]",
          "           ↓",
          "[INSTANT ORDER DISPATCHED TO SELLER WHATSAPP]",
          "           ↓",
          "[CUSTOMER RECEIVES LIVE TRACKING LINK ON WHATSAPP]"
        ]
      },
      {
        slideNumber: 4,
        layout: "breakdown_steps",
        badge: "SPEED TO MARKET",
        headline: "LIVE IN 48 HOURS",
        body: [
          "No expensive design agency needed.",
          "We take your product photos, descriptions, and UPI details, and launch your high-converting storefront in two days."
        ]
      },
      {
        slideNumber: 5,
        layout: "cta_system",
        badge: "START SELLING",
        headline: "READY TO TAKE YOUR STORE ONLINE?",
        body: [
          "DM 'STORE' or tap the link in bio to book a live demo.",
          "apex-engineering.co.in/microcommerce"
        ]
      }
    ]
  },

  // --- 08: REEL / YOUTUBE SHORT (SPEC-02 System Blueprint)
  {
    id: "APEX-M01-008",
    assetCode: "APEX-2026-M01-008",
    title: "How to Build a WhatsApp Lead Capture Engine in 60 Seconds",
    targetDate: "2026-10-14",
    postTimeIST: "04:30 PM",
    platform: "youtube",
    secondaryPlatforms: ["instagram", "linkedin"],
    format: "reel_short",
    stream: "automation_systems",
    speciesCode: "SPEC-02_SYSTEM_BLUEPRINT",
    status: "approved",
    hook: "Watch this: A customer types 'Price for 50 units'. 4 seconds later, our system generates a quote, updates Google Sheets, and alerts sales.",
    caption: `This is what a real AI business system looks like.

No fluff. No generic ChatGPT chatbots saying "As an AI language model..."

Watch the live screen capture:
1. Customer sends an inquiry on WhatsApp.
2. Webhook fires to our lightweight backend.
3. Gemini extracts: Company Name, Quantity, Delivery Date.
4. Auto-calculates volume discount.
5. Sends customized PDF quote back into the WhatsApp chat with a 1-tap approval button.
6. Rows added to Google Sheets master dashboard.

Total elapsed time: 4.2 seconds.
Human intervention: Zero.

Want to engineer this for your sales pipeline? Comment 'FLOW' and we'll send the architecture blueprint.

#WhatsAppAutomation #GoogleSheets #GeminiAPI #ApexEngineering #SystemsArchitecture #BuildInPublic`,
    hashtags: ["WhatsAppAutomation", "GoogleSheets", "GeminiAPI", "ApexEngineering", "SystemsArchitecture", "BuildInPublic"],
    callToAction: "Comment 'FLOW' for the full architecture blueprint",
    viralityScore: 97,
    targetReach: 35000,
    estimatedImpressions: 58000,
    expectedLeads: 22,
    targetBuyerPersona: "B2B Manufacturers, Wholesale distributors, Enterprise service providers",
    designSystemVerified: true,
    colorScheme: "carbon_orange",
    audioTrackRecommendation: "High-tempo tech beat with clean hi-hats",
    videoScenes: [
      {
        sceneNumber: 1,
        timestamp: "0:00 - 0:04",
        hookText: "INQUIRY TO QUOTE IN 4 SECONDS FLAT",
        bRollPrompt: "Timer on screen counting from 0.00s to 4.20s while WhatsApp messages exchange in real-time.",
        narrationVoiceover: "Watch this: A customer asks for a bulk quotation on WhatsApp. In 4 seconds, the system answers, quotes, and files the order.",
        onScreenCaption: "4-SECOND INSTANT B2B QUOTATION",
        visualFocus: "Real-time stopwatch overlay in bright Apex Orange."
      },
      {
        sceneNumber: 2,
        timestamp: "0:04 - 0:12",
        hookText: "THE BACKEND PLUMBING REVEALED",
        bRollPrompt: "Code IDE split with live terminal and Google Sheets row populating automatically in the background.",
        narrationVoiceover: "Here is the plumbing: Webhook catches the message, Gemini extracts the specs, checks inventory rules, and drafts a custom PDF.",
        onScreenCaption: "WHATSAPP ➔ GEMINI AI ➔ GOOGLE SHEETS",
        visualFocus: "Apex Design System dark UI with monospace code highlights."
      },
      {
        sceneNumber: 3,
        timestamp: "0:12 - 0:20",
        hookText: "ZERO HUMAN COPY-PASTING",
        bRollPrompt: "Customer taps 'Approve Quote' on WhatsApp, green checkmark illuminates, sales manager gets Slack ping.",
        narrationVoiceover: "The customer approves with one tap. Zero humans had to copy-paste names, addresses, or phone numbers.",
        onScreenCaption: "ZERO MANUAL DATA ENTRY",
        visualFocus: "Interactive UI checkmark animation."
      },
      {
        sceneNumber: 4,
        timestamp: "0:20 - 0:30",
        hookText: "GET THIS ENGINE FOR YOUR TEAM",
        bRollPrompt: "Amar Pawar on screen in studio with laptop open, showing apex-engineering.co.in on monitor.",
        narrationVoiceover: "If your business does it every day, why is it still manual? Comment 'FLOW' and I will send you the blueprint.",
        onScreenCaption: "COMMENT 'FLOW' FOR BLUEPRINT",
        visualFocus: "Apex Engineering outro signature."
      }
    ]
  },

  // --- 09: STATIC POSTER (SPEC-03 Founder Perspective)
  {
    id: "APEX-M01-009",
    assetCode: "APEX-2026-M01-009",
    title: "18+ Years of UX: The 6 Questions We Ask Before Writing a Line of Code",
    targetDate: "2026-10-16",
    postTimeIST: "10:30 AM",
    platform: "linkedin",
    secondaryPlatforms: ["twitter"],
    format: "static_poster",
    stream: "founder_philosophy",
    speciesCode: "SPEC-03_FOUNDER_PERSPECTIVE",
    status: "approved",
    hook: "Most software projects fail before the first line of code is written because they start with tools instead of humans.",
    caption: `Over 18 years in digital product design, I have watched companies burn millions on software nobody uses.

They start with:
"Should we use React or Flutter?"
"Should we use Gemini or Claude?"
"Can we add a 3D spline animation to the hero section?"

None of these questions matter.

Here are the 6 questions we ask at Apex Engineering before opening Figma or a terminal:
1. What is the actual commercial friction?
2. What are people doing manually right now when this happens?
3. Where does the data live today (and why is it a mess)?
4. What is the single action we want the user to take in the first 5 seconds?
5. How does this system tie directly to cash flow or time saved?
6. If the internet drops for 10 minutes, does the operation collapse?

Engineering is not about making things complicated. It is about making complex things feel invisible.

— Amar Pawar, Founder, Apex Engineering

#UXDesign #SoftwareEngineering #SystemsThinking #AmarPawar #ApexEngineering #ProductStrategy`,
    hashtags: ["UXDesign", "SoftwareEngineering", "SystemsThinking", "AmarPawar", "ApexEngineering", "ProductStrategy"],
    callToAction: "Follow Amar Pawar on LinkedIn or visit apex-engineering.co.in",
    viralityScore: 89,
    targetReach: 12000,
    estimatedImpressions: 19500,
    expectedLeads: 6,
    targetBuyerPersona: "Startup Founders, Product Heads, Enterprise Innovators",
    designSystemVerified: true,
    colorScheme: "mono_dark",
    posterLayoutType: "founder_quote",
    posterVisualPrompt: "Editorial Swiss-style poster, deep slate black background, bold sans headline: 'THE 6 QUESTIONS WE ASK BEFORE WRITING A LINE OF CODE'. Numbered list 01 to 06 with stark white text and orange highlight numerals. Founder signature 'AMAR PAWAR // 18+ YEARS UX & DIGITAL SYSTEMS', minimal geometric frame with 48px padding."
  },

  // --- 10: CAROUSEL (SPEC-04 Client Case Study - Flightpath Aviation)
  {
    id: "APEX-M01-010",
    assetCode: "APEX-2026-M01-010",
    title: "Case Study: Flightpath Aviation — Translating Sky Expertise into Digital Authority",
    targetDate: "2026-10-18",
    postTimeIST: "11:30 AM",
    platform: "linkedin",
    secondaryPlatforms: ["instagram"],
    format: "carousel",
    stream: "digital_experiences",
    speciesCode: "SPEC-04_CASE_STUDY",
    status: "approved",
    hook: "When your clients are airline executives and fleet owners, your website cannot look like a generic template.",
    caption: `Flightpath Aviation Consultants brings thousands of hours in the sky into high-stakes global aviation consulting.

Their challenge:
How do you build a digital presence that instantly communicates:
- Extreme precision and flight safety standards
- Multi-decade aircraft fleet lifecycle experience
- Unshakable credibility for international enterprise contracts

The Apex Engineering Solution:
1. Architectural Elegance: Clean aerodynamic visual geometry, high-contrast cockpit photography, and deep nautical blues.
2. Authority Narrative: Structuring complex aviation consulting tracks into clear executive briefs.
3. High-Security Inquiry Gateways: Direct, encrypted advisory intake pipeline for fleet acquisitions and regulatory audits.

The result: An authoritative digital footprint that commands enterprise trust across Europe, the Middle East, and Asia.

Swipe through for the design system breakdown. 👉

#FlightpathAviation #AviationConsulting #B2BWebDesign #EnterpriseUX #ApexEngineering #PuneDesignStudio`,
    hashtags: ["FlightpathAviation", "AviationConsulting", "B2BWebDesign", "EnterpriseUX", "ApexEngineering", "PuneDesignStudio"],
    callToAction: "Read the full case study at apex-engineering.co.in/work",
    viralityScore: 87,
    targetReach: 11000,
    estimatedImpressions: 18000,
    expectedLeads: 4,
    targetBuyerPersona: "C-Suite Executives, Aviation Leaders, Elite B2B Consultants",
    designSystemVerified: true,
    colorScheme: "slate_electric",
    slides: [
      {
        slideNumber: 1,
        layout: "title_hook",
        badge: "CASE STUDY // ENTERPRISE AUTHORITY",
        headline: "TRANSFORMING SKY EXPERTISE INTO BUSINESS TRUST",
        subtext: "How Apex Engineering built the digital authority platform for Flightpath Aviation Consultants.",
        body: ["Swipe for the project review 👉"]
      },
      {
        slideNumber: 2,
        layout: "problem_agitation",
        badge: "THE STAKES",
        headline: "HIGH-STAKES CONSULTING DEMANDS HIGH-STAKES UX",
        body: [
          "• Fleet acquisitions and safety audits involve multi-million dollar decisions.",
          "• A weak or generic web presence immediately kills institutional credibility.",
          "• Consulting frameworks needed to be explained without overwhelming technical jargon."
        ]
      },
      {
        slideNumber: 3,
        layout: "diagram_architecture",
        badge: "THE APEX METHOD",
        headline: "AERODYNAMIC PRECISION IN EVERY PIXEL",
        body: [
          "[AEROSPACE MONOCHROME PALETTE: Titanium & Midnight Blue]",
          "[STRUCTURED ADVISORY TIERS: Commercial, Defense, Regulatory]",
          "[EXECUTIVE INTAKE PIPELINE: Direct connection to principal consultants]"
        ]
      },
      {
        slideNumber: 4,
        layout: "proof_quote",
        badge: "CLIENT TESTIMONIAL",
        headline: "'OUR DIGITAL PLATFORM NOW MATCHES OUR FLIGHT DECK STANDARDS.'",
        body: [
          "Delivering precision, safety, and authority to airline operators worldwide."
        ]
      },
      {
        slideNumber: 5,
        layout: "cta_system",
        badge: "AUTHORITY BY DESIGN",
        headline: "IS YOUR DIGITAL PRESENCE HOLDING BACK YOUR B2B DEALS?",
        body: [
          "Let's engineer an authority web platform for your consulting firm.",
          "Visit apex-engineering.co.in"
        ]
      }
    ]
  },

  // --- 11: REEL / YOUTUBE SHORT (SPEC-05 AI Reality Check)
  {
    id: "APEX-M01-011",
    assetCode: "APEX-2026-M01-011",
    title: "Why Generic AI Chatbots Are Killing Your Conversion Rate",
    targetDate: "2026-10-20",
    postTimeIST: "05:00 PM",
    platform: "instagram",
    secondaryPlatforms: ["youtube"],
    format: "reel_short",
    stream: "applied_ai",
    speciesCode: "SPEC-05_AI_REALITY_CHECK",
    status: "approved",
    hook: "Stop putting those annoying little AI chat bubbles on the bottom corner of your website. They are repelling your highest-paying clients.",
    caption: `Here is what happens when a serious business buyer lands on a website with a generic AI chatbot:

Buyer: "Do you offer custom API integrations for our CRM?"
Bot: "Hello! As an AI assistant, I love technology! Let me check with our team..."
Buyer closes tab immediately.

Generic chatbots fail because they treat conversation as a toy instead of a structured conversion funnel.

What works instead?
1. Guided Intent Routing: 3 simple buttons: "Pricing", "Book Consultation", "Technical Specs".
2. Instant Verified Answers: Pulled strictly from your company's actual database (zero hallucinations).
3. Human Hand-off in 1 Tap: Seamlessly transfers to a real team member on WhatsApp when high buyer intent is detected.

AI is not the product. The business problem is.

Follow @apex_engineering for no-slop AI engineering.

#AIFails #ChatbotTruth #ConversionRate #UXDesign #ApexEngineering #PuneTech #WebDevelopment`,
    hashtags: ["AIFails", "ChatbotTruth", "ConversionRate", "UXDesign", "ApexEngineering", "PuneTech", "WebDevelopment"],
    callToAction: "Follow for pragmatic AI systems",
    viralityScore: 93,
    targetReach: 29000,
    estimatedImpressions: 48000,
    expectedLeads: 12,
    targetBuyerPersona: "E-commerce managers, B2B marketing leads, business owners",
    designSystemVerified: true,
    colorScheme: "carbon_orange",
    audioTrackRecommendation: "Moody bass-heavy trap beat with subtle vinyl crackle",
    videoScenes: [
      {
        sceneNumber: 1,
        timestamp: "0:00 - 0:04",
        hookText: "KILL THE CHATBOT ON YOUR HOMEPAGE",
        bRollPrompt: "Screen recording of clicking a chat bubble, receiving a generic useless response, and violently closing the browser window.",
        narrationVoiceover: "Stop putting generic AI chatbots on your website. They are actively killing your conversion rate.",
        onScreenCaption: "STOP KILLING YOUR CONVERSIONS",
        visualFocus: "Red 'X' stamped over generic chatbot bubble icon."
      },
      {
        sceneNumber: 2,
        timestamp: "0:04 - 0:11",
        hookText: "THE 3 MISTAKES BOTS MAKE",
        bRollPrompt: "Typing fast into phone while walking in office: 'Hallucinating pricing, annoying buyers, zero lead tracking.'",
        narrationVoiceover: "They hallucinate answers, they sound like a robot, and worst of all, they let serious buyers slip away without capturing their contact.",
        onScreenCaption: "HALLUCINATIONS + LOST LEADS",
        visualFocus: "High-contrast text cards in Apex Design System typography."
      },
      {
        sceneNumber: 3,
        timestamp: "0:11 - 0:20",
        hookText: "THE APEX GUIDED ASSISTANT",
        bRollPrompt: "Clean, frictionless Apex guided intake modal: 3 interactive chips, verified answers, instant WhatsApp handover.",
        narrationVoiceover: "What works is a guided intent flow. It answers from your real catalog and hands warm leads to WhatsApp in 1 tap.",
        onScreenCaption: "GUIDED INTENT + VERIFIED REPO",
        visualFocus: "Apex Orange interactive buttons on stark white background."
      },
      {
        sceneNumber: 4,
        timestamp: "0:20 - 0:30",
        hookText: "AI WHERE IT ACTUALLY MAKES SENSE",
        bRollPrompt: "Amar Pawar smiling, pointing to screen showing the 6-step method.",
        narrationVoiceover: "Remember: AI is not the product. The business problem is. Build systems that sell. Visit apex-engineering.co.in.",
        onScreenCaption: "AI IS NOT THE PRODUCT. THE BUSINESS PROBLEM IS.",
        visualFocus: "Apex Engineering official outro bumper."
      }
    ]
  },

  // --- 12: STATIC POSTER (SPEC-02 System Blueprint)
  {
    id: "APEX-M01-012",
    assetCode: "APEX-2026-M01-012",
    title: "The Anatomy of a Modern B2B Web Engine (Beyond Pretty Pictures)",
    targetDate: "2026-10-22",
    postTimeIST: "10:00 AM",
    platform: "linkedin",
    secondaryPlatforms: ["twitter"],
    format: "static_poster",
    stream: "digital_experiences",
    speciesCode: "SPEC-02_SYSTEM_BLUEPRINT",
    status: "approved",
    hook: "A website is not an art gallery. It is an automated sales engine disguised as an interface.",
    caption: `If someone visits your website and doesn't know within 5 seconds:
1. What you solve
2. Who you solve it for
3. What they should do next

...you don't have a website. You have an expensive digital paperweight.

Here is the exact architectural wireframe we use for high-converting B2B web engines at Apex Engineering:
- Hero: Crisp problem-first headline (not vague slogans)
- Proof Bar: Real client metrics (not generic 5-star badges)
- Problem Audit: "What's not working?" self-selection chips
- The System Blueprint: Visual diagram of your proprietary process
- Frictionless Action: Direct WhatsApp / Calendar booking link with 0 required fields

Swipe or save this diagram for your next redesign.

#B2BMarketing #WebArchitecture #ApexEngineering #SystemsThinking #UIDesign #ConversionRateOptimization`,
    hashtags: ["B2BMarketing", "WebArchitecture", "ApexEngineering", "SystemsThinking", "UIDesign", "ConversionRateOptimization"],
    callToAction: "Save this blueprint for your next web redesign",
    viralityScore: 90,
    targetReach: 13500,
    estimatedImpressions: 21000,
    expectedLeads: 7,
    targetBuyerPersona: "Tech Founders, CMOs, Agency Partners",
    designSystemVerified: true,
    colorScheme: "clean_white",
    posterLayoutType: "architecture_diagram",
    posterVisualPrompt: "Clean wireframe blueprint schematic of a high-converting web landing page: Header, Hero Value Prop with Apex Orange button, 'What's Not Working?' 6-tile problem grid, System Flowchart, and Founder Trust Card. Technical architectural callout lines, 1080x1350 portrait ratio, Apex Engineering logo at base."
  },

  // --- 13: CAROUSEL (SPEC-04 Client Case Study - Trikaya Leadership)
  {
    id: "APEX-M01-013",
    assetCode: "APEX-2026-M01-013",
    title: "Case Study: Trikaya Leadership — 'The Three Dimensions of Leadership'",
    targetDate: "2026-10-24",
    postTimeIST: "11:30 AM",
    platform: "linkedin",
    secondaryPlatforms: ["instagram"],
    format: "carousel",
    stream: "digital_experiences",
    speciesCode: "SPEC-04_CASE_STUDY",
    status: "approved",
    hook: "'Mind drives performance, Heart builds trust, Soul ensures direction.' Designing for transformative executive leadership.",
    caption: `Executive coaching and organizational transformation cannot be sold through shouting sales pages or discount countdown timers.

For Trikaya Leadership, the digital experience had to reflect deep philosophical grounding combined with enterprise rigour:

"The Three Dimensions of Leadership"
- Mind drives performance
- Heart builds trust
- Soul ensures direction

Apex Engineering crafted a bespoke narrative platform where every scroll feels deliberate, contemplative, and authoritative.

Key architectural touches:
- Generous editorial typography with expansive negative space
- Fluid, silent page transitions that invite thoughtful reading
- Bespoke executive application pathway rather than a cold 'Contact Us' form

The result: An elevated brand home that attracts top-tier corporate leaders and board directors.

Explore the case study in the carousel. 👉

#LeadershipTransformation #ExecutiveCoaching #ApexEngineering #EditorialDesign #UXForFounders #BrandExperience`,
    hashtags: ["LeadershipTransformation", "ExecutiveCoaching", "ApexEngineering", "EditorialDesign", "UXForFounders", "BrandExperience"],
    callToAction: "Explore the live experience at apex-engineering.co.in/work",
    viralityScore: 86,
    targetReach: 9800,
    estimatedImpressions: 15500,
    expectedLeads: 4,
    targetBuyerPersona: "Executive Coaches, Management Consultants, Organizational Leaders",
    designSystemVerified: true,
    colorScheme: "mono_dark",
    slides: [
      {
        slideNumber: 1,
        layout: "title_hook",
        badge: "CASE STUDY // BRAND EXPERIENCE",
        headline: "TRIKAYA LEADERSHIP",
        subtext: "Designing an elevated narrative digital platform for premier executive transformation.",
        body: ["'The Three Dimensions of Leadership'"]
      },
      {
        slideNumber: 2,
        layout: "problem_agitation",
        badge: "THE PHILOSOPHY",
        headline: "MIND. HEART. SOUL.",
        body: [
          "• Mind drives performance: Clear strategy, cognitive agility, decisiveness.",
          "• Heart builds trust: Empathy, psychological safety, authentic alignment.",
          "• Soul ensures direction: Purpose, enduring principles, legacy."
        ]
      },
      {
        slideNumber: 3,
        layout: "diagram_architecture",
        badge: "THE DESIGN PHILOSOPHY",
        headline: "CALM, EDITORIAL DIGNITY",
        body: [
          "[SPACIOUS MONOCHROME COMPOSITIONS: Zero visual clutter]",
          "[CURATED TYPOGRAPHIC RHYTHM: Serif elegance paired with modern sans]",
          "[HIGH-TOUCH INTAKE: Confidential application for board advisory]"
        ]
      },
      {
        slideNumber: 4,
        layout: "cta_system",
        badge: "EXPERIENCE ENGINEERED",
        headline: "DOES YOUR BRAND COMMAND EXECUTIVE GRAVITAS?",
        body: [
          "We engineer digital authority for world-class thinkers and advisors.",
          "Visit apex-engineering.co.in"
        ]
      }
    ]
  },

  // --- 14: REEL / YOUTUBE SHORT (SPEC-01 Problem-First)
  {
    id: "APEX-M01-014",
    assetCode: "APEX-2026-M01-014",
    title: "Orders Scattered Across WhatsApp and Spreadsheets? Watch This.",
    targetDate: "2026-10-26",
    postTimeIST: "04:45 PM",
    platform: "instagram",
    secondaryPlatforms: ["youtube"],
    format: "reel_short",
    stream: "commerce_operations",
    speciesCode: "SPEC-01_PROBLEM_FIRST",
    status: "approved",
    hook: "If your staff spends 3 hours every morning copying customer orders from WhatsApp chats into Excel, stop everything and watch this.",
    caption: `The biggest operational bottleneck for Indian growing businesses isn't lead generation. It's the spreadsheet trap.

You sell a product on Instagram.
The customer messages you on WhatsApp.
Your team manually writes the address into a Google Sheet.
Someone forgets to log an order.
The wrong parcel gets dispatched.
Customer is furious.

Here is how Apex Microcommerce replaces all that manual pain:
1. Customer buys through your lightning-fast web storefront.
2. Order details automatically sync into your Google Sheets inventory database in real time.
3. Shipping label auto-generated.
4. Customer receives tracking link on WhatsApp.

Zero copy-pasting. Zero lost orders.

Comment 'SYNC' to see the Google Sheets connection script.

#SpreadsheetHell #WhatsAppCommerce #ApexEngineering #Automation #D2CIndia #PuneBusiness`,
    hashtags: ["SpreadsheetHell", "WhatsAppCommerce", "ApexEngineering", "Automation", "D2CIndia", "PuneBusiness"],
    callToAction: "Comment 'SYNC' for the automated spreadsheet script",
    viralityScore: 96,
    targetReach: 33000,
    estimatedImpressions: 52000,
    expectedLeads: 18,
    targetBuyerPersona: "D2C Founders, E-commerce Operations, Small Factory Owners",
    designSystemVerified: true,
    colorScheme: "carbon_orange",
    audioTrackRecommendation: "Crisp lo-fi synth groove with subtle riser",
    videoScenes: [
      {
        sceneNumber: 1,
        timestamp: "0:00 - 0:04",
        hookText: "THE SPREADSHEET DISASTER",
        bRollPrompt: "Hands frantically scrolling a messy Excel spreadsheet with yellow highlighted rows and mismatched customer phone numbers.",
        narrationVoiceover: "If your team is still copying customer orders from WhatsApp into Excel sheets by hand, stop immediately.",
        onScreenCaption: "THE SPREADSHEET DISASTER",
        visualFocus: "Chaotic yellow highlight markers on spreadsheet cells."
      },
      {
        sceneNumber: 2,
        timestamp: "0:04 - 0:11",
        hookText: "WHAT HAPPENS WHEN ORDERS GET LOST",
        bRollPrompt: "Split screen showing wrong shipping box being labeled while angry customer WhatsApp messages flash on screen.",
        narrationVoiceover: "One missed copy-paste means a lost order, an angry customer, and wasted shipping fees.",
        onScreenCaption: "1 MISSED ROW = LOST CUSTOMER",
        visualFocus: "Red warning pulse animation."
      },
      {
        sceneNumber: 3,
        timestamp: "0:11 - 0:20",
        hookText: "THE AUTO-SYNC ENGINE",
        bRollPrompt: "Customer taps 'Pay ₹1,499 with UPI' on mobile. Instantly, the Google Sheet row turns green and fills in: Name, SKU, Address, Transaction ID.",
        narrationVoiceover: "With Apex Microcommerce, checkout triggers instant real-time sync into Google Sheets with zero human touch.",
        onScreenCaption: "INSTANT AUTO-SYNC TO DATABASE",
        visualFocus: "Apex Orange confirmation badge."
      },
      {
        sceneNumber: 4,
        timestamp: "0:20 - 0:30",
        hookText: "GET CONNECTED TODAY",
        bRollPrompt: "Amar Pawar on screen holding coffee mug in modern studio setting.",
        narrationVoiceover: "If your business does it every day, why is it still manual? Comment 'SYNC' and let's automate your pipeline.",
        onScreenCaption: "COMMENT 'SYNC' TO AUTOMATE",
        visualFocus: "Apex Engineering outro card."
      }
    ]
  },

  // --- 15: STATIC POSTER (SPEC-03 Founder Thought Leadership)
  {
    id: "APEX-M01-015",
    assetCode: "APEX-2026-M01-015",
    title: "Why Most Tech Consultations Waste Your Time (The 6-Step Method)",
    targetDate: "2026-10-28",
    postTimeIST: "10:30 AM",
    platform: "linkedin",
    secondaryPlatforms: ["twitter"],
    format: "static_poster",
    stream: "founder_philosophy",
    speciesCode: "SPEC-03_FOUNDER_PERSPECTIVE",
    status: "approved",
    hook: "We don't start with technology. We start with what isn't working.",
    caption: `Have you ever sat through a tech consultation where the agency spent 45 minutes throwing jargon at you?
"We will use Next.js 15 with Dockerized microservices and Kubernetes pods..."

You walked away thinking:
"Okay, but does this actually get me more customers?"

At Apex Engineering, our method is ruthlessly grounded:
01 UNDERSTAND — What is the actual business bottleneck?
02 DESIGN — How do people behave when using it?
03 ENGINEER — Build the digital product with solid architecture.
04 CONNECT — Hook up existing data, tools, and platforms.
05 AUTOMATE — Turn repetitive manual steps into autonomous rules.
06 IMPROVE — Measure, learn, and iterate.

Simple. Disciplined. Commercial.

#BusinessBeforeTechnology #ApexEngineering #SoftwareEngineering #AmarPawar #PragmaticTech #Pune`,
    hashtags: ["BusinessBeforeTechnology", "ApexEngineering", "SoftwareEngineering", "AmarPawar", "PragmaticTech", "Pune"],
    callToAction: "Start a conversation at apex-engineering.co.in",
    viralityScore: 91,
    targetReach: 14000,
    estimatedImpressions: 22000,
    expectedLeads: 6,
    targetBuyerPersona: "Non-technical founders, business owners, operational directors",
    designSystemVerified: true,
    colorScheme: "clean_white",
    posterLayoutType: "stat_grid",
    posterVisualPrompt: "Clean 6-card grid poster: 'WE DON'T START WITH TECHNOLOGY.' Cards 01 UNDERSTAND, 02 DESIGN, 03 ENGINEER, 04 CONNECT, 05 AUTOMATE, 06 IMPROVE. High contrast black & titanium styling with vivid Apex Orange border accents, minimal typography."
  },

  // --- 16: CAROUSEL (SPEC-01 Problem-First)
  {
    id: "APEX-M01-016",
    assetCode: "APEX-2026-M01-016",
    title: "5 Signs Your Website Is Just an Expensive Business Card",
    targetDate: "2026-10-29",
    postTimeIST: "11:30 AM",
    platform: "instagram",
    secondaryPlatforms: ["linkedin"],
    format: "carousel",
    stream: "digital_experiences",
    speciesCode: "SPEC-01_PROBLEM_FIRST",
    status: "approved",
    hook: "You paid ₹1,50,000 for a website last year. When was the last time it generated a qualified lead while you were asleep?",
    caption: `Be honest with yourself:
Does your website actually work for you, or is it just sitting there collecting digital dust?

Here are the 5 signs your website is just an expensive digital business card:
1. Your contact form asks for 9 fields and emails an info@ inbox that nobody monitors.
2. It takes 7 seconds to load on mobile over mobile data.
3. Your headline is a vague slogan ("Empowering synergy through innovation").
4. Customers still have to call or message you to find out what you actually charge.
5. You have zero automated follow-ups when someone drops their email.

At Apex Engineering, we create websites that do more than look good.
We build connected systems that capture, qualify, and convert.

Swipe through for the 5-point audit. 👉

#WebDesignMistakes #ApexEngineering #UXAudit #ConversionRate #BusinessGrowth #PuneFounders`,
    hashtags: ["WebDesignMistakes", "ApexEngineering", "UXAudit", "ConversionRate", "BusinessGrowth", "PuneFounders"],
    callToAction: "Request a free 5-minute site audit at apex-engineering.co.in",
    viralityScore: 93,
    targetReach: 21000,
    estimatedImpressions: 34000,
    expectedLeads: 11,
    targetBuyerPersona: "SME owners, professional service firms, boutique founders",
    designSystemVerified: true,
    colorScheme: "carbon_orange",
    slides: [
      {
        slideNumber: 1,
        layout: "title_hook",
        badge: "WEBSITE AUDIT // 2026",
        headline: "5 SIGNS YOUR SITE IS AN EXPENSIVE BUSINESS CARD.",
        subtext: "Are you driving traffic to a dead end? Swipe to test your website.",
        body: ["Swipe for the 5 tests 👉"]
      },
      {
        slideNumber: 2,
        layout: "breakdown_steps",
        badge: "TEST 01 & 02",
        headline: "THE FIRST 5 SECONDS",
        body: [
          "• Sign 01: Vague corporate poetry instead of clear problem solving.",
          "• Sign 02: Mobile loading takes >3 seconds (over 53% of users bounce)."
        ]
      },
      {
        slideNumber: 3,
        layout: "breakdown_steps",
        badge: "TEST 03 & 04",
        headline: "THE FRICTION CHECK",
        body: [
          "• Sign 03: 8-field contact forms that ask for company fax numbers.",
          "• Sign 04: No instant way to WhatsApp or book an appointment."
        ]
      },
      {
        slideNumber: 4,
        layout: "breakdown_steps",
        badge: "TEST 05",
        headline: "THE SYSTEM CHECK",
        body: [
          "• Sign 05: Inquiries vanish into an unmonitored email account with zero auto-confirmation.",
          "• A real website should qualify leads and sync directly with your sales pipeline."
        ]
      },
      {
        slideNumber: 5,
        layout: "cta_system",
        badge: "THE APEX FIX",
        headline: "WE CREATE WEBSITES THAT DO MORE THAN LOOK GOOD.",
        body: [
          "Drop your website URL in the comments.",
          "Amar Pawar will record a personalized 3-minute UX & systems teardown for the top 5 submissions."
        ]
      }
    ]
  },

  // --- 17: REEL / YOUTUBE SHORT (SPEC-03 Founder Perspective)
  {
    id: "APEX-M01-017",
    assetCode: "APEX-2026-M01-017",
    title: "The Zero-Pill Button Philosophy: Why Brutalist UX Works",
    targetDate: "2026-10-30",
    postTimeIST: "05:00 PM",
    platform: "instagram",
    secondaryPlatforms: ["youtube"],
    format: "reel_short",
    stream: "founder_philosophy",
    speciesCode: "SPEC-03_FOUNDER_PERSPECTIVE",
    status: "approved",
    hook: "Why did every modern tech website start looking like a colorful candy shop with rounded pill buttons?",
    caption: `If you look at 90% of SaaS websites built in the last 3 years:
- Neon purple gradients
- Giant rounded pill buttons
- Cartoon 3D floating characters
- Fluffy marketing jargon

It all looks like a candy shop. And it signals zero engineering discipline.

At Apex Engineering, our design philosophy is built on precision:
- Sharp geometric borders (0px or 4px radius)
- High-contrast monochromatic hierarchy with intentional orange accents
- Monospace readouts for technical credibility
- Real screen captures of working software instead of generic mockups

When you look like an engineer, clients treat you like an engineering partner, not a replaceable freelancer.

Agree or disagree? Drop your thoughts in the comments.

#DesignPhilosophy #BrutalistWeb #UXDesign #ApexEngineering #AmarPawar #DesignSystems`,
    hashtags: ["DesignPhilosophy", "BrutalistWeb", "UXDesign", "ApexEngineering", "AmarPawar", "DesignSystems"],
    callToAction: "Read our design manifesto at apex-engineering.co.in",
    viralityScore: 94,
    targetReach: 26000,
    estimatedImpressions: 43000,
    expectedLeads: 10,
    targetBuyerPersona: "Product designers, startup founders, creative directors",
    designSystemVerified: true,
    colorScheme: "mono_dark",
    audioTrackRecommendation: "Deep minimal techno pulse with sub-bass kick",
    videoScenes: [
      {
        sceneNumber: 1,
        timestamp: "0:00 - 0:04",
        hookText: "WHY DOES EVERY WEBSITE LOOK LIKE A CANDY SHOP?",
        bRollPrompt: "Fast montage of generic purple AI website templates scrolling by with bubbly pill buttons and cartoon floating 3D hands.",
        narrationVoiceover: "Why does every modern tech website look like a candy shop with giant rounded pill buttons and cartoon characters?",
        onScreenCaption: "THE SAAS CLONE EPIDEMIC",
        visualFocus: "Split screen of neon purple generic templates vs stark Apex Engineering editorial layout."
      },
      {
        sceneNumber: 2,
        timestamp: "0:04 - 0:12",
        hookText: "SERIOUS BUSINESSES DEMAND CREDIBILITY",
        bRollPrompt: "Amar Pawar sketching precision UI grid on dot-pad with mechanical pencil, showing crisp 90-degree corners.",
        narrationVoiceover: "Serious B2B buyers don't want cartoon playfulness. They want precision, speed, and engineering discipline.",
        onScreenCaption: "PRECISION OVER PLAYFULNESS",
        visualFocus: "Macro shot of sharp 1px borders and monospace typography."
      },
      {
        sceneNumber: 3,
        timestamp: "0:12 - 0:22",
        hookText: "THE APEX SOCIAL DESIGN SYSTEM",
        bRollPrompt: "Scrolling through the live Apex Social Design System: Typography, Void Black, Stark Titanium, High-Vis Orange.",
        narrationVoiceover: "That is why our social design system uses sharp geometric edges, intense contrast, and brutalist clarity.",
        onScreenCaption: "THE APEX DESIGN SYSTEM",
        visualFocus: "High-contrast Orange and Carbon UI tokens."
      },
      {
        sceneNumber: 4,
        timestamp: "0:22 - 0:30",
        hookText: "BUILD FOR AUTHORITY",
        bRollPrompt: "Amar Pawar looking at camera with Apex monogram overlay.",
        narrationVoiceover: "Stop blending in with the clones. Build systems with character. Follow Apex Engineering.",
        onScreenCaption: "BUILD SYSTEMS WITH CHARACTER.",
        visualFocus: "Apex Engineering outro signature."
      }
    ]
  },

  // --- 18: INFOGRAPHIC FLYER (SPEC-02 System Blueprint)
  {
    id: "APEX-M01-018",
    assetCode: "APEX-2026-M01-018",
    title: "The Lead-to-Cash Automation Flowchart (Copy Our System)",
    targetDate: "2026-10-31",
    postTimeIST: "10:30 AM",
    platform: "linkedin",
    secondaryPlatforms: ["twitter"],
    format: "infographic_flyer",
    stream: "automation_systems",
    speciesCode: "SPEC-02_SYSTEM_BLUEPRINT",
    status: "approved",
    hook: "The exact 7-step autonomous pipeline we build for businesses doing ₹1Cr+ in annual revenue.",
    caption: `Most founders think automation means buying 15 expensive Zapier subscriptions that break every Thursday.

Real automation is simple, robust, and cost-effective:
Step 1: Lead fills 2-question form or sends WhatsApp ping.
Step 2: Webhook logs row in Google Sheets master database.
Step 3: Lightweight AI model qualifies intent (Buyer vs Job seeker vs Spam).
Step 4: If qualified, automated WhatsApp message sends tailored portfolio & calendar.
Step 5: Client books slot; automated calendar blocks time & sends SMS reminder.
Step 6: Post-call proposal generated from templated markdown with 1 click.
Step 7: Payment collected via UPI/Stripe; invoice auto-emailed.

Total monthly software cost: ₹0 to ₹1,500.
Hours saved: 25+ hours every single week.

Save this flowchart for your team.

#AutomationFlowchart #GoogleSheets #B2BLeadGen #ApexEngineering #BusinessPlumbing #Pune`,
    hashtags: ["AutomationFlowchart", "GoogleSheets", "B2BLeadGen", "ApexEngineering", "BusinessPlumbing", "Pune"],
    callToAction: "Save this flowchart or visit apex-engineering.co.in",
    viralityScore: 92,
    targetReach: 17000,
    estimatedImpressions: 26000,
    expectedLeads: 10,
    targetBuyerPersona: "Founders, Operations Directors, Managing Directors",
    designSystemVerified: true,
    colorScheme: "clean_white",
    posterLayoutType: "architecture_diagram",
    posterVisualPrompt: "Clean horizontal engineering flowchart: 7 sequential stages from 'LEAD ARRIVAL' to 'CASH IN BANK'. Crisp arrows, monochrome layout with bright Apex Orange triggers, clean monospace metric labels at each node."
  },

  // --- 19: FOUNDER CARD (SPEC-03 Founder Perspective)
  {
    id: "APEX-M01-019",
    assetCode: "APEX-2026-M01-019",
    title: "Expert ID Card: Amar Pawar on 18 Years in UX & Systems",
    targetDate: "2026-11-01",
    postTimeIST: "12:00 PM",
    platform: "linkedin",
    secondaryPlatforms: ["instagram", "twitter"],
    format: "founder_card",
    stream: "founder_philosophy",
    speciesCode: "SPEC-03_FOUNDER_PERSPECTIVE",
    status: "approved",
    hook: "Built by a designer who started with a simple question: 'Why are businesses still doing so much manually?'",
    caption: `"I've spent most of my career designing digital experiences.
Over time, I realised something:
Businesses rarely need another screen.
They need better systems behind those screens.

That's why I started Apex Engineering.
We combine UX, engineering, AI, and automation to solve the actual problem — not simply deliver another website."

— Amar Pawar, Founder, Apex Engineering (Pune, India • Working Globally)

If you're tired of disjointed tools and want a connected system that actually runs your operations, let's talk.

#AmarPawar #ApexEngineering #FounderStory #UXLeadership #PuneDesign #SystemsEngineering`,
    hashtags: ["AmarPawar", "ApexEngineering", "FounderStory", "UXLeadership", "PuneDesign", "SystemsEngineering"],
    callToAction: "Connect with Amar Pawar at apex-engineering.co.in",
    viralityScore: 90,
    targetReach: 15000,
    estimatedImpressions: 23500,
    expectedLeads: 8,
    targetBuyerPersona: "Enterprise leaders, startup founders, creative collaborators",
    designSystemVerified: true,
    colorScheme: "carbon_orange",
    posterLayoutType: "founder_quote",
    posterVisualPrompt: "Editorial passport ID card layout: Authentic portrait photo of Amar Pawar with warm lighting, verified badge 'FOUNDER & PRINCIPAL SYSTEMS DESIGNER', '18+ YEARS UX & DIGITAL SYSTEMS', quote in large editorial typography, base footer 'APEX ENGINEERING // PUNE, INDIA • WORKING GLOBALLY'."
  },

  // --- 20: CAROUSEL (SPEC-01 & SPEC-02 Master Summary)
  {
    id: "APEX-M01-020",
    assetCode: "APEX-2026-M01-020",
    title: "The Complete Business Systems Audit: What's Broken in Your Company?",
    targetDate: "2026-11-02",
    postTimeIST: "11:30 AM",
    platform: "instagram",
    secondaryPlatforms: ["linkedin"],
    format: "carousel",
    stream: "automation_systems",
    speciesCode: "SPEC-01_PROBLEM_FIRST",
    status: "approved",
    hook: "Which of these 6 problems is quietly draining your time and profit every week?",
    caption: `You don't need to know what technology you need.
Just tell us what isn't working.

Here are the 6 most common bottlenecks we engineer away:
1. "Customers keep messaging us on WhatsApp" ➔ Automated intake + qualification
2. "We're still taking bookings manually" ➔ Automated calendar + instant deposits
3. "Orders are scattered across WhatsApp and spreadsheets" ➔ Apex Microcommerce unified storefront
4. "We spend hours following up with leads" ➔ Automated drip sequences & intent scoring
5. "Our website isn't helping the business" ➔ Conversion-focused UX redesign
6. "We want AI but don't know where it fits" ➔ Pragmatic AI audit

Swipe to find your bottleneck and see the exact architectural solution. 👉

#BusinessAudit #ApexEngineering #Automation #DigitalTransformation #PuneStartups #UXDesign`,
    hashtags: ["BusinessAudit", "ApexEngineering", "Automation", "DigitalTransformation", "PuneStartups", "UXDesign"],
    callToAction: "Book a systems audit at apex-engineering.co.in",
    viralityScore: 95,
    targetReach: 27000,
    estimatedImpressions: 44000,
    expectedLeads: 15,
    targetBuyerPersona: "Business owners, directors, department heads",
    designSystemVerified: true,
    colorScheme: "carbon_orange",
    slides: [
      {
        slideNumber: 1,
        layout: "title_hook",
        badge: "WHAT'S NOT WORKING? // AUDIT",
        headline: "YOU BRING THE BUSINESS PROBLEM.",
        subtext: "We engineer the system. Swipe to identify your company's #1 bottleneck.",
        body: ["Swipe to begin audit 👉"]
      },
      {
        slideNumber: 2,
        layout: "problem_agitation",
        badge: "PROBLEMS 01 & 02",
        headline: "COMMUNICATION & BOOKING BOTTLENECK",
        body: [
          "• Problem 01: Endless WhatsApp messages answering the same 5 questions.",
          "• Problem 02: Taking bookings manually and suffering 35% no-shows."
        ]
      },
      {
        slideNumber: 3,
        layout: "problem_agitation",
        badge: "PROBLEMS 03 & 04",
        headline: "COMMERCE & FOLLOW-UP CHAOS",
        body: [
          "• Problem 03: Orders scattered between chats and spreadsheets.",
          "• Problem 04: Spending 3 hours a day manually following up with cold leads."
        ]
      },
      {
        slideNumber: 4,
        layout: "diagram_architecture",
        badge: "PROBLEMS 05 & 06",
        headline: "WEBSITE & AI CONFUSION",
        body: [
          "• Problem 05: Website is a static digital paperweight.",
          "• Problem 06: Buying into AI hype without a clear commercial ROI."
        ]
      },
      {
        slideNumber: 5,
        layout: "cta_system",
        badge: "THE APEX PROMISE",
        headline: "WE COMBINE UX, ENGINEERING, AI & AUTOMATION.",
        body: [
          "Tell us what's frustrating in your business operations.",
          "We'll figure out the technology. Visit apex-engineering.co.in"
        ]
      }
    ]
  },

  // --- 21: REEL / SHORT (SPEC-04 Apex Microcommerce Live Demo)
  {
    id: "APEX-M01-021",
    assetCode: "APEX-2026-M01-021",
    title: "Launching an Online Store in 48 Hours Without High Monthly Fees",
    targetDate: "2026-11-03",
    postTimeIST: "04:30 PM",
    platform: "instagram",
    secondaryPlatforms: ["youtube"],
    format: "reel_short",
    stream: "commerce_operations",
    speciesCode: "SPEC-04_CASE_STUDY",
    status: "approved",
    hook: "Think you need ₹50,000 and 2 months to launch a professional online store in India? Watch this.",
    caption: `If you're selling handmade goods, baked treats, designer apparel, or home decor in India, you don't need a heavy enterprise ecommerce system.

You need something simple, beautiful, and lightning fast.

Apex Microcommerce:
✅ Clean mobile storefront built for Indian buyers
✅ Direct 1-tap UPI payments (GPay, PhonePe, Paytm)
✅ Instant WhatsApp order notifications
✅ Real-time Google Sheets inventory sync
✅ Live in 48 hours

No tech knowledge required. You bring the products, we engineer the store.

DM 'STORE' or check the link in bio.

#ApexMicrocommerce #SmallBusinessIndia #D2CIndia #HandmadeIndia #PuneEntrepreneurs #ShopifyAlternative`,
    hashtags: ["ApexMicrocommerce", "SmallBusinessIndia", "D2CIndia", "HandmadeIndia", "PuneEntrepreneurs", "ShopifyAlternative"],
    callToAction: "DM 'STORE' for live demo or visit apex-engineering.co.in/microcommerce",
    viralityScore: 93,
    targetReach: 25000,
    estimatedImpressions: 41000,
    expectedLeads: 17,
    targetBuyerPersona: "Boutique owners, artisan sellers, home bakers, lifestyle brand creators",
    designSystemVerified: true,
    colorScheme: "carbon_orange",
    audioTrackRecommendation: "Crisp uplifting indie-electronic rhythm",
    videoScenes: [
      {
        sceneNumber: 1,
        timestamp: "0:00 - 0:03",
        hookText: "LAUNCH AN ONLINE STORE IN 48 HOURS",
        bRollPrompt: "Hands holding iPhone showing high-aesthetic boutique storefront with smooth product scroll and instant 'Buy with UPI' button.",
        narrationVoiceover: "Think you need ₹50,000 and two months to launch a modern online store? Think again.",
        onScreenCaption: "STORE LIVE IN 48 HOURS",
        visualFocus: "Apex Microcommerce mobile storefront."
      },
      {
        sceneNumber: 2,
        timestamp: "0:03 - 0:10",
        hookText: "THE 1-CLICK UPI CHECKOUT",
        bRollPrompt: "Customer taps UPI button, GPay opens seamlessly, payment confirms in 2 seconds.",
        narrationVoiceover: "Zero multi-page forms. Your buyers check out in one tap with Google Pay or PhonePe.",
        onScreenCaption: "1-CLICK UPI CHECKOUT",
        visualFocus: "UPI payment success HUD."
      },
      {
        sceneNumber: 3,
        timestamp: "0:10 - 0:18",
        hookText: "DIRECT TO WHATSAPP & SPREADSHEET",
        bRollPrompt: "Seller receives instant WhatsApp alert with customer name and shipping address while Google Sheets row populates.",
        narrationVoiceover: "Orders ping your WhatsApp instantly and sync straight to your master spreadsheet.",
        onScreenCaption: "INSTANT WHATSAPP NOTIFICATION",
        visualFocus: "Clean notification badge in Apex Orange."
      },
      {
        sceneNumber: 4,
        timestamp: "0:18 - 0:30",
        hookText: "START SELLING TODAY",
        bRollPrompt: "Amar Pawar smiling with laptop in modern studio, apex-engineering.co.in displayed cleanly.",
        narrationVoiceover: "Start selling online without building an expensive tech team. Comment 'STORE' for a live demo.",
        onScreenCaption: "COMMENT 'STORE' FOR LIVE DEMO",
        visualFocus: "Apex Engineering outro card."
      }
    ]
  },

  // --- 22: STATIC POSTER (SPEC-05 AI Reality Check)
  {
    id: "APEX-M01-022",
    assetCode: "APEX-2026-M01-022",
    title: "The 2026 AI Stack for Lean Businesses (Total Cost: ₹0 / Month)",
    targetDate: "2026-11-04",
    postTimeIST: "10:30 AM",
    platform: "linkedin",
    secondaryPlatforms: ["twitter"],
    format: "static_poster",
    stream: "applied_ai",
    speciesCode: "SPEC-05_AI_REALITY_CHECK",
    status: "approved",
    hook: "You don't need a $20,000 enterprise AI budget. Here is how to run autonomous business plumbing for ₹0.",
    caption: `Everyone thinks automating their business requires paying enterprise software subscriptions.

Here is the exact zero-cost stack we use to build autonomous workflows for lean companies:

1. Database: Google Sheets (Free, instant collaboration, zero server maintenance)
2. Intelligence: Google Gemini 2.5 Flash API (Massive free tier, ultra-fast latency for lead classification)
3. Orchestration: Google Apps Script Webhooks (Free serverless execution directly inside your spreadsheet)
4. Frontend: Vite + React on Cloud Run or Cloudflare Pages (Free tier handles millions of requests)
5. Customer Channel: WhatsApp Business API / Webhooks (Free tier for direct customer service sessions)

When you know how systems fit together, you don't need to throw money at bloated tools.
You just need clean engineering.

Save this stack for your technical roadmap.

#LeanStack #ZeroCostAutomation #ApexEngineering #GoogleSheets #GeminiAPI #PragmaticEngineering`,
    hashtags: ["LeanStack", "ZeroCostAutomation", "ApexEngineering", "GoogleSheets", "GeminiAPI", "PragmaticEngineering"],
    callToAction: "Save this stack or connect with Apex Engineering",
    viralityScore: 97,
    targetReach: 28000,
    estimatedImpressions: 46000,
    expectedLeads: 14,
    targetBuyerPersona: "Bootstrapped founders, technical leads, operations managers",
    designSystemVerified: true,
    colorScheme: "clean_white",
    posterLayoutType: "minimal_editorial",
    posterVisualPrompt: "Clean, high-impact technical poster: 'THE ZERO-COST AI BUSINESS STACK (₹0/MONTH)'. Five tier breakdown: Database (Google Sheets), Intelligence (Gemini), Webhooks (Apps Script), Frontend (Vite/React), Channel (WhatsApp). Contrast between sleek black typography and vibrant Apex Orange badges."
  }
];

export const SEED_ASSETS: SocialAsset[] = INITIAL_MONTH_ASSETS.map((asset) => {
  const isAppliedAi = asset.stream === 'applied_ai';
  const campaignId = asset.campaignId || (isAppliedAi ? 'cmp-q2-anti-slop' : 'cmp-q1-manifesto');
  const campaignName = asset.campaignName || (isAppliedAi ? 'AI Where It Actually Makes Sense (Anti-Slop Era)' : 'The Anti-Manual Manifesto & Microcommerce Launch');
  return {
    ...asset,
    campaignId,
    campaignName
  };
});

// Sync asset count on initial campaigns
INITIAL_CAMPAIGNS[0].assetCount = SEED_ASSETS.filter(a => a.campaignId === 'cmp-q1-manifesto').length;
INITIAL_CAMPAIGNS[1].assetCount = SEED_ASSETS.filter(a => a.campaignId === 'cmp-q2-anti-slop').length;
INITIAL_CAMPAIGNS[2].assetCount = 0;


export const AUTOMATED_LEAD_TRIGGERS = [
  {
    keyword: "LEAK",
    autoReplyText: "Hey! Amar from Apex Engineering here. Here is our 1-page WhatsApp Lead Leak Diagnostic checklist to help you patch customer drop-offs: https://apex-engineering.co.in/diagnostics/whatsapp-leak.pdf",
    deliverableLink: "https://apex-engineering.co.in/diagnostics/whatsapp-leak.pdf",
    targetStage: "lead_magnet"
  },
  {
    keyword: "BOOK",
    autoReplyText: "Hello! Here is the interactive demo of our Apex Autonomous Booking Engine: https://apex-engineering.co.in/demo/booking. Pick a test slot to see how the instant UPI and WhatsApp reminders trigger!",
    deliverableLink: "https://apex-engineering.co.in/demo/booking",
    targetStage: "consultation"
  },
  {
    keyword: "STORE",
    autoReplyText: "Hi! Excited to show you Apex Microcommerce. Explore our live sample boutique storefront here: https://apex-engineering.co.in/microcommerce/demo — you can test the 1-click UPI checkout!",
    deliverableLink: "https://apex-engineering.co.in/microcommerce/demo",
    targetStage: "microcommerce_demo"
  },
  {
    keyword: "FLOW",
    autoReplyText: "Hey there! Here is the complete Miro architecture diagram for connecting WhatsApp + Gemini AI + Google Sheets in 4 seconds: https://apex-engineering.co.in/blueprints/instant-quote-flow",
    deliverableLink: "https://apex-engineering.co.in/blueprints/instant-quote-flow",
    targetStage: "consultation"
  },
  {
    keyword: "SYSTEM",
    autoReplyText: "Thanks for reaching out! Tell us in 1 sentence: What is the most repetitive manual thing your business does every week? We'll reply with a tailored system architecture blueprint.",
    deliverableLink: "https://apex-engineering.co.in/#contact",
    targetStage: "consultation"
  }
];
