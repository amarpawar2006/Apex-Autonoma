import 'dotenv/config';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, GenerateVideosOperation } from '@google/genai';
import { 
  autonomaDb, 
  campaignToDbRow, 
  dbRowToCampaign, 
  assetToDbRow, 
  dbRowToAsset 
} from './server/autonomaDatabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '2mb' }));

  // Health and System Status Endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY);
    const hasSheets = Boolean(autonomaDb.getGoogleSheetsUrl());
    res.json({
      status: 'ok',
      hasGeminiKey: hasKey,
      hasSheetsConnection: hasSheets,
      model: 'gemini-2.5-flash',
      engine: 'Apex Autonoma Server-Side Campaign Generator & Durable Sheets Store'
    });
  });

  // ==========================================
  // AUTONOMA PERSISTENCE & GOOGLE SHEETS API
  // ==========================================

  // 1. Campaigns Endpoints
  app.get('/api/autonoma/campaigns', (_req: Request, res: Response) => {
    try {
      const rows = autonomaDb.getCampaigns();
      const campaigns = rows.map(dbRowToCampaign);
      res.json({ success: true, count: campaigns.length, data: campaigns });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to load campaigns' });
    }
  });

  app.get('/api/autonoma/campaigns/:id', (req: Request, res: Response) => {
    try {
      const row = autonomaDb.getCampaign(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }
      res.json({ success: true, data: dbRowToCampaign(row) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to load campaign' });
    }
  });

  app.post('/api/autonoma/campaigns', async (req: Request, res: Response) => {
    try {
      const campaignPayload = req.body;
      if (!campaignPayload || !campaignPayload.id || !campaignPayload.name) {
        return res.status(400).json({ success: false, error: 'Campaign id and name are required' });
      }
      const dbRow = campaignPayload.campaignId ? campaignPayload : campaignToDbRow(campaignPayload);
      const result = await autonomaDb.saveCampaign(dbRow);
      res.json({ success: true, data: dbRowToCampaign(result.data) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to save campaign' });
    }
  });

  app.put('/api/autonoma/campaigns/:id', async (req: Request, res: Response) => {
    try {
      const existing = autonomaDb.getCampaign(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }
      const updates = req.body;
      const updatedRow = {
        ...existing,
        ...(updates.status ? { status: updates.status } : {}),
        ...(updates.name ? { name: updates.name } : {}),
        ...(updates.brief ? { brief: updates.brief } : {}),
        ...(updates.objective ? { objective: updates.objective } : {}),
        updatedAt: new Date().toISOString()
      };
      const result = await autonomaDb.saveCampaign(updatedRow);
      res.json({ success: true, data: dbRowToCampaign(result.data) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to update campaign' });
    }
  });

  // 2. Assets Endpoints
  app.get('/api/autonoma/assets', (req: Request, res: Response) => {
    try {
      const campaignId = req.query.campaignId as string | undefined;
      const rows = autonomaDb.getAssets(campaignId);
      const assets = rows.map(dbRowToAsset);
      res.json({ success: true, count: assets.length, data: assets });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to load assets' });
    }
  });

  app.get('/api/autonoma/assets/:id', (req: Request, res: Response) => {
    try {
      const row = autonomaDb.getAsset(req.params.id);
      if (!row) {
        return res.status(404).json({ success: false, error: 'Asset not found' });
      }
      res.json({ success: true, data: dbRowToAsset(row) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to load asset' });
    }
  });

  app.post('/api/autonoma/assets', async (req: Request, res: Response) => {
    try {
      const assetPayload = req.body;
      if (!assetPayload || !assetPayload.id || !assetPayload.title) {
        return res.status(400).json({ success: false, error: 'Asset id and title are required' });
      }
      const dbRow = assetPayload.assetId ? assetPayload : assetToDbRow(assetPayload);
      const result = await autonomaDb.saveAsset(dbRow);
      res.json({ success: true, data: dbRowToAsset(result.data) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to save asset' });
    }
  });

  app.post('/api/autonoma/assets/batch', async (req: Request, res: Response) => {
    try {
      const { assets } = req.body;
      if (!Array.isArray(assets) || assets.length === 0) {
        return res.status(400).json({ success: false, error: 'Array of assets is required' });
      }
      const dbRows = assets.map((a: any) => (a.assetId ? a : assetToDbRow(a)));
      const result = await autonomaDb.batchSaveAssets(dbRows);
      res.json({ success: true, count: result.count, message: `Persisted ${result.count} assets in batch.` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to batch save assets' });
    }
  });

  app.put('/api/autonoma/assets/:id', async (req: Request, res: Response) => {
    try {
      const existing = autonomaDb.getAsset(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Asset not found' });
      }
      const assetPayload = req.body;
      const updatedRow = assetPayload.assetId ? assetPayload : assetToDbRow(assetPayload);
      const result = await autonomaDb.saveAsset(updatedRow);
      res.json({ success: true, data: dbRowToAsset(result.data) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to update asset' });
    }
  });

  // 3. Media, Publishing, Performance, Snapshots
  app.post('/api/autonoma/media', async (req: Request, res: Response) => {
    try {
      const result = await autonomaDb.saveMediaRecord(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/autonoma/publishing', async (req: Request, res: Response) => {
    try {
      const result = await autonomaDb.savePublication(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/autonoma/performance', async (req: Request, res: Response) => {
    try {
      const result = await autonomaDb.upsertPerformance(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/autonoma/snapshot', async (req: Request, res: Response) => {
    try {
      const result = await autonomaDb.createDailySnapshot(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // 4. Settings & Google Sheets Connectivity
  app.get('/api/autonoma/settings', (_req: Request, res: Response) => {
    try {
      const info = autonomaDb.getSettings();
      res.json({ success: true, data: info });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/autonoma/settings', async (req: Request, res: Response) => {
    try {
      const { settings, googleSheetsUrl } = req.body;
      const result = await autonomaDb.updateSettings(settings || {}, googleSheetsUrl);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // 5. Test Connection to Google Sheets Web App
  app.post('/api/autonoma/test-connection', async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      const targetUrl = url || autonomaDb.getGoogleSheetsUrl();
      if (!targetUrl) {
        return res.status(400).json({
          success: false,
          error: 'No Google Sheets Web App URL provided or configured.'
        });
      }

      const startTime = Date.now();
      const testRes = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PING' }),
        redirect: 'follow'
      });
      const latencyMs = Date.now() - startTime;

      if (!testRes.ok) {
        return res.status(400).json({
          success: false,
          error: `Google Apps Script returned HTTP ${testRes.status}: ${testRes.statusText}`,
          latencyMs
        });
      }

      const json = await testRes.json();
      if (json && json.success) {
        if (url) {
          autonomaDb.setGoogleSheetsUrl(url);
        }
        return res.json({
          success: true,
          latencyMs,
          message: 'Connection verified! Google Sheets Web App is responsive and authenticated.',
          details: json.data
        });
      } else {
        return res.status(400).json({
          success: false,
          error: json?.error || 'Apps script responded with error status',
          latencyMs
        });
      }
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err?.message || 'Failed to connect to Google Sheets Web App'
      });
    }
  });

  // 6. Initialize All 8 Sheets in Google Sheet
  app.post('/api/autonoma/init-sheet', async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      const result = await autonomaDb.initGoogleSheet(url);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // 7. Full Synchronization
  app.post('/api/autonoma/sync', async (_req: Request, res: Response) => {
    try {
      const result = await autonomaDb.syncWithGoogleSheets();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // 8. Activity Log
  app.get('/api/autonoma/activity', (_req: Request, res: Response) => {
    try {
      const logs = autonomaDb.getActivityLog();
      res.json({ success: true, count: logs.length, data: logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Real Server-Side Gemini Campaign Generator Endpoint
  app.post('/api/campaign/generate', async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'MISSING_API_KEY',
          message: 'Server-side GEMINI_API_KEY is not configured in the runtime environment.'
        });
      }

      const {
        topic,
        targetPlatform = 'instagram',
        format = 'carousel',
        stream = 'commerce_operations',
        speciesCode = 'SPEC-01_PROBLEM_FIRST'
      } = req.body;

      if (!topic || typeof topic !== 'string' || !topic.trim()) {
        return res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'A valid business problem or topic string is required.'
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `You are the Lead Systems Architect & Senior Growth Strategist (IQ 300) for Apex Engineering (https://apex-engineering.co.in), founded by Amar Pawar (18+ years UX & digital systems experience, based in Pune, India, working globally).

Apex Engineering Core Philosophy:
- "We create websites that do more than look good."
- "AI is not the product. The business problem is."
- "Businesses rarely need another screen. They need better systems behind those screens."
- "If your business does it every day, we should ask why it's still manual."
- Core Formulation: MANUAL WORK ➔ RULES + DATA + AI ➔ AUTOMATED SYSTEM.
- Verified Client Systems: BRC Pune, Flightpath Aviation Consultants, Apex Microcommerce, Trikaya Leadership.

Apex Engineering Social Design System (AES-DS) Rules:
- Void Black (#0A0B0E), Carbon Charcoal (#14161B), Apex High-Vis Orange (#FF4500), Stark Titanium (#FFFFFF).
- Typography: Bold brutalist sans headlines, JetBrains Mono telemetry badges and code notations, Inter body.
- Zero generic AI slop: NO cartoon 3D robot hands, floating blue brains, or generic motivational quotes. Focus strictly on real engineering architecture, data plumbing, customer drop-off bottlenecks, and commercial ROI.

Campaign Request:
- Topic / Problem to Solve: "${topic.trim()}"
- Target Platform: ${targetPlatform.toUpperCase()}
- Content Format: ${format.toUpperCase()}
- Content Stream: ${stream}
- Species Code: ${speciesCode}

Instructions:
1. Synthesize an authoritative, highly shareable, conversion-optimized campaign asset.
2. Structure the hook to immediately address founder/operator pain in the first 3 seconds or first slide.
3. If format is 'carousel', provide 5 to 6 structured carousel slides (title_hook, problem_agitation, diagram_architecture, breakdown_steps, proof_quote or cta_system).
4. If format is 'reel_short', provide 4 to 5 timed video scenes (with timestamps, narration, B-roll prompt, on-screen caption, visual focus).
5. Provide actionable image and video prompts adhering strictly to the Apex Social Design System.
6. Return ONLY the validated structured JSON matching the requested schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              assetCode: { type: Type.STRING },
              title: { type: Type.STRING },
              hook: { type: Type.STRING },
              businessProblem: { type: Type.STRING },
              buyerPersona: { type: Type.STRING },
              platform: { type: Type.STRING },
              format: { type: Type.STRING },
              contentStream: { type: Type.STRING },
              speciesCode: { type: Type.STRING },
              funnelStage: { type: Type.STRING },
              caption: { type: Type.STRING },
              hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              CTA: { type: Type.STRING },
              carouselSlides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    slideNumber: { type: Type.INTEGER },
                    layout: { type: Type.STRING },
                    badge: { type: Type.STRING },
                    headline: { type: Type.STRING },
                    subtext: { type: Type.STRING },
                    body: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ['slideNumber', 'headline', 'body']
                }
              },
              reelScript: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sceneNumber: { type: Type.INTEGER },
                    timestamp: { type: Type.STRING },
                    hookText: { type: Type.STRING },
                    bRollPrompt: { type: Type.STRING },
                    narrationVoiceover: { type: Type.STRING },
                    onScreenCaption: { type: Type.STRING },
                    visualFocus: { type: Type.STRING }
                  },
                  required: ['sceneNumber', 'timestamp', 'hookText', 'narrationVoiceover', 'onScreenCaption']
                }
              },
              imagePrompt: { type: Type.STRING },
              videoPrompt: { type: Type.STRING },
              viralityRationale: { type: Type.STRING },
              viralityScore: { type: Type.INTEGER }
            },
            required: [
              'assetCode',
              'title',
              'hook',
              'businessProblem',
              'buyerPersona',
              'platform',
              'format',
              'contentStream',
              'speciesCode',
              'funnelStage',
              'caption',
              'hashtags',
              'CTA',
              'carouselSlides',
              'reelScript',
              'imagePrompt',
              'videoPrompt',
              'viralityRationale',
              'viralityScore'
            ]
          }
        }
      });

      const responseText = response.text || '';
      if (!responseText) {
        throw new Error('Gemini API returned an empty response.');
      }

      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('Failed to parse Gemini JSON output:', responseText);
        throw new Error('Model output could not be parsed as valid JSON.');
      }

      // Ensure assetCode format conforms to APEX standard
      if (!parsedData.assetCode || !parsedData.assetCode.startsWith('APEX-')) {
        const randomSuffix = Math.floor(100 + Math.random() * 900);
        parsedData.assetCode = `APEX-2026-M01-${randomSuffix}`;
      }

      // Ensure platform, format, contentStream, speciesCode fallback consistency
      parsedData.platform = parsedData.platform || targetPlatform;
      parsedData.format = parsedData.format || format;
      parsedData.contentStream = parsedData.contentStream || stream;
      parsedData.speciesCode = parsedData.speciesCode || speciesCode;
      parsedData.businessProblem = parsedData.businessProblem || topic.trim();
      parsedData.viralityScore = typeof parsedData.viralityScore === 'number' ? Math.min(100, Math.max(70, parsedData.viralityScore)) : 93;

      return res.json({
        success: true,
        data: parsedData
      });
    } catch (error: any) {
      console.error('Server-side Gemini generation error:', error);
      return res.status(500).json({
        error: 'GENERATION_FAILED',
        message: error?.message || 'An unexpected error occurred during Gemini campaign generation.'
      });
    }
  });

  // Comprehensive Multi-Asset Campaign Director Endpoint
  // Generates a full narrative arc across platforms with zero generic "Part 2" titles,
  // platform-native executions, audience-grounded language, and calibrated realistic reach.
  app.post('/api/campaign/synthesize-campaign', async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'MISSING_API_KEY',
          message: 'Server-side GEMINI_API_KEY is not configured in the runtime environment.'
        });
      }

      const {
        brief,
        platforms = ['instagram', 'facebook', 'linkedin'],
        formats = ['carousel', 'reel_short', 'static_poster'],
        duration = '7_days',
        daysSpan = 7,
        assetCount = 7,
        languages = ['English'],
        advancedOptions = {}
      } = req.body;

      if (!brief || typeof brief !== 'string' || !brief.trim()) {
        return res.status(400).json({
          error: 'INVALID_INPUT',
          message: 'A valid campaign brief or business objective string is required.'
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `You are the Executive Creative Director and Lead Growth Strategist at Autonoma, an elite AI social media agency acting on behalf of Apex Engineering (founded by Amar Pawar, 18+ years UX & systems experience in Pune, India, working globally).

CORE AGENCY OPERATING DIRECTIVES (CRITICAL QUALITY STANDARDS):
==================================================
1. STRICTLY FORBIDDEN: NO "PART 2 / PART 3 / PART 4" TITLES
   Never generate placeholder sequence titles such as "Part 2", "Part 3", "Part 4".
   Every single asset MUST have its own compelling, standalone title, strategic angle, and hook that can stop a user scrolling in their feed.

2. DELIBERATE CAMPAIGN NARRATIVE ARC
   A campaign must not repeat one single message across deliverables.
   Construct a sequential narrative progression across the ${assetCount} deliverables:
   - Stage 1: Problem Recognition (surfacing the hidden daily friction in the customer's workflow)
   - Stage 2: Pain & Financial Consequence (missed inquiries, lost orders, payment verification chaos)
   - Stage 3: Foundational Education (re-framing the root cause, e.g. "WhatsApp is a chat tool, not an order database")
   - Stage 4: Visual System Walkthrough (mapping the 10-second frictionless order flow)
   - Stage 5: Transformation & Relatability (realistic small business story, e.g. bakery, boutique, or local merchant)
   - Stage 6: Objection Handling (e.g. "I don't need a heavy Shopify store, just a simpler order link")
   - Stage 7: Frictionless Conversion (direct call-to-action to test or set up an order flow)
   Adapt this arc to the exact number of deliverables (${assetCount}).

3. NATIVE PLATFORM EXECUTION (NO GENERIC COPY-PASTE)
   - INSTAGRAM: Strong visual hooks, carousel step-by-step slides, reels with dynamic pacing, save/share focus.
   - FACEBOOK: Relatable small-business scenarios, accessible conversational language, asking owners about their daily struggles.
   - LINKEDIN: Founder insight, business economics, operational efficiency, professional lessons learned.
   - YOUTUBE SHORTS: 3-second hook, high-retention demonstration, fast problem-to-solution transition.
   - X: Sharp observation, punchy data point or paradox, concise takeaways.

4. AUDIENCE LANGUAGE & ANTI-SLOP DISCIPLINE
   - Respect the target audience specified in the brief. If targeting small Indian businesses (home-food businesses, bakeries, boutiques, nurseries, small manufacturers, resellers, local shops):
     - Speak their language: "orders lost in 50 unread chats", "payment screenshots", "cross-checking bank SMS at night", "price please comments", "dispatch slips", "UPI payment links".
     - FORBIDDEN JARGON: Do NOT use generic consultant slop like "digital transformation ecosystem", "synergistic operational paradigm", "enterprise workflow fabric", "holistic automation architecture".
     - Keep it human, sharp, empathetic, and actionable.

5. CALIBRATED ORGANIC REACH & VIRALITY
   - viralityScore: 78 to 95 (measured resonance index)
   - viralityRationale: Explain the exact psychological trigger (e.g. "Relatable daily friction with WhatsApp screenshots triggers high comments and shares among boutique owners")
   - targetReach: Realistic organic reach estimates (Reels: 2,000-4,500, Carousels: 1,400-3,200, LinkedIn: 900-2,500, FB: 700-1,800, X: 1,000-2,200)
   - estimatedImpressions: ~1.3x to 1.5x of targetReach
   - expectedLeads: 2 to 8 qualified inquiries per asset

CAMPAIGN BRIEF:
"${brief.trim()}"

TARGET PLATFORMS: ${platforms.join(', ')}
AVAILABLE FORMATS: ${formats.join(', ')}
DURATION: ${duration} (${daysSpan} days)
TOTAL DELIVERABLES REQUIRED: Exactly ${assetCount} assets
LANGUAGES: ${languages.join(', ')}
ADVANCED OPTIONS / GUIDELINES:
- Target Audience: ${advancedOptions?.targetAudience || 'Small business owners, local product merchants, home businesses taking orders on chat'}
- Primary CTA: ${advancedOptions?.primaryCta || 'Visit apex-engineering.co.in or drop a message to test the demo'}
- Products/Services: ${advancedOptions?.productsEmphasized || 'Apex Microcommerce / Automated Order Management'}
- Tone: ${advancedOptions?.tone || 'Empathetic, grounded, authoritative, conversion-focused'}

GENERATE A COMPLETE STRUCTURED JSON OBJECT WITH:
- campaignName: Concise, premium campaign title (e.g. "From Chat Chaos to Clear Orders", "The Zero-Friction Order Engine")
- coreInsight: Deep market observation
- valueProposition: Clear promise
- targetAudience: Specific description of the real people targeted
- buyerPersonas: Array of 3 distinct, grounded personas
- contentPillars: Array of 3 strategic pillars
- postingSequence: Summary of the narrative arc
- assets: Array of exactly ${assetCount} assets. Each asset MUST include:
  - strategicPurpose: Name of the narrative step (e.g. "Problem Recognition", "Pain Point & Consequence", "Operational Education", "Visual System", "Transformation Story", "Objection Handling", "Direct Conversion")
  - angle: Unique creative angle for this deliverable
  - title: UNIQUE, standalone title (NEVER "Part X")
  - platform: Assigned platform from the requested platforms
  - format: Content format (carousel, reel_short, static_poster, etc.)
  - hook: Grabbing first line or visual hook
  - caption: Complete, platform-native caption with formatting
  - hashtags: 4-6 curated hashtags
  - CTA: Specific action prompt
  - carouselSlides: If format is 'carousel', provide 4 to 5 structured slides with layout, headline, and body points
  - reelScript: If format is 'reel_short', provide 4 structured scenes with timestamp, hookText, narrationVoiceover, onScreenCaption, bRollPrompt
  - posterVisualPrompt: Design prompt following high-contrast AES-DS aesthetic
  - viralityScore: Realistic score between 80 and 96
  - viralityRationale: Specific reason for engagement potential
  - targetReach: Calibrated organic reach number
  - estimatedImpressions: Calibrated impressions number
  - expectedLeads: Calibrated lead projection (integer)`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              campaignName: { type: Type.STRING },
              coreInsight: { type: Type.STRING },
              valueProposition: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              buyerPersonas: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              contentPillars: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              postingSequence: { type: Type.STRING },
              assets: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    strategicPurpose: { type: Type.STRING },
                    angle: { type: Type.STRING },
                    title: { type: Type.STRING },
                    platform: { type: Type.STRING },
                    format: { type: Type.STRING },
                    hook: { type: Type.STRING },
                    caption: { type: Type.STRING },
                    hashtags: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    CTA: { type: Type.STRING },
                    carouselSlides: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          slideNumber: { type: Type.INTEGER },
                          layout: { type: Type.STRING },
                          badge: { type: Type.STRING },
                          headline: { type: Type.STRING },
                          subtext: { type: Type.STRING },
                          body: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                          }
                        },
                        required: ['slideNumber', 'headline', 'body']
                      }
                    },
                    reelScript: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          sceneNumber: { type: Type.INTEGER },
                          timestamp: { type: Type.STRING },
                          hookText: { type: Type.STRING },
                          bRollPrompt: { type: Type.STRING },
                          narrationVoiceover: { type: Type.STRING },
                          onScreenCaption: { type: Type.STRING },
                          visualFocus: { type: Type.STRING }
                        },
                        required: ['sceneNumber', 'timestamp', 'hookText', 'narrationVoiceover', 'onScreenCaption']
                      }
                    },
                    posterVisualPrompt: { type: Type.STRING },
                    viralityScore: { type: Type.INTEGER },
                    viralityRationale: { type: Type.STRING },
                    targetReach: { type: Type.INTEGER },
                    estimatedImpressions: { type: Type.INTEGER },
                    expectedLeads: { type: Type.INTEGER }
                  },
                  required: [
                    'strategicPurpose',
                    'angle',
                    'title',
                    'platform',
                    'format',
                    'hook',
                    'caption',
                    'hashtags',
                    'CTA',
                    'viralityScore',
                    'viralityRationale'
                  ]
                }
              }
            },
            required: [
              'campaignName',
              'coreInsight',
              'valueProposition',
              'targetAudience',
              'buyerPersonas',
              'contentPillars',
              'postingSequence',
              'assets'
            ]
          }
        }
      });

      const responseText = response.text || '';
      if (!responseText) {
        throw new Error('Gemini API returned an empty response.');
      }

      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('Failed to parse Gemini JSON output:', responseText);
        throw new Error('Model output could not be parsed as valid JSON.');
      }

      return res.json({
        success: true,
        data: parsedData
      });
    } catch (error: any) {
      console.error('Server-side Gemini multi-asset campaign synthesis error:', error);
      return res.status(500).json({
        error: 'SYNTHESIS_FAILED',
        message: error?.message || 'An unexpected error occurred during Gemini campaign synthesis.'
      });
    }
  });

  // Ensure public/generated-media directory exists
  const publicMediaDir = path.resolve(__dirname, 'public', 'generated-media');
  if (!fs.existsSync(publicMediaDir)) {
    fs.mkdirSync(publicMediaDir, { recursive: true });
  }
  // Serve generated media files statically
  app.use('/generated-media', express.static(publicMediaDir));

  // Direct attachment download endpoint
  app.get('/api/media/download/:filename', (req: Request, res: Response) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(publicMediaDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    return res.download(filePath, filename);
  });

  // 1. REAL SERVER-SIDE IMAGE GENERATION ENDPOINT
  // Cost/Quota Protected: only called when user clicks GENERATE on an individual asset
  app.post('/api/media/generate-image', async (req: Request, res: Response) => {
    try {
      const apiKey = req.body.customApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: 'MISSING_API_KEY',
          message: 'Server-side GEMINI_API_KEY is not configured.'
        });
      }

      const { prompt, aspectRatio = '3:4', assetCode = 'ASSET' } = req.body;
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PROMPT',
          message: 'A valid text prompt is required for image generation.'
        });
      }

      // Map aspect ratio to valid Google GenAI values: "1:1", "3:4", "4:3", "9:16", "16:9"
      let validRatio = '3:4';
      if (aspectRatio === '1:1') validRatio = '1:1';
      else if (aspectRatio === '9:16') validRatio = '9:16';
      else if (aspectRatio === '16:9') validRatio = '16:9';
      else if (aspectRatio === '4:3') validRatio = '4:3';
      else validRatio = '3:4'; // 4:5 vertical carousel/poster maps best to 3:4

      const targetModel = 'gemini-3.1-flash-lite-image';
      console.log(`[Media Gen] Requesting image with model ${targetModel} for ${assetCode}...`);

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: prompt.trim(),
        config: {
          imageConfig: {
            aspectRatio: validRatio as any
          }
        }
      });

      // Extract image part
      let base64Data: string | null = null;
      let mimeType = 'image/png';
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          base64Data = part.inlineData.data;
          mimeType = part.inlineData.mimeType || 'image/png';
          break;
        }
      }

      if (!base64Data) {
        return res.status(500).json({
          success: false,
          model: targetModel,
          error: 'NO_IMAGE_DATA',
          message: 'The model did not return image data in the response parts.'
        });
      }

      // Store image to disk in public/generated-media
      const safeCode = (assetCode || 'asset').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safeCode}-${Date.now()}.png`;
      const filePath = path.join(publicMediaDir, filename);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      const fileUrl = `/generated-media/${filename}`;
      const dataUrl = `data:${mimeType};base64,${base64Data}`;

      console.log(`[Media Gen] Successfully generated and stored image: ${filename}`);

      return res.json({
        success: true,
        model: targetModel,
        fileUrl,
        dataUrl,
        filename,
        aspectRatio: validRatio
      });
    } catch (error: any) {
      console.warn('[Media Gen] Image generation response info:', error?.status || 'ERR', error?.message || error);
      const isBillingRequired = 
        error?.status === 429 || 
        error?.message?.includes('quota') || 
        error?.message?.includes('RESOURCE_EXHAUSTED') ||
        error?.message?.includes('billing') ||
        error?.message?.includes('limit: 0');

      const userMessage = isBillingRequired
        ? 'Google AI Studio free tier limits quota for image models (gemini-3.1-flash-lite-image) to 0. A billing-enabled API key or BYOK is required for direct pixel synthesis. You can copy the production prompt for Google AI Studio Web, use the deterministic AES-DS design, or configure a paid API key in Settings.'
        : (error?.message || 'Failed to generate image via Google Gemini API.');

      return res.status(error?.status === 429 ? 429 : 500).json({
        success: false,
        model: 'gemini-3.1-flash-lite-image',
        error: userMessage,
        rawError: error?.message,
        isBillingRequired
      });
    }
  });

  // 2. REAL SERVER-SIDE VIDEO GENERATION ENDPOINT (VEO 3.1)
  // Invokes Google veo-3.1-lite-generate-preview if supported, or reports exact quota/billing status
  app.post('/api/media/generate-video', async (req: Request, res: Response) => {
    try {
      const apiKey = req.body.customApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: 'MISSING_API_KEY',
          message: 'Server-side GEMINI_API_KEY is not configured.'
        });
      }

      const { prompt, aspectRatio = '9:16' } = req.body;
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PROMPT',
          message: 'A valid video generation prompt is required.'
        });
      }

      const validRatio = aspectRatio === '16:9' ? '16:9' : '9:16';
      const targetModel = 'veo-3.1-lite-generate-preview';
      console.log(`[Media Gen] Requesting video generation with model ${targetModel}...`);

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const operation = await ai.models.generateVideos({
        model: targetModel,
        prompt: prompt.trim(),
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: validRatio
        }
      });

      return res.json({
        success: true,
        model: targetModel,
        operationName: operation.name
      });
    } catch (error: any) {
      console.warn('[Media Gen] Video generation response info:', error?.status || 'ERR', error?.message || error);
      const isBillingRequired = 
        error?.status === 429 || 
        error?.message?.includes('quota') || 
        error?.message?.includes('RESOURCE_EXHAUSTED') ||
        error?.message?.includes('billing') ||
        error?.message?.includes('limit: 0') ||
        error?.message?.includes('not found') ||
        error?.status === 404;

      const userMessage = isBillingRequired
        ? 'Google Veo video generation is not enabled on this free project tier or requires paid API billing access. Video generation is unavailable directly, but your production prompt, script, voiceover, and storyboard are ready to copy.'
        : (error?.message || 'Video generation failed via Google Veo API.');

      return res.status(error?.status === 429 ? 429 : 500).json({
        success: false,
        model: 'veo-3.1-lite-generate-preview',
        error: userMessage,
        rawError: error?.message,
        isBillingRequired
      });
    }
  });

  // 3. VIDEO STATUS POLLING ENDPOINT
  app.post('/api/media/video-status', async (req: Request, res: Response) => {
    try {
      const apiKey = req.body.customApiKey || process.env.GEMINI_API_KEY;
      const { operationName } = req.body;
      if (!operationName) {
        return res.status(400).json({ success: false, message: 'operationName required' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });

      return res.json({
        success: true,
        done: Boolean(updated.done),
        error: updated.error || null
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error?.message || 'Failed to poll video status'
      });
    }
  });

  // 4. VIDEO DOWNLOAD ENDPOINT
  app.post('/api/media/video-download', async (req: Request, res: Response) => {
    try {
      const apiKey = req.body.customApiKey || process.env.GEMINI_API_KEY;
      const { operationName, assetCode = 'VIDEO' } = req.body;
      if (!operationName) {
        return res.status(400).json({ success: false, message: 'operationName required' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

      if (!uri) {
        return res.status(404).json({ success: false, message: 'No video URI found in completed operation.' });
      }

      // Fetch video stream from Google Cloud with API key
      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': apiKey! }
      });
      const buffer = Buffer.from(await videoRes.arrayBuffer());

      // Save to disk
      const filename = `${assetCode.replace(/[^a-zA-Z0-9_-]/g, '_')}-${Date.now()}.mp4`;
      const filePath = path.join(publicMediaDir, filename);
      fs.writeFileSync(filePath, buffer);

      return res.json({
        success: true,
        videoUrl: `/generated-media/${filename}`,
        filename
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error?.message || 'Failed to download video file'
      });
    }
  });

  // Mount Vite middleware in development, or serve built assets in production
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Apex Autonoma] Full-Stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Apex Autonoma] Fatal server error:', err);
  process.exit(1);
});
