import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';

const C = {
  bg: rgb(0.035, 0.039, 0.047),
  panel: rgb(0.078, 0.086, 0.106),
  panel2: rgb(0.102, 0.11, 0.135),
  ink: rgb(0.114, 0.114, 0.122),
  muted: rgb(0.43, 0.43, 0.46),
  muted2: rgb(0.64, 0.64, 0.67),
  light: rgb(0.961, 0.961, 0.969),
  white: rgb(1, 1, 1),
  orange: rgb(1, 0.271, 0),
  orange2: rgb(1, 0.48, 0.27),
  green: rgb(0.16, 0.72, 0.48),
  blue: rgb(0.30, 0.49, 0.996),
  border: rgb(0.88, 0.88, 0.90)
};

type Fonts = { regular: PDFFont; bold: PDFFont };

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MM = 72 / 25.4;

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

function paragraph(page: PDFPage, text: string, x: number, y: number, width: number, font: PDFFont, size: number, color: any, leading = size * 1.38) {
  let yy = y;
  for (const line of wrap(text, font, size, width)) {
    page.drawText(line, { x, y: yy, size, font, color });
    yy -= leading;
  }
  return yy;
}

function rect(page: PDFPage, x: number, y: number, w: number, h: number, fill: any, border?: any, borderWidth = 0.7) {
  page.drawRectangle({ x, y, width: w, height: h, color: fill, ...(border ? { borderColor: border, borderWidth } : {}) });
}

function lockup(page: PDFPage, fonts: Fonts, light = false) {
  const col = light ? C.white : C.ink;
  page.drawLine({ start: { x: 31, y: 803 }, end: { x: 39, y: 815 }, thickness: 2.5, color: col });
  page.drawLine({ start: { x: 39, y: 815 }, end: { x: 47, y: 803 }, thickness: 2.5, color: col });
  page.drawLine({ start: { x: 40, y: 805 }, end: { x: 45, y: 805 }, thickness: 2.5, color: C.orange });
  page.drawText('APEX AUTONOMA', { x: 57, y: 806, size: 12, font: fonts.bold, color: col });
  page.drawText('AI CAMPAIGN OPERATING SYSTEM', { x: 57, y: 795, size: 6.5, font: fonts.regular, color: light ? C.muted2 : C.muted });
}

function footer(page: PDFPage, fonts: Fonts, n: number, dark = false) {
  const col = dark ? rgb(.47,.48,.51) : C.muted;
  page.drawText('Apex Engineering  |  Pune, India - Working Globally', { x: 51, y: 25, size: 6.5, font: fonts.regular, color: col });
  page.drawText(String(n).padStart(2, '0'), { x: 537, y: 25, size: 6.5, font: fonts.regular, color: col });
}

function badge(page: PDFPage, fonts: Fonts, text: string, y: number, dark = false) {
  const label = text.toUpperCase();
  const w = fonts.bold.widthOfTextAtSize(label, 6.7) + 18;
  rect(page, 51, y - 5, w, 18, dark ? C.panel2 : rgb(1, .94, .91));
  page.drawText(label, { x: 60, y: y + 1, size: 6.7, font: fonts.bold, color: C.orange });
}

function stat(page: PDFPage, fonts: Fonts, x: number, y: number, w: number, label: string, value: string) {
  rect(page, x, y, w, 27, C.panel2, rgb(.16,.17,.20));
  page.drawText(label.toUpperCase(), { x: x+8, y: y+17, size: 5.2, font: fonts.bold, color: rgb(.47,.48,.52) });
  page.drawText(value, { x: x+8, y: y+6, size: 8.2, font: fonts.bold, color: C.white });
}

