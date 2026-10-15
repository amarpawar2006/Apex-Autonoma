import { Campaign, SocialAsset } from '../types/campaign';

const esc = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const fmt = (value: unknown, fallback = '—'): string => {
  if (value === null || value === undefined || value === '') return fallback;
  if (Array.isArray(value)) return value.map((item) => fmt(item, '')).filter(Boolean).join(' • ') || fallback;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const nl2br = (value: unknown): string => esc(fmt(value, '')).replace(/\n/g, '<br />');

function renderStrategy(campaign: Campaign): string {
  const strategy = campaign.strategy;
  if (!strategy) return '<p class="muted">No campaign strategy was stored.</p>';

  const rows: Array<[string, unknown]> = [
    ['Objective Summary', strategy.objectiveSummary],
    ['Target Audience', strategy.targetAudience],
    ['Buyer Personas', strategy.buyerPersonas],
    ['Core Insight', strategy.coreInsight],
    ['Value Proposition', strategy.valueProposition],
    ['Content Pillars', strategy.contentPillars],
    ['Posting Sequence', strategy.postingSequence],
    ['Recommended Posting Schedule', strategy.recommendedPostingSchedule],
    ['Language Guidance', strategy.languageGuidance],
    ['Format Mix', strategy.formatMix],
  ];

  return '<div class="info-grid">' + rows
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => `<div class="info"><span>${esc(label)}</span><strong>${nl2br(value)}</strong></div>`)
    .join('') + '</div>';
}

function renderCalendarRows(assets: SocialAsset[]): string {
  if (!assets.length) return '<tr><td colspan="7" class="muted">No campaign content items found.</td></tr>';
  return [...assets]
    .sort((a, b) => `${a.targetDate || ''} ${a.postTimeIST || ''}`.localeCompare(`${b.targetDate || ''} ${b.postTimeIST || ''}`))
    .map((asset) => `
      <tr>
        <td>${esc(asset.targetDate)}</td>
        <td>${esc(asset.postTimeIST || '—')}</td>
        <td>${esc(asset.platform)}</td>
        <td>${esc(asset.format)}</td>
        <td>${esc(asset.title)}</td>
        <td>${esc(asset.status)}</td>
        <td>${esc(asset.language || '—')}</td>
      </tr>`)
    .join('');
}

function renderAsset(asset: SocialAsset, index: number): string {
  const hashtags = Array.isArray(asset.hashtags) ? asset.hashtags.map((tag) => tag.startsWith('#') ? tag : `#${tag}`).join(' ') : '';
  const slides = Array.isArray(asset.slides) && asset.slides.length
    ? `<div class="subsection"><h4>Carousel Slides</h4>${asset.slides.map((slide) => `
        <div class="nested">
          <b>Slide ${esc(slide.slideNumber)} — ${esc(slide.headline)}</b>
          ${slide.subtext ? `<div>${nl2br(slide.subtext)}</div>` : ''}
          ${Array.isArray(slide.body) ? `<ul>${slide.body.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>` : ''}
          ${slide.visualPrompt ? `<div><b>Visual prompt:</b> ${nl2br(slide.visualPrompt)}</div>` : ''}
        </div>`).join('')}</div>`
    : '';

  const scenes = Array.isArray(asset.videoScenes) && asset.videoScenes.length
    ? `<div class="subsection"><h4>Video / Reel Scenes</h4>${asset.videoScenes.map((scene) => `
        <div class="nested">
          <b>Scene ${esc(scene.sceneNumber)} — ${esc(scene.timestamp)}</b>
          <div><b>Hook:</b> ${nl2br(scene.hookText)}</div>
          <div><b>Narration:</b> ${nl2br(scene.narrationVoiceover)}</div>
          <div><b>On-screen:</b> ${nl2br(scene.onScreenCaption)}</div>
          <div><b>B-roll:</b> ${nl2br(scene.bRollPrompt)}</div>
        </div>`).join('')}</div>`
    : '';

  return `
    <article class="asset">
      <div class="asset-head">
        <div>
          <div class="eyebrow">CONTENT ${index + 1} · ${esc(asset.assetCode || asset.id)}</div>
          <h3>${esc(asset.title)}</h3>
        </div>
        <div class="badge">${esc(asset.platform)} · ${esc(asset.format)}</div>
      </div>
      <div class="meta">${esc(asset.targetDate)} · ${esc(asset.postTimeIST || '—')} · ${esc(asset.status)}${asset.language ? ` · ${esc(asset.language)}` : ''}</div>
      ${asset.strategicPurpose ? `<p><b>Strategic purpose:</b> ${nl2br(asset.strategicPurpose)}</p>` : ''}
      ${asset.angle ? `<p><b>Angle:</b> ${nl2br(asset.angle)}</p>` : ''}
      <p><b>Hook:</b> ${nl2br(asset.hook)}</p>
      <div class="copy"><b>Caption</b><div>${nl2br(asset.caption)}</div></div>
      ${hashtags ? `<p><b>Hashtags:</b> ${esc(hashtags)}</p>` : ''}
      <p><b>CTA:</b> ${nl2br(asset.callToAction)}</p>
      ${asset.targetBuyerPersona ? `<p><b>Target persona:</b> ${nl2br(asset.targetBuyerPersona)}</p>` : ''}
      ${asset.posterVisualPrompt ? `<div class="copy"><b>Visual prompt</b><div>${nl2br(asset.posterVisualPrompt)}</div></div>` : ''}
      ${asset.generatedImagePrompt ? `<div class="copy"><b>Generated image prompt</b><div>${nl2br(asset.generatedImagePrompt)}</div></div>` : ''}
      ${asset.videoGenerationPrompt ? `<div class="copy"><b>Video prompt</b><div>${nl2br(asset.videoGenerationPrompt)}</div></div>` : ''}
      ${slides}
      ${scenes}
    </article>`;
}

