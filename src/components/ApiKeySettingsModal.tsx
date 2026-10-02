import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  X, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  Lock,
  Copy,
  Download,
  RefreshCw,
  Database,
  Table,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Mail,
  FolderSync,
  Radio,
  Loader2,
  HardDrive
} from 'lucide-react';
import { autonomaDataService } from '../services/autonomaDataService';
import { AUTONOMA_APPS_SCRIPT_CONNECTOR } from '../services/autonomaGoogleAppsScript';
import { AiProvidersSettings, TransactionalEmailConfig } from '../types/auth';

interface ApiKeySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  openaiKey: string;
  setOpenaiKey: (key: string) => void;
  geminiPaidKey?: string;
  setGeminiPaidKey?: (key: string) => void;
  sheetsWebhookUrl: string;
  setSheetsWebhookUrl: (url: string) => void;
  onDataRefreshed?: (campaigns: any[], assets: any[]) => void;
}

export const ApiKeySettingsModal: React.FC<ApiKeySettingsModalProps> = ({
  isOpen,
  onClose,
  openaiKey,
  setOpenaiKey,
  geminiPaidKey = '',
  setGeminiPaidKey,
  sheetsWebhookUrl,
  setSheetsWebhookUrl,
  onDataRefreshed
}) => {
  const [activeTab, setActiveTab] = useState<'providers' | 'email' | 'sheets'>('providers');
  
  // AI & Media Providers State
  const [providersSettings, setProvidersSettings] = useState<AiProvidersSettings>({
    defaults: { text: 'gemini', image: 'openai', video: 'nvidia' },
    providers: {
      gemini: {
        id: 'gemini',
        name: 'Google Gemini',
        capabilities: ['text', 'image', 'video'],
        selectedModel: 'gemini-3.8-flash',
        availableModels: ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-3.1-flash-lite-image'],
        status: 'CONFIGURED'
      },
      openai: {
        id: 'openai',
        name: 'OpenAI',
        capabilities: ['text', 'image'],
        selectedModel: 'dall-e-3',
        availableModels: ['dall-e-3', 'dall-e-2', 'gpt-4o', 'gpt-4o-mini'],
        status: 'UNCONFIGURED'
      },
      nvidia: {
        id: 'nvidia',
        name: 'NVIDIA NIM',
        capabilities: ['image', 'video'],
        selectedModel: 'stabilityai/stable-diffusion-xl-base-1.0',
        availableModels: ['stabilityai/stable-diffusion-xl-base-1.0', 'black-forest-labs/flux-1-schnell', 'nvidia/genai-video-mvp'],
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
    googleDrive: { folderIdOrUrl: '', enabled: false }
  });

  // Email Config State
  const [emailConfig, setEmailConfig] = useState<TransactionalEmailConfig>({
    provider: 'system',
    status: 'CONFIGURED'
  });

  // Input fields for provider keys
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [driveInput, setDriveInput] = useState('');
  const [testResults, setTestResults] = useState<Record<string, { testing?: boolean; success?: boolean; message?: string; latency?: number }>>({});

  // Email testing
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  // Sheets Integration States
  const [localWebhook, setLocalWebhook] = useState(sheetsWebhookUrl);
  const [isServerSecretSheets, setIsServerSecretSheets] = useState(false);
  const [isTestingSheets, setIsTestingSheets] = useState(false);
  const [sheetsTestResult, setSheetsTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);
  const [isRefreshingFromSheets, setIsRefreshingFromSheets] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initResult, setInitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      autonomaDataService.getAiProviders().then((res) => {
        if (res.aiProviders) {
          setProvidersSettings(res.aiProviders);
          setDriveInput(res.aiProviders.googleDrive?.folderIdOrUrl || '');
          const initialKeys: Record<string, string> = {};
          for (const [id, prov] of Object.entries(res.aiProviders.providers as Record<string, any>)) {
            if (prov.apiKey) initialKeys[id] = prov.apiKey;
          }
          setKeyInputs(initialKeys);
        }
        if (res.emailConfig) {
          setEmailConfig(res.emailConfig);
        }
      }).catch((e) => console.warn('Provider settings load:', e));

      autonomaDataService.loadSettings().then((res: any) => {
        if (res.isServerSecret || res.sheetsSource === 'server_secret') {
          setIsServerSecretSheets(true);
        }
        if (res.googleSheetsUrl) {
          setLocalWebhook(res.googleSheetsUrl);
          setSheetsWebhookUrl(res.googleSheetsUrl);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAll = async () => {
    // 1. Build updated providers payload
    const updatedProviders: Record<string, any> = {};
    for (const [id, prov] of Object.entries(providersSettings.providers)) {
      const inputKey = keyInputs[id];
      updatedProviders[id] = {
        ...prov,
        apiKey: inputKey !== undefined ? inputKey : prov.apiKey
      };
    }

    const payload = {
      aiProviders: {
        defaults: providersSettings.defaults,
        providers: updatedProviders,
        googleDrive: {
          folderIdOrUrl: driveInput.trim(),
          enabled: Boolean(driveInput.trim())
        }
      },
      emailConfig
    };

    await autonomaDataService.updateAiProviders(payload);

    // Save legacy keys for backward compatibility
    if (keyInputs.openai) setOpenaiKey(keyInputs.openai);
    if (keyInputs.gemini && setGeminiPaidKey) setGeminiPaidKey(keyInputs.gemini);

    // Save sheets webhook
    setSheetsWebhookUrl(localWebhook);
    await autonomaDataService.updateSettings({}, localWebhook);

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  const handleTestProvider = async (providerId: string) => {
    setTestResults((prev) => ({ ...prev, [providerId]: { testing: true } }));
    try {
      const res = await autonomaDataService.testAiProvider(providerId, keyInputs[providerId]);
      setTestResults((prev) => ({
        ...prev,
        [providerId]: {
          testing: false,
          success: res.success,
          message: res.message,
          latency: res.latencyMs
        }
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: {
          testing: false,
          success: false,
          message: err?.message || 'Connection test failed'
        }
      }));
    }
  };

  const handleTestEmail = async () => {
    setEmailTesting(true);
    setEmailTestResult(null);
    try {
      const res = await autonomaDataService.testEmailDelivery(testEmailAddress.trim() || undefined, emailConfig);
      setEmailTestResult({
        success: res.success,
        message: res.message || (res.success ? 'Email test passed!' : 'Email test failed'),
        latency: res.latencyMs
      });
    } catch (err: any) {
      setEmailTestResult({
        success: false,
        message: err?.message || 'Failed to send test email'
      });
    } finally {
      setEmailTesting(false);
    }
  };

  const handleTestSheets = async () => {
    const isSecretOnly = isServerSecretSheets && (!localWebhook.trim() || localWebhook.includes('SERVER_SECRET'));
    if (!localWebhook.trim() && !isServerSecretSheets) {
      setSheetsTestResult({ success: false, message: 'Please enter a Google Apps Script Web App URL first.' });
      return;
    }
    setIsTestingSheets(true);
    setSheetsTestResult(null);
    try {
      const urlToTest = isSecretOnly ? '' : localWebhook.trim();
      const res = await autonomaDataService.testGoogleSheetsConnection(urlToTest);
      setSheetsTestResult({
        success: res.success,
        message: res.message || (res.success ? 'Google Sheets Web App connected!' : 'Connection test failed'),
        latency: res.latencyMs
      });
    } catch (err: any) {
      setSheetsTestResult({
        success: false,
        message: err?.message || 'Failed to connect to Google Sheets Web App'
      });
    } finally {
      setIsTestingSheets(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative w-full max-w-3xl rounded-3xl border border-black/[0.08] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4 bg-[#FBFBFD]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-50 text-[#FF4500]">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1D1D1F]">AI & Media Providers Settings</h3>
              <p className="text-xs text-[#6E6E73]">
                Configure AI generation providers, transactional email & storage
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-[#6E6E73] hover:bg-black/[0.05] hover:text-[#1D1D1F]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-black/[0.06] bg-slate-50/70 px-6 pt-2 gap-2 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex items-center gap-2 px-3.5 py-2.5 font-semibold transition-all border-b-2 shrink-0 ${
              activeTab === 'providers'
                ? 'border-[#FF4500] text-[#FF4500]'
                : 'border-transparent text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI & Media Providers</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-3.5 py-2.5 font-semibold transition-all border-b-2 shrink-0 ${
              activeTab === 'email'
                ? 'border-[#FF4500] text-[#FF4500]'
                : 'border-transparent text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Transactional Email (Invites)</span>
          </button>
          <button
            onClick={() => setActiveTab('sheets')}
            className={`flex items-center gap-2 px-3.5 py-2.5 font-semibold transition-all border-b-2 shrink-0 ${
              activeTab === 'sheets'
                ? 'border-[#FF4500] text-[#FF4500]'
                : 'border-transparent text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Table className="h-3.5 w-3.5" />
            <span>Google Sheets & Database</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: AI & MEDIA PROVIDERS */}
          {activeTab === 'providers' && (
            <div className="space-y-6">
              {/* Capability Defaults Matrix */}
              <div className="rounded-2xl border border-black/[0.06] bg-slate-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                    Default Capability Providers
                  </span>
                  <span className="text-[10px] text-[#86868B]">GLOBAL DEFAULTS</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-medium text-[#6E6E73] block mb-1">Text Generation</label>
                    <select
                      value={providersSettings.defaults.text}
                      onChange={(e) => setProvidersSettings((prev) => ({
                        ...prev,
                        defaults: { ...prev.defaults, text: e.target.value }
                      }))}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-2.5 py-2 text-xs font-semibold outline-none"
                    >
                      <option value="gemini">Google Gemini (Recommended)</option>
                      <option value="openai">OpenAI (GPT-4o)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#6E6E73] block mb-1">Image Generation</label>
                    <select
                      value={providersSettings.defaults.image}
                      onChange={(e) => setProvidersSettings((prev) => ({
                        ...prev,
                        defaults: { ...prev.defaults, image: e.target.value }
                      }))}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-2.5 py-2 text-xs font-semibold outline-none"
                    >
                      <option value="openai">OpenAI (DALL-E 3)</option>
                      <option value="nvidia">NVIDIA NIM (SDXL / Flux)</option>
                      <option value="gemini">Google Gemini Flash Image</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-[#6E6E73] block mb-1">Video Generation</label>
                    <select
                      value={providersSettings.defaults.video}
                      onChange={(e) => setProvidersSettings((prev) => ({
                        ...prev,
                        defaults: { ...prev.defaults, video: e.target.value }
                      }))}
                      className="w-full rounded-xl border border-black/[0.08] bg-white px-2.5 py-2 text-xs font-semibold outline-none"
                    >
                      <option value="nvidia">NVIDIA NIM Video MVP</option>
                      <option value="google_veo">Google Veo (3.1 Lite)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Provider Cards */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                  Configured AI Providers
                </div>

                {/* 1. Google Gemini */}
                <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#1D1D1F]">Google Gemini</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700">TEXT · IMAGE · VIDEO</span>
                    </div>
                    <button
                      onClick={() => handleTestProvider('gemini')}
                      disabled={testResults.gemini?.testing}
                      className="text-[11px] font-medium text-[#FF4500] hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      {testResults.gemini?.testing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      Test Connection
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label className="space-y-1 block">
                      <span className="text-[10px] text-[#6E6E73]">API Key (leave blank to use system env)</span>
                      <input
                        type="password"
                        placeholder="AIzaSy... (masked if saved)"
                        value={keyInputs.gemini || ''}
                        onChange={(e) => setKeyInputs((prev) => ({ ...prev, gemini: e.target.value }))}
                        className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3 py-1.5 text-xs font-mono outline-none"
                      />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[10px] text-[#6E6E73]">Model selector</span>
                      <select
                        value={providersSettings.providers.gemini?.selectedModel || 'gemini-3.8-flash'}
                        onChange={(e) => setProvidersSettings((prev) => ({
                          ...prev,
                          providers: {
                            ...prev.providers,
                            gemini: { ...prev.providers.gemini, selectedModel: e.target.value }
                          }
                        }))}
                        className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3 py-1.5 text-xs outline-none"
                      >
                        <option value="gemini-3.8-flash">gemini-3.8-flash (Primary)</option>
                        <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                        <option value="gemini-3.1-flash-lite-image">gemini-3.1-flash-lite-image</option>
                      </select>
                    </label>
                  </div>
                  {testResults.gemini && (
                    <div className={`p-2 rounded-xl text-[11px] ${testResults.gemini.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                      {testResults.gemini.message}
                    </div>
                  )}
                </div>

                {/* 2. OpenAI */}
                <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#1D1D1F]">OpenAI</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700">IMAGE (DALL-E) · TEXT</span>
                    </div>
                    <button
                      onClick={() => handleTestProvider('openai')}
                      disabled={testResults.openai?.testing}
                      className="text-[11px] font-medium text-[#FF4500] hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      {testResults.openai?.testing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      Test Connection
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label className="space-y-1 block">
                      <span className="text-[10px] text-[#6E6E73]">OpenAI API Key</span>
                      <input
                        type="password"
                        placeholder="sk-proj-... (masked if saved)"
                        value={keyInputs.openai || ''}
                        onChange={(e) => setKeyInputs((prev) => ({ ...prev, openai: e.target.value }))}
                        className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3 py-1.5 text-xs font-mono outline-none"
                      />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[10px] text-[#6E6E73]">Image Model</span>
                      <select
                        value={providersSettings.providers.openai?.selectedModel || 'dall-e-3'}
                        onChange={(e) => setProvidersSettings((prev) => ({
                          ...prev,
                          providers: {
                            ...prev.providers,
                            openai: { ...prev.providers.openai, selectedModel: e.target.value }
                          }
                        }))}
                        className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3 py-1.5 text-xs outline-none"
                      >
                        <option value="dall-e-3">dall-e-3 (High definition)</option>
                        <option value="dall-e-2">dall-e-2</option>
                      </select>
                    </label>
                  </div>
                  {testResults.openai && (
                    <div className={`p-2 rounded-xl text-[11px] ${testResults.openai.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                      {testResults.openai.message}
                    </div>
                  )}
                </div>

                {/* 3. NVIDIA NIM */}
                <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#1D1D1F]">NVIDIA NIM</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-50 text-purple-700">IMAGE (SDXL/FLUX) · VIDEO</span>
                    </div>
                    <button
                      onClick={() => handleTestProvider('nvidia')}
                      disabled={testResults.nvidia?.testing}
                      className="text-[11px] font-medium text-[#FF4500] hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      {testResults.nvidia?.testing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      Test Connection
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label className="space-y-1 block">
                      <span className="text-[10px] text-[#6E6E73]">NVIDIA API Key (nvapi-...)</span>
                      <input
                        type="password"
                        placeholder="nvapi-... (masked if saved)"
                        value={keyInputs.nvidia || ''}
                        onChange={(e) => setKeyInputs((prev) => ({ ...prev, nvidia: e.target.value }))}
                        className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3 py-1.5 text-xs font-mono outline-none"
                      />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[10px] text-[#6E6E73]">Model selector</span>
                      <select
                        value={providersSettings.providers.nvidia?.selectedModel || 'stabilityai/stable-diffusion-xl-base-1.0'}
                        onChange={(e) => setProvidersSettings((prev) => ({
                          ...prev,
                          providers: {
                            ...prev.providers,
                            nvidia: { ...prev.providers.nvidia, selectedModel: e.target.value }
                          }
                        }))}
                        className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3 py-1.5 text-xs outline-none"
                      >
                        <option value="stabilityai/stable-diffusion-xl-base-1.0">stabilityai/stable-diffusion-xl-base-1.0</option>
                        <option value="black-forest-labs/flux-1-schnell">black-forest-labs/flux-1-schnell</option>
                        <option value="nvidia/genai-video-mvp">nvidia/genai-video-mvp</option>
                      </select>
                    </label>
                  </div>
                  {testResults.nvidia && (
                    <div className={`p-2 rounded-xl text-[11px] ${testResults.nvidia.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                      {testResults.nvidia.message}
                    </div>
                  )}
                </div>

                {/* 4. Google Drive Destination (Requirement 7) */}
                <div className="rounded-2xl border border-black/[0.06] bg-slate-50/70 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-[#FF4500]" />
                    <span className="font-semibold text-xs text-[#1D1D1F]">Google Drive Media Storage Destination</span>
                  </div>
                  <p className="text-[11px] text-[#6E6E73]">
                    Generated media is tracked in durable internal DB records. Enter an optional Google Drive folder URL or ID for asset destination mapping.
                  </p>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/drive/folders/... or Folder ID"
                    value={driveInput}
                    onChange={(e) => setDriveInput(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRANSACTIONAL EMAIL */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-black/[0.06] bg-slate-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                    Transactional Delivery Provider
                  </span>
                  <span className="text-[10px] text-[#86868B]">REAL EMAIL DISPATCH</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="emailProvider"
                      value="system"
                      checked={emailConfig.provider === 'system'}
                      onChange={() => setEmailConfig((p) => ({ ...p, provider: 'system' }))}
                    />
                    <span>Autonoma Internal Delivery (Test Ethereal Preview)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="emailProvider"
                      value="resend"
                      checked={emailConfig.provider === 'resend'}
                      onChange={() => setEmailConfig((p) => ({ ...p, provider: 'resend' }))}
                    />
                    <span>Resend API</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="emailProvider"
                      value="smtp"
                      checked={emailConfig.provider === 'smtp'}
                      onChange={() => setEmailConfig((p) => ({ ...p, provider: 'smtp' }))}
                    />
                    <span>Custom SMTP Server</span>
                  </label>
                </div>
              </div>

              {emailConfig.provider === 'resend' && (
                <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-2xs space-y-3">
                  <span className="font-semibold text-xs text-[#1D1D1F]">Resend API Configuration</span>
                  <label className="space-y-1 block text-xs">
                    <span className="text-[10px] text-[#6E6E73]">Resend API Key (re_...)</span>
                    <input
                      type="password"
                      placeholder="re_••••••••"
                      value={emailConfig.resendApiKey || ''}
                      onChange={(e) => setEmailConfig((p) => ({ ...p, resendApiKey: e.target.value }))}
                      className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3 py-1.5 text-xs font-mono outline-none"
                    />
                  </label>
                  <label className="space-y-1 block text-xs">
                    <span className="text-[10px] text-[#6E6E73]">From Address (e.g. Autonoma &lt;onboarding@resend.dev&gt;)</span>
                    <input
                      type="text"
                      placeholder="Autonoma <onboarding@resend.dev>"
                      value={emailConfig.smtpFrom || ''}
                      onChange={(e) => setEmailConfig((p) => ({ ...p, smtpFrom: e.target.value }))}
                      className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3 py-1.5 text-xs outline-none"
                    />
                  </label>
                </div>
              )}

              {emailConfig.provider === 'smtp' && (
                <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-2xs space-y-3 text-xs">
                  <span className="font-semibold text-xs text-[#1D1D1F]">Custom SMTP Settings</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="space-y-1 block">
                      <span className="text-[10px] text-[#6E6E73]">SMTP Host</span>
                      <input
                        placeholder="smtp.example.com"
                        value={emailConfig.smtpHost || ''}
                        onChange={(e) => setEmailConfig((p) => ({ ...p, smtpHost: e.target.value }))}
                        className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3 py-1.5 text-xs outline-none"
                      />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[10px] text-[#6E6E73]">Port</span>
                      <input
                        type="number"
                        placeholder="587"
                        value={emailConfig.smtpPort || ''}
                        onChange={(e) => setEmailConfig((p) => ({ ...p, smtpPort: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3 py-1.5 text-xs outline-none"
                      />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[10px] text-[#6E6E73]">Username</span>
                      <input
                        placeholder="user@example.com"
                        value={emailConfig.smtpUser || ''}
                        onChange={(e) => setEmailConfig((p) => ({ ...p, smtpUser: e.target.value }))}
                        className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3 py-1.5 text-xs outline-none"
                      />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[10px] text-[#6E6E73]">Password</span>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={emailConfig.smtpPass || ''}
                        onChange={(e) => setEmailConfig((p) => ({ ...p, smtpPass: e.target.value }))}
                        className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3 py-1.5 text-xs outline-none"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Test Email Dispatch */}
              <div className="rounded-2xl border border-black/[0.06] bg-slate-50/70 p-4 space-y-3">
                <span className="font-semibold text-xs text-[#1D1D1F] block">Send Test Transactional Email</span>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter recipient email address..."
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    className="flex-1 rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-xs outline-none"
                  />
                  <button
                    onClick={handleTestEmail}
                    disabled={emailTesting}
                    className="px-4 py-2 bg-[#0A0B0E] hover:bg-black text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                  >
                    {emailTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                    <span>{emailTesting ? 'Sending…' : 'Send Test'}</span>
                  </button>
                </div>

                {emailTestResult && (
                  <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${emailTestResult.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                    {emailTestResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />}
                    <span>{emailTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE SHEETS & DATABASE */}
          {activeTab === 'sheets' && (
            <div className="space-y-5">
              {isServerSecretSheets && (
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-50/80 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                          Google Sheets
                        </span>
                        <span className="text-xs font-bold text-emerald-700">
                          CONNECTED / CONFIGURED SERVER-SIDE
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200/70 text-emerald-800 font-bold">
                      SERVER SECRET ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800/90 leading-relaxed">
                    Connected securely via runtime environment secret. Synchronization and hydration survive deployments and restarts automatically. You do not need to paste the URL again.
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-black/[0.06] bg-slate-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">
                    {isServerSecretSheets ? 'Workspace URL Override (Optional)' : 'Google Sheets Synchronization URL'}
                  </span>
                  <span className="text-[10px] text-[#86868B]">WEB APP CONNECTOR</span>
                </div>
                <input
                  type="url"
                  placeholder={isServerSecretSheets ? "Leave blank to continue using server-side secret" : "https://script.google.com/macros/s/.../exec"}
                  value={localWebhook.includes('SERVER_SECRET') ? '' : localWebhook}
                  onChange={(e) => setLocalWebhook(e.target.value)}
                  className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-xs outline-none font-mono"
                />
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={handleTestSheets}
                    disabled={isTestingSheets}
                    className="text-xs font-semibold text-[#FF4500] hover:underline flex items-center gap-1"
                  >
                    {isTestingSheets ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Test Sheets Webhook Connection
                  </button>
                  <button
                    onClick={() => setShowSetupGuide(!showSetupGuide)}
                    className="text-xs text-[#6E6E73] hover:text-[#1D1D1F] flex items-center gap-1"
                  >
                    <span>Connector Code</span>
                    {showSetupGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {sheetsTestResult && (
                  <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${sheetsTestResult.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                    {sheetsTestResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />}
                    <span>{sheetsTestResult.message}</span>
                  </div>
                )}

                {showSetupGuide && (
                  <div className="mt-3 p-3 bg-black/5 rounded-xl space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#6E6E73]">Apps Script Connector Code</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(AUTONOMA_APPS_SCRIPT_CONNECTOR);
                          setCodeCopied(true);
                          setTimeout(() => setCodeCopied(false), 2000);
                        }}
                        className="text-[11px] text-[#FF4500] hover:underline flex items-center gap-1"
                      >
                        {codeCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{codeCopied ? 'Copied' : 'Copy script'}</span>
                      </button>
                    </div>
                    <pre className="max-h-40 overflow-y-auto p-2 bg-white rounded-lg text-[10px] text-[#333]">
                      {AUTONOMA_APPS_SCRIPT_CONNECTOR.slice(0, 400)}...
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-black/[0.06] px-6 py-4 bg-[#FBFBFD]">
          <span className="text-xs text-[#6E6E73]">
            Changes take effect immediately across all client and backend synthesis flows.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-black/[0.08] text-xs font-medium text-[#1D1D1F] hover:bg-black/[0.03]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
            >
              {saved ? <CheckCircle2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              <span>{saved ? 'Saved!' : 'Save Provider Settings'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
