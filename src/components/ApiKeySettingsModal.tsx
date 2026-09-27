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
  ChevronUp
} from 'lucide-react';
import { autonomaDataService } from '../services/autonomaDataService';
import { AUTONOMA_APPS_SCRIPT_CONNECTOR } from '../services/autonomaGoogleAppsScript';

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
  const [localOpenai, setLocalOpenai] = useState(openaiKey);
  const [localGeminiPaid, setLocalGeminiPaid] = useState(geminiPaidKey);
  const [localWebhook, setLocalWebhook] = useState(sheetsWebhookUrl);
  const [saved, setSaved] = useState(false);

  // Sheets Integration States
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);
  const [isRefreshingFromSheets, setIsRefreshingFromSheets] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initResult, setInitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  useEffect(() => {
    if (isOpen) {
      autonomaDataService.loadSettings().then(res => {
        if (res.googleSheetsUrl) {
          setLocalWebhook(res.googleSheetsUrl);
          setSheetsWebhookUrl(res.googleSheetsUrl);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setOpenaiKey(localOpenai);
    if (setGeminiPaidKey) setGeminiPaidKey(localGeminiPaid);
    setSheetsWebhookUrl(localWebhook);
    await autonomaDataService.updateSettings({}, localWebhook);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  const handleTestConnection = async () => {
    if (!localWebhook.trim()) {
      setTestResult({ success: false, message: 'Please enter a Google Apps Script Web App URL first.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await autonomaDataService.testGoogleSheetsConnection(localWebhook.trim());
      setTestResult({
        success: res.success,
        message: res.message || (res.success ? 'Google Sheets Web App connected!' : 'Connection test failed'),
        latency: res.latencyMs
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Failed to connect to Google Sheets Web App'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleInitSheet = async () => {
    if (!localWebhook.trim()) {
      setInitResult({ success: false, message: 'Please enter a Google Apps Script Web App URL first.' });
      return;
    }
    setIsInitializing(true);
    setInitResult(null);
    try {
      const res = await autonomaDataService.initGoogleSheet(localWebhook.trim());
      setInitResult({
        success: res.success,
        message: res.message
      });
    } catch (err: any) {
      setInitResult({
        success: false,
        message: err?.message || 'Failed to initialize sheet tables'
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await autonomaDataService.syncGoogleSheets();
      setSyncResult({
        success: res.success,
        message: res.message
      });
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err?.message || 'Sync failed'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefreshFromSheets = async () => {
    setIsRefreshingFromSheets(true);
    setRefreshResult(null);
    try {
      const res = await autonomaDataService.refreshFromGoogleSheets();
      if (res.success) {
        setRefreshResult({
          success: true,
          message: `Hydrated ${res.campaigns} campaigns and ${res.assets} assets from Google Sheets!`
        });
        const [freshCampaigns, freshAssets] = await Promise.all([
          autonomaDataService.loadCampaigns(),
          autonomaDataService.loadAssets()
        ]);
        if (onDataRefreshed) {
          onDataRefreshed(freshCampaigns, freshAssets);
        }
      } else {
        setRefreshResult({
          success: false,
          message: res.error || 'Failed to refresh data from Google Sheets'
        });
      }
    } catch (err: any) {
      setRefreshResult({
        success: false,
        message: err?.message || 'Error refreshing data from Google Sheets'
      });
    } finally {
      setIsRefreshingFromSheets(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(AUTONOMA_APPS_SCRIPT_CONNECTOR);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl max-w-2xl w-full p-4 sm:p-7 space-y-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 text-[#1D1D1F]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-black/[0.04] text-[#1D1D1F] flex items-center justify-center">
              <Settings className="w-4 h-4 text-[#FF4500]" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#1D1D1F]">
                Settings & Durable Persistence
              </h3>
              <p className="text-xs text-[#86868B]">
                Configure durable Google Sheets database and server-side model credentials
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Server-Side Durable Storage Architecture Banner */}
        <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
          <div className="font-semibold flex items-center space-x-1.5 text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Durable Operational Database Active</span>
          </div>
          <p className="text-[12px] text-emerald-950/80 leading-relaxed">
            Autonoma campaigns and assets persist durably server-side to survive restarts, rebuilds, and redeployments. When paired with Google Sheets, all 8 tables sync automatically via Google Apps Script without paid middleware.
          </p>
        </div>

        {/* SECTION 1: Google Sheets Operational Database */}
        <div className="p-5 bg-[#FBFBFD] rounded-2xl border border-black/[0.06] space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-black/[0.04] pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Database className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#1D1D1F]">
                  Google Sheets Operational Database
                </h4>
                <p className="text-[11px] text-[#6E6E73]">
                  8-table workbook: CAMPAIGNS, ASSETS, MEDIA, PUBLISHING, PERFORMANCE, SNAPSHOTS, SETTINGS, LOGS
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSetupGuide(!showSetupGuide)}
              className="text-[#FF4500] hover:text-[#EA3E00] text-xs font-medium flex items-center space-x-1"
            >
              <span>{showSetupGuide ? 'Hide instructions' : 'Setup guide (30s)'}</span>
              {showSetupGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Setup Guide Accordion */}
          {showSetupGuide && (
            <div className="p-4 bg-white rounded-xl border border-black/[0.06] space-y-2.5 text-[11px] text-[#1D1D1F] animate-in fade-in duration-150">
              <span className="font-semibold text-xs text-[#1D1D1F] block">
                Quick 4-Step Google Sheet Setup (100% Free):
              </span>
              <ol className="list-decimal pl-4 space-y-1.5 text-[#424245] leading-relaxed">
                <li>Create a blank Google Sheet in your Google Drive.</li>
                <li>In Google Sheets, go to <strong>Extensions &gt; Apps Script</strong>.</li>
                <li>
                  Click <strong>Copy Connector Code</strong> below, paste it into Code.gs, and click Save.
                </li>
                <li>
                  Click <strong>Deploy &gt; New deployment</strong>, select type <strong>Web app</strong>, set <em>Execute as: "Me"</em> and <em>Who has access: "Anyone"</em>, click Deploy, and paste the Web App URL below.
                </li>
              </ol>
            </div>
          )}

          {/* Webhook Input Field */}
          <div className="space-y-1.5">
            <label className="text-[#1D1D1F] font-medium flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Table className="w-3.5 h-3.5 text-[#FF4500]" />
                <span>Google Apps Script Web App URL</span>
              </span>
              {testResult?.success ? (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>CONNECTED</span>
                </span>
              ) : testResult && !testResult.success ? (
                <span className="text-[10px] text-rose-600 font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>DISCONNECTED</span>
                </span>
              ) : localWebhook ? (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>CONNECTED</span>
                </span>
              ) : (
                <span className="text-[10px] text-rose-500 font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>DISCONNECTED</span>
                </span>
              )}
            </label>
            <input
              type="text"
              value={localWebhook}
              onChange={(e) => setLocalWebhook(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full bg-white border border-black/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#FF4500]/20 font-mono"
            />
          </div>

          {/* Interactive Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !localWebhook.trim()}
              className="px-3 py-1.5 bg-white hover:bg-black/[0.02] border border-black/[0.08] text-[#1D1D1F] font-medium rounded-xl text-xs flex items-center space-x-1.5 disabled:opacity-50 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3 h-3 text-[#FF4500] ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing connection…' : 'Test connection'}</span>
            </button>

            <button
              type="button"
              onClick={handleRefreshFromSheets}
              disabled={isRefreshingFromSheets || !localWebhook.trim()}
              className="px-3 py-1.5 bg-[#FF4500] hover:bg-[#EA3E00] text-white font-medium rounded-xl text-xs flex items-center space-x-1.5 disabled:opacity-50 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3 h-3 text-white ${isRefreshingFromSheets ? 'animate-spin' : ''}`} />
              <span>{isRefreshingFromSheets ? 'Refreshing…' : 'Refresh from Sheets'}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncData}
              disabled={isSyncing || !localWebhook.trim()}
              className="px-3 py-1.5 bg-white hover:bg-black/[0.02] border border-black/[0.08] text-[#1D1D1F] font-medium rounded-xl text-xs flex items-center space-x-1.5 disabled:opacity-50 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3 h-3 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing…' : 'Sync data now'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 bg-[#14161B] hover:bg-black text-white font-medium rounded-xl text-xs flex items-center space-x-1.5 transition-colors shadow-2xs sm:ml-auto"
            >
              {codeCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{codeCopied ? 'Connector code copied!' : 'Copy Apps Script code'}</span>
            </button>

            <a
              href="/autonoma-connector.gs"
              download="autonoma-connector.gs"
              className="px-3 py-1.5 bg-white hover:bg-black/[0.02] border border-black/[0.08] text-[#1D1D1F] font-medium rounded-xl text-xs flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3 h-3 text-[#86868B]" />
              <span>Download .gs</span>
            </a>
          </div>

          {/* Test / Refresh / Init Result Alerts */}
          {refreshResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start space-x-2 animate-in fade-in ${
              refreshResult.success ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {refreshResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              <p className="font-semibold">{refreshResult.message}</p>
            </div>
          )}

          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start space-x-2 animate-in fade-in ${
              testResult.success ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              <div>
                <p className="font-semibold">{testResult.message}</p>
                {testResult.latency && <p className="text-[11px] text-[#6E6E73] mt-0.5">Roundtrip Latency: {testResult.latency}ms</p>}
              </div>
            </div>
          )}

          {initResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start space-x-2 animate-in fade-in ${
              initResult.success ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {initResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              <p className="font-semibold">{initResult.message}</p>
            </div>
          )}

          {syncResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start space-x-2 animate-in fade-in ${
              syncResult.success ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {syncResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              <p className="font-semibold">{syncResult.message}</p>
            </div>
          )}
        </div>

        {/* SECTION 2: AI Synthesis Engines */}
        <div className="space-y-4 text-xs">
          {/* Active Model Indicator */}
          <div className="p-4 bg-[#FBFBFD] rounded-2xl border border-black/[0.06] flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-semibold text-[#1D1D1F] flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF4500]" />
                <span>Google Gemini Engine</span>
              </div>
              <p className="text-[#6E6E73] text-[11px]">
                Model: gemini-2.5-flash · Free tier campaign synthesis with calibrated narrative arcs
              </p>
            </div>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium text-[11px]">
              <Lock className="w-3 h-3" />
              <span>Active</span>
            </span>
          </div>

          {/* Paid Gemini API Key (Optional BYOK) */}
          <div className="space-y-1.5">
            <label className="text-[#1D1D1F] font-medium flex items-center justify-between">
              <span>Paid Google Gemini API Key (Optional BYOK)</span>
              <span className="text-[10px] text-[#86868B]">For Veo / Nano Banana</span>
            </label>
            <input
              type="password"
              value={localGeminiPaid}
              onChange={(e) => setLocalGeminiPaid(e.target.value)}
              placeholder="AIzaSy... (For paid image & video generation with quota > 0)"
              className="w-full bg-[#F2F2F7] border-0 rounded-xl px-3.5 py-2.5 text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#FF4500]/20 font-mono"
            />
            <p className="text-[11px] text-[#86868B]">
              Image and video models require a billing-attached key.
            </p>
          </div>

          {/* ChatGPT / OpenAI Key (Optional BYOK) */}
          <div className="space-y-1.5">
            <label className="text-[#1D1D1F] font-medium flex items-center justify-between">
              <span>OpenAI API Key (Optional BYOK)</span>
              <span className="text-[10px] text-[#86868B]">Alternative provider</span>
            </label>
            <input
              type="password"
              value={localOpenai}
              onChange={(e) => setLocalOpenai(e.target.value)}
              placeholder="sk-proj-... (Optional alternative provider)"
              className="w-full bg-[#F2F2F7] border-0 rounded-xl px-3.5 py-2.5 text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#FF4500]/20 font-mono"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="pt-3 border-t border-black/[0.06] flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl transition-all shadow-sm flex items-center space-x-1.5 active:scale-95"
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{saved ? 'Saved!' : 'Save changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
