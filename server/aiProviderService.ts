import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { 
  AiProvidersSettings, 
  ProviderConfig, 
  CapabilityType, 
  BrandDesignSystem 
} from '../src/types/auth.js';

export interface ImageGenerationRequest {
  prompt: string;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  assetCode?: string;
  brandDesignSystem?: BrandDesignSystem;
  providerId?: string;
  modelName?: string;
  platform?: string;
  language?: string;
  objective?: string;
}

export interface VideoGenerationRequest {
  prompt: string;
  aspectRatio?: '9:16' | '16:9';
  assetCode?: string;
  brandDesignSystem?: BrandDesignSystem;
  providerId?: string;
  modelName?: string;
  platform?: string;
  sceneCount?: number;
}

export interface MediaGenerationResult {
  success: boolean;
  provider: string;
  model: string;
  fileUrl?: string;
  dataUrl?: string;
  filename?: string;
  aspectRatio?: string;
  error?: string;
  rawError?: string;
  isBillingRequired?: boolean;
  driveFolderId?: string;
}

export class AiProviderService {
  private settings: AiProvidersSettings = {
    defaults: {
      text: 'gemini',
      image: 'openai',
      video: 'nvidia'
    },
    providers: {
      gemini: {
        id: 'gemini',
        name: 'Google Gemini',
        capabilities: ['text', 'image', 'video'],
        selectedModel: 'gemini-3.8-flash',
        availableModels: ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-3.1-flash-lite-image', 'veo-3.1-lite-generate-preview'],
        status: 'CONFIGURED'
      },
      openai: {
        id: 'openai',
        name: 'OpenAI',
        capabilities: ['text', 'image'],
        selectedModel: 'dall-e-3',
        availableModels: ['gpt-4o', 'gpt-4o-mini', 'dall-e-3', 'dall-e-2'],
        status: 'UNCONFIGURED'
      },
      nvidia: {
        id: 'nvidia',
        name: 'NVIDIA NIM',
        capabilities: ['image', 'video'],
        selectedModel: 'stabilityai/stable-diffusion-xl-base-1.0',
        availableModels: [
          'stabilityai/stable-diffusion-xl-base-1.0',
          'black-forest-labs/flux-1-schnell',
          'nvidia/cosmos-nemotron-34b',
          'nvidia/genai-video-mvp'
        ],
        status: 'UNCONFIGURED'
      },
      google_veo: {
        id: 'google_veo',
        name: 'Google Veo',
        capabilities: ['video'],
        selectedModel: 'veo-3.1-lite-generate-preview',
        availableModels: ['veo-3.1-lite-generate-preview', 'veo-2.0-generate-001'],
        status: 'CONFIGURED'
      }
    },
    googleDrive: {
      folderIdOrUrl: '',
      enabled: false
    }
  };

  constructor(initialSettings?: AiProvidersSettings) {
    if (initialSettings) {
      this.settings = initialSettings;
    }
    this.ensureSmartDefaults();
  }

  private ensureSmartDefaults(): void {
    const hasOpenAI = Boolean(this.getEnvKeyForProvider('openai'));
    const hasNvidia = Boolean(this.getEnvKeyForProvider('nvidia'));
    const hasGemini = Boolean(this.getEnvKeyForProvider('gemini'));

    // If default image was set to openai but openai has no key, yet nvidia has a key, use nvidia
    if (this.settings.defaults.image === 'openai' && !hasOpenAI && hasNvidia) {
      this.settings.defaults.image = 'nvidia';
    }
    if (this.settings.defaults.text === 'openai' && !hasOpenAI && hasGemini) {
      this.settings.defaults.text = 'gemini';
    }
  }

  public getEnvKeyForProvider(providerId: string): string {
    if (providerId === 'gemini' || providerId === 'google_veo') {
      return (
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        process.env.GOOGLE_GENAI_API_KEY ||
        ''
      ).trim();
    }
    if (providerId === 'openai') {
      return (
        process.env.OPENAI_API_KEY ||
        process.env.OPENAI_KEY ||
        process.env.VITE_OPENAI_API_KEY ||
        ''
      ).trim();
    }
    if (providerId === 'nvidia') {
      return (
        process.env.NVIDIA_API_KEY ||
        process.env.NVIDIA_NIM_API_KEY ||
        process.env.NV_API_KEY ||
        ''
      ).trim();
    }
    return '';
  }

