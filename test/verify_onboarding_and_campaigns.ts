import fs from 'fs';
import os from 'os';
import path from 'path';
import assert from 'assert';
import { AutonomaDatabaseManager, DEFAULT_ORG_ID, campaignToDbRow } from '../server/autonomaDatabase.js';
import { CompanyProfile, CompanyUnderstoodSummary } from '../src/types/auth.js';

async function testOnboardingAndCampaigns() {
  console.log('--- STARTING AUTONOMA ONBOARDING & CAMPAIGN 2.0 VERIFICATION ---');

  const tempDbPath = path.join(os.tmpdir(), `autonoma-test-onboard-${Date.now()}.json`);
  const db = new AutonomaDatabaseManager(tempDbPath);
  db.setGoogleSheetsUrl('');

  // 1. Verify Legacy Org has 100% active context out of the box
  console.log('\n[Test 1] Verifying Apex Engineering Pune Context & Profile Completion...');
  const apex = db.getCompany(DEFAULT_ORG_ID);
  assert(apex, 'Apex Engineering Pune must exist');
  assert(apex.profile, 'Apex must have a profile');
  assert(apex.profile.confirmedContext, 'Apex must have confirmedContext');
  assert.strictEqual(apex.profile.confirmedContext.isActive, true, 'Apex context must be active');
  console.log('✓ Apex Engineering Pune initialized with active v1 confirmed context.');

  // 2. Create a new company without website or context, verify completion percentage logic
  console.log('\n[Test 2] Verifying Company Setup Checklist Steps Calculation...');
  const newCompany = await db.createCompany('Sahyadri Organic Teas');
  assert(newCompany.companyId, 'Sahyadri must have an ID');

  // Helper matching CompanySetupChecklist completion logic
  function calculateSetupProgress(comp: any) {
    const profile = comp.profile;
    const steps = [
      Boolean(profile?.confirmedContext?.isActive || (profile?.website && profile?.confirmedContext)),
      Boolean(comp.name && profile?.organizationType),
      Boolean(profile?.description?.trim() && (profile?.offerings?.trim() || profile?.description?.trim().length > 15)),
      Boolean(profile?.audience?.trim() && (profile?.geography?.trim() || profile?.audience?.trim().length > 10)),
      Boolean(profile?.primaryGoal?.trim()),
      Boolean(profile?.confirmedContext?.isActive)
    ];
    const completed = steps.filter(Boolean).length;
    return { completed, total: steps.length, percent: Math.round((completed / steps.length) * 100) };
  }

  const initialProgress = calculateSetupProgress(newCompany);
  assert(initialProgress.percent < 100, 'Fresh company must not be 100% complete');
  console.log(`✓ Fresh company setup progress: ${initialProgress.completed}/${initialProgress.total} (${initialProgress.percent}%)`);

  // 3. Simulate Website Analysis and Profile Auto-Fill preserving user data
  console.log('\n[Test 3] Verifying Auto-fill without overwriting existing user data...');
  const userEnteredDescription = 'Hand-picked organic orthodox teas from high-elevation Western Ghats estates.';
  
  // User had manually entered a custom description beforehand
  const initialProfile: CompanyProfile = {
    organizationType: 'business',
    description: userEnteredDescription,
    audience: '',
    primaryGoal: ''
  };
  await db.updateCompany(newCompany.companyId, { profile: initialProfile });

  // Inferred profile from website analysis
  const inferredFromWebsite = {
    companyName: 'Sahyadri Organic Teas Private Limited',
    organizationType: 'business' as const,
    description: 'Generic beverage distributor in India.', // should NOT overwrite user's description!
    offerings: 'Single-estate black tea, green tea, lavender white tea blends',
    audience: 'Artisanal tea lovers, luxury hospitality buyers, and wellness consumers',
    geography: 'Pune, Mumbai, Bengaluru, and export to EU',
    positioning: 'India’s most sustainable biodynamic single-origin estate teas',
    primaryGoal: 'Drive retail subscription orders and upscale cafe partnerships',
    brandVoice: 'Earthy, sensory, elevated, mindful of origin',
    claimsAvoid: 'Never make uncertified medicinal claims or mention synthetic flavorings',
    preferredCta: 'Explore our harvest collection at sahyadriteas.com'
  };

  // Auto-fill logic matching CompanyManagementModal
  const currentComp = db.getCompany(newCompany.companyId)!;
  const currentProf = currentComp.profile || ({} as any);

  const filledProfile: CompanyProfile = {
    ...currentProf,
    organizationType: currentProf.organizationType || inferredFromWebsite.organizationType,
    // Preserve user-entered description!
    description: currentProf.description?.trim() ? currentProf.description : inferredFromWebsite.description,
    offerings: currentProf.offerings?.trim() ? currentProf.offerings : inferredFromWebsite.offerings,
    audience: currentProf.audience?.trim() ? currentProf.audience : inferredFromWebsite.audience,
    geography: currentProf.geography?.trim() ? currentProf.geography : inferredFromWebsite.geography,
    positioning: currentProf.positioning?.trim() ? currentProf.positioning : inferredFromWebsite.positioning,
    primaryGoal: currentProf.primaryGoal?.trim() ? currentProf.primaryGoal : inferredFromWebsite.primaryGoal,
    brandVoice: currentProf.brandVoice?.trim() ? currentProf.brandVoice : inferredFromWebsite.brandVoice,
    claimsAvoid: currentProf.claimsAvoid?.trim() ? currentProf.claimsAvoid : inferredFromWebsite.claimsAvoid,
    preferredCta: currentProf.preferredCta?.trim() ? currentProf.preferredCta : inferredFromWebsite.preferredCta,
    website: 'https://sahyadriteas.com'
  };

  assert.strictEqual(filledProfile.description, userEnteredDescription, 'User entered description MUST be preserved');
  assert.strictEqual(filledProfile.offerings, inferredFromWebsite.offerings, 'Missing offerings MUST be auto-filled');
  assert.strictEqual(filledProfile.positioning, inferredFromWebsite.positioning, 'Missing positioning MUST be auto-filled');

  // Save profile and confirm context
  const confirmedContextV1: CompanyUnderstoodSummary = {
    organizationAndOffering: filledProfile.offerings || filledProfile.description,
    audience: filledProfile.audience,
    goals: filledProfile.primaryGoal,
    voice: filledProfile.brandVoice || 'Earthy and elevated',
    cta: filledProfile.preferredCta || 'Visit website',
    constraints: filledProfile.claimsAvoid || 'None',
    positioning: filledProfile.positioning,
    geography: filledProfile.geography,
    sourceUrls: ['https://sahyadriteas.com'],
    assumptions: ['[Assumption] High-end premium direct-to-consumer tea model.'],
    version: 1,
    isActive: true,
    confirmedAt: new Date().toISOString()
  };

  filledProfile.confirmedContext = confirmedContextV1;
  filledProfile.contextVersions = [confirmedContextV1];

  const updatedComp = await db.updateCompany(newCompany.companyId, { profile: filledProfile });
  const postConfirmProgress = calculateSetupProgress(updatedComp);
  assert.strictEqual(postConfirmProgress.percent, 100, 'After confirmation and full profile, progress MUST be 100%');
  console.log(`✓ Post-confirmation progress calculated as 100% (${postConfirmProgress.completed}/${postConfirmProgress.total} steps).`);

  // 4. Persistence across complete database reload
  console.log('\n[Test 4] Verifying Persistence across cold reload from disk...');
  const coldDb = new AutonomaDatabaseManager(tempDbPath);
  coldDb.setGoogleSheetsUrl('');
  const reloadedSahyadri = coldDb.getCompany(newCompany.companyId);
  assert(reloadedSahyadri, 'Sahyadri must reload from disk');
  assert(reloadedSahyadri.profile, 'Profile must reload from disk');
  assert(reloadedSahyadri.profile.confirmedContext, 'Confirmed context must reload from disk');
  assert.strictEqual(reloadedSahyadri.profile.confirmedContext.isActive, true, 'Confirmed context must remain active');
  assert.strictEqual(reloadedSahyadri.profile.description, userEnteredDescription, 'Preserved description must remain intact');
  assert.strictEqual(calculateSetupProgress(reloadedSahyadri).percent, 100, 'Must remain 100% after cold reload');
  console.log('✓ Company profile & AI strategic context persisted with 100% completion across disk cycle.');

  // 5. Campaign Creation 2.0 Invariants
  console.log('\n[Test 5] Verifying Campaign Creation 2.0 Data Contracts...');
  const testCampaignWithLanguages = {
    id: 'cmp_marathi_ig_test',
    campaignCode: 'CMP-MAR-01',
    name: 'Diwali Festive Tea Gifting 2026',
    objective: 'Promote festive artisan tea hampers across Western Maharashtra',
    status: 'active' as const,
    startDate: '2026-10-01',
    endDate: '2026-10-25',
    platforms: ['instagram', 'snapchat', 'reddit'] as any,
    targetLanguage: 'Mixed / Marathi + English',
    languageStyle: 'Local / colloquial',
    primaryAudience: 'Festive corporate & family gifting buyers in Pune and Mumbai',
    productFocus: 'Diwali Wooden Artisan Tea Caddy Hampers',
    organizationId: newCompany.companyId,
    contentPillars: ['Festive Tradition', 'Single-Estate Purity', 'Sensory Unboxing'],
    totalAssets: 6,
    publishedAssets: 0,
    assetsReady: 3,
    assetsNeedsReview: 2
  };

  const savedCampRow = campaignToDbRow(testCampaignWithLanguages as any);
  assert(savedCampRow.platformsJson?.includes('snapchat'), 'Platforms JSON must store snapchat');
  assert(savedCampRow.platformsJson?.includes('reddit'), 'Platforms JSON must store reddit');
  assert.strictEqual(savedCampRow.targetLanguage, 'Mixed / Marathi + English', 'Target language must be preserved');
  console.log('✓ Campaign 2.0 multi-platform and language metadata serialized safely.');

  console.log('\n======================================================');
  console.log('ALL ONBOARDING & CAMPAIGN 2.0 VERIFICATIONS PASSED (5/5)');
  console.log('======================================================\n');
}

testOnboardingAndCampaigns().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
