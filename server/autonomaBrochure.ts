import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';

const C = {
  bg: rgb(0.039, 0.043, 0.055),
  panel: rgb(0.075, 0.082, 0.102),
  ink: rgb(0.114, 0.114, 0.122),
  muted: rgb(0.43, 0.43, 0.46),
  light: rgb(0.961, 0.961, 0.969),
  white: rgb(1, 1, 1),
  orange: rgb(1, 0.271, 0),
  orangeSoft: rgb(1, 0.92, 0.89),
  border: rgb(0.89, 0.89, 0.91),
  green: rgb(0.15, 0.66, 0.42)
};

type Fonts = { regular: PDFFont; bold: PDFFont };

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? current + ' ' + word : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) current = next;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function paragraph(page: PDFPage, text: string, x: number, y: number, width: number, font: PDFFont, size: number, color: any, leading = size * 1.4) {
  for (const line of wrap(text, font, size, width)) {
    page.drawText(line, { x, y, size, font, color });
    y -= leading;
  }
  return y;
}

function pill(page: PDFPage, text: string, x: number, y: number, fonts: Fonts, dark = false) {
  const size = 7;
  const w = fonts.bold.widthOfTextAtSize(text.toUpperCase(), size) + 18;
  page.drawRectangle({ x, y: y - 5, width: w, height: 18, color: dark ? C.panel : C.orangeSoft, borderColor: dark ? rgb(.16,.17,.20) : C.orangeSoft, borderWidth: 1 });
  page.drawText(text.toUpperCase(), { x: x + 9, y: y + 1, size, font: fonts.bold, color: C.orange });
  return w;
}

function lockup(page: PDFPage, fonts: Fonts, light = false) {
  page.drawText('APEX AUTONOMA', { x: 52, y: 805, size: 12, font: fonts.bold, color: light ? C.white : C.ink });
  page.drawText('AI CAMPAIGN OPERATING SYSTEM', { x: 52, y: 794, size: 6.5, font: fonts.regular, color: light ? rgb(.65,.65,.68) : C.muted });
  page.drawRectangle({ x: 30, y: 797, width: 13, height: 13, color: light ? C.white : C.ink });
  page.drawRectangle({ x: 39, y: 800, width: 7, height: 5, color: C.orange });
}

function footer(page: PDFPage, fonts: Fonts, n: number, light = false) {
  page.drawText('Apex Engineering | Pune, India - Working Globally', { x: 30, y: 24, size: 6.5, font: fonts.regular, color: light ? rgb(.47,.48,.51) : C.muted });
  page.drawText(String(n).padStart(2,'0'), { x: 548, y: 24, size: 6.5, font: fonts.regular, color: light ? rgb(.47,.48,.51) : C.muted });
}

function card(page: PDFPage, fonts: Fonts, x: number, y: number, w: number, h: number, title: string, body: string, dark = false) {
  page.drawRectangle({ x, y: y-h, width: w, height: h, color: dark ? C.panel : C.white, borderColor: dark ? rgb(.14,.15,.18) : C.border, borderWidth: 0.8 });
  page.drawText(title, { x: x+12, y: y-23, size: 10, font: fonts.bold, color: dark ? C.white : C.ink });
  paragraph(page, body, x+12, y-40, w-24, fonts.regular, 7.2, dark ? rgb(.67,.67,.70) : C.muted, 10);
}

