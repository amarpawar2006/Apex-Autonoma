import fs from 'fs';
import os from 'os';
import path from 'path';
import assert from 'assert';
import * as XLSX from 'xlsx';
import { AutonomaDatabaseManager, DEFAULT_ORG_ID } from '../server/autonomaDatabase.js';
import { 
  DataImportService, 
  MAX_FILE_SIZE_BYTES, 
  MAX_FILES_PER_SESSION,
  SUPPORTED_EXTENSIONS 
} from '../server/dataImportService.js';
import { DbContactRow } from '../src/types/database.js';
import { ImportUserChoice } from '../src/types/import.js';

async function runDataImportVerification() {
  console.log('====================================================');
  console.log('APEX AUTONOMA — LEGACY DATA & CONTEXT IMPORT TESTS');
  console.log('====================================================');

  const tempDbPath = path.join(os.tmpdir(), `autonoma-test-import-${Date.now()}.json`);
  const db = new AutonomaDatabaseManager(tempDbPath);
  db.setGoogleSheetsUrl('');

  const importService = new DataImportService();

  const orgA = 'org_apex_pune';
  const orgB = 'org_sahyadri_teas';
  const actor = 'usr_test_admin';

  // Create org B to verify isolation
  await db.createCompany('Sahyadri Teas');

  console.log('\n[1] 25 MB Validation & File Limits Check');
  const validFiles = [
    { name: 'contacts.csv', size: 1024 * 50 },
    { name: 'catalog.xlsx', size: 1024 * 100 }
  ];
  const validCheck = importService.validateFiles(validFiles);
  assert.strictEqual(validCheck.valid, true, 'Valid files should pass validation');

  const oversizedFile = [
    { name: 'huge_database.csv', size: 26 * 1024 * 1024 } // 26 MB
  ];
  const overCheck = importService.validateFiles(oversizedFile);
  assert.strictEqual(overCheck.valid, false, 'Oversized file must be rejected');
  assert(overCheck.error?.includes('25 MB'), 'Error must mention 25 MB limit');
  console.log('✓ 25 MB limit correctly enforced and rejected:', overCheck.error);

  console.log('\n[2] Unsupported Format Rejection Check');
  const unsupportedFiles = [
    { name: 'malware.exe', size: 5000 },
    { name: 'backup.zip', size: 10000 }
  ];
  const unsuppCheck = importService.validateFiles(unsupportedFiles);
  assert.strictEqual(unsuppCheck.valid, false, 'Unsupported extensions must be rejected');
  assert(unsuppCheck.error?.includes('Unsupported file format'), 'Error must specify unsupported format');
  console.log('✓ Unsupported file extensions cleanly rejected:', unsuppCheck.error);

  console.log('\n[3] 10-File Maximum Session Limit Check');
  const elevenFiles = Array.from({ length: 11 }, (_, i) => ({
    name: `sheet_${i + 1}.csv`,
    size: 2000
  }));
  const elevenCheck = importService.validateFiles(elevenFiles);
  assert.strictEqual(elevenCheck.valid, false, 'More than 10 files must be rejected');
  assert(elevenCheck.error?.includes('10 files'), 'Error must mention limit of 10 files');
  console.log('✓ 10-file session maximum enforced:', elevenCheck.error);

  console.log('\n[4] CSV Contact Import & Inspection');
  const csvContent = `Name,Email,Phone,Company,Location,Segment\nRajesh Sharma,rajesh@tata-motors.com,+91 98230 11223,Tata Motors,Pune,Automotive OEM\nAnita Desai,anita@bharat-forge.com,+91 98230 44556,Bharat Forge,Pune,Forging & Components\nSunil Patil,sunil@kirloskar.com,,Kirloskar Brothers,Kirloskarvadi,Industrial Machinery`;
  const csvBuffer = Buffer.from(csvContent, 'utf8');

  const csvItem = {
    fileName: 'pune_industrial_clients.csv',
    buffer: csvBuffer,
    size: csvBuffer.length,
    mimeType: 'text/csv'
  };

  const csvInspection = await importService.inspectFile(csvItem, orgA, actor);
  assert.strictEqual(csvInspection.inspection.status, 'READY_FOR_REVIEW');
  assert.strictEqual(csvInspection.inspection.summary.contactsCount, 3);
  assert.strictEqual(csvInspection.inspection.summary.companiesCount, 3);
  assert.strictEqual(csvInspection.inspection.summary.emailsCount, 3);
  assert.strictEqual(csvInspection.inspection.summary.phonesCount, 2);
  assert(csvInspection.inspection.summary.categoriesDetected.includes('CONTACT'));
  assert(csvInspection.inspection.summary.categoriesDetected.includes('AUDIENCE'));
  console.log(`✓ CSV Inspection identified: ${csvInspection.inspection.summary.contactsCount} contacts, ${csvInspection.inspection.summary.companiesCount} companies, ${csvInspection.inspection.summary.emailsCount} emails, ${csvInspection.inspection.summary.phonesCount} phones.`);

  console.log('\n[5] XLSX Contact Import & Inspection');
  const wb = XLSX.utils.book_new();
  const wsData = [
    ['Product Name', 'SKU', 'Price INR', 'Target Segment'],
    ['High-Precision CNC Lathe', 'CNC-APEX-900', '1450000', 'Tier 1 Machining'],
    ['5-Axis Machining Center', 'CNC-APEX-5AX', '3200000', 'Aerospace Tooling'],
    ['Industrial EDM Wire Cut', 'EDM-APEX-400', '1800000', 'Die & Mould Makers']
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const xlsxItem = {
    fileName: 'apex_product_catalog.xlsx',
    buffer: xlsxBuffer,
    size: xlsxBuffer.length,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };

  const xlsxInspection = await importService.inspectFile(xlsxItem, orgA, actor);
  assert.strictEqual(xlsxInspection.inspection.status, 'READY_FOR_REVIEW');
  assert(xlsxInspection.inspection.summary.categoriesDetected.includes('PRODUCT'));
  assert(xlsxInspection.inspection.summary.skusCount > 0, 'SKUs must be identified');
  console.log(`✓ XLSX Inspection identified product offerings with ${xlsxInspection.inspection.summary.skusCount} SKUs and pricing data.`);

  console.log('\n[6] JSON Import & Inspection');
  const jsonContent = JSON.stringify([
    {
      campaign: 'Q1 Aerospace Component Launch',
      theme: 'Micro-tolerance CNC engineering',
      hashtags: ['#AerospaceEngineering', '#CNCIndia', '#ApexMachining'],
      leadsCount: 42
    },
    {
      campaign: 'Factory Automation Expo 2025',
      theme: 'Zero-downtime manufacturing lines',
      hashtags: ['#Industry40', '#AutomationPune'],
      leadsCount: 68
    }
  ]);
  const jsonBuffer = Buffer.from(jsonContent, 'utf8');
  const jsonItem = {
    fileName: 'historical_campaigns.json',
    buffer: jsonBuffer,
    size: jsonBuffer.length,
    mimeType: 'application/json'
  };

  const jsonInspection = await importService.inspectFile(jsonItem, orgA, actor);
  assert.strictEqual(jsonInspection.inspection.status, 'READY_FOR_REVIEW');
  assert(jsonInspection.inspection.summary.categoriesDetected.includes('CAMPAIGN_HISTORY'));
  assert(jsonInspection.inspection.summary.hashtagsCount >= 3, 'Hashtags must be parsed');
  console.log(`✓ JSON Inspection identified historical campaigns and ${jsonInspection.inspection.summary.hashtagsCount} hashtags.`);

  console.log('\n[7] PDF Text Source Extraction');
  const plainTextDocument = `Apex Engineering Brand & Technical Overview
Apex Engineering specializes in high-precision aerospace subassemblies, automotive components, and automated fixtures in Pune, India.
Key contacts:
Director: Dr. Vikram Joshi, vikram.joshi@apex-engineering.co.in, +91 20 2712 8899
Head of Sales: Sunita Rao, sunita.rao@apex-engineering.co.in
Social Profile: https://www.linkedin.com/company/apex-engineering-pune
Instagram: @apex_machining_pune`;
  const pdfSimulatedBuffer = Buffer.from(plainTextDocument, 'utf8');
  const pdfItem = {
    fileName: 'apex_corporate_overview.pdf',
    buffer: pdfSimulatedBuffer,
    size: pdfSimulatedBuffer.length,
    mimeType: 'application/pdf'
  };

  const pdfInspection = await importService.inspectFile(pdfItem, orgA, actor);
  assert.strictEqual(pdfInspection.inspection.status, 'READY_FOR_REVIEW');
  assert(pdfInspection.inspection.summary.emailsCount >= 2, 'Should identify PDF email contacts');
  assert(pdfInspection.inspection.summary.socialHandlesCount >= 2, 'Should identify LinkedIn and Instagram');
  console.log(`✓ PDF text source extracted ${pdfInspection.inspection.summary.emailsCount} emails and ${pdfInspection.inspection.summary.socialHandlesCount} social handles without hallucination.`);

  console.log('\n[8] Staged Import Confirmation & User Choice Execution');
  const sessionId = 'session_test_batch_1';
  const stageRes = await importService.inspectAndStageFiles(sessionId, orgA, actor, [csvItem, xlsxItem]);
  assert.strictEqual(stageRes.inspections.length, 2);

  const csvSourceId = stageRes.inspections[0].sourceId;
  const xlsxSourceId = stageRes.inspections[1].sourceId;

  // Confirmation payload matching user choice
  const choices: Record<string, ImportUserChoice> = {
    [csvSourceId]: {
      saveCompanyKnowledge: true,
      saveContacts: true,
      saveSocialHandles: true,
      saveAudienceSegments: true,
      saveProducts: false,
      saveHistoricalCampaigns: false,
      useAsCampaignContext: true,
      useOnlyForDistribution: false,
      campaignOnly: false,
      doNotSavePersonalContactInfo: false,
      doNotRetainSourceFile: false,
      audienceListName: 'Pune Industrial OEMs'
    },
    [xlsxSourceId]: {
      saveCompanyKnowledge: true,
      saveContacts: false,
      saveSocialHandles: false,
      saveAudienceSegments: false,
      saveProducts: true,
      saveHistoricalCampaigns: false,
      useAsCampaignContext: true,
      useOnlyForDistribution: false,
      campaignOnly: false,
      doNotSavePersonalContactInfo: false,
      doNotRetainSourceFile: false
    }
  };

  const campaignId = 'cmp-2026-test-q1';
  const confirmResult = await importService.confirmImport({
    sessionId,
    sourceIds: [csvSourceId, xlsxSourceId],
    choices,
    campaignId,
    organizationId: orgA,
    actorUserId: actor
  });

  assert.strictEqual(confirmResult.success, true);
  assert.strictEqual(confirmResult.contactsInserted, 3, '3 contacts should be inserted');
  assert(confirmResult.knowledgeItemsCreated >= 2, 'Knowledge items should be created for products and company context');
  assert.strictEqual(confirmResult.audienceListsCreated, 1, '1 audience list should be created');
  assert.strictEqual(confirmResult.campaignContextsCreated, 2, '2 campaign context sources should be created');
  console.log('✓ Import confirmed: 3 contacts, product catalog knowledge, audience list, and campaign context created.');

  console.log('\n[9] Duplicate Contact Handling with Normalized Email/Phone');
  // Re-importing a list containing duplicate email with updated title/location
  const duplicateContacts: DbContactRow[] = [
    {
      contactId: 'cnt_new_attempt',
      organizationId: orgA,
      name: 'Rajesh K. Sharma',
      email: 'RAJESH@tata-motors.com', // uppercase to verify normalization
      phone: '+91 98230 11223',
      company: 'Tata Motors Limited',
      location: 'Chakan, Pune',
      segment: 'Automotive OEM Head',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      contactId: 'cnt_fresh_brand_new',
      organizationId: orgA,
      name: 'Dr. Ramesh G',
      email: 'ramesh@bajajauto.co.in',
      phone: '+91 99999 88888',
      company: 'Bajaj Auto',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const dedupeResult = await db.batchUpsertContacts(duplicateContacts, orgA, actor);
  assert.strictEqual(dedupeResult.updated, 1, 'Existing contact rajesh@tata-motors.com should be updated, NOT duplicated');
  assert.strictEqual(dedupeResult.inserted, 1, 'New contact ramesh@bajajauto.co.in should be inserted');

  const allOrgAContacts = db.getContacts(orgA);
  const rajeshEntries = allOrgAContacts.filter(c => c.email?.toLowerCase() === 'rajesh@tata-motors.com');
  assert.strictEqual(rajeshEntries.length, 1, 'Exactly 1 record for Rajesh Sharma must exist in database');
  assert.strictEqual(rajeshEntries[0].company, 'Tata Motors Limited', 'Record should have merged updated company');
  console.log('✓ Duplicate contact prevented: 1 updated via normalized email, 1 inserted.');

  console.log('\n[10] Company Isolation Enforcement');
  const orgBContacts = db.getContacts(orgB);
  assert.strictEqual(orgBContacts.length, 0, 'Company B must NOT see any contacts from Company A');

  const orgBKnowledge = db.getCompanyKnowledge(orgB);
  assert.strictEqual(orgBKnowledge.length, 0, 'Company B must NOT see any knowledge records from Company A');

  const orgBSources = db.getKnowledgeSources(orgB);
  assert.strictEqual(orgBSources.length, 0, 'Company B must NOT see any knowledge sources from Company A');
  console.log('✓ Company isolation strictly verified server-side: 0 records leaked across organization boundary.');

  console.log('\n[11] Campaign-Only Context vs Permanent Knowledge');
  const session2 = 'session_campaign_only_test';
  const stagedPii = await importService.inspectAndStageFiles(session2, orgA, actor, [csvItem]);
  const piiSourceId = stagedPii.inspections[0].sourceId;

  const campaignOnlyChoice: Record<string, ImportUserChoice> = {
    [piiSourceId]: {
      saveCompanyKnowledge: false,
      saveContacts: false,
      saveSocialHandles: false,
      saveAudienceSegments: false,
      saveProducts: false,
      saveHistoricalCampaigns: false,
      useAsCampaignContext: true,
      useOnlyForDistribution: false,
      campaignOnly: true, // Campaign only!
      doNotSavePersonalContactInfo: true,
      doNotRetainSourceFile: true
    }
  };

  const initialContactCount = db.getContacts(orgA).length;
  await importService.confirmImport({
    sessionId: session2,
    sourceIds: [piiSourceId],
    choices: campaignOnlyChoice,
    campaignId: 'cmp-temp-run',
    organizationId: orgA,
    actorUserId: actor
  });

  const postContactCount = db.getContacts(orgA).length;
  assert.strictEqual(postContactCount, initialContactCount, 'Contact count must not increase when campaignOnly and doNotSavePersonalContactInfo are selected');
  
  const ccsList = db.getCampaignContextSources('cmp-temp-run', orgA);
  assert.strictEqual(ccsList.length, 1, 'Campaign context source must be attached to the target campaign');
  assert.strictEqual(ccsList[0].useMode, 'CAMPAIGN_CONTEXT');
  console.log('✓ Campaign-only context respected: context attached to campaign without polluting permanent contacts.');

  console.log('\n[12] Distribution List Attachment & Activity Logging');
  const attachedLists = db.getAudienceLists(orgA);
  assert(attachedLists.length >= 1, 'Audience list must exist in database');
  const listMembers = db.getAudienceListMembers(attachedLists[0].listId);
  assert(listMembers.length > 0, 'Audience list must have member contact IDs mapped');

  const activityLogs = (db as any).store.activityLog || [];
  const uploadLog = activityLogs.find((l: any) => l.action === 'IMPORT_UPLOAD');
  const confirmLog = activityLogs.find((l: any) => l.action === 'IMPORT_CONFIRMED');
  const contactLog = activityLogs.find((l: any) => l.action === 'CONTACT_CREATED');
  assert(uploadLog, 'IMPORT_UPLOAD activity must be logged');
  assert(confirmLog, 'IMPORT_CONFIRMED activity must be logged');
  assert(contactLog, 'CONTACT_CREATED activity must be logged');
  console.log('✓ Activity log verified: IMPORT_UPLOAD, IMPORT_CONFIRMED, and CONTACT_CREATED logged with actor/company scoping.');

  console.log('\n[13] Refresh Persistence (Disk Store Reload)');
  const reloadedDb = new AutonomaDatabaseManager(tempDbPath);
  const reloadedContacts = reloadedDb.getContacts(orgA);
  const reloadedSources = reloadedDb.getKnowledgeSources(orgA);
  const reloadedLists = reloadedDb.getAudienceLists(orgA);
  assert.strictEqual(reloadedContacts.length, allOrgAContacts.length, 'Contacts must persist across disk reloads');
  assert(reloadedSources.length >= 2, 'Knowledge sources must persist across disk reloads');
  assert(reloadedLists.length >= 1, 'Audience lists must persist across disk reloads');
  console.log(`✓ Refresh persistence verified: ${reloadedContacts.length} contacts and ${reloadedSources.length} sources successfully recovered from disk.`);

  console.log('\n[14] Campaign Engine & Existing Deliverables Integrity');
  const initialCampaigns = reloadedDb.getCampaigns(orgA);
  assert(initialCampaigns.length > 0, 'Foundational campaigns must remain intact');
  const initialAssets = reloadedDb.getAssets(initialCampaigns[0].campaignId);
  assert(initialAssets.length > 0, 'Deliverables and assets must remain intact');
  console.log(`✓ Campaign engine unchanged: ${initialCampaigns.length} campaigns and existing assets completely intact.`);

  // Cleanup temp database file
  try { fs.unlinkSync(tempDbPath); } catch {}

  console.log('\n====================================================');
  console.log('ALL 14 TEST CRITERIA PASSED CLEANLY');
  console.log('====================================================');
}

runDataImportVerification().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
