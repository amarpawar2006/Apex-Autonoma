import fs from 'fs';
import assert from 'assert';

const read = (path: string) => fs.readFileSync(path, 'utf8');

const server = read('server.ts');
const login = read('src/components/auth/LoginPage.tsx');
const reset = read('src/components/auth/ResetPasswordPage.tsx');
const invite = read('src/components/public/InviteLandingPage.tsx');
const support = read('src/components/public/SupportPage.tsx');
const privacy = read('src/components/public/PrivacyPage.tsx');
const terms = read('src/components/public/TermsPage.tsx');
const indexHtml = read('index.html');
const aiProvider = read('server/aiProviderService.ts');
const dataService = read('src/services/autonomaDataService.ts');
const companyModal = read('src/components/admin/CompanyManagementModal.tsx');
const campaignDetail = read('src/components/CampaignDetailView.tsx');

const checks: Array<[string, boolean]> = [
  ['Password login endpoint exists', server.includes("/api/auth/password-login")],
  ['Forgot password endpoint exists', server.includes("/api/auth/forgot-password")],
  ['Reset password endpoint exists', server.includes("/api/auth/reset-password")],
  ['Credential hashing uses scrypt', server.includes('crypto.scryptSync')],
  ['Canonical Super Admin enforced', server.includes('INITIAL_SUPER_ADMIN_EMAIL') && server.includes("user.isSuperAdmin = true")],
  ['Login UI has no Google button', !login.includes('accounts.id') && !login.includes('Google Sign')],
  ['Reset route UI exists', reset.includes('Set Password & Sign In')],
  ['Invite uses password activation', invite.includes('Set Password & Enter Workspace') && invite.includes('token')],
  ['No public signup copy', login.includes('No public signup')],
  ['Secure invite token is issued', server.includes('issuePasswordToken') && server.includes('setupToken')],
  ['Invite delivery status reaches UI', dataService.includes('emailDelivery: json.emailDelivery')],
  ['Tokenless invite fallback removed', !companyModal.includes('window.location.origin}/invite?membership=')],
  ['Campaign generation has bounded timeout', server.includes('withAiTimeout') && server.includes('30000')],
  ['Campaign generation has OpenAI fallback', server.includes('generateCampaignJsonWithFallback') && server.includes('gpt-6-luna')],
  ['OpenAI Responses API is implemented', aiProvider.includes("https://api.openai.com/v1/responses")],
  ['Failed campaign is retryable from detail', campaignDetail.includes('Retry Campaign Generation')],
  ['Provider exhaustion preserves retryable failure', server.includes('AI_PROVIDERS_EXHAUSTED')],
  ['Privacy matches password auth', privacy.includes('salted cryptographic hashes')],
  ['Terms no longer requires Google Sign-In', !terms.includes('requires authentication via Google Sign-In')],
  ['Support no longer documents Google authentication', !support.includes('Sign In & Google Authentication')],
  ['Canonical SEO metadata exists', indexHtml.includes('rel="canonical"') && indexHtml.includes('SoftwareApplication')],
  ['robots.txt exists', fs.existsSync('public/robots.txt')],
  ['sitemap.xml exists', fs.existsSync('public/sitemap.xml')],
  ['Public About landing page exists', fs.existsSync('src/components/public/AboutPage.tsx')],
  ['Root route serves public landing page', read('src/App.tsx').includes("currentPath === '/' || currentPath === '/about'")],
  ['Dedicated login route exists', read('src/App.tsx').includes("currentPath === '/login'")],
  ['Request access route exists', read('src/App.tsx').includes("currentPath === '/request-access'") && fs.existsSync('src/components/public/RequestAccessPage.tsx')],
  ['Request access endpoint exists', server.includes("app.post('/api/request-access'")],
  ['Public brochure PDF route exists', server.includes("Apex-Autonoma-Brochure.pdf") && fs.existsSync('server/autonomaBrochure.ts')],
  ['Landing page has floating brochure download', read('src/components/public/AboutPage.tsx').includes('Download Brochure')],
  ['Landing page has social sharing', read('src/components/public/AboutPage.tsx').includes('shareLinkedIn') && read('src/components/public/AboutPage.tsx').includes('shareWhatsApp')],
  ['Production fixture auth is disabled', server.includes("process.env.NODE_ENV !== 'test'") && server.includes("error: 'NOT_FOUND'")],
  ['Legacy Google auth cannot onboard tenant users', server.includes("error: 'LEGACY_LOGIN_DISABLED'")],
  ['Tenant APIs use authenticated active company scope', !server.includes('userActiveCompanyId') && server.includes('(req as any).activeCompany?.companyId')],
  ['Activity logs require Super Admin', server.includes("app.get('/api/autonoma/activity', authenticateUser, requireSuperAdmin")],
  ['Global provider settings require Super Admin', server.includes("app.post('/api/ai/providers', authenticateUser, requireSuperAdmin")],
  ['Media proxy requires tenant auth', server.includes("app.get('/api/media/proxy-image', authenticateUser, requireActiveMembership")],
  ['Media proxy uses SSRF validation', server.includes('validateSafePublicUrl(targetUrl)')],
  ['Composed creatives use durable upload helper', read('src/components/AssetProductionModal.tsx').includes('persistComposedCreative')],
  ['Runtime DB snapshots are ignored', read('.gitignore').includes('data/autonoma-database.json')],
  ['Runtime DB snapshots are not tracked', !fs.existsSync('data/autonoma-database.json') && !fs.existsSync('data/autonoma-database.backup.json')]
];

let failed = 0;
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} | ${name}`);
  if (!pass) failed++;
}
console.log(`\nPILOT RELEASE GATE: ${checks.length - failed}/${checks.length} passed`);
assert.strictEqual(failed, 0, `${failed} pilot release gate checks failed`);