export async function generateAutonomaBrochurePdf(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold)
  };
  const size: [number, number] = [595.28, 841.89];

  // 1 Cover
  {
    const p = pdf.addPage(size);
    p.drawRectangle({ x:0, y:0, width:size[0], height:size[1], color:C.bg });
    lockup(p, fonts, true);
    pill(p,'Product Brochure',30,752,fonts,true);
    p.drawText('CAMPAIGNS.', { x:30, y:690, size:32, font:fonts.bold, color:C.white });
    p.drawText('WITHOUT THE CHAOS.', { x:30, y:652, size:32, font:fonts.bold, color:C.white });
    paragraph(p,'Apex Autonoma turns company intelligence into campaign-ready execution - strategy, content, creative production, calendars, approvals and client-ready exports in one controlled workspace.',30,602,500,fonts.regular,11,rgb(.73,.73,.76),16);
    let x=30;
    for (const t of ['MULTI-COMPANY','MULTILINGUAL','BRAND-SAFE','HUMAN-APPROVED']) {
      const w=fonts.bold.widthOfTextAtSize(t,6.5)+18;
      p.drawRectangle({x,y:505,width:w,height:20,color:C.panel,borderColor:rgb(.16,.17,.20),borderWidth:.8});
      p.drawText(t,{x:x+9,y:512,size:6.5,font:fonts.bold,color:rgb(.85,.85,.87)});
      x+=w+7;
    }
    p.drawRectangle({x:30,y:150,width:535,height:300,color:rgb(.055,.06,.075),borderColor:rgb(.16,.17,.20),borderWidth:1});
    p.drawRectangle({x:30,y:422,width:535,height:28,color:rgb(.085,.09,.11)});
    p.drawText('LIVE CAMPAIGN WORKSPACE',{x:405,y:432,size:6,font:fonts.bold,color:rgb(.45,.46,.50)});
    p.drawRectangle({x:45,y:372,width:56,height:18,color:C.orange});
    for(let i=0;i<5;i++) p.drawRectangle({x:45,y:338-i*32,width:56,height:19,color:i===1?rgb(.15,.16,.19):rgb(.09,.10,.12)});
    p.drawText('Q4 Demand Generation',{x:125,y:375,size:15,font:fonts.bold,color:C.white});
    p.drawText('Strategy  >  Content  >  Creative  >  Calendar',{x:125,y:358,size:7,font:fonts.regular,color:rgb(.46,.47,.51)});
    const labels=[['PLATFORMS','Multi-channel'],['LANGUAGES','Localized'],['STATUS','Ready']];
    labels.forEach((a,i)=>{ const xx=125+i*125; p.drawRectangle({x:xx,y:302,width:112,height:42,color:C.panel}); p.drawText(a[0],{x:xx+9,y:328,size:5.5,font:fonts.bold,color:rgb(.43,.44,.48)}); p.drawText(a[1],{x:xx+9,y:312,size:7.5,font:fonts.bold,color:C.white});});
    p.drawRectangle({x:125,y:185,width:245,height:96,color:C.panel});
    p.drawText('Content matrix',{x:136,y:261,size:8,font:fonts.bold,color:C.white});
    [0.87,0.68,0.92,0.61].forEach((v,i)=>{ const yy=240-i*16; p.drawRectangle({x:185,y:yy,width:155,height:5,color:rgb(.16,.17,.20)}); p.drawRectangle({x:185,y:yy,width:155*v,height:5,color:C.orange});});
    p.drawRectangle({x:387,y:185,width:147,height:96,color:rgb(.15,.09,.07)});
    p.drawText('Exact',{x:402,y:231,size:14,font:fonts.bold,color:C.white});
    p.drawText('brand text',{x:402,y:214,size:14,font:fonts.bold,color:C.white});
    footer(p,fonts,1,true);
  }

  // 2 Operating model
  {
    const p=pdf.addPage(size); p.drawRectangle({x:0,y:0,width:size[0],height:size[1],color:C.light}); lockup(p,fonts);
    pill(p,'Why Autonoma',30,752,fonts);
    p.drawText('Marketing breaks between strategy and',{x:30,y:690,size:24,font:fonts.bold,color:C.ink});
    p.drawText('execution.',{x:30,y:658,size:24,font:fonts.bold,color:C.ink});
    paragraph(p,"Briefs live in documents. Company context lives in people's heads. AI prompts are disconnected. Creative files are scattered. Calendars and approvals happen somewhere else.",30,610,515,fonts.regular,10.5,C.muted,15);
    p.drawRectangle({x:30,y:355,width:535,height:190,color:C.white,borderColor:C.border,borderWidth:1});
    const nodes=['COMPANY\nCONTEXT','CAMPAIGN\nENGINE','CONTENT\nMATRIX','CREATIVE\nSYSTEM','CALENDAR\n+ EXPORT'];
    nodes.forEach((label,i)=>{
      const xx=55+i*101; p.drawRectangle({x:xx,y:427,width:80,height:70,color:i===0?C.orangeSoft:C.light,borderColor:C.border,borderWidth:.7});
      const [a,b]=label.split('\n'); p.drawText(a,{x:xx+11,y:463,size:7.2,font:fonts.bold,color:i===0?C.orange:C.ink}); p.drawText(b,{x:xx+11,y:447,size:7.2,font:fonts.bold,color:i===0?C.orange:C.ink});
      if(i<4){ p.drawLine({start:{x:xx+82,y:462},end:{x:xx+96,y:462},thickness:1.5,color:C.orange}); }
    });
    p.drawText('One operating layer keeps the brief, brand rules, content, assets and execution connected.',{x:110,y:383,size:7,font:fonts.regular,color:C.muted});
    const cols=[
      ['01','UNDERSTAND','Company context, audience, positioning, offers, brand rules and source material.'],
      ['02','ORCHESTRATE','Campaign objective, platforms, languages, formats, cadence and deliverables.'],
      ['03','PRODUCE','Copy, AI visuals, exact brand typography, approvals, calendar and exports.']
    ];
    cols.forEach((a,i)=>{ const xx=50+i*174; p.drawText(a[0],{x:xx,y:302,size:7,font:fonts.bold,color:C.orange}); p.drawText(a[1],{x:xx,y:278,size:10,font:fonts.bold,color:C.ink}); paragraph(p,a[2],xx,255,145,fonts.regular,7.4,C.muted,10);});
    paragraph(p,'The goal is not more AI output. The goal is a repeatable operating system your team can actually run.',30,92,530,fonts.bold,14,C.ink,18);
    footer(p,fonts,2);
  }

  // 3 Capabilities
  {
    const p=pdf.addPage(size); p.drawRectangle({x:0,y:0,width:size[0],height:size[1],color:C.white}); lockup(p,fonts);
    pill(p,'Core Capabilities',30,752,fonts);
    p.drawText('One workspace. End-to-end campaign operations.',{x:30,y:690,size:22,font:fonts.bold,color:C.ink});
    const f=[
      ['Company Intelligence','Offerings, audience, geography, positioning, claims, voice and approved company context.'],
      ['Campaign Strategy','Objectives become pillars, personas, narrative arc, cadence and structured deliverables.'],
      ['Multi-platform Variants','Platform-native executions instead of copy-pasting one post everywhere.'],
      ['Multilingual Campaigns','Language variants preserve strategy, meaning and company context.'],
      ['Brand Design System','Colors, typography, logo and visual direction guide production.'],
      ['Text-safe Creative','AI generates visuals; exact headlines, CTA and branding are composed deterministically.'],
      ['Campaign Calendar','Dates, production status and planned content stay visible across the campaign.'],
      ['Review & Approval','Human review remains in the loop before external use.'],
      ['Client-ready Export','Download final creatives, campaign reports and posting-ready handoff material.']
    ];
    f.forEach((a,i)=>{ const col=i%3,row=Math.floor(i/3); card(p,fonts,30+col*178,625-row*155,165,132,a[0],a[1]); });
    footer(p,fonts,3);
  }

  // 4 Reliability / teams
  {
    const p=pdf.addPage(size); p.drawRectangle({x:0,y:0,width:size[0],height:size[1],color:C.bg}); lockup(p,fonts,true);
    pill(p,'Built for real operations',30,752,fonts,true);
    p.drawText('AI acceleration with operational controls.',{x:30,y:690,size:23,font:fonts.bold,color:C.white});
    const f=[
      ['Tenant-isolated workspaces','Separate companies, memberships, campaigns and assets.'],
      ['Controlled onboarding','No public signup. Admins provision accounts and secure password setup links.'],
      ['Resilient generation','Bounded timeouts, retryable campaign shells and cross-provider fallback architecture.'],
      ['Exact brand typography','Readable copy is rendered by the design system, not hallucinated inside pixels.'],
      ['Durable creative storage','Final media is stored as real files and URLs, ready to reopen and download.'],
      ['Human accountability','AI output remains visible, editable and reviewable before use.']
    ];
    f.forEach((a,i)=>{ const col=i%2,row=Math.floor(i/2); card(p,fonts,30+col*267,625-row*150,252,126,a[0],a[1],true); });
    p.drawText('OPERATING ROLES',{x:30,y:142,size:7,font:fonts.bold,color:C.orange});
    p.drawText('Super Admin  |  Company Admin  |  Team Member',{x:30,y:116,size:14,font:fonts.bold,color:C.white});
    paragraph(p,'One platform separates global governance from company operations so each person works inside the correct workspace and permission boundary.',30,91,510,fonts.regular,8,rgb(.65,.66,.69),12);
    footer(p,fonts,4,true);
  }

  // 5 CTA
  {
    const p=pdf.addPage(size); p.drawRectangle({x:0,y:0,width:size[0],height:size[1],color:C.light}); lockup(p,fonts);
    pill(p,'Apex Autonoma',30,752,fonts);
    p.drawText('Build campaigns like a system,',{x:30,y:675,size:27,font:fonts.bold,color:C.ink});
    p.drawText('not a folder full of prompts.',{x:30,y:640,size:27,font:fonts.bold,color:C.ink});
    paragraph(p,'Private company workspaces. Company-grounded AI. Multi-platform and multilingual campaign production. Brand-safe creative output. Human review. Client-ready execution.',30,580,510,fonts.regular,11,C.muted,16);
    p.drawRectangle({x:30,y:330,width:535,height:165,color:C.white,borderColor:C.border,borderWidth:1});
    p.drawText('EXPLORE AUTONOMA',{x:50,y:452,size:7,font:fonts.bold,color:C.orange});
    p.drawText('autonoma.apex-engineering.co.in',{x:50,y:420,size:15,font:fonts.bold,color:C.ink});
    p.drawText('apex-engineering.co.in',{x:50,y:394,size:9,font:fonts.regular,color:C.muted});
    p.drawRectangle({x:395,y:401,width:135,height:34,color:C.orange});
    p.drawText('REQUEST ACCESS',{x:417,y:413,size:8,font:fonts.bold,color:C.white});
    p.drawText('SIGN IN',{x:476,y:365,size:8,font:fonts.bold,color:C.orange});
    p.drawText('A product by Apex Engineering',{x:30,y:165,size:9,font:fonts.bold,color:C.ink});
    paragraph(p,'Pune, India - Working Globally',30,144,300,fonts.regular,8,C.muted,12);
    footer(p,fonts,5);
  }

  pdf.setTitle('Apex Autonoma - Product Brochure');
  pdf.setAuthor('Apex Engineering');
  pdf.setSubject('AI Campaign Operating System');
  return pdf.save();
}
