import { autonomaDb } from '../server/autonomaDatabase.js';
import { aiProviderService } from '../server/aiProviderService.js';
import { emailService } from '../server/emailService.js';
import { analyzeBrandGuidelinesPdf } from '../server/brandPdfService.js';

async function runTests() {
  console.log('=== RUNNING CONTROLLED BATCH 1 VALIDATION TESTS ===');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // TEST 1: Tenant Isolated Brand Design System
  console.log('\n--- 1. Brand Design System Isolation ---');
  const companies = autonomaDb.getCompanies();
  const c1 = companies[0];
  let c2 = companies[1];
  if (!c2) {
    c2 = await autonomaDb.createCompany('Nova Systems Tech', 'ACTIVE', {
      organizationType: 'saas',
      description: 'Enterprise workflow intelligence',
      audience: 'CTOs and VP Engineering',
      primaryGoal: 'Enterprise pipeline growth'
    });
  }

  // Save distinct brand design system to C1
  await autonomaDb.updateCompany(c1.companyId, {
    profile: {
      ...(c1.profile as any),
      brandDesignSystem: {
        primaryColor: '#0F172A',
        secondaryColor: '#38BDF8',
        accentColor: '#F59E0B',
        backgroundColor: '#FFFFFF',
        textColor: '#0F172A',
        headingFont: 'Outfit',
        bodyFont: 'Plus Jakarta Sans',
        visualStyleNotes: 'Clean, modern enterprise SaaS aesthetic with high clarity.',
        imageStyle: 'Real engineering teams, modern clean code spaces.',
        videoStyleDirection: 'Kinetic typography with product diagrams.',
        creativeRules: 'Never use cheesy clip art. Maintain high contrast.'
      }
    }
  });

  // Save distinct brand design system to C2
  await autonomaDb.updateCompany(c2.companyId, {
    profile: {
      ...(c2.profile as any),
      brandDesignSystem: {
        primaryColor: '#831843',
        secondaryColor: '#F43F5E',
        accentColor: '#10B981',
        backgroundColor: '#FFF1F2',
        textColor: '#881337',
        headingFont: 'Playfair Display',
        bodyFont: 'Lora',
        visualStyleNotes: 'Editorial luxury branding.',
        imageStyle: 'High-end studio photography with soft dramatic lighting.',
        videoStyleDirection: 'Slow cinema-grade camera moves.',
        creativeRules: 'Never rush pacing. Elegant serif typography only.'
      }
    }
  });

  const reloadedC1 = autonomaDb.getCompany(c1.companyId);
  const reloadedC2 = autonomaDb.getCompany(c2.companyId);

  assert(reloadedC1?.profile?.brandDesignSystem?.primaryColor === '#0F172A', 'Company 1 primary color is #0F172A');
  assert(reloadedC1?.profile?.brandDesignSystem?.headingFont === 'Outfit', 'Company 1 heading font is Outfit');
  assert(reloadedC2?.profile?.brandDesignSystem?.primaryColor === '#831843', 'Company 2 primary color is #831843');
  assert(reloadedC2?.profile?.brandDesignSystem?.headingFont === 'Playfair Display', 'Company 2 heading font is Playfair Display');
  assert(reloadedC1?.profile?.brandDesignSystem?.primaryColor !== reloadedC2?.profile?.brandDesignSystem?.primaryColor, 'Brand systems remain strictly isolated between workspaces');

  // TEST 2: Brand Context Injection in Generation
  console.log('\n--- 2. Brand Context Injected into Prompts ---');
  const enrichedPrompt = aiProviderService.buildEnrichedImagePrompt({
    prompt: 'High converting social creative showing workflow bottleneck solved',
    brandDesignSystem: reloadedC1?.profile?.brandDesignSystem,
    platform: 'linkedin',
    language: 'English',
    objective: 'Drive enterprise demo bookings'
  });

  assert(enrichedPrompt.includes('BRAND COLOR PALETTE: Primary: #0F172A'), 'Prompt includes Company 1 Primary Color #0F172A');
  assert(enrichedPrompt.includes('TYPOGRAPHY DIRECTION: Heading font style: Outfit'), 'Prompt includes Company 1 Heading font Outfit');
  assert(enrichedPrompt.includes('VISUAL STYLE: Clean, modern enterprise SaaS aesthetic'), 'Prompt includes visual style direction');
  assert(enrichedPrompt.includes('TARGET PLATFORM: LINKEDIN'), 'Prompt includes target platform context');
  assert(enrichedPrompt.includes('CONTENT OBJECTIVE: Drive enterprise demo bookings'), 'Prompt includes content objective');

  // TEST 3: AI Provider Settings & Masking
  console.log('\n--- 3. AI & Media Provider Settings ---');
  aiProviderService.updateSettings({
    defaults: { text: 'gemini', image: 'openai', video: 'nvidia' },
    providers: {
      openai: {
        id: 'openai',
        name: 'OpenAI',
        apiKey: 'sk-proj-mockTestKey1234567890abcd',
        capabilities: ['text', 'image'],
        selectedModel: 'dall-e-3',
        availableModels: ['dall-e-3', 'dall-e-2']
      },
      nvidia: {
        id: 'nvidia',
        name: 'NVIDIA NIM',
        apiKey: 'nvapi-mockTestNvidiaKey99998888',
        capabilities: ['image', 'video'],
        selectedModel: 'stabilityai/stable-diffusion-xl-base-1.0',
        availableModels: ['stabilityai/stable-diffusion-xl-base-1.0', 'black-forest-labs/flux-1-schnell', 'nvidia/genai-video-mvp']
      }
    },
    googleDrive: {
      folderIdOrUrl: 'https://drive.google.com/drive/folders/1ABCXYZ-demo-folder',
      enabled: true
    }
  });

  const masked = aiProviderService.getSettings(false);
  assert(masked.defaults.image === 'openai', 'Default image provider set to OpenAI');
  assert(masked.defaults.video === 'nvidia', 'Default video provider set to NVIDIA');
  assert(masked.providers.openai.hasKey === true, 'OpenAI hasKey is true');
  assert(Boolean(masked.providers.openai.apiKey?.includes('••••')), 'OpenAI key is masked in client representation');
  assert(masked.providers.nvidia.hasKey === true, 'NVIDIA hasKey is true');
  assert(Boolean(masked.providers.nvidia.apiKey?.includes('••••')), 'NVIDIA key is masked in client representation');
  assert(masked.googleDrive?.folderIdOrUrl === 'https://drive.google.com/drive/folders/1ABCXYZ-demo-folder', 'Google Drive folder link mapped');

  // TEST 4: Transactional Email Delivery & Invite Flow
  console.log('\n--- 4. Transactional Email Delivery & Invite Tracking ---');
  const emailResult = await emailService.sendWorkspaceInvite({
    toEmail: process.env.INITIAL_SUPER_ADMIN_EMAIL || 'amarpawar2007@gmail.com',
    toName: 'Amar Pawar',
    companyName: c1.name,
    inviterName: 'Lead Admin',
    role: 'MEMBER',
    inviteLink: `http://localhost:3000/?invite=mem_test_123&company=${c1.companyId}`
  });

  assert(emailResult.success === true, 'Transactional invite email dispatched without silent failure');
  assert(Boolean(emailResult.messageId || emailResult.previewUrl), 'Email delivery returned message ID or preview verification');

  // Verify membership invite tracking in database
  const dummyUser = {
    userId: `usr_test_${Date.now()}`,
    email: 'newmember@clientcompany.com',
    name: 'Jordan Smith',
    isSuperAdmin: false,
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };
  await autonomaDb.saveUser(dummyUser);
  const mem = await autonomaDb.createMembership(dummyUser.userId, c1.companyId, 'MEMBER', 'SYSTEM');
  const updatedMem = await autonomaDb.updateMembership(mem.membershipId, {
    inviteStatus: emailResult.success ? 'SENT' : 'FAILED',
    inviteSentAt: new Date().toISOString(),
    inviteLink: `http://localhost:3000/?invite=${mem.membershipId}&company=${c1.companyId}`
  });

  assert(updatedMem.inviteStatus === 'SENT', 'Membership record tracks inviteStatus: SENT');
  assert(Boolean(updatedMem.inviteSentAt), 'Membership record tracks inviteSentAt timestamp');
  assert(Boolean(updatedMem.inviteLink), 'Membership record tracks direct onboarding invite link');

  // TEST 5: Brand Guidelines PDF Ingestion Helper Test
  console.log('\n--- 5. Brand Guidelines PDF Ingestion ---');
  const mockPdfText = `%PDF-1.4\nBrand Guidelines for Acme Robotics\nPrimary Brand Color: #1E293B\nSecondary Brand Color: #F97316\nHeading Font: Space Grotesk\nBody Font: Inter\nBrand Voice: Technical, precise, and visionary.\nVisual Style: Dark mode UI, crisp vector diagrams, industrial robotics photography.\nRules: Avoid hand-drawn cartoon graphics. Never claim 100% autonomous zero-error operations without certification.`;
  const pdfBuffer = Buffer.from(mockPdfText, 'utf-8');

  // If GEMINI_API_KEY is present in env, run live AI PDF test, otherwise verify safe fallback
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    console.log('Testing live PDF analysis with Gemini...');
    const pdfAnalysis = await analyzeBrandGuidelinesPdf(pdfBuffer, geminiKey);
    assert(pdfAnalysis.success === true, 'PDF brand guidelines analyzed successfully with AI');
    assert(Boolean(pdfAnalysis.suggestions?.primaryColor), `Suggested Primary Color: ${pdfAnalysis.suggestions?.primaryColor}`);
    assert(Boolean(pdfAnalysis.suggestions?.headingFont), `Suggested Heading Font: ${pdfAnalysis.suggestions?.headingFont}`);
  } else {
    console.log('No GEMINI_API_KEY in env, testing safe error handling...');
    const pdfAnalysis = await analyzeBrandGuidelinesPdf(pdfBuffer, 'mock_key');
    assert(pdfAnalysis.success === false && Boolean(pdfAnalysis.error), 'Safe error reporting when key is invalid/unconfigured (never crashes)');
  }

  // TEST 6: Video generation path
  console.log('\n--- 6. Video Generation Path MVP ---');
  const videoResult = await aiProviderService.generateVideo({
    prompt: '30-second kinetic video breakdown of automated supply chain workflow',
    brandDesignSystem: reloadedC1?.profile?.brandDesignSystem,
    providerId: 'nvidia'
  });

  assert(videoResult.success === true, 'Video generation MVP operates without crash');
  assert(videoResult.provider === 'nvidia', 'Video generation used selected NVIDIA provider');

  // TEST 7: Dynamic Scheduling Intelligence Engine
  console.log('\n--- 7. Dynamic Scheduling Intelligence Engine ---');
  const { generateDynamicSchedule } = await import('../server/schedulingEngine.js');
  const deliverables = [
    { platform: 'linkedin', format: 'carousel', conceptIndex: 1 },
    { platform: 'instagram', format: 'reel_short', conceptIndex: 1 },
    { platform: 'twitter', format: 'static_poster', conceptIndex: 2 },
    { platform: 'youtube', format: 'reel_short', conceptIndex: 2 }
  ];
  const schedule = generateDynamicSchedule('2026-10-15', 7, deliverables, { companyTimezone: 'Asia/Kolkata' });
  assert(schedule.length === 4, 'Scheduled slots match deliverables count');
  assert(!schedule.some(s => s.postTime === '11:30 AM'), 'No static 11:30 AM scheduling across slots');
  assert(schedule[0].timezone === 'Asia/Kolkata', 'Timezone respected');
  assert(schedule[0].postTimeFormatted.includes('IST'), 'Formatted post time contains IST label');
  assert(Boolean(schedule[0].recommendedReason), 'Slot includes AI recommendation rationale');
  assert(schedule[0].aiContentScoreEstimated >= 80, 'Slot includes heuristic AI Content Score');

  // TEST 8: Supabase Storage Adapter & Fallback Resilience
  console.log('\n--- 8. Supabase Storage Adapter Resilience ---');
  const { supabaseStorage, getSupabaseConfig } = await import('../server/supabaseStorage.js');
  const supaConf = getSupabaseConfig();
  assert(typeof supaConf.isConfigured === 'boolean', 'Supabase config resolution executed safely');
  const migrationRes = await supabaseStorage.migrateStore((autonomaDb as any).store || {} as any);
  assert(typeof migrationRes.migrated === 'boolean', 'Idempotent store migration runs safely without crashing');

  // TEST 9: Permanent Company Deletion & Tombstone
  console.log('\n--- 9. Permanent Company Deletion ---');
  const tempCompany = await autonomaDb.createCompany('Temp Deletion Target Co', 'ACTIVE', {
    description: 'Temporary company created to test deletion persistence'
  });
  assert(Boolean(tempCompany.companyId), 'Temporary company created');
  const deleteRes = await autonomaDb.deleteCompany(tempCompany.companyId, 'usr_super_admin');
  assert(deleteRes.companyId === tempCompany.companyId, 'Company deleted successfully');
  assert(autonomaDb.getCompany(tempCompany.companyId) === null, 'Company no longer in database');
  const isDeletedTracked = ((autonomaDb as any).store.deletedCompanyIds || []).includes(tempCompany.companyId);
  assert(isDeletedTracked === true, 'Deleted company ID tracked in deletion tombstone array');

  // TEST 10: Google Sheets Settings & Server Secret Authority
  console.log('\n--- 10. Google Sheets Settings & Server Secrets ---');
  const settingsInfo = autonomaDb.getSettings();
  assert(typeof settingsInfo.hasSheetsConnection === 'boolean', 'hasSheetsConnection is boolean');
  assert(typeof settingsInfo.isServerSecret === 'boolean', 'isServerSecret is boolean');
  if (settingsInfo.isServerSecret) {
    assert(settingsInfo.googleSheetsUrl.includes('SERVER_SECRET') || settingsInfo.googleSheetsUrl.includes('***') || settingsInfo.googleSheetsUrl.includes('/exec'), 'Server secret URL safely masked or resolved');
  }

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