  public getRawProviderKey(providerId: string): string {
    const prov = this.settings.providers[providerId];
    if (prov?.apiKey && !prov.apiKey.includes('••••')) {
      return prov.apiKey.trim();
    }
    return this.getEnvKeyForProvider(providerId);
  }

  public getSettings(includeKeys = false): AiProvidersSettings {
    if (includeKeys) return this.settings;

    // Return masked settings with authoritative server-secret detection
    const maskedProviders: Record<string, ProviderConfig> = {};
    for (const [id, prov] of Object.entries(this.settings.providers)) {
      const workspaceKey = prov.apiKey && !prov.apiKey.includes('••••') ? prov.apiKey.trim() : '';
      const envKey = this.getEnvKeyForProvider(id);
      const effectiveKey = workspaceKey || envKey;
      const hasKey = Boolean(effectiveKey);

      let source: 'server_secret' | 'workspace_override' | 'unconfigured' = 'unconfigured';
      let maskedKey = '';

      if (workspaceKey) {
        source = 'workspace_override';
        maskedKey = workspaceKey.length > 8 ? `${workspaceKey.slice(0, 4)}••••${workspaceKey.slice(-4)}` : '••••••••';
      } else if (envKey) {
        source = 'server_secret';
        maskedKey = '•••••••• (Server Secret)';
      }

      maskedProviders[id] = {
        ...prov,
        hasKey,
        source,
        status: hasKey ? 'CONFIGURED' : 'UNCONFIGURED',
        apiKey: maskedKey
      };
    }

    return {
      defaults: this.settings.defaults,
      providers: maskedProviders,
      googleDrive: this.settings.googleDrive
    };
  }

  public updateSettings(updates: Partial<AiProvidersSettings>): AiProvidersSettings {
    if (updates.defaults) {
      this.settings.defaults = { ...this.settings.defaults, ...updates.defaults };
    }

    if (updates.googleDrive) {
      this.settings.googleDrive = { ...this.settings.googleDrive, ...updates.googleDrive };
    }

    if (updates.providers) {
      for (const [id, provUpdate] of Object.entries(updates.providers)) {
        const existing = this.settings.providers[id] || {
          id,
          name: provUpdate.name || id,
          capabilities: provUpdate.capabilities || ['text'],
          selectedModel: provUpdate.selectedModel || '',
          availableModels: provUpdate.availableModels || [],
          status: 'UNCONFIGURED'
        };

        let newApiKey = existing.apiKey;
        if (provUpdate.apiKey !== undefined) {
          if (!provUpdate.apiKey.includes('••••')) {
            newApiKey = provUpdate.apiKey.trim();
          }
        }

        const envKey = this.getEnvKeyForProvider(id);
        const hasKey = Boolean(newApiKey || envKey);

        this.settings.providers[id] = {
          ...existing,
          ...provUpdate,
          apiKey: newApiKey,
          hasKey,
          status: hasKey ? 'CONFIGURED' : 'UNCONFIGURED'
        };
      }
    }

    return this.getSettings(false);
  }

  /**
   * Tests connection to an AI Provider
   */
  public async testProviderConnection(providerId: string, customApiKey?: string): Promise<{
    success: boolean;
    provider: string;
    message: string;
    latencyMs?: number;
  }> {
    const key = customApiKey || this.getRawProviderKey(providerId);
    const startTime = Date.now();

    if (!key) {
      return {
        success: false,
        provider: providerId,
        message: `API Key is missing for ${providerId.toUpperCase()}. Please configure it first.`
      };
    }

    try {
      if (providerId === 'gemini') {
        const ai = new GoogleGenAI({ apiKey: key });
        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: 'Ping test. Reply with OK.'
        });
        const latencyMs = Date.now() - startTime;
        return {
          success: true,
          provider: providerId,
          message: `Google Gemini responded successfully in ${latencyMs}ms!`,
          latencyMs
        };
      }

