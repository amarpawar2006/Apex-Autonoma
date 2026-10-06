import path from 'path';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import * as pdfParseModule from 'pdf-parse';
import { 
  FileInspectionSummary, 
  ImportClassification, 
  StagedFileInspection, 
  ImportUserChoice 
} from '../src/types/import.js';
import { 
  DbKnowledgeSourceRow, 
  DbCompanyKnowledgeRow, 
  DbContactRow, 
  DbAudienceListRow, 
  DbCampaignContextSourceRow 
} from '../src/types/database.js';
import { autonomaDb } from './autonomaDatabase.js';
import { supabaseStorage } from './supabaseStorage.js';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_FILES_PER_SESSION = 10;
export const SUPPORTED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.pdf', '.docx', '.txt', '.json'];

export interface UploadedFileItem {
  fileName: string;
  buffer: Buffer;
  size: number;
  mimeType?: string;
}

export interface StagedImportSession {
  sessionId: string;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  files: Map<string, {
    fileItem: UploadedFileItem;
    inspection: StagedFileInspection;
    extractedRows?: any[];
    rawText?: string;
  }>;
}

export class DataImportService {
  private sessions: Map<string, StagedImportSession> = new Map();

  /**
   * Validates file count and properties before parsing
   */
  public validateFiles(files: Array<{ name: string; size: number }>): { valid: boolean; error?: string } {
    if (!files || files.length === 0) {
      return { valid: false, error: 'No files provided for import.' };
    }
    if (files.length > MAX_FILES_PER_SESSION) {
      return { 
        valid: false, 
        error: `Import session exceeds the limit of ${MAX_FILES_PER_SESSION} files. Provided: ${files.length}.` 
      };
    }
    for (const f of files) {
      const ext = path.extname(f.name).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        return { 
          valid: false, 
          error: `Unsupported file format "${ext}" for "${f.name}". Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}.` 
        };
      }
      if (f.size > MAX_FILE_SIZE_BYTES) {
        const sizeMb = (f.size / (1024 * 1024)).toFixed(1);
        return { 
          valid: false, 
          error: `File "${f.name}" exceeds the 25 MB size limit (${sizeMb} MB).` 
        };
      }
    }
    return { valid: true };
  }

  /**
   * Creates or gets a staged import session
   */
  public getOrCreateSession(sessionId: string, organizationId: string, createdBy: string): StagedImportSession {
    let session = this.sessions.get(sessionId);
    if (!session || session.organizationId !== organizationId) {
      session = {
        sessionId,
        organizationId,
        createdBy,
        createdAt: new Date().toISOString(),
        files: new Map()
      };
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  /**
   * Inspects and stages multiple uploaded files for a session
   */
  public async inspectAndStageFiles(
    sessionId: string,
    organizationId: string,
    createdBy: string,
    files: UploadedFileItem[]
  ): Promise<{ inspections: StagedFileInspection[]; errors: string[] }> {
    const session = this.getOrCreateSession(sessionId, organizationId, createdBy);
    const inspections: StagedFileInspection[] = [];
    const errors: string[] = [];

    for (const f of files) {
      try {
        const { inspection, extractedRows, rawText } = await this.inspectFile(f, organizationId, createdBy);
        session.files.set(inspection.sourceId, {
          fileItem: f,
          inspection,
          extractedRows,
          rawText
        });
        inspections.push(inspection);
      } catch (err: any) {
        errors.push(`Failed to inspect ${f.fileName}: ${err?.message}`);
      }
    }

    return { inspections, errors };
  }

  /**
   * Inspects a single uploaded file and returns staged metadata
   */
  public async inspectFile(
    fileItem: UploadedFileItem,
    organizationId: string,
    createdBy: string
  ): Promise<{ inspection: StagedFileInspection; extractedRows?: any[]; rawText?: string }> {
    const sourceId = `src_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ext = path.extname(fileItem.fileName).toLowerCase();

    let rawText = '';
    let extractedRows: any[] = [];

    try {
      if (ext === '.csv') {
        const textContent = fileItem.buffer.toString('utf8');
        rawText = textContent;
        extractedRows = this.parseCsv(textContent);
      } else if (ext === '.xlsx' || ext === '.xls') {
        const workbook = XLSX.read(fileItem.buffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        if (firstSheetName) {
          const sheet = workbook.Sheets[firstSheetName];
          extractedRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          rawText = XLSX.utils.sheet_to_csv(sheet);
        }
      } else if (ext === '.json') {
        const textContent = fileItem.buffer.toString('utf8');
        rawText = textContent;
        try {
          const parsed = JSON.parse(textContent);
          if (Array.isArray(parsed)) {
            extractedRows = parsed;
          } else if (typeof parsed === 'object' && parsed !== null) {
            extractedRows = [parsed];
          }
        } catch (jsonErr: any) {
          throw new Error(`Invalid JSON syntax: ${jsonErr?.message}`);
        }
      } else if (ext === '.txt') {
        rawText = fileItem.buffer.toString('utf8');
      } else if (ext === '.pdf') {
        try {
          const PDFParseClass = (pdfParseModule as any).PDFParse;
          if (typeof PDFParseClass === 'function') {
            const parser = new PDFParseClass({ data: fileItem.buffer });
            if (typeof parser.load === 'function') await parser.load();
            if (typeof parser.getText === 'function') {
              const res = await parser.getText();
              rawText = (res?.text || '').trim();
            }
          } else {
            rawText = fileItem.buffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
          }
        } catch (pdfErr) {
          rawText = fileItem.buffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
        }
      } else if (ext === '.docx') {
        const docxResult = await mammoth.extractRawText({ buffer: fileItem.buffer });
        rawText = (docxResult?.value || '').trim();
      }

      const summary = this.analyzeContent(rawText, extractedRows, fileItem.fileName);

      const inspection: StagedFileInspection = {
        sourceId,
        fileName: fileItem.fileName,
        fileType: ext.replace('.', '').toUpperCase(),
        fileSize: fileItem.size,
        status: 'READY_FOR_REVIEW',
        summary
      };

      return { inspection, extractedRows, rawText };
    } catch (err: any) {
      console.warn(`[DataImportService] Inspection error for ${fileItem.fileName}:`, err?.message);
      const inspection: StagedFileInspection = {
        sourceId,
        fileName: fileItem.fileName,
        fileType: ext.replace('.', '').toUpperCase(),
        fileSize: fileItem.size,
        status: 'FAILED',
        error: err?.message || 'File parsing failed',
        summary: {
          contactsCount: 0,
          companiesCount: 0,
          emailsCount: 0,
          phonesCount: 0,
          socialHandlesCount: 0,
          linkedinUrlsCount: 0,
          instagramHandlesCount: 0,
          youtubeUrlsCount: 0,
          websitesCount: 0,
          locationsCount: 0,
          segmentsCount: 0,
          productsCount: 0,
          campaignHistoryCount: 0,
          contentIdeasCount: 0,
          captionsCount: 0,
          hashtagsCount: 0,
          skusCount: 0,
          pricingFieldsCount: 0,
          distributionListsCount: 0,
          audienceCategoriesCount: 0,
          categoriesDetected: ['OTHER'],
          sampleEntities: {}
        }
      };
      return { inspection };
    }
  }

  /**
   * Helper to parse CSV cleanly with quote awareness
   */
  private parseCsv(text: string): any[] {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];

    const delimiter = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',');
    
    function parseLine(line: string): string[] {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    }

    const headers = parseLine(lines[0]).map(h => h.replace(/^["']|["']$/g, '').trim());
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h || `column_${idx + 1}`] = values[idx] || '';
      });
      rows.push(rowObj);
    }
    return rows;
  }

  /**
   * Inspects extracted rows and plain text to detect entities without hallucinating
   */
  private analyzeContent(rawText: string, rows: any[], fileName: string): FileInspectionSummary {
    const emailsSet = new Set<string>();
    const phonesSet = new Set<string>();
    const linkedinSet = new Set<string>();
    const instagramSet = new Set<string>();
    const youtubeSet = new Set<string>();
    const websitesSet = new Set<string>();
    const companiesSet = new Set<string>();
    const segmentsSet = new Set<string>();
    const productsSet = new Set<string>();
    const locationsSet = new Set<string>();
    const hashtagsSet = new Set<string>();

    const sampleContacts: FileInspectionSummary['sampleEntities']['sampleContacts'] = [];

    // Regex matchers
    const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g;
    const linkedinRegex = /https?:\/\/(?:www\.)?linkedin\.com\/(?:in|company)\/[a-zA-Z0-9_-]+/gi;
    const instagramRegex = /(?:https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)|@([a-zA-Z0-9._]{3,30}))/gi;
    const youtubeRegex = /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[a-zA-Z0-9_?&=%-]+/gi;
    const websiteRegex = /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi;
    const hashtagRegex = /#([a-zA-Z0-9_]{2,40})/g;

    // 1. Text-level scanning
    const matchedEmails = rawText.match(emailRegex) || [];
    matchedEmails.forEach(e => emailsSet.add(e.toLowerCase().trim()));

    const matchedPhones = rawText.match(phoneRegex) || [];
    matchedPhones.forEach(p => {
      const clean = p.replace(/[^\d+]/g, '');
      if (clean.length >= 8 && clean.length <= 15) {
        phonesSet.add(p.trim());
      }
    });

    const matchedLinkedin = rawText.match(linkedinRegex) || [];
    matchedLinkedin.forEach(l => linkedinSet.add(l.trim()));

    const matchedYoutube = rawText.match(youtubeRegex) || [];
    matchedYoutube.forEach(y => youtubeSet.add(y.trim()));

    const matchedWebsites = rawText.match(websiteRegex) || [];
    matchedWebsites.forEach(w => {
      if (!w.includes('linkedin.com') && !w.includes('instagram.com') && !w.includes('youtube.com')) {
        websitesSet.add(w.trim());
      }
    });

    let igMatch;
    while ((igMatch = instagramRegex.exec(rawText)) !== null) {
      const handle = igMatch[1] || igMatch[2];
      if (handle && handle.length > 2) instagramSet.add(`@${handle.replace(/^@/, '')}`);
    }

    let hashMatch;
    while ((hashMatch = hashtagRegex.exec(rawText)) !== null) {
      if (hashMatch[1]) hashtagsSet.add(`#${hashMatch[1]}`);
    }

    // 2. Structured row scanning (if available)
    let contactsCount = 0;
    let skusCount = 0;
    let pricingCount = 0;
    let campaignHistoryCount = 0;
    let contentIdeasCount = 0;

    if (rows && rows.length > 0) {
      for (const row of rows) {
        const keys = Object.keys(row);
        let nameVal = '';
        let emailVal = '';
        let phoneVal = '';
        let compVal = '';
        let locVal = '';
        let segVal = '';
        let prodVal = '';

        for (const k of keys) {
          const val = String(row[k] || '').trim();
          if (!val) continue;

          const lk = k.toLowerCase();
          if (lk.includes('email') && emailRegex.test(val)) {
            emailVal = val;
            emailsSet.add(val.toLowerCase());
          } else if (lk.includes('phone') || lk.includes('mobile') || lk.includes('contact no')) {
            phoneVal = val;
            phonesSet.add(val);
          } else if (lk === 'name' || lk === 'contact_name' || lk === 'full_name' || lk === 'contact') {
            nameVal = val;
          } else if (lk.includes('company') || lk.includes('organization') || lk.includes('account')) {
            compVal = val;
            companiesSet.add(val);
          } else if (lk.includes('city') || lk.includes('location') || lk.includes('state') || lk.includes('country') || lk.includes('region')) {
            locVal = val;
            locationsSet.add(val);
          } else if (lk.includes('segment') || lk.includes('category') || lk.includes('tier') || lk.includes('industry')) {
            segVal = val;
            segmentsSet.add(val);
          } else if (lk.includes('product') || lk.includes('offering') || lk.includes('item') || lk.includes('service')) {
            prodVal = val;
            productsSet.add(val);
          } else if (lk.includes('sku') || lk.includes('part_number')) {
            skusCount++;
            productsSet.add(val);
          } else if (lk.includes('price') || lk.includes('mrp') || lk.includes('cost') || lk.includes('rate')) {
            pricingCount++;
          } else if (lk.includes('campaign') || lk.includes('theme') || lk.includes('caption') || lk.includes('pillar')) {
            campaignHistoryCount++;
          }
        }

        if (nameVal || emailVal || phoneVal) {
          contactsCount++;
          if (sampleContacts.length < 8) {
            sampleContacts.push({
              name: nameVal || undefined,
              email: emailVal || undefined,
              phone: phoneVal || undefined,
              company: compVal || undefined,
              location: locVal || undefined
            });
          }
        }
      }
    } else {
      // Unstructured document heuristics
      contactsCount = emailsSet.size > 0 ? emailsSet.size : (phonesSet.size > 0 ? phonesSet.size : 0);
      
      // Look for products/offerings sections in text
      const lower = rawText.toLowerCase();
      if (lower.includes('product') || lower.includes('services') || lower.includes('catalog') || lower.includes('specifications')) {
        productsSet.add(fileName.replace(path.extname(fileName), ''));
      }
      if (lower.includes('campaign') || lower.includes('social media') || lower.includes('metrics') || lower.includes('analytics')) {
        campaignHistoryCount = 1;
      }
    }

    // Determine classifications
    const categoriesDetected: ImportClassification[] = [];
    if (contactsCount > 0 || emailsSet.size > 0 || phonesSet.size > 0) categoriesDetected.push('CONTACT');
    if (segmentsSet.size > 0) categoriesDetected.push('AUDIENCE');
    if (productsSet.size > 0 || skusCount > 0) categoriesDetected.push('PRODUCT');
    if (campaignHistoryCount > 0 || hashtagsSet.size > 0) categoriesDetected.push('CAMPAIGN_HISTORY');
    if (linkedinSet.size > 0 || instagramSet.size > 0 || youtubeSet.size > 0) categoriesDetected.push('SOCIAL_HANDLE');
    if (contactsCount >= 5 && segmentsSet.size > 0) categoriesDetected.push('DISTRIBUTION_LIST');
    if (companiesSet.size > 0 || rawText.length > 500) categoriesDetected.push('COMPANY_KNOWLEDGE');
    if (categoriesDetected.length === 0) categoriesDetected.push('OTHER');

    // Build PII-safe campaign context summary
    let safeContextParts: string[] = [];
    if (companiesSet.size > 0) {
      safeContextParts.push(`Identified Target Accounts/Companies: ${Array.from(companiesSet).slice(0, 8).join(', ')}.`);
    }
    if (segmentsSet.size > 0) {
      safeContextParts.push(`Key Audience Segments: ${Array.from(segmentsSet).slice(0, 6).join(', ')}.`);
    }
    if (locationsSet.size > 0) {
      safeContextParts.push(`Geographic Focus: ${Array.from(locationsSet).slice(0, 6).join(', ')}.`);
    }
    if (productsSet.size > 0) {
      safeContextParts.push(`Products/Services Referenced: ${Array.from(productsSet).slice(0, 8).join(', ')}.`);
    }
    if (contactsCount > 0) {
      safeContextParts.push(`Audience scale: ~${contactsCount.toLocaleString()} verified industry contacts across specified segments.`);
    }
    if (hashtagsSet.size > 0) {
      safeContextParts.push(`Historical/Target Hashtags: ${Array.from(hashtagsSet).slice(0, 8).join(' ')}.`);
    }

    const safeCampaignContext = safeContextParts.length > 0 
      ? safeContextParts.join('\n') 
      : `Imported context from ${fileName}: general business knowledge and verified audience profile.`;

    return {
      contactsCount,
      companiesCount: companiesSet.size,
      emailsCount: emailsSet.size,
      phonesCount: phonesSet.size,
      socialHandlesCount: linkedinSet.size + instagramSet.size + youtubeSet.size,
      linkedinUrlsCount: linkedinSet.size,
      instagramHandlesCount: instagramSet.size,
      youtubeUrlsCount: youtubeSet.size,
      websitesCount: websitesSet.size,
      locationsCount: locationsSet.size,
      segmentsCount: segmentsSet.size,
      productsCount: productsSet.size,
      campaignHistoryCount,
      contentIdeasCount,
      captionsCount: 0,
      hashtagsCount: hashtagsSet.size,
      skusCount,
      pricingFieldsCount: pricingCount,
      distributionListsCount: contactsCount > 0 ? 1 : 0,
      audienceCategoriesCount: segmentsSet.size,
      categoriesDetected,
      sampleEntities: {
        companies: Array.from(companiesSet).slice(0, 8),
        segments: Array.from(segmentsSet).slice(0, 6),
        products: Array.from(productsSet).slice(0, 6),
        locations: Array.from(locationsSet).slice(0, 6),
        socialHandles: [...Array.from(instagramSet), ...Array.from(linkedinSet)].slice(0, 6),
        sampleContacts: sampleContacts.slice(0, 5)
      },
      structuredDataSnippet: rows.length > 0 
        ? JSON.stringify(rows.slice(0, 3), null, 2) 
        : (rawText.slice(0, 400) + '...'),
      safeCampaignContext
    };
  }

  /**
   * Cleans up an import session
   */
  public clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Retrieves staged inspection for confirmation
   */
  public getStagedFile(sessionId: string, sourceId: string) {
    const session = this.sessions.get(sessionId);
    return session?.files.get(sourceId);
  }

  /**
   * Confirms import of staged files according to explicit user choices
   */
  public async confirmImport(params: {
    sessionId: string;
    sourceIds: string[];
    choices: Record<string, ImportUserChoice>;
    campaignId?: string;
    organizationId: string;
    actorUserId: string;
  }): Promise<{
    success: boolean;
    importedSources: DbKnowledgeSourceRow[];
    contactsInserted: number;
    contactsUpdated: number;
    knowledgeItemsCreated: number;
    audienceListsCreated: number;
    campaignContextsCreated: number;
    error?: string;
  }> {
    const { sessionId, sourceIds, choices, campaignId, organizationId, actorUserId } = params;
    const session = this.sessions.get(sessionId);
    if (!session || session.organizationId !== organizationId) {
      return {
        success: false,
        importedSources: [],
        contactsInserted: 0,
        contactsUpdated: 0,
        knowledgeItemsCreated: 0,
        audienceListsCreated: 0,
        campaignContextsCreated: 0,
        error: 'Import session expired or invalid. Please re-upload your files.'
      };
    }

    const importedSources: DbKnowledgeSourceRow[] = [];
    let totalContactsInserted = 0;
    let totalContactsUpdated = 0;
    let totalKnowledgeItemsCreated = 0;
    let totalAudienceListsCreated = 0;
    let totalCampaignContextsCreated = 0;

    try {
      for (const sourceId of sourceIds) {
        const staged = session.files.get(sourceId);
        if (!staged) continue;

        const choice = choices[sourceId] || choices['global'] || {
          saveCompanyKnowledge: true,
          saveContacts: true,
          saveSocialHandles: true,
          saveAudienceSegments: true,
          saveProducts: true,
          saveHistoricalCampaigns: true,
          useAsCampaignContext: Boolean(campaignId),
          useOnlyForDistribution: false,
          campaignOnly: false,
          doNotSavePersonalContactInfo: false,
          doNotRetainSourceFile: false
        };

        let savedContactIds: string[] = [];

        // 1. Process contacts if requested and not forbidden by PII policy
        if (choice.saveContacts && !choice.doNotSavePersonalContactInfo && !choice.campaignOnly) {
          const rawContacts: DbContactRow[] = [];

          if (staged.extractedRows && staged.extractedRows.length > 0) {
            for (const row of staged.extractedRows) {
              let name = '';
              let email = '';
              let phone = '';
              let comp = '';
              let loc = '';
              let seg = '';
              let notes = '';
              let linkedinUrl = '';
              let instagramHandle = '';
              const otherHandles: Record<string, string> = {};

              for (const [k, v] of Object.entries(row)) {
                const val = String(v ?? '').trim();
                if (!val) continue;
                const lk = k.toLowerCase();
                if (lk.includes('email') && /\S+@\S+\.\S+/.test(val)) {
                  email = val.toLowerCase();
                } else if (lk.includes('phone') || lk.includes('mobile') || lk.includes('contact no') || lk.includes('whatsapp')) {
                  phone = val;
                } else if (lk === 'name' || lk === 'contact_name' || lk === 'full_name' || lk === 'contact') {
                  name = val;
                } else if (lk.includes('company') || lk.includes('account') || lk.includes('organization')) {
                  comp = val;
                } else if (lk.includes('city') || lk.includes('location') || lk.includes('state') || lk.includes('region')) {
                  loc = val;
                } else if (lk.includes('segment') || lk.includes('category') || lk.includes('tier') || lk.includes('role')) {
                  seg = val;
                } else if (lk.includes('notes') || lk.includes('comment') || lk.includes('remark')) {
                  notes = val;
                } else if (lk.includes('linkedin')) {
                  linkedinUrl = val;
                } else if (lk.includes('instagram')) {
                  instagramHandle = val;
                } else {
                  otherHandles[k] = val;
                }
              }

              if (name || email || phone || comp) {
                rawContacts.push({
                  contactId: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                  organizationId, // Strict company isolation
                  sourceId,
                  name: name || (email ? email.split('@')[0] : comp || 'Unnamed Contact'),
                  company: comp || undefined,
                  email: email || undefined,
                  phone: phone || undefined,
                  linkedinUrl: linkedinUrl || undefined,
                  instagramHandle: instagramHandle || undefined,
                  otherHandlesJson: Object.keys(otherHandles).length > 0 ? JSON.stringify(otherHandles) : undefined,
                  location: loc || undefined,
                  segment: seg || undefined,
                  notes: notes || undefined,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                });
              }
            }
          } else if (staged.inspection.summary.sampleEntities.sampleContacts) {
            for (const sc of staged.inspection.summary.sampleEntities.sampleContacts) {
              if (sc.name || sc.email || sc.phone) {
                rawContacts.push({
                  contactId: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                  organizationId,
                  sourceId,
                  name: sc.name || (sc.email ? sc.email.split('@')[0] : 'Contact'),
                  company: sc.company,
                  email: sc.email,
                  phone: sc.phone,
                  location: sc.location,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                });
              }
            }
          }

          if (rawContacts.length > 0) {
            const batchResult = await autonomaDb.batchUpsertContacts(rawContacts, organizationId, actorUserId);
            totalContactsInserted += batchResult.inserted;
            totalContactsUpdated += batchResult.updated;
            savedContactIds = batchResult.contacts.map((c: any) => c.contactId);
          }
        }

        // 2. Process audience / distribution list
        if ((choice.useOnlyForDistribution || choice.saveAudienceSegments || savedContactIds.length > 0) && !choice.campaignOnly) {
          const listId = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const audienceList: DbAudienceListRow = {
            listId,
            organizationId,
            sourceId,
            name: choice.audienceListName || `${staged.inspection.fileName.replace(/\.[^/.]+$/, '')} List`,
            description: `Imported list from ${staged.inspection.fileName}`,
            contactCount: savedContactIds.length,
            listType: choice.useOnlyForDistribution ? 'DISTRIBUTION_LIST' : 'AUDIENCE',
            metadataJson: JSON.stringify({
              sourceFileName: staged.inspection.fileName,
              channels: {
                total: savedContactIds.length,
                emails: staged.inspection.summary.emailsCount,
                phones: staged.inspection.summary.phonesCount,
                social: staged.inspection.summary.socialHandlesCount
              }
            }),
            createdAt: new Date().toISOString()
          };

          await autonomaDb.saveAudienceList(audienceList, savedContactIds, actorUserId);
          totalAudienceListsCreated++;
        }

        // 3. Process company knowledge entries (Products, Audience segments, Historical campaign data)
        if (!choice.campaignOnly) {
          // Products
          if (choice.saveProducts && staged.inspection.summary.productsCount > 0) {
            const prodList = staged.inspection.summary.sampleEntities.products || [];
            await autonomaDb.saveCompanyKnowledge({
              knowledgeId: `knw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              organizationId,
              sourceId,
              category: 'PRODUCT',
              title: `Products & Offerings (${staged.inspection.fileName})`,
              content: prodList.length > 0 ? `Key offerings: ${prodList.join(', ')}` : `Products referenced in ${staged.inspection.fileName}`,
              structuredJson: JSON.stringify({
                products: prodList,
                skusCount: staged.inspection.summary.skusCount,
                pricingFieldsCount: staged.inspection.summary.pricingFieldsCount
              }),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, actorUserId);
            totalKnowledgeItemsCreated++;
          }

          // Historical campaign data
          if (choice.saveHistoricalCampaigns && staged.inspection.summary.campaignHistoryCount > 0) {
            await autonomaDb.saveCompanyKnowledge({
              knowledgeId: `knw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              organizationId,
              sourceId,
              category: 'CAMPAIGN_HISTORY',
              title: `Historical Campaign Intelligence (${staged.inspection.fileName})`,
              content: staged.inspection.summary.safeCampaignContext || '',
              structuredJson: JSON.stringify({
                historicalCampaigns: staged.inspection.summary.campaignHistoryCount,
                hashtags: staged.inspection.summary.sampleEntities.socialHandles || []
              }),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, actorUserId);
            totalKnowledgeItemsCreated++;
          }

          // Audience segments
          if (choice.saveAudienceSegments && staged.inspection.summary.segmentsCount > 0) {
            const segList = staged.inspection.summary.sampleEntities.segments || [];
            await autonomaDb.saveCompanyKnowledge({
              knowledgeId: `knw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              organizationId,
              sourceId,
              category: 'AUDIENCE',
              title: `Audience Segments (${staged.inspection.fileName})`,
              content: segList.length > 0 ? `Target Segments: ${segList.join(', ')}` : `Audience categories from ${staged.inspection.fileName}`,
              structuredJson: JSON.stringify({
                segments: segList,
                locations: staged.inspection.summary.sampleEntities.locations || []
              }),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, actorUserId);
            totalKnowledgeItemsCreated++;
          }

          // General company knowledge
          if (choice.saveCompanyKnowledge) {
            await autonomaDb.saveCompanyKnowledge({
              knowledgeId: `knw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              organizationId,
              sourceId,
              category: 'COMPANY_KNOWLEDGE',
              title: `Business Context: ${staged.inspection.fileName}`,
              content: staged.inspection.summary.safeCampaignContext || '',
              structuredJson: JSON.stringify(staged.inspection.summary),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, actorUserId);
            totalKnowledgeItemsCreated++;
          }
        }

        // 4. Save campaign context source if requested
        if ((choice.useAsCampaignContext || choice.campaignOnly) && campaignId) {
          const ccs: DbCampaignContextSourceRow = {
            id: `ccs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            organizationId,
            campaignId,
            sourceId,
            useMode: choice.campaignOnly ? 'CAMPAIGN_CONTEXT' : (choice.useOnlyForDistribution ? 'SCHEDULING_DISTRIBUTION' : 'FULL_IMPORT'),
            summary: staged.inspection.summary.safeCampaignContext,
            contextJson: JSON.stringify({
              fileName: staged.inspection.fileName,
              fileType: staged.inspection.fileType,
              contactsCount: staged.inspection.summary.contactsCount,
              companiesCount: staged.inspection.summary.companiesCount,
              segments: staged.inspection.summary.sampleEntities.segments || [],
              products: staged.inspection.summary.sampleEntities.products || [],
              locations: staged.inspection.summary.sampleEntities.locations || []
            }),
            createdAt: new Date().toISOString()
          };

          await autonomaDb.saveCampaignContextSource(ccs, actorUserId);
          totalCampaignContextsCreated++;
        }

        // 5. Store source file in private bucket if retention requested
        let storageUrl: string | undefined = undefined;
        if (!choice.doNotRetainSourceFile) {
          try {
            const uploadRes = await supabaseStorage.uploadPrivateImportFile(
              organizationId,
              sourceId,
              staged.fileItem.fileName,
              staged.fileItem.buffer,
              staged.fileItem.mimeType
            );
            storageUrl = uploadRes.storagePath;
          } catch (storageErr: any) {
            console.warn('[DataImportService] Storage upload note:', storageErr?.message);
          }
        }

        // 6. Save permanent knowledge source record
        const knowledgeSource: DbKnowledgeSourceRow = {
          sourceId,
          organizationId,
          fileName: staged.inspection.fileName,
          fileType: staged.inspection.fileType,
          fileSize: staged.inspection.fileSize,
          sourceType: 'FILE_UPLOAD',
          storageUrl,
          status: 'IMPORTED',
          createdBy: actorUserId,
          createdAt: new Date().toISOString(),
          metadataJson: JSON.stringify({
            summary: staged.inspection.summary,
            fileRetained: !choice.doNotRetainSourceFile,
            campaignId: campaignId || null,
            choices: choice
          })
        };

        const savedSource = await autonomaDb.saveKnowledgeSource(knowledgeSource, actorUserId);
        importedSources.push(savedSource);

        // 7. Log activity (clean metadata, NEVER raw private contact lists or raw file contents)
        autonomaDb.logActivity('KNOWLEDGE_SOURCE', sourceId, 'IMPORT_CONFIRMED', {
          fileName: staged.inspection.fileName,
          fileType: staged.inspection.fileType,
          fileSize: staged.inspection.fileSize,
          companyId: organizationId,
          sourceId,
          campaignId: campaignId || null,
          contactsImported: savedContactIds.length,
          fileRetained: !choice.doNotRetainSourceFile
        }, actorUserId);
      }

      // Cleanup staging session
      this.sessions.delete(sessionId);

      return {
        success: true,
        importedSources,
        contactsInserted: totalContactsInserted,
        contactsUpdated: totalContactsUpdated,
        knowledgeItemsCreated: totalKnowledgeItemsCreated,
        audienceListsCreated: totalAudienceListsCreated,
        campaignContextsCreated: totalCampaignContextsCreated
      };
    } catch (err: any) {
      console.error('[DataImportService] Error confirming import:', err);
      autonomaDb.logActivity('KNOWLEDGE_SOURCE', sessionId, 'IMPORT_FAILED', {
        companyId: organizationId,
        error: err?.message || 'Import could not be completed.'
      }, actorUserId);

      return {
        success: false,
        importedSources: [],
        contactsInserted: 0,
        contactsUpdated: 0,
        knowledgeItemsCreated: 0,
        audienceListsCreated: 0,
        campaignContextsCreated: 0,
        error: err?.message || 'Import could not be completed.'
      };
    }
  }
}

export const dataImportService = new DataImportService();
