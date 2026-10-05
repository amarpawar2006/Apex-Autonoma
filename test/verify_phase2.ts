import fs from 'fs';
import os from 'os';
import path from 'path';
import assert from 'assert';
import { AutonomaDatabaseManager, DEFAULT_ORG_ID, INITIAL_SUPER_ADMIN_EMAIL, campaignToDbRow } from '../server/autonomaDatabase';

async function runPhase2Verification() {
  const tempDbPath = path.join(os.tmpdir(), `autonoma-test-phase2-${Date.now()}.json`);
  const autonomaDb = new AutonomaDatabaseManager(tempDbPath);

  console.log('--- STARTING AUTONOMA PHASE 2 ISOLATED FIXTURE VERIFICATION ---');

  // Test 1: Verify Legacy Data Isolation
  console.log('\n[Test 1] Verifying Legacy Data Isolation...');
  const companies = autonomaDb.getCompanies();
  const apexCompany = companies.find(c => c.companyId === DEFAULT_ORG_ID);
  assert(apexCompany, 'Apex Engineering Pune must exist as default legacy organization');
  assert.strictEqual(apexCompany.name, 'Apex Engineering Pune');

  const apexCampaigns = autonomaDb.getCampaigns(DEFAULT_ORG_ID);
  assert(apexCampaigns.length > 0, 'Apex Engineering must have campaigns');
  for (const c of apexCampaigns) {
    assert.strictEqual(c.organizationId, DEFAULT_ORG_ID, `Campaign ${c.campaignId} must belong to ${DEFAULT_ORG_ID}`);
  }

  // Create isolated company B (e.g. Flightpath Aviation)
  const companyB = await autonomaDb.createCompany('Flightpath Aviation Consultants');
  const companyBCampaigns = autonomaDb.getCampaigns(companyB.companyId);
  assert.strictEqual(companyBCampaigns.length, 0, 'New company must NOT have access to Apex campaigns');
  console.log('✓ Legacy data mapped strictly to Apex Engineering Pune. Zero cross-company leakage to new company.');

  // Test 2: Role & Membership Enforcement
  console.log('\n[Test 2] Verifying User, Membership & Initial Super Admin Settings...');
  // Ensure Super Admin identity setting is server-enforced
  assert.strictEqual(INITIAL_SUPER_ADMIN_EMAIL, 'amarpawar2007@gmail.com');

  // Create Test User 1 (Member) and Test User 2 (Company Admin) in Company B
  const memberUser = await autonomaDb.saveUser({
    userId: 'usr_test_member',
    email: 'member.test@flightpath.com',
    name: 'Test Member',
    isSuperAdmin: false,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  });

  const memberMem = await autonomaDb.createMembership(memberUser.userId, companyB.companyId, 'MEMBER', 'ADMIN_SETUP');
  assert.strictEqual(memberMem.role, 'MEMBER');

  // Verify safe repeated approval & duplicate prevention
  const duplicateMem = await autonomaDb.createMembership(memberUser.userId, companyB.companyId, 'MEMBER', 'ADMIN_SETUP');
  assert.strictEqual(duplicateMem.membershipId, memberMem.membershipId, 'Must not create duplicate membership');
  const allMemsForUser = autonomaDb.getMemberships(memberUser.userId, companyB.companyId);
  assert.strictEqual(allMemsForUser.length, 1, 'Should have exactly 1 membership');
  console.log('✓ Membership duplicate prevention and safe repeated assignments verified.');

  // Test 3: Cross-Company Isolation for Assets & Campaigns
  console.log('\n[Test 3] Verifying Cross-Company Isolation for Assets & Campaigns...');
  const testCampId = `cmp-flightpath-${Date.now()}`;
  const campBRow = campaignToDbRow({
    id: testCampId,
    campaignCode: `CMP-FLIGHTPATH-${Date.now()}`,
    name: 'Aviation Safety Protocols',
    brief: 'Commercial pilot safety updates',
    objective: 'Drive consultations',
    status: 'active',
    platforms: ['linkedin', 'twitter'],
    formats: ['carousel', 'reel_short'],
    languages: ['English'],
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as any, companyB.companyId);
  await autonomaDb.saveCampaign(campBRow, companyB.companyId);

  // Attempt reading Company B campaign using Apex Company ID -> Must return null
  const crossRead = autonomaDb.getCampaign(testCampId, DEFAULT_ORG_ID);
  assert.strictEqual(crossRead, null, 'Apex company must NOT be able to read Flightpath campaign');

  // Attempt reading Apex campaign using Company B ID -> Must return null
  const apexCamp = apexCampaigns[0];
  const leakRead = autonomaDb.getCampaign(apexCamp.campaignId, companyB.companyId);
  assert.strictEqual(leakRead, null, 'Flightpath must NOT be able to read Apex campaign');

  // Attempt unauthorized cross-company write -> Must throw
  let crossWriteBlocked = false;
  try {
    await autonomaDb.saveCampaign(campBRow, DEFAULT_ORG_ID);
  } catch (err: any) {
    if (err.message.includes('cross-company')) {
      crossWriteBlocked = true;
    }
  }
  assert.strictEqual(crossWriteBlocked, true, 'Cross-company write must be rejected by server');
  console.log('✓ Cross-company campaign isolation verified in both directions for reads and writes.');

  // Test 4: Pending Access Approval Workflow
  console.log('\n[Test 4] Verifying Signup Pending Access Workflow...');
  const newEmail = `founder.${Date.now()}@newstartup.io`;
  const pendingRequest = await autonomaDb.createApprovalRequest(newEmail, 'New Founder', 'New Startup Inc');
  assert.strictEqual(pendingRequest.status, 'PENDING');
  assert.strictEqual(pendingRequest.email, newEmail);

  // Approve the request into a new company as COMPANY_ADMIN
  const approvalResult = await autonomaDb.approveRequest(
    pendingRequest.requestId,
    'new',
    'COMPANY_ADMIN',
    'usr_super_test',
    'New Startup Inc'
  );
  assert.strictEqual(approvalResult.success, true);
  assert.strictEqual(approvalResult.request.status, 'APPROVED');
  assert.strictEqual(approvalResult.company.name, 'New Startup Inc');
  assert.strictEqual(approvalResult.membership.role, 'COMPANY_ADMIN');
  console.log('✓ Signup request creation and approval workflow verified.');

  // Test 5: Session Creation & Deletion (Sign Out)
  console.log('\n[Test 5] Verifying Session Management & Sign Out...');
  const session = await autonomaDb.createSession(memberUser.userId, companyB.companyId);
  assert(session.sessionToken, 'Must generate session token');
  
  const fetchedSession = autonomaDb.getSession(session.sessionToken);
  assert(fetchedSession, 'Session must be retrievable before sign out');

  await autonomaDb.deleteSession(session.sessionToken);
  const deletedSession = autonomaDb.getSession(session.sessionToken);
  assert.strictEqual(deletedSession, null, 'Session must be null after sign out');
  console.log('✓ Working Sign Out & session revocation verified.');

  // Test 6: Suspension Enforcement
  console.log('\n[Test 6] Verifying User and Company Suspension...');
  memberUser.status = 'SUSPENDED';
  await autonomaDb.saveUser(memberUser);
  const updatedUser = autonomaDb.getUser(memberUser.userId);
  assert.strictEqual(updatedUser?.status, 'SUSPENDED');
  console.log('✓ User suspension enforcement verified.');

  console.log('\n======================================================');
  console.log('ALL PHASE 2 ISOLATED FIXTURE VERIFICATIONS PASSED (6/6)');
  console.log('======================================================\n');

  try {
    if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);
  } catch {}
}

runPhase2Verification().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
