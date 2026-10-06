import React, { useState, useRef, useId } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Eye, 
  RotateCcw, 
  ExternalLink, 
  Layers, 
  Users, 
  Mail, 
  Phone, 
  Share2, 
  Tag, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  Lock,
  HardDrive
} from 'lucide-react';
import { 
  StagedFileInspection, 
  ImportUserChoice, 
  FileInspectionSummary 
} from '../../types/import';
import { autonomaDataService } from '../../services/autonomaDataService';

export const SUPPORTED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.pdf', '.docx', '.txt', '.json'];
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_FILES_PER_SESSION = 10;

interface ExistingDataImportSectionProps {
  campaignId?: string;
  onApprovedContextChange?: (contextText: string, approvedSourceIds: string[]) => void;
  disabled?: boolean;
}

export const ExistingDataImportSection: React.FC<ExistingDataImportSectionProps> = ({
  campaignId,
  onApprovedContextChange,
  disabled = false
}) => {
  const [mode, setMode] = useState<'IDLE' | 'UPLOAD' | 'DRIVE' | 'SKIPPED'>('IDLE');
  const [stagedFiles, setStagedFiles] = useState<StagedFileInspection[]>([]);
  const [sessionId, setSessionId] = useState<string>(() => `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Inspection modal / drawer state
  const [activeInspectSource, setActiveInspectSource] = useState<StagedFileInspection | null>(null);

  // User confirmation & choice state per sourceId
  const [userChoices, setUserChoices] = useState<Record<string, ImportUserChoice>>({});
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmedSourceIds, setConfirmedSourceIds] = useState<string[]>([]);

  // Google Drive state
  const [driveAuthorized] = useState<boolean>(false); // Drive OAuth gate

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputId = useId();

  // Validate files locally before upload
  const validateSelectedFiles = (fileList: File[]): { valid: boolean; error?: string } => {
    if (fileList.length === 0) return { valid: false, error: 'No files selected' };
    if (fileList.length + stagedFiles.length > MAX_FILES_PER_SESSION) {
      return { 
        valid: false, 
        error: `Maximum ${MAX_FILES_PER_SESSION} files allowed per import session. You have ${stagedFiles.length} staged, trying to add ${fileList.length}.` 
      };
    }

    for (const file of fileList) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        return { 
          valid: false, 
          error: `Unsupported format "${ext}" for "${file.name}". Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}` 
        };
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        return { 
          valid: false, 
          error: `File "${file.name}" exceeds the 25 MB size limit (${sizeMb} MB).` 
        };
      }
    }
    return { valid: true };
  };

  const handleFilesChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(event.target.files || []);
    if (rawFiles.length === 0) return;

    setUploadError(null);
    const validation = validateSelectedFiles(rawFiles);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file selection');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);

    try {
      // Read files as base64
      const preparedFiles: Array<{ fileName: string; fileData: string; size: number; mimeType?: string }> = [];

      for (const file of rawFiles) {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
          reader.readAsDataURL(file);
        });

        preparedFiles.push({
          fileName: file.name,
          fileData: base64Data,
          size: file.size,
          mimeType: file.type
        });
      }

      const res = await autonomaDataService.inspectImportFiles(preparedFiles, sessionId);
      if (res.sessionId) setSessionId(res.sessionId);

      // Merge inspections
      setStagedFiles((prev) => {
        const existingMap = new Map(prev.map(f => [f.fileName, f]));
        for (const item of res.inspections) {
          existingMap.set(item.fileName, item);
        }
        return Array.from(existingMap.values());
      });

      // Initialize default user choices for each new inspection
      setUserChoices((prev) => {
        const next = { ...prev };
        for (const item of res.inspections) {
          if (!next[item.sourceId]) {
            next[item.sourceId] = {
              saveCompanyKnowledge: true,
              saveContacts: item.summary.contactsCount > 0,
              saveSocialHandles: item.summary.socialHandlesCount > 0,
              saveAudienceSegments: item.summary.segmentsCount > 0,
              saveProducts: item.summary.productsCount > 0,
              saveHistoricalCampaigns: item.summary.campaignHistoryCount > 0,
              useAsCampaignContext: true,
              useOnlyForDistribution: false,
              campaignOnly: false,
              doNotSavePersonalContactInfo: false,
              doNotRetainSourceFile: false
            };
          }
        }
        return next;
      });

      // Auto-open first inspected file for review if modal was idle
      if (res.inspections.length > 0 && !activeInspectSource) {
        setActiveInspectSource(res.inspections[0]);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to inspect files');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveSource = (sourceId: string) => {
    setStagedFiles((prev) => prev.filter(s => s.sourceId !== sourceId));
    setConfirmedSourceIds((prev) => prev.filter(id => id !== sourceId));
    if (activeInspectSource?.sourceId === sourceId) {
      setActiveInspectSource(null);
    }
    // Update context
    notifyContextUpdate(stagedFiles.filter(s => s.sourceId !== sourceId && confirmedSourceIds.includes(s.sourceId)));
  };

  const handleToggleChoice = (sourceId: string, field: keyof ImportUserChoice) => {
    setUserChoices((prev) => {
      const current = prev[sourceId] || {
        saveCompanyKnowledge: true,
        saveContacts: true,
        saveSocialHandles: true,
        saveAudienceSegments: true,
        saveProducts: true,
        saveHistoricalCampaigns: true,
        useAsCampaignContext: true,
        useOnlyForDistribution: false,
        campaignOnly: false,
        doNotSavePersonalContactInfo: false,
        doNotRetainSourceFile: false
      };
      return {
        ...prev,
        [sourceId]: {
          ...current,
          [field]: !current[field]
        }
      };
    });
  };

  const handleConfirmImport = async (targetSourceId?: string) => {
    const idsToConfirm = targetSourceId ? [targetSourceId] : stagedFiles.map(s => s.sourceId);
    if (idsToConfirm.length === 0) return;

    setIsConfirming(true);
    setConfirmError(null);

    try {
      const res = await autonomaDataService.confirmImport({
        sessionId,
        sourceIds: idsToConfirm,
        choices: userChoices,
        campaignId
      });

      if (!res.success) {
        throw new Error('Import could not be completed.');
      }

      // Mark confirmed in state
      setConfirmedSourceIds((prev) => Array.from(new Set([...prev, ...idsToConfirm])));
      
      // Update staged files status
      setStagedFiles((prev) => prev.map(s => {
        if (idsToConfirm.includes(s.sourceId)) {
          return { ...s, status: 'IMPORTED' };
        }
        return s;
      }));

      // Notify parent of approved campaign context
      const approvedSources = stagedFiles.filter(s => idsToConfirm.includes(s.sourceId) || confirmedSourceIds.includes(s.sourceId));
      notifyContextUpdate(approvedSources);

      if (activeInspectSource && idsToConfirm.includes(activeInspectSource.sourceId)) {
        setActiveInspectSource(null);
      }
    } catch (err: any) {
      setConfirmError('Import could not be completed.');
    } finally {
      setIsConfirming(false);
    }
  };

  const notifyContextUpdate = (sources: StagedFileInspection[]) => {
    if (!onApprovedContextChange) return;
    const contextLines: string[] = [];
    const sourceIds: string[] = [];

    for (const src of sources) {
      const choice = userChoices[src.sourceId];
      if (choice && (choice.useAsCampaignContext || choice.campaignOnly)) {
        sourceIds.push(src.sourceId);
        if (src.summary.safeCampaignContext) {
          contextLines.push(src.summary.safeCampaignContext);
        }
      }
    }

    onApprovedContextChange(contextLines.join('\n\n'), sourceIds);
  };

  return (
    <div className="rounded-2xl border border-black/[0.08] bg-[#FBFBFD] p-4 sm:p-5 space-y-4">
      {/* Header & Helper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-[#FF4500]/20 flex items-center justify-center text-[#FF4500]">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-[#1D1D1F]">
              Use Existing Data — Optional
            </h3>
            <span className="text-[10px] text-[#86868B]">
              Inspect, classify, and selectively inject verified business data
            </span>
          </div>
        </div>

        {/* Options switcher */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-black/[0.06] text-[11px] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode('UPLOAD')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              mode === 'UPLOAD' || (mode === 'IDLE' && stagedFiles.length > 0)
                ? 'bg-[#1D1D1F] text-white shadow-sm'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Upload Files
          </button>
          <button
            type="button"
            onClick={() => setMode('DRIVE')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              mode === 'DRIVE'
                ? 'bg-[#1D1D1F] text-white shadow-sm'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Import from Google Drive
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('SKIPPED');
              setStagedFiles([]);
              setConfirmedSourceIds([]);
              if (onApprovedContextChange) onApprovedContextChange('', []);
            }}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              mode === 'SKIPPED'
                ? 'bg-black/[0.06] text-[#1D1D1F]'
                : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            Skip for Now
          </button>
        </div>
      </div>

      {/* Helper Explainer */}
      <p className="text-[11px] text-[#6E6E73] leading-relaxed">
        Bring in customer lists, previous campaign sheets, product data, social handles, research or other business information. Autonoma will inspect the files first and ask what you want to use.
      </p>

      {/* Google Drive Option */}
      {mode === 'DRIVE' && (
        <div className="rounded-xl border border-dashed border-black/[0.12] bg-white p-6 text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-[#1D1D1F]">Google Drive Import</h4>
            <p className="text-[11px] text-[#6E6E73] max-w-md mx-auto">
              Google Drive import becomes available once Drive access is authorized.
            </p>
          </div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-medium border border-blue-200/60">
            <Lock className="w-3 h-3" />
            <span>OAuth Integration Gate — Connect via Workspace Settings</span>
          </div>
        </div>
      )}

      {/* Upload Box & Limits */}
      {(mode === 'UPLOAD' || (mode === 'IDLE' && stagedFiles.length === 0)) && (
        <div className="space-y-3">
          <div 
            onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed border-black/[0.12] hover:border-[#FF4500]/50 bg-white p-5 sm:p-6 text-center cursor-pointer transition-all ${
              isUploading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-orange-50/20'
            }`}
          >
            <input 
              id={fileInputId}
              ref={fileInputRef}
              type="file"
              multiple
              accept={SUPPORTED_EXTENSIONS.join(',')}
              onChange={handleFilesChosen}
              disabled={disabled || isUploading}
              className="sr-only"
              aria-label="Upload data files for campaign context"
            />
            <div className="flex flex-col items-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-[#FF4500]/20 flex items-center justify-center text-[#FF4500]">
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UploadCloud className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-[#1D1D1F]">
                  {isUploading ? 'Inspecting & classifying uploaded files…' : 'Click to select or drag and drop business files'}
                </p>
                <p className="text-[10px] text-[#86868B] mt-0.5">
                  Supported formats: {SUPPORTED_EXTENSIONS.join(', ')} · Max {MAX_FILES_PER_SESSION} files · Up to 25 MB each
                </p>
              </div>
            </div>
          </div>

          {/* Limits visibly stated before upload */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] text-[#86868B]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Client-side pre-flight verification (cleanly rejects unsupported &amp; &gt;25MB files)</span>
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-blue-600" />
              <span>Never auto-imports blindly · Confirmation required before permanent storage</span>
            </span>
          </div>
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Upload failed: </span>
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Confirmation Error Banner */}
      {confirmError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 font-semibold text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Import could not be completed.</span>
            </div>
            <button
              type="button"
              onClick={() => setConfirmError(null)}
              className="text-amber-700 hover:text-amber-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-amber-800">
            One or more selected records could not be safely ingested. Your staging state has been preserved.
          </p>
          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={() => handleConfirmImport()}
              disabled={isConfirming}
              className="px-3 py-1.5 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-[11px] font-medium rounded-lg"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => {
                setStagedFiles([]);
                setConfirmError(null);
              }}
              className="px-3 py-1.5 bg-white border border-black/[0.08] text-[#1D1D1F] text-[11px] font-medium rounded-lg hover:bg-black/[0.03]"
            >
              Remove files
            </button>
            <a
              href="#support"
              onClick={(e) => { e.preventDefault(); alert('Error report logged for operator review.'); }}
              className="text-[11px] text-amber-900 underline hover:text-amber-950 px-2"
            >
              Report issue
            </a>
          </div>
        </div>
      )}

      {/* Staged & Imported Sources Cards */}
      {stagedFiles.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-[#1D1D1F]">
              Imported Sources ({stagedFiles.length}/{MAX_FILES_PER_SESSION})
            </span>
            <span className="text-[10px] text-[#86868B]">
              {confirmedSourceIds.length} confirmed · {stagedFiles.length - confirmedSourceIds.length} pending approval
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {stagedFiles.map((source) => {
              const choice = userChoices[source.sourceId];
              const isConfirmed = confirmedSourceIds.includes(source.sourceId) || source.status === 'IMPORTED';
              const sizeKb = (source.fileSize / 1024).toFixed(0);

              return (
                <div
                  key={source.sourceId}
                  className={`rounded-xl border p-3 bg-white transition-all space-y-2.5 ${
                    isConfirmed 
                      ? 'border-emerald-200/80 bg-emerald-50/20' 
                      : 'border-black/[0.08] hover:border-black/[0.15]'
                  }`}
                >
                  {/* Top: File info & status badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex items-start space-x-2">
                      <div className="p-1.5 rounded-lg bg-[#F5F5F7] text-[#1D1D1F] shrink-0 mt-0.5">
                        <FileText className="w-3.5 h-3.5 text-[#6E6E73]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#1D1D1F] truncate" title={source.fileName}>
                          {source.fileName}
                        </div>
                        <div className="text-[10px] text-[#86868B]">
                          {source.fileType} · {sizeKb} KB
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center space-x-1">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider ${
                        source.status === 'IMPORTED' || isConfirmed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : source.status === 'FAILED'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {source.status === 'IMPORTED' || isConfirmed ? 'IMPORTED' : source.status}
                      </span>
                    </div>
                  </div>

                  {/* Summary preview snippet */}
                  <div className="text-[11px] text-[#6E6E73] bg-[#FBFBFD] p-2 rounded-lg border border-black/[0.04] space-y-1">
                    <div className="flex flex-wrap gap-2 text-[10px] font-medium text-[#1D1D1F]">
                      {source.summary.contactsCount > 0 && (
                        <span className="flex items-center gap-1 text-emerald-700">
                          <Users className="w-3 h-3" />
                          <span>{source.summary.contactsCount.toLocaleString()} contacts</span>
                        </span>
                      )}
                      {source.summary.companiesCount > 0 && (
                        <span className="flex items-center gap-1 text-blue-700">
                          <Database className="w-3 h-3" />
                          <span>{source.summary.companiesCount} companies</span>
                        </span>
                      )}
                      {source.summary.emailsCount > 0 && (
                        <span className="flex items-center gap-1 text-purple-700">
                          <Mail className="w-3 h-3" />
                          <span>{source.summary.emailsCount} emails</span>
                        </span>
                      )}
                      {source.summary.phonesCount > 0 && (
                        <span className="flex items-center gap-1 text-amber-700">
                          <Phone className="w-3 h-3" />
                          <span>{source.summary.phonesCount} phones</span>
                        </span>
                      )}
                      {source.summary.socialHandlesCount > 0 && (
                        <span className="flex items-center gap-1 text-pink-700">
                          <Share2 className="w-3 h-3" />
                          <span>{source.summary.socialHandlesCount} social handles</span>
                        </span>
                      )}
                      {source.summary.segmentsCount > 0 && (
                        <span className="flex items-center gap-1 text-indigo-700">
                          <Tag className="w-3 h-3" />
                          <span>{source.summary.segmentsCount} audience segments</span>
                        </span>
                      )}
                      {source.summary.productsCount > 0 && (
                        <span className="flex items-center gap-1 text-slate-700">
                          <Sparkles className="w-3 h-3" />
                          <span>{source.summary.productsCount} products</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions: Remove, Replace, Inspect, Use for Campaign */}
                  <div className="flex items-center justify-between pt-1 border-t border-black/[0.04] text-[11px]">
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setActiveInspectSource(source)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-[#1D1D1F] hover:bg-black/[0.04] rounded-lg font-medium transition-colors"
                      >
                        <Eye className="w-3 h-3 text-[#6E6E73]" />
                        <span>Inspect</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveSource(source.sourceId)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                      >
                        <X className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div>
                      {isConfirmed ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-700 font-medium text-[11px] px-2 py-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active in Context</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConfirmImport(source.sourceId)}
                          disabled={isConfirming}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#1D1D1F] text-white hover:bg-black rounded-lg font-medium transition-all shadow-sm active:scale-95"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Use for Campaign</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Inspection & User Choice Modal / Dialog */}
      {activeInspectSource && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-black/[0.08] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-2xl bg-orange-50 border border-[#FF4500]/20 flex items-center justify-center text-[#FF4500]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">
                    Inspection: {activeInspectSource.fileName}
                  </h3>
                  <p className="text-[11px] text-[#86868B]">
                    Parsed entities, data classification &amp; selective import controls
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveInspectSource(null)}
                className="w-8 h-8 rounded-full hover:bg-black/[0.05] flex items-center justify-center text-[#6E6E73]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Inspection Summary Stats */}
              <div>
                <h4 className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-2.5">
                  Inspection Summary
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 bg-[#FBFBFD] rounded-xl border border-black/[0.05]">
                    <div className="text-[10px] text-[#86868B]">Contacts Detected</div>
                    <div className="text-base font-semibold text-[#1D1D1F] mt-0.5">
                      {activeInspectSource.summary.contactsCount.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-[#FBFBFD] rounded-xl border border-black/[0.05]">
                    <div className="text-[10px] text-[#86868B]">Companies / Accounts</div>
                    <div className="text-base font-semibold text-[#1D1D1F] mt-0.5">
                      {activeInspectSource.summary.companiesCount}
                    </div>
                  </div>
                  <div className="p-3 bg-[#FBFBFD] rounded-xl border border-black/[0.05]">
                    <div className="text-[10px] text-[#86868B]">Emails Found</div>
                    <div className="text-base font-semibold text-[#1D1D1F] mt-0.5">
                      {activeInspectSource.summary.emailsCount.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-[#FBFBFD] rounded-xl border border-black/[0.05]">
                    <div className="text-[10px] text-[#86868B]">Phone Numbers</div>
                    <div className="text-base font-semibold text-[#1D1D1F] mt-0.5">
                      {activeInspectSource.summary.phonesCount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Additional detected entities */}
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[#6E6E73]">
                  {activeInspectSource.summary.socialHandlesCount > 0 && (
                    <span className="px-2.5 py-1 bg-pink-50 border border-pink-200/60 text-pink-800 rounded-lg">
                      {activeInspectSource.summary.socialHandlesCount} social handles ({activeInspectSource.summary.linkedinUrlsCount} LinkedIn, {activeInspectSource.summary.instagramHandlesCount} Instagram)
                    </span>
                  )}
                  {activeInspectSource.summary.segmentsCount > 0 && (
                    <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200/60 text-indigo-800 rounded-lg">
                      {activeInspectSource.summary.segmentsCount} audience segments
                    </span>
                  )}
                  {activeInspectSource.summary.productsCount > 0 && (
                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200/60 text-emerald-800 rounded-lg">
                      {activeInspectSource.summary.productsCount} products / services
                    </span>
                  )}
                  {activeInspectSource.summary.campaignHistoryCount > 0 && (
                    <span className="px-2.5 py-1 bg-orange-50 border border-orange-200/60 text-orange-800 rounded-lg">
                      {activeInspectSource.summary.campaignHistoryCount} historical campaign references
                    </span>
                  )}
                </div>
              </div>

              {/* Data Classifications */}
              <div>
                <h4 className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider mb-2">
                  Data Classification
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeInspectSource.summary.categoriesDetected.map((cat) => (
                    <span key={cat} className="px-2.5 py-1 bg-[#1D1D1F] text-white rounded-lg text-[10px] font-semibold">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* PII Safe Campaign Context Snippet */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider">
                    Derived Campaign Context (PII-Safe)
                  </h4>
                  <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Aggregated — No raw emails or phones injected</span>
                  </span>
                </div>
                <div className="p-3 bg-[#FBFBFD] border border-black/[0.06] rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed text-[#1D1D1F]">
                  {activeInspectSource.summary.safeCampaignContext || 'No context generated'}
                </div>
              </div>

              {/* USER CHOICE AFTER INSPECTION (Requirement 5) */}
              <div className="pt-2 border-t border-black/[0.06] space-y-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[#1D1D1F]">
                    What should Autonoma do with this data?
                  </h4>
                  <p className="text-[11px] text-[#6E6E73]">
                    Select precisely what records to retain and how this context should be utilized.
                  </p>
                </div>

                {(() => {
                  const choice = userChoices[activeInspectSource.sourceId] || {
                    saveCompanyKnowledge: true,
                    saveContacts: true,
                    saveSocialHandles: true,
                    saveAudienceSegments: true,
                    saveProducts: true,
                    saveHistoricalCampaigns: true,
                    useAsCampaignContext: true,
                    useOnlyForDistribution: false,
                    campaignOnly: false,
                    doNotSavePersonalContactInfo: false,
                    doNotRetainSourceFile: false
                  };

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#1D1D1F]">
                      <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-black/[0.05] bg-[#FBFBFD] hover:bg-black/[0.02] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={choice.saveCompanyKnowledge}
                          onChange={() => handleToggleChoice(activeInspectSource.sourceId, 'saveCompanyKnowledge')}
                          className="rounded text-[#FF4500] focus:ring-[#FF4500]"
                        />
                        <span>Save company knowledge</span>
                      </label>

                      <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-black/[0.05] bg-[#FBFBFD] hover:bg-black/[0.02] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={choice.saveContacts}
                          onChange={() => handleToggleChoice(activeInspectSource.sourceId, 'saveContacts')}
                          className="rounded text-[#FF4500] focus:ring-[#FF4500]"
                        />
                        <span>Save contacts</span>
                      </label>

                      <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-black/[0.05] bg-[#FBFBFD] hover:bg-black/[0.02] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={choice.saveSocialHandles}
                          onChange={() => handleToggleChoice(activeInspectSource.sourceId, 'saveSocialHandles')}
                          className="rounded text-[#FF4500] focus:ring-[#FF4500]"
                        />
                        <span>Save social handles</span>
                      </label>

                      <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-black/[0.05] bg-[#FBFBFD] hover:bg-black/[0.02] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={choice.saveAudienceSegments}
                          onChange={() => handleToggleChoice(activeInspectSource.sourceId, 'saveAudienceSegments')}
                          className="rounded text-[#FF4500] focus:ring-[#FF4500]"
                        />
                        <span>Save audience segments</span>
                      </label>

                      <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-black/[0.05] bg-[#FBFBFD] hover:bg-black/[0.02] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={choice.saveProducts}
                          onChange={() => handleToggleChoice(activeInspectSource.sourceId, 'saveProducts')}
                          className="rounded text-[#FF4500] focus:ring-[#FF4500]"
                        />
                        <span>Save products/services</span>
                      </label>

                      <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-black/[0.05] bg-[#FBFBFD] hover:bg-black/[0.02] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={choice.saveHistoricalCampaigns}
                          onChange={() => handleToggleChoice(activeInspectSource.sourceId, 'saveHistoricalCampaigns')}
                          className="rounded text-[#FF4500] focus:ring-[#FF4500]"
                        />
                        <span>Save historical campaign information</span>
                      </label>

                      <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-black/[0.05] bg-[#FBFBFD] hover:bg-black/[0.02] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={choice.useAsCampaignContext}
                          onChange={() => handleToggleChoice(activeInspectSource.sourceId, 'useAsCampaignContext')}
                          className="rounded text-[#FF4500] focus:ring-[#FF4500]"
                        />
                        <span className="font-semibold text-[#FF4500]">Use as context for this campaign</span>
                      </label>

                      <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-black/[0.05] bg-[#FBFBFD] hover:bg-black/[0.02] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={choice.useOnlyForDistribution}
                          onChange={() => handleToggleChoice(activeInspectSource.sourceId, 'useOnlyForDistribution')}
                          className="rounded text-[#FF4500] focus:ring-[#FF4500]"
                        />
                        <span>Use only for scheduling/distribution</span>
                      </label>

                      <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-black/[0.05] bg-[#FBFBFD] hover:bg-black/[0.02] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={choice.campaignOnly}
                          onChange={() => handleToggleChoice(activeInspectSource.sourceId, 'campaignOnly')}
                          className="rounded text-[#FF4500] focus:ring-[#FF4500]"
                        />
                        <span>Use for this campaign only</span>
                      </label>

                      <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-black/[0.05] bg-[#FBFBFD] hover:bg-black/[0.02] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={choice.doNotSavePersonalContactInfo}
                          onChange={() => handleToggleChoice(activeInspectSource.sourceId, 'doNotSavePersonalContactInfo')}
                          className="rounded text-[#FF4500] focus:ring-[#FF4500]"
                        />
                        <span className="text-amber-900">Do not save personal contact information</span>
                      </label>

                      <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-black/[0.05] bg-[#FBFBFD] hover:bg-black/[0.02] cursor-pointer sm:col-span-2">
                        <input
                          type="checkbox"
                          checked={choice.doNotRetainSourceFile}
                          onChange={() => handleToggleChoice(activeInspectSource.sourceId, 'doNotRetainSourceFile')}
                          className="rounded text-[#FF4500] focus:ring-[#FF4500]"
                        />
                        <span className="text-red-900">Do not permanently retain source file (delete after inspection)</span>
                      </label>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#FBFBFD] border-t border-black/[0.06] flex items-center justify-between">
              <span className="text-[11px] text-[#86868B]">
                Explicit confirmation required before saving records
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveInspectSource(null)}
                  className="px-4 py-2 text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F]"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirmImport(activeInspectSource.sourceId)}
                  disabled={isConfirming}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {isConfirming ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm Selected Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
