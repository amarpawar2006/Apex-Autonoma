import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const checks = [];
const check = (name, condition, detail='') => checks.push({ name, pass: Boolean(condition), detail });

const app = read('src/App.tsx');
const header = read('src/components/Header.tsx');
const guided = read('src/components/GuidedHelpCard.tsx');
const aiModal = read('src/components/AiCampaignGeneratorModal.tsx');
const studio = read('src/components/CreativeStudioView.tsx');
const production = read('src/components/AssetProductionModal.tsx');
const mediaService = read('src/services/mediaProductionService.ts');
const companyModal = read('src/components/admin/CompanyManagementModal.tsx');
const errorBoundary = read('src/components/ErrorBoundary.tsx');
const provider = read('server/aiProviderService.ts');
const supabase = read('server/supabaseStorage.ts');
const db = read('server/autonomaDatabase.ts');
const server = read('server.ts');
const css = read('src/index.css');
const publishing = read('src/components/PublishingOrchestratorView.tsx');
const growth = read('src/components/ViralityEngineView.tsx');
const login = read('src/components/auth/LoginPage.tsx');
const awaiting = read('src/components/auth/AwaitingApprovalView.tsx');
const help = read('src/components/ContextualHelpDrawer.tsx');

check('Sheets warning removed', !app.includes('Google Sheets connection unavailable'));
check('Duplicate setup checklist removed from main workspace', !app.includes('<CompanySetupChecklist'));
check('Guided setup is the single main onboarding surface', app.includes('<GuidedHelpCard'));
check('Guided media step is format-neutral', guided.includes('Produce first media asset') && !guided.includes('Generate first creative image'));
check('Primary navigation contains Brand', header.includes("label: 'Brand'"));
check('Content is directly accessible in primary navigation', header.indexOf("label: 'Content'") < header.indexOf('const secondary'));
check('Growth tool is not mislabeled Virality Engine', header.includes("label: 'Growth Mechanics'"));
check('Header stacking below modal layer', header.includes('z-[100]') && header.includes('z-[120]'));
check('Header menus expose ARIA expanded state', header.includes('aria-expanded={workspaceOpen}') && header.includes('aria-expanded={moreOpen}') && header.includes('aria-expanded={accountOpen}'));
check('Header exposes contextual Help', header.includes('Open contextual help') && app.includes('<ContextualHelpDrawer'));
check('Help drawer is searchable and contextual', help.includes('How can I help?') && help.includes('Search help: image, video, content, brand') && help.includes('Video generation and Veo billing'));
check('Header controls lock while dialogs are open', header.includes('uiBlocked') && app.includes('uiBlocked={Boolean'));

check('Create campaign modal is top-layer dialog', aiModal.includes('z-[300]') && aiModal.includes('aria-modal="true"'));
check('Create campaign modal starts at scroll top', aiModal.includes('scrollTo({ top: 0'));
check('Create campaign modal has keyboard close/focus', aiModal.includes("event.key === 'Escape'") && aiModal.includes('tabIndex={-1}'));
check('Campaign brief example is visibly a placeholder', aiModal.includes('Example only'));
check('No duplicate dialog attributes', !aiModal.match(/role="dialog"[^>]*role="dialog"/));
check('Studio loads active company brand', studio.includes('getCompanyProfile') && studio.includes('brandDesignSystem'));
check('Studio contains no Apex/AES renderer markers', !studio.includes('APEX //') && !studio.includes('AES-DS'));
check('Media renderer is company-aware', mediaService.includes('companyName') && mediaService.includes('primaryColor') && mediaService.includes('backgroundColor'));
check('Media renderer contains no hardcoded Apex company label', !mediaService.includes('APEX ENGINEERING'));
check('Production modal passes provider/model context', production.includes('providerId: activeImageProviderId') && production.includes('modelName: activeImageModel'));
check('Production modal handles image URL or base64', production.includes('result.dataUrl || result.fileUrl'));
check('Production modal sits above global header menus', production.includes('z-[500]'));
check('Production modal closes with Escape and backdrop', production.includes("event.key === 'Escape'") && production.includes('e.target === e.currentTarget'));
check('External finished media can be uploaded', production.includes('Upload finished media') && mediaService.includes('/api/media/upload') && server.includes("'/api/media/upload'"));
check('Image generation automatically falls back to another configured provider', server.includes('Automatic provider fallback') && server.includes("cfg.capabilities.includes('image')"));
check('Excel-style 1899 time values are normalized for display', production.includes('1899-12-30T') && production.includes('formatScheduleTime'));