function productMockup(page: PDFPage, fonts: Fonts, x: number, y: number, w: number, h: number) {
  rect(page, x, y, w, h, C.panel, rgb(.17,.18,.21), .8);
  rect(page, x, y+h-27, w, 27, C.panel2);
  [0,1,2].forEach(i => page.drawCircle({ x:x+12+i*10, y:y+h-14, size:2.2, color:rgb(.29,.30,.33) }));
  page.drawText('AUTONOMA WORKSPACE', { x:x+w-92, y:y+h-17, size:5.4, font:fonts.bold, color:rgb(.46,.47,.50) });

  const sb = 52;
  rect(page, x, y, sb, h-27, rgb(.051,.055,.067));
  rect(page, x+8, y+h-53, sb-16, 16, C.orange);
  for (let i=0;i<5;i++) rect(page, x+8, y+h-84-i*27, sb-16, 17, i===1 ? rgb(.14,.15,.17) : rgb(.09,.10,.12));

  const cx=x+sb+14, cw=w-sb-28;
  page.drawText('LIVE CAMPAIGN', { x:cx, y:y+h-55, size:6, font:fonts.bold, color:C.orange2 });
  page.drawText('Q4 Demand Generation', { x:cx, y:y+h-73, size:12, font:fonts.bold, color:C.white });
  page.drawText('Strategy  >  Content  >  Creative  >  Calendar', { x:cx, y:y+h-86, size:5.8, font:fonts.regular, color:rgb(.47,.48,.51) });

  const gap=6, sw=(cw-gap*2)/3;
  stat(page,fonts,cx,y+h-130,sw,'Platforms','4 channels');
  stat(page,fonts,cx+sw+gap,y+h-130,sw,'Languages','2 active');
  stat(page,fonts,cx+2*(sw+gap),y+h-130,sw,'Status','Reviewable');

  const leftw=cw*.58;
  rect(page,cx,y+18,leftw,h-171,C.panel2,rgb(.17,.18,.21));
  page.drawText('Content matrix',{x:cx+9,y:y+h-156,size:7,font:fonts.bold,color:C.white});
  const labs=['LinkedIn','Instagram','Facebook','X'];
  const vals=[.86,.68,.93,.61];
  labs.forEach((lab,i)=>{
    const yy=y+h-178-i*18;
    page.drawText(lab,{x:cx+9,y:yy,size:5.2,font:fonts.regular,color:rgb(.45,.46,.49)});
    rect(page,cx+48,yy-1,leftw-58,5,rgb(.19,.20,.23));
    rect(page,cx+48,yy-1,(leftw-58)*vals[i],5,C.orange);
  });

  const rx=cx+leftw+8, rw=cw-leftw-8;
  rect(page,rx,y+18,rw,h-171,rgb(.13,.075,.06),rgb(.21,.13,.10));
  page.drawText('CREATIVE',{x:rx+9,y:y+h-156,size:5.4,font:fonts.bold,color:rgb(1,.70,.58)});
  page.drawText('Exact',{x:rx+9,y:y+h-185,size:12,font:fonts.bold,color:C.white});
  page.drawText('brand text',{x:rx+9,y:y+h-201,size:12,font:fonts.bold,color:C.white});
  page.drawText('AI visual + deterministic overlay',{x:rx+9,y:y+h-218,size:5.2,font:fonts.regular,color:rgb(.62,.62,.65)});
  rect(page,rx+9,y+29,rw-18,5,C.orange);
}

function title(page: PDFPage, fonts: Fonts, kicker: string, lines: string[], dark = false) {
  badge(page,fonts,kicker,703,dark);
  const col=dark?C.white:C.ink;
  let y=648;
  for(const line of lines){
    page.drawText(line,{x:51,y,size:22,font:fonts.bold,color:col});
    y-=27;
  }
}