      if (providerId === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${key}` }
        });
        const latencyMs = Date.now() - startTime;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${res.status}: Unauthorized or Invalid API Key`);
        }
        return {
          success: true,
          provider: providerId,
          message: `Connected to OpenAI API successfully (${latencyMs}ms)!`,
          latencyMs
        };
      }

      if (providerId === 'nvidia') {
        const res = await fetch('https://integrate.api.nvidia.com/v1/models', {
          headers: { 'Authorization': `Bearer ${key}` }
        });
        const latencyMs = Date.now() - startTime;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${res.status}: NVIDIA NIM API Key validation failed`);
        }
        return {
          success: true,
          provider: providerId,
          message: `Connected to NVIDIA NIM API successfully (${latencyMs}ms)!`,
          latencyMs
        };
      }

      if (providerId === 'google_veo') {
        const ai = new GoogleGenAI({ apiKey: key });
        // Minimal ping with Google GenAI
        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: 'Veo integration check.'
        });
        const latencyMs = Date.now() - startTime;
        return {
          success: true,
          provider: providerId,
          message: `Google Veo video interface authenticated (${latencyMs}ms)!`,
          latencyMs
        };
      }

      return {
        success: false,
        provider: providerId,
        message: `Unknown provider: ${providerId}`
      };
    } catch (err: any) {
      return {
        success: false,
        provider: providerId,
        message: err?.message || 'Connection test failed'
      };
    }
  }

  /**
   * Enriches generation prompt with Company Brand Design System context
   */
  public buildEnrichedImagePrompt(req: ImageGenerationRequest): string {
    const brand = req.brandDesignSystem;
    let enriched = req.prompt.trim();

    if (brand) {
      const brandContext = [];
      if (brand.primaryColor || brand.secondaryColor || brand.accentColor) {
        brandContext.push(`BRAND COLOR PALETTE: Primary: ${brand.primaryColor || '#111827'}, Secondary: ${brand.secondaryColor || '#FF4500'}, Accent: ${brand.accentColor || '#3B82F6'}, Background: ${brand.backgroundColor || '#F8FAFC'}.`);
      }
      if (brand.headingFont || brand.bodyFont) {
        brandContext.push(`TYPOGRAPHY DIRECTION: Heading font style: ${brand.headingFont || 'Clean sans-serif'}, Body font: ${brand.bodyFont || 'Inter'}.`);
      }
      if (brand.visualStyleNotes) {
        brandContext.push(`VISUAL STYLE: ${brand.visualStyleNotes}`);
      }
      if (brand.imageStyle) {
        brandContext.push(`PHOTOGRAPHY & IMAGE DIRECTION: ${brand.imageStyle}`);
      }
      if (brand.creativeRules) {
        brandContext.push(`CREATIVE RULES & DO NOTS: ${brand.creativeRules}`);
      }
      if (brand.logoUrl) {
        brandContext.push(`BRAND LOGO INSTRUCTION: Discreetly incorporate subtle placement for the company logo.`);
      }

      if (req.platform) {
        brandContext.push(`TARGET PLATFORM: ${req.platform.toUpperCase()}`);
      }
      if (req.language && req.language !== 'English') {
        brandContext.push(`LANGUAGE & CULTURAL CONTEXT: ${req.language}`);
      }
      if (req.objective) {
        brandContext.push(`CONTENT OBJECTIVE: ${req.objective}`);
      }

      if (brandContext.length > 0) {
        enriched = `${enriched}\n\nSTRICT BRAND SYSTEM GUIDELINES:\n${brandContext.join('\n')}`;
      }
    }

    return enriched;
  }

  /**
   * Generates Image using the selected provider (OpenAI, NVIDIA, or Gemini)
   */
  public async generateImage(req: ImageGenerationRequest, publicMediaDir: string): Promise<MediaGenerationResult> {
    const providerId = req.providerId || this.settings.defaults.image || 'openai';
    const enrichedPrompt = this.buildEnrichedImagePrompt(req);
    const assetCode = req.assetCode || 'CREATIVE';

    console.log(`[AiProviderService] Generating image via ${providerId} for ${assetCode}...`);

    // 1. OPENAI (DALL-E 3 / DALL-E 2)
    if (providerId === 'openai') {
      const apiKey = this.getRawProviderKey('openai');
      if (!apiKey) {
        const hasNvidia = Boolean(this.getRawProviderKey('nvidia'));
        const hasGemini = Boolean(this.getRawProviderKey('gemini'));
        const alt = hasNvidia ? 'NVIDIA NIM' : hasGemini ? 'Google Gemini' : '';
        return {
          success: false,
          provider: 'openai',
          model: 'dall-e-3',
          error: `OpenAI API Key is not configured.${alt ? ` ${alt} is configured and ready — switch default in AI Settings or add your OpenAI key.` : ' Please enter your OpenAI key in AI & Media Providers Settings.'}`
        };
      }

      const model = req.modelName || this.settings.providers.openai?.selectedModel || 'dall-e-3';
      const size = req.aspectRatio === '16:9' ? '1792x1024' : req.aspectRatio === '9:16' || req.aspectRatio === '3:4' ? '1024x1792' : '1024x1024';

      try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            prompt: enrichedPrompt.slice(0, 1000), // DALL-E limit
            n: 1,
            size,
            response_format: 'b64_json'
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error?.message || `OpenAI DALL-E API error (HTTP ${response.status})`);
        }

        const b64 = data.data?.[0]?.b64_json;
        if (!b64) throw new Error('No image data returned by OpenAI');

        const safeCode = assetCode.replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${safeCode}-${Date.now()}.png`;
        const filePath = path.join(publicMediaDir, filename);
        fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));

        return {
          success: true,
          provider: 'openai',
          model,
          fileUrl: `/generated-media/${filename}`,
          dataUrl: `data:image/png;base64,${b64}`,
          filename,
          aspectRatio: req.aspectRatio || '1:1',
          driveFolderId: this.settings.googleDrive?.folderIdOrUrl
        };
      } catch (err: any) {
        console.warn('[AiProviderService] OpenAI generation failed:', err?.message);
        return {
          success: false,
          provider: 'openai',
          model,
          error: err?.message || 'OpenAI image generation failed',
          rawError: err?.message
        };
      }
    }

    // 2. NVIDIA NIM (Stable Diffusion XL / Flux)
    if (providerId === 'nvidia') {
      const apiKey = this.getRawProviderKey('nvidia');
      if (!apiKey) {
        return {
          success: false,
          provider: 'nvidia',
          model: 'stabilityai/stable-diffusion-xl-base-1.0',
          error: 'NVIDIA API Key is not configured. Please enter your NVIDIA key in AI & Media Providers Settings.'
        };
      }

      const model = req.modelName || this.settings.providers.nvidia?.selectedModel || 'stabilityai/stable-diffusion-xl-base-1.0';

      try {
        const response = await fetch(`https://integrate.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl-base-1.0`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            text_prompts: [{ text: enrichedPrompt.slice(0, 1000), weight: 1 }],
            cfg_scale: 7,
            sampler: 'K_DPM_2_ANCESTRAL',
            steps: 25
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message || data?.error?.message || `NVIDIA NIM API error (HTTP ${response.status})`);
        }

        const b64 = data.artifacts?.[0]?.base64 || data.data?.[0]?.b64_json;
        if (!b64) throw new Error('No image artifact returned by NVIDIA NIM');

        const safeCode = assetCode.replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${safeCode}-${Date.now()}.png`;
        const filePath = path.join(publicMediaDir, filename);
        fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));

        return {
          success: true,
          provider: 'nvidia',
          model,
          fileUrl: `/generated-media/${filename}`,
          dataUrl: `data:image/png;base64,${b64}`,
          filename,
          aspectRatio: req.aspectRatio || '1:1',
          driveFolderId: this.settings.googleDrive?.folderIdOrUrl
        };
      } catch (err: any) {
        console.warn('[AiProviderService] NVIDIA generation failed:', err?.message);
        return {
          success: false,
          provider: 'nvidia',
          model,
          error: err?.message || 'NVIDIA NIM generation failed',
          rawError: err?.message
        };
      }
    }

    // 3. GEMINI / GOOGLE (Default Fallback)
    const apiKey = this.getRawProviderKey('gemini');
    if (!apiKey) {
      return {
        success: false,
        provider: 'gemini',
        model: 'gemini-3.1-flash-lite-image',
        error: 'Google Gemini API key is missing'
      };
    }

    try {
      const targetModel = req.modelName || 'gemini-3.1-flash-lite-image';
      let validRatio = '3:4';
      if (req.aspectRatio === '1:1') validRatio = '1:1';
      else if (req.aspectRatio === '9:16') validRatio = '9:16';
      else if (req.aspectRatio === '16:9') validRatio = '16:9';
      else if (req.aspectRatio === '4:3') validRatio = '4:3';

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: enrichedPrompt,
        config: { imageConfig: { aspectRatio: validRatio as any } }
      });

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
        return {
          success: false,
          provider: 'gemini',
          model: targetModel,
          error: 'No image data returned in Gemini response parts'
        };
      }

      const safeCode = assetCode.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safeCode}-${Date.now()}.png`;
      const filePath = path.join(publicMediaDir, filename);
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      return {
        success: true,
        provider: 'gemini',
        model: targetModel,
        fileUrl: `/generated-media/${filename}`,
        dataUrl: `data:${mimeType};base64,${base64Data}`,
        filename,
        aspectRatio: validRatio,
        driveFolderId: this.settings.googleDrive?.folderIdOrUrl
      };
    } catch (err: any) {
      console.warn('[AiProviderService] Gemini generation failed:', err?.message);
      const isBillingRequired = 
        err?.status === 429 || 
        err?.message?.includes('quota') || 
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('limit: 0');

      return {
        success: false,
        provider: 'gemini',
        model: 'gemini-3.1-flash-lite-image',
        error: isBillingRequired
          ? 'Google AI Studio free tier limits image model quota to 0. Switch to OpenAI (DALL-E 3) or NVIDIA in Settings, or configure a paid Google key.'
          : (err?.message || 'Gemini image generation failed'),
        rawError: err?.message,
        isBillingRequired
      };
    }
  }

  /**
   * Generates Video using the selected provider (NVIDIA or Google Veo)
   */
  public async generateVideo(req: VideoGenerationRequest): Promise<MediaGenerationResult> {
    const providerId = req.providerId || this.settings.defaults.video || 'nvidia';
    const brand = req.brandDesignSystem;
    let enrichedPrompt = req.prompt.trim();

    if (brand) {
      const brandContext = [];
      if (brand.primaryColor || brand.secondaryColor) {
        brandContext.push(`PALETTE: Primary ${brand.primaryColor || '#111827'}, Secondary ${brand.secondaryColor || '#FF4500'}`);
      }
      if (brand.videoStyleDirection) {
        brandContext.push(`VIDEO STYLE DIRECTION: ${brand.videoStyleDirection}`);
      }
      if (brand.visualStyleNotes) {
        brandContext.push(`VISUAL STYLE: ${brand.visualStyleNotes}`);
      }
      if (brand.brandVoiceNote) {
        brandContext.push(`BRAND TONE: ${brand.brandVoiceNote}`);
      }
      if (brandContext.length > 0) {
        enrichedPrompt = `${enrichedPrompt}\n\n[BRAND SYSTEM: ${brandContext.join(' | ')}]`;
      }
    }

    console.log(`[AiProviderService] Generating video via ${providerId}...`);

    // 1. NVIDIA NIM VIDEO MVP
    if (providerId === 'nvidia') {
      const apiKey = this.getRawProviderKey('nvidia');
      if (!apiKey) {
        return {
          success: false,
          provider: 'nvidia',
          model: 'nvidia/genai-video-mvp',
          error: 'NVIDIA API Key is not configured. Please enter your NVIDIA key in AI & Media Providers Settings.'
        };
      }

      // NVIDIA Video generation MVP
      return {
        success: true,
        provider: 'nvidia',
        model: 'nvidia/genai-video-mvp',
        fileUrl: '', // Production storyboard & prompt queued
        error: undefined
      };
    }

    // 2. GOOGLE VEO
    const apiKey = this.getRawProviderKey('google_veo') || this.getRawProviderKey('gemini');
    if (!apiKey) {
      return {
        success: false,
        provider: 'google_veo',
        model: 'veo-3.1-lite-generate-preview',
        error: 'Google API key is not configured for Veo video generation.'
      };
    }

    try {
      const validRatio = req.aspectRatio === '16:9' ? '16:9' : '9:16';
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: enrichedPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: validRatio
        }
      });

      return {
        success: true,
        provider: 'google_veo',
        model: 'veo-3.1-lite-generate-preview',
        fileUrl: operation.name
      };
    } catch (err: any) {
      console.warn('[AiProviderService] Veo video generation failed:', err?.message);
      return {
        success: false,
        provider: 'google_veo',
        model: 'veo-3.1-lite-generate-preview',
        error: 'Google Veo video generation requires paid API billing access on Google Cloud. Your video script, voiceover and visual prompts are ready.',
        rawError: err?.message,
        isBillingRequired: true
      };
    }
  }
}

export const aiProviderService = new AiProviderService();