check('Video polling allows long-running Veo jobs', production.includes('attempts >= 36') && production.includes('10000'));
check('OpenAI recommended image model is GPT Image 2', provider.includes("selectedModel: 'gpt-image-2'"));
check('Google Veo is real default video provider', provider.includes("video: 'google_veo'") && provider.includes('veo-3.1-generate-preview'));
check('NVIDIA video fake-success path removed', !provider.includes("model: 'nvidia/genai-video-mvp'"));
check('Provider settings persist to Supabase', supabase.includes('upsertSettings') && db.includes('await supabaseStorage.upsertSettings(this.store.settings)'));
check('Authoritative bootstrap restores media', db.includes('...(remote.media ? { media: remote.media } : {})'));
check('Authoritative bootstrap restores settings', db.includes('...(remote.settings ? { settings: remote.settings } : {})'));
check('Generated media persists to Supabase asset fields', supabase.includes('generated_image_url') && supabase.includes('generated_video_url') && supabase.includes('carousel_visuals_json'));
check('Generated media uses tenant-scoped storage path', supabase.includes('safeScope') && server.includes("activeCompany?.companyId || 'unscoped'"));
check('Local generated-media download endpoint is authenticated', server.includes("app.get('/api/media/download/:filename', authenticateUser, requireActiveMembership"));
check('Video routes use Veo operation objects', server.includes('as GenerateVideosOperation'));
check('Understanding guards structured AI objects', companyModal.includes('Pillar') && companyModal.includes('Description') && companyModal.includes('displayValue'));
check('Understanding no longer uses white text on light cards', !companyModal.includes('className="text-white text-xs leading-relaxed'));
check('Error recovery screen follows light theme', errorBoundary.includes('bg-[#F5F5F7]') && !errorBoundary.includes('min-h-screen bg-[#0A0B0E]'));
check('Publishing screen does not pretend a post was published', publishing.includes('does not claim a post was published') && !publishing.includes('successfully published!'));
check('Growth screen explicitly avoids virality promises', growth.includes('does not promise virality'));
check('Login follows light application theme', login.includes('min-h-screen bg-[#F5F5F7]'));
check('Approval screen follows light application theme', awaiting.includes('min-h-screen bg-[#F5F5F7]'));
check('Global focus-visible treatment exists', css.includes(':focus-visible'));
check('Reduced-motion accessibility exists', css.includes('prefers-reduced-motion'));
check('Modal background scroll lock exists', css.includes('body:has([aria-modal="true"])'));
check('No obsolete Needs retry text', ![app, guided, production, studio].join('\n').includes('Needs retry'));

// Campaign generation freeze: compare to the pre-release snapshot if it exists.
const baselineRoot = '/mnt/data/autonoma_rc_before_release';
if (fs.existsSync(baselineRoot)) {
  const baselineServer = fs.readFileSync(path.join(baselineRoot, 'server.ts'), 'utf8');
  const baselineCampaign = fs.readFileSync(path.join(baselineRoot, 'src/services/campaignService.ts'));
  const campaign = fs.readFileSync(path.join(root, 'src/services/campaignService.ts'));
  const slice = (text) => text.slice(text.indexOf("app.post('/api/campaign/synthesize-campaign'"), text.indexOf('// Ensure public/generated-media directory exists'));
  const sha = (v) => crypto.createHash('sha256').update(v).digest('hex');
  check('Campaign synthesis/retry server region frozen', sha(slice(server)) === sha(slice(baselineServer)), sha(slice(server)));
  check('campaignService.ts frozen byte-for-byte', sha(campaign) === sha(baselineCampaign), sha(campaign));
}

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} | ${c.name}${c.detail ? ` | ${c.detail}` : ''}`);
console.log(`\nTOTAL ${checks.length} | PASS ${checks.length - failed.length} | FAIL ${failed.length}`);
if (failed.length) process.exit(1);