export async function generateAutonomaBrochurePdf(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold)
  };
  const size: [number, number] = [PAGE_W, PAGE_H];

  // PAGE 1 - Cover
  {
    const p=pdf.addPage(size);
    rect(p,0,0,PAGE_W,PAGE_H,C.bg);
    p.drawCircle({x:58,y:772,size:150,color:rgb(.15,.065,.035)});
    lockup(p,fonts,true);
    badge(p,fonts,'Product Brochure',708,true);
    p.drawText('CAMPAIGNS. WITHOUT THE CHAOS.',{x:51,y:635,size:27,font:fonts.bold,color:C.white});
    paragraph(p,'From company intelligence to campaign strategy, multi-platform content, brand-safe creative production, approvals and export - in one controlled workspace.',51,453,452,fonts.regular,10.5,rgb(.73,.73,.76),15);

    let chipX=51;
    for(const label of ['MULTI-COMPANY','MULTILINGUAL','BRAND-SAFE','HUMAN-APPROVED']){
      const w=fonts.bold.widthOfTextAtSize(label,6.2)+16;
      rect(p,chipX,380,w,20,C.panel2,rgb(.18,.19,.22));
      p.drawText(label,{x:chipX+8,y:387,size:6.2,font:fonts.bold,color:C.white});
      chipX+=w+6;
    }

    productMockup(p,fonts,51,91,493,250);
    footer(p,fonts,1,true);
  }

  // PAGE 2 - Operating model
  {
    const p=pdf.addPage(size);
    rect(p,0,0,PAGE_W,PAGE_H,C.light);
    lockup(p,fonts);
    title(p,fonts,'Why Autonoma',['Marketing breaks between','strategy and execution.']);
    paragraph(p,'Autonoma connects the pieces that usually live in separate files, tools and people.',51,468,490,fonts.regular,9.5,C.muted,13.5);

    const stages=[
      ['01','COMPANY','CONTEXT',C.orange],
      ['02','CAMPAIGN','ENGINE',C.blue],
      ['03','CONTENT','MATRIX',C.green],
      ['04','CREATIVE','SYSTEM',C.orange2],
      ['05','CALENDAR','+ EXPORT',C.ink]
    ];
    const sx=51,gap=11,bw=(493-gap*4)/5;
    stages.forEach((s:any,i)=>{
      const x=sx+i*(bw+gap);
      rect(p,x,334,bw,111,C.white,C.border);
      p.drawText(s[0],{x:x+8,y:417,size:6.5,font:fonts.bold,color:s[3]});
      p.drawText(s[1],{x:x+8,y:382,size:8.2,font:fonts.bold,color:C.ink});
      p.drawText(s[2],{x:x+8,y:356,size:8.2,font:fonts.bold,color:C.ink});
      if(i<4) p.drawLine({start:{x:x+bw+3,y:389},end:{x:x+bw+gap-3,y:389},thickness:1.4,color:C.orange});
    });

    rect(p,51,202,493,96,C.white,C.border);
    const proofs=[
      ['UNDERSTAND','Audience, offer, market, claims, brand rules'],
      ['ORCHESTRATE','Objective, platforms, languages, cadence'],
      ['PRODUCE','Copy, visual, exact typography, approval']
    ];
    proofs.forEach((a,i)=>{
      const x=68+i*157;
      p.drawText(a[0],{x,y:272,size:6.4,font:fonts.bold,color:C.orange});
      paragraph(p,a[1],x,247,130,fonts.regular,7.1,C.muted,9.5);
    });
    paragraph(p,'The goal is not more AI output. The goal is a repeatable operating system your team can actually run.',51,130,493,fonts.bold,13,C.ink,17);
    footer(p,fonts,2);
  }

  // PAGE 3 - Capabilities
  {
    const p=pdf.addPage(size);
    rect(p,0,0,PAGE_W,PAGE_H,C.white);
    lockup(p,fonts);
    title(p,fonts,'Core Capabilities',['One workspace. End-to-end','campaign operations.']);

    productMockup(p,fonts,51,190,300,285);

    const features=[
      ['Company intelligence','Ground generation in approved business context.'],
      ['Campaign strategy','Objectives become pillars, personas and deliverables.'],
      ['Platform + language matrix','Native variants across channels and languages.'],
      ['Brand system','Colors, typography, logo and creative rules.'],
      ['Review + calendar','Approve assets and plan execution.'],
      ['Campaign export','Download creatives and complete campaign packs.']
    ];
    let y=458;
    features.forEach((a,i)=>{
      const x=370;
      p.drawCircle({x:x,y:y+2,size:2.3,color:C.orange});
      p.drawText(a[0],{x:x+9,y,size:8.6,font:fonts.bold,color:C.ink});
      paragraph(p,a[1],x+9,y-12,160,fonts.regular,6.8,C.muted,9);
      y-=65;
    });

    rect(p,51,79,493,62,rgb(.985,.985,.992),C.border);
    p.drawText('AI VISUAL',{x:68,y:119,size:7.5,font:fonts.bold,color:C.ink});
    p.drawText('Background / subject / lighting',{x:68,y:96,size:6.5,font:fonts.regular,color:C.muted});
    p.drawText('+',{x:220,y:98,size:14,font:fonts.bold,color:C.orange});
    p.drawText('DESIGN SYSTEM',{x:266,y:119,size:7.5,font:fonts.bold,color:C.ink});
    p.drawText('Exact text / CTA / logo / layout',{x:266,y:96,size:6.5,font:fonts.regular,color:C.muted});
    p.drawText('=',{x:441,y:98,size:14,font:fonts.bold,color:C.orange});
    p.drawText('FINAL',{x:477,y:119,size:7.5,font:fonts.bold,color:C.ink});
    p.drawText('Downloadable',{x:477,y:96,size:6.5,font:fonts.regular,color:C.muted});
    footer(p,fonts,3);
  }

  // PAGE 4 - Workflow / resilience
  {
    const p=pdf.addPage(size);
    rect(p,0,0,PAGE_W,PAGE_H,C.bg);
    lockup(p,fonts,true);
    title(p,fonts,'How It Works',['From company DNA to','campaign-ready execution.'],true);

    const steps=[
      ['01','BUILD CONTEXT','Offer, audience, geography, proof points and brand voice.'],
      ['02','CREATE BRIEF','Objective, duration, channels, languages and formats.'],
      ['03','SYNTHESIZE','Strategy + delivery matrix with retry-safe generation.'],
      ['04','PRODUCE','Visual backgrounds + deterministic brand layout.'],
      ['05','REVIEW','Open every asset, inspect content and approve.'],
      ['06','EXPORT','Calendar, final creative, campaign report and handoff.']
    ];
    steps.forEach((a,i)=>{
      const col=i%2,row=Math.floor(i/2);
      const x=51+col*260, y=393-row*122;
      rect(p,x,y,232,99,C.panel,rgb(.17,.18,.21));
      p.drawText(a[0],{x:x+10,y:y+74,size:6.5,font:fonts.bold,color:C.orange});
      p.drawText(a[1],{x:x+10,y:y+48,size:9,font:fonts.bold,color:C.white});
      paragraph(p,a[2],x+10,y+28,202,fonts.regular,6.8,C.muted2,9);
    });

    rect(p,51,73,493,70,C.panel2,rgb(.17,.18,.21));
    p.drawText('RESILIENT GENERATION',{x:68,y:121,size:6.3,font:fonts.bold,color:C.muted2});
    const fallbacks=[['Gemini 3.8',C.orange],['Gemini 2.5',C.blue],['OpenAI fallback',C.green],['Retry-safe shell',C.white]];
    fallbacks.forEach((a:any,i)=>{
      const x=68+i*112;
      p.drawCircle({x,y:96,size:2.2,color:a[1]});
      p.drawText(a[0],{x:x+7,y:93,size:6.4,font:fonts.regular,color:C.white});
    });
    footer(p,fonts,4,true);
  }

  // PAGE 5 - Governance / differentiators
  {
    const p=pdf.addPage(size);
    rect(p,0,0,PAGE_W,PAGE_H,C.light);
    lockup(p,fonts);
    title(p,fonts,'Built For Real Operations',['Private workspaces.','Human control. Durable output.']);

    const roles=[
      ['SUPER ADMIN','Create companies, assign admins and manage global AI/provider settings.'],
      ['COMPANY ADMIN','Manage company profile, brand system, users and campaign operations.'],
      ['TEAM MEMBER','Create, review and execute content inside the assigned company workspace.']
    ];
    roles.forEach((a,i)=>{
      const x=51+i*164;
      rect(p,x,385,151,120,C.white,C.border);
      p.drawText(a[0],{x:x+10,y:468,size:6.2,font:fonts.bold,color:C.orange});
      paragraph(p,a[1],x+10,438,126,fonts.regular,6.9,C.muted,9.5);
    });

    const items=[
      ['Tenant isolation','Company-scoped users, campaigns and assets.'],
      ['Controlled onboarding','No public signup; secure one-time setup links.'],
      ['Text-safe creative','Exact readable typography outside AI image pixels.'],
      ['Durable media','Final creative stored as real downloadable files.'],
      ['Recovery by design','Failed generation preserves the campaign shell.'],
      ['Human accountability','AI output remains visible before external use.']
    ];
    items.forEach((a,i)=>{
      const col=i%2,row=Math.floor(i/2);
      const x=51+col*255, y=322-row*77;
      p.drawCircle({x,y:y+2,size:2.2,color:C.orange});
      p.drawText(a[0],{x:x+9,y,size:8.2,font:fonts.bold,color:C.ink});
      paragraph(p,a[1],x+9,y-12,210,fonts.regular,6.8,C.muted,9);
    });
    footer(p,fonts,5);
  }

  // PAGE 6 - CTA
  {
    const p=pdf.addPage(size);
    rect(p,0,0,PAGE_W,PAGE_H,C.bg);
    lockup(p,fonts,true);
    badge(p,fonts,'Apex Autonoma',698,true);
    p.drawText('BUILD CAMPAIGNS',{x:51,y:618,size:28,font:fonts.bold,color:C.white});
    p.drawText('LIKE A SYSTEM.',{x:51,y:582,size:28,font:fonts.bold,color:C.white});
    p.drawText('Not a folder full of prompts.',{x:51,y:538,size:14,font:fonts.bold,color:C.orange2});
    paragraph(p,'Private company workspaces. Company-grounded AI. Multi-platform and multilingual campaign production. Brand-safe creative output. Human review. Client-ready execution.',51,493,455,fonts.regular,10.2,rgb(.72,.72,.75),15);

    rect(p,51,187,493,156,C.panel,rgb(.17,.18,.21));
    p.drawText('Explore Autonoma',{x:74,y:288,size:13,font:fonts.bold,color:C.white});
    p.drawText('autonoma.apex-engineering.co.in',{x:74,y:253,size:8.5,font:fonts.regular,color:C.muted2});
    p.drawText('apex-engineering.co.in',{x:74,y:229,size:8.5,font:fonts.regular,color:C.muted2});
    rect(p,372,252,139,37,C.orange);
    p.drawText('REQUEST ACCESS',{x:393,y:266,size:7.8,font:fonts.bold,color:C.white});
    p.drawText('SIGN IN',{x:444,y:213,size:7.8,font:fonts.bold,color:C.orange2});
    footer(p,fonts,6,true);
  }

  pdf.setTitle('Apex Autonoma - Product Brochure');
  pdf.setAuthor('Apex Engineering');
  pdf.setSubject('AI Campaign Operating System');
  return pdf.save();
}
