import fs from 'fs';
import os from 'os';
import path from 'path';
import assert from 'assert';
import { 
  AutonomaDatabaseManager, 
  DEFAULT_ORG_ID, 
  campaignToDbRow 
} from '../server/autonomaDatabase';
import { CompanyProfile, CompanyUnderstoodSummary } from '../src/types/auth';

async function runPhase5Verification() {
  console.log('===============================================================');
  console.log('STARTING AUTONOMA PHASE 5: COMPANY ONBOARDING & AI CONTEXT TESTS');
  console.log('===============================================================\n');

  // Isolated temporary database store to guarantee no pollution of live database
  const tempDbPath = path.join(os.tmpdir(), `autonoma-test-phase5-${Date.now()}.json`);
  const autonomaDb = new AutonomaDatabaseManager(tempDbPath);
  autonomaDb.setGoogleSheetsUrl(''); // Strictly isolate fixtures from real Sheets network calls

  try {
    // -------------------------------------------------------------
    // Test 1: Company Profile Creation & Persistence Across Reload
    // -------------------------------------------------------------
    console.log('[Test 1] Verifying Company Profile Creation & Field Persistence...');

    // Fixture 1: Bombay Riding Club (BRC)
    const brcProfile: CompanyProfile = {
      organizationType: 'club_community',
      description: 'A premier equestrian riding and training academy in Pune offering dressage, jumping, and trail rides.',
      offerings: 'Weekend riding clinics, horse livery, private dressage coaching, guided scenic trail rides',
      audience: 'Equestrian athletes, amateur riders, youth competitors, and outdoor enthusiast families',
      geography: 'Pune and Western Ghats, Maharashtra',
      primaryGoal: 'Enrol 25 new riders for seasonal clinics and expand weekend livery memberships',
      preferredLanguage: 'English',
      timezone: 'Asia/Kolkata',
      website: 'https://bombayridingclub.in',
      socialLinks: {
        instagram: '@bombayridingclub',
        facebook: 'facebook.com/bombayridingclub'
      },
      preferredCta: 'Book a discovery trail session via WhatsApp or call our stablemaster',
      defaultWhatsAppRecipient: '+919822011223',
      brandVoice: 'Welcoming, grounded, disciplined, and passionate about horsemanship',
      claimsAvoid: 'Never promise instant Olympic training or make aggressive commercial guarantees'
    };

    const brcCompany = await autonomaDb.createCompany('Bombay Riding Club', 'ACTIVE', brcProfile);
    assert(brcCompany.companyId, 'BRC must have a valid companyId');
    assert.strictEqual(brcCompany.name, 'Bombay Riding Club');
    assert.strictEqual(brcCompany.profile?.organizationType, 'club_community');
    assert.strictEqual(brcCompany.profile?.defaultWhatsAppRecipient, '+919822011223');

    // Simulate complete reload from disk
    const reloadedDb = new AutonomaDatabaseManager(tempDbPath);
    reloadedDb.setGoogleSheetsUrl('');
    const reloadedBrc = reloadedDb.getCompany(brcCompany.companyId);
    assert(reloadedBrc, 'Company must persist to disk and reload cleanly');
    assert.strictEqual(reloadedBrc.profile?.description, brcProfile.description);
    assert.strictEqual(reloadedBrc.profile?.offerings, brcProfile.offerings);
    assert.strictEqual(reloadedBrc.profile?.claimsAvoid, brcProfile.claimsAvoid);
    console.log('✓ Company profile fields persisted and reloaded cleanly across disk cycles.');

    // -------------------------------------------------------------
    // Test 2: AI-Assisted Context Engine & Versioned Confirmation
    // -------------------------------------------------------------
    console.log('\n[Test 2] Verifying Versioned Company Context Confirmation & Activation...');

    const understoodContextV1: CompanyUnderstoodSummary = {
      organizationAndOffering: 'Premier equestrian riding, horse livery and dressage training facility in Pune.',
      audience: 'Families, recreational riders, and equestrian competitors in Western India.',
      goals: 'Seasonal clinic enrollment and trail ride discovery bookings.',
      voice: 'Authoritative, grounded, equestrian-focused, and welcoming.',
      cta: 'Book your stable tour or trail ride today.',
      constraints: 'Strictly equestrian copy. Never mention manufacturing, software, or unverified claims.',
      assumptions: ['[Assumption] Primary revenue driven by weekend lessons and stable memberships.'],
      sourceUrls: ['https://bombayridingclub.in'],
      version: 1,
      isActive: true,
      confirmedAt: new Date().toISOString(),
      confirmedBy: 'usr_super_admin'
    };

    // Update with confirmed context
    const updatedProfileWithContext: CompanyProfile = {
      ...reloadedBrc.profile,
      confirmedContext: understoodContextV1,
      contextVersions: [understoodContextV1]
    };

    const confirmedBrc = await autonomaDb.updateCompany(brcCompany.companyId, { profile: updatedProfileWithContext });
    assert(confirmedBrc.profile?.confirmedContext?.isActive, 'Context must be active upon confirmation');
    assert.strictEqual(confirmedBrc.profile?.confirmedContext?.version, 1);
    assert.strictEqual(confirmedBrc.profile?.contextVersions?.length, 1);
    console.log('✓ Authorized admin confirmation correctly activates versioned company context.');

    // -------------------------------------------------------------
    // Test 3: Second Distinct Company Context (Kisan Organic Flour Mills)
    // -------------------------------------------------------------
    console.log('\n[Test 3] Verifying Second Distinct Company (Kisan Organic Flour Mill)...');

    const kisanProfile: CompanyProfile = {
      organizationType: 'business',
      description: 'Traditional stone-ground whole wheat chakki atta and cold-milled ancient grains with zero preservatives.',
      offerings: 'MP Sharbati whole wheat atta, stone-ground ragi flour, multi-millet mixes, cold-pressed sesame oil',
      audience: 'Health-conscious home cooks, traditional Indian families, and nutrition-focused meal planners',
      geography: 'Pune, Mumbai, and Nashik residential hubs',
      primaryGoal: 'Drive weekly household subscriptions and direct orders',
      preferredLanguage: 'English, Marathi',
      timezone: 'Asia/Kolkata',
      website: 'https://kisanflourmills.com',
      preferredCta: 'Order fresh-milled atta for doorstep delivery',
      defaultWhatsAppRecipient: '+919922334455',
      brandVoice: 'Wholesome, honest, rustic, kitchen-tested, and transparent about purity',
      claimsAvoid: 'Never make unscientific medical curing claims or mock modern food choices'
    };

    const kisanCompany = await autonomaDb.createCompany('Kisan Organic Flour Mill', 'ACTIVE', kisanProfile);
    assert(kisanCompany.companyId, 'Kisan must have a valid companyId');

    const kisanContextV1: CompanyUnderstoodSummary = {
      organizationAndOffering: 'Stone-ground chakki flour and cold-milled traditional grains delivered fresh.',
      audience: 'Urban families and health-focused home cooks seeking unadulterated staple nutrition.',
      goals: 'Direct-to-consumer household flour subscriptions.',
      voice: 'Warm, rustic, authentic, and culinary-grounded.',
      cta: 'Order fresh stone-ground atta directly to your kitchen.',
      constraints: 'Food purity focus only. Never inject tech, CNC, or industrial machining copy.',
      assumptions: ['[Assumption] Customers prioritize freshness and absence of chemical bleaching agents.'],
      sourceUrls: ['https://kisanflourmills.com'],
      version: 1,
      isActive: true,
      confirmedAt: new Date().toISOString(),
      confirmedBy: 'usr_super_admin'
    };

    await autonomaDb.updateCompany(kisanCompany.companyId, {
      profile: {
        ...kisanProfile,
        confirmedContext: kisanContextV1,
        contextVersions: [kisanContextV1]
      }
    });

    console.log('✓ Second distinct company context (Kisan Flour Mills) created and confirmed.');

    // -------------------------------------------------------------
    // Test 4: Campaign Isolation and Anti-Pollution Validation
    // -------------------------------------------------------------
    console.log('\n[Test 4] Verifying Cross-Company Campaign Isolation (BRC vs Kisan vs Apex)...');

    // Save a campaign under BRC
    const brcCampaignRow = campaignToDbRow({
      id: 'cmp-brc-autumn-clinic',
      campaignCode: 'CMP-BRC-01',
      name: 'Autumn Trail & Dressage Clinic',
      brief: 'Promote our upcoming 3-day riding clinic and trail experience for amateur horse riders in Pune.',
      objective: 'Enrol 15 riders',
      status: 'ACTIVE',
      platforms: ['instagram', 'facebook'],
      formats: ['carousel', 'reel_short'],
      languages: ['English'],
      startDate: '2026-10-01',
      endDate: '2026-10-08',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assetCount: 0
    }, brcCompany.companyId);

    await autonomaDb.saveCampaign(brcCampaignRow, brcCompany.companyId);

    // Save a campaign under Kisan Flour Mill
    const kisanCampaignRow = campaignToDbRow({
      id: 'cmp-kisan-fresh-milled',
      campaignCode: 'CMP-KISAN-01',
      name: 'Fresh Stone-Ground Atta Subscription',
      brief: 'Introduce weekly subscription of fresh stone-ground Sharbati whole wheat atta delivered within 24 hours of milling.',
      objective: '50 new subscriptions',
      status: 'ACTIVE',
      platforms: ['instagram', 'facebook', 'linkedin'],
      formats: ['carousel', 'static_poster'],
      languages: ['English'],
      startDate: '2026-10-05',
      endDate: '2026-10-12',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assetCount: 0
    }, kisanCompany.companyId);

    await autonomaDb.saveCampaign(kisanCampaignRow, kisanCompany.companyId);

    // Verify isolation
    const brcCampaigns = autonomaDb.getCampaigns(brcCompany.companyId);
    const kisanCampaigns = autonomaDb.getCampaigns(kisanCompany.companyId);
    const apexCampaigns = autonomaDb.getCampaigns(DEFAULT_ORG_ID);

    assert.strictEqual(brcCampaigns.length, 1, 'BRC should have exactly 1 campaign');
    assert.strictEqual(brcCampaigns[0].campaignId, 'cmp-brc-autumn-clinic');

    assert.strictEqual(kisanCampaigns.length, 1, 'Kisan should have exactly 1 campaign');
    assert.strictEqual(kisanCampaigns[0].campaignId, 'cmp-kisan-fresh-milled');

    // Ensure zero cross-company leakage
    assert(
      !brcCampaigns.some(c => c.campaignId === 'cmp-kisan-fresh-milled'),
      'BRC must NOT see Kisan campaigns'
    );
    assert(
      !kisanCampaigns.some(c => c.campaignId === 'cmp-brc-autumn-clinic'),
      'Kisan must NOT see BRC campaigns'
    );
    assert(
      !apexCampaigns.some(c => c.campaignId === 'cmp-brc-autumn-clinic' || c.campaignId === 'cmp-kisan-fresh-milled'),
      'Apex must NOT see new company campaigns'
    );

    console.log('✓ Strict cross-company campaign isolation verified across all companies.');

    // -------------------------------------------------------------
    // Test 5: Accurate Company Counts (Total, Active, Suspended)
    // -------------------------------------------------------------
    console.log('\n[Test 5] Verifying Company Counts Accuracy (Total, Active, Suspended)...');
    
    // Suspend one company to test count accuracy
    await autonomaDb.updateCompany(kisanCompany.companyId, { status: 'SUSPENDED' });

    const allCompanies = autonomaDb.getCompanies();
    const totalCount = allCompanies.length;
    const activeCount = allCompanies.filter(c => c.status === 'ACTIVE').length;
    const suspendedCount = allCompanies.filter(c => c.status === 'SUSPENDED').length;

    assert.strictEqual(totalCount, 3, 'Total companies should be 3 (Apex, BRC, Kisan)');
    assert.strictEqual(activeCount, 2, 'Active companies should be 2 (Apex, BRC)');
    assert.strictEqual(suspendedCount, 1, 'Suspended companies should be 1 (Kisan)');
    console.log(`✓ Accurate company counts verified: ${totalCount} Total, ${activeCount} Active, ${suspendedCount} Suspended.`);

    console.log('\n===============================================================');
    console.log('ALL PHASE 5 FIXTURE & ISOLATION VERIFICATIONS PASSED (5/5)');
    console.log('===============================================================\n');
  } finally {
    // Clean up temporary test file so disk remains clean
    try {
      if (fs.existsSync(tempDbPath)) {
        fs.unlinkSync(tempDbPath);
      }
    } catch {}
  }
}

runPhase5Verification().catch(err => {
  console.error('PHASE 5 VERIFICATION FAILED:', err);
  process.exit(1);
});