export function downloadFullCampaignReport(
  campaign: Campaign,
  assets: SocialAsset[],
  organizationName: string
): void {
  const campaignAssets = (assets || []).filter((asset) => !asset.isArchived);
  const generatedAt = new Date();
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(campaign.name)} — Autonoma Campaign</title>
<style>
  :root{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;color:#1d1d1f;background:#f5f5f7}
  *{box-sizing:border-box}
  body{margin:0;padding:24px;background:#f5f5f7;line-height:1.5}
  .page{max-width:1100px;margin:auto;background:#fff;border:1px solid #e8e8ea;border-radius:24px;padding:28px}
  h1{font-size:30px;line-height:1.15;margin:8px 0 10px} h2{font-size:20px;margin:32px 0 14px} h3{font-size:17px;margin:4px 0} h4{font-size:14px}
  .eyebrow{font-size:11px;font-weight:700;letter-spacing:.08em;color:#86868b;text-transform:uppercase}
  .muted,.meta{color:#6e6e73;font-size:12px}.summary{font-size:14px;color:#4a4a4f}
  .info-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .info{background:#f5f5f7;border-radius:14px;padding:12px;min-width:0}.info span{display:block;font-size:10px;text-transform:uppercase;color:#86868b;font-weight:700;margin-bottom:4px}.info strong{font-size:13px;white-space:normal;overflow-wrap:anywhere}
  .actions-note{padding:12px 14px;border-radius:14px;background:#fff6f1;border:1px solid #ffd8c7;font-size:12px}
  table{width:100%;border-collapse:collapse;font-size:11px}th,td{padding:9px;border-bottom:1px solid #ececee;text-align:left;vertical-align:top}th{background:#fafafa;position:sticky;top:0}
  .table-wrap{overflow-x:auto;border:1px solid #ececee;border-radius:14px}
  .asset{border:1px solid #e8e8ea;border-radius:18px;padding:18px;margin:14px 0;break-inside:avoid}.asset-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.badge{font-size:10px;background:#f5f5f7;padding:5px 8px;border-radius:999px;text-transform:capitalize;white-space:nowrap}
  .copy,.nested{background:#f7f7f8;border-radius:12px;padding:11px;margin:10px 0;font-size:12px;overflow-wrap:anywhere}.subsection{margin-top:14px}.subsection h4{margin-bottom:7px}ul{margin:6px 0;padding-left:18px}
  @media(max-width:640px){body{padding:0;background:#fff}.page{border:0;border-radius:0;padding:18px}.info-grid{grid-template-columns:1fr}.asset-head{flex-direction:column}.badge{white-space:normal}h1{font-size:24px}}
  @media print{body{background:#fff;padding:0}.page{border:0;max-width:none;padding:0}.asset{page-break-inside:avoid}}
</style>
</head>
<body>
<main class="page">
  <div class="eyebrow">Apex Autonoma · Full Campaign Export</div>
  <h1>${esc(campaign.name)}</h1>
  <p class="summary">${nl2br(campaign.brief)}</p>
  <div class="actions-note">This single file contains the campaign overview, strategy, schedule/calendar and complete generated content. Open it in any browser; you can also Print → Save as PDF.</div>

  <h2>Campaign Details</h2>
  <div class="info-grid">
    <div class="info"><span>Company</span><strong>${esc(organizationName || 'Company')}</strong></div>
    <div class="info"><span>Campaign Code</span><strong>${esc(campaign.campaignCode)}</strong></div>
    <div class="info"><span>Status</span><strong>${esc(campaign.status)}</strong></div>
    <div class="info"><span>Objective</span><strong>${nl2br(campaign.objective)}</strong></div>
    <div class="info"><span>Dates</span><strong>${esc(campaign.startDate)} → ${esc(campaign.endDate)}</strong></div>
    <div class="info"><span>Platforms</span><strong>${esc((campaign.platforms || []).join(', '))}</strong></div>
    <div class="info"><span>Formats</span><strong>${esc((campaign.formats || []).join(', '))}</strong></div>
    <div class="info"><span>Languages</span><strong>${esc((campaign.languages || []).join(', '))}</strong></div>
    <div class="info"><span>Created</span><strong>${esc(campaign.createdAt)}</strong></div>
    <div class="info"><span>Exported</span><strong>${esc(generatedAt.toLocaleString())}</strong></div>
  </div>

  <h2>Strategic Blueprint</h2>
  ${renderStrategy(campaign)}

  <h2>Campaign Calendar</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Date</th><th>Time</th><th>Platform</th><th>Format</th><th>Content</th><th>Status</th><th>Language</th></tr></thead>
      <tbody>${renderCalendarRows(campaignAssets)}</tbody>
    </table>
  </div>

  <h2>Complete Campaign Content (${campaignAssets.length})</h2>
  ${campaignAssets.map(renderAsset).join('') || '<p class="muted">No content items found.</p>'}
</main>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const code = (campaign.campaignCode || campaign.id || 'CAMPAIGN').replace(/[^a-zA-Z0-9-_]/g, '_');
  link.href = url;
  link.download = `AUTONOMA-FULL-CAMPAIGN-${code}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
