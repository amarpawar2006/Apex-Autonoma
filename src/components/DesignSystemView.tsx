import React, { useState } from 'react';
import { 
  Palette, 
  Type, 
  Layers, 
  Video, 
  UserCheck, 
  LayoutGrid, 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles,
  Camera,
  Shapes,
  Maximize2,
  FileCheck
} from 'lucide-react';
import { APEX_SOCIAL_DESIGN_SYSTEM } from '../data/apexDesignSystem';
import { APEX_COMPANY_DATA } from '../data/apexCompanyData';

export const DesignSystemView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'typography' | 'color' | 'carousels' | 'video' | 'expert_card' | 'cta_data'>('overview');

  return (
    <div className="space-y-6 pb-20">
      {/* Design System Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs text-[#86868B]">
            <span className="w-2 h-2 rounded-full bg-[#FF4500]"></span>
            <span>AES-DS Specification v{APEX_SOCIAL_DESIGN_SYSTEM.version}</span>
            <span>·</span>
            <span>Apex Engineering</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Social Design System
          </h1>
          <p className="text-sm text-[#6E6E73] font-normal max-w-2xl">
            {APEX_SOCIAL_DESIGN_SYSTEM.philosophy}. Ensuring every carousel, reel, poster, and flyer builds institutional credibility.
          </p>
        </div>

        <div className="px-3.5 py-2 bg-white rounded-xl border border-black/[0.06] shadow-sm text-xs text-[#1D1D1F] font-medium flex items-center space-x-2 self-start md:self-end">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>100% Spec Compliant</span>
        </div>
      </div>

      {/* Apple-style Segmented Sub-Navigation */}
      <div className="bg-white p-1.5 rounded-2xl border border-black/[0.06] shadow-sm flex flex-wrap gap-1">
        {[
          { id: 'overview', label: 'Overview & Rules', icon: Layers },
          { id: 'typography', label: 'Typography', icon: Type },
          { id: 'color', label: 'Color & Species', icon: Palette },
          { id: 'carousels', label: 'Carousels (4:5)', icon: LayoutGrid },
          { id: 'video', label: 'Video & Lower Thirds', icon: Video },
          { id: 'expert_card', label: 'Founder & Expert Cards', icon: UserCheck },
          { id: 'cta_data', label: 'CTA & Data Visualization', icon: ArrowRight },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-xl transition-all font-medium ${
                isActive
                  ? 'bg-orange-50 text-[#FF4500]'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.02]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW & RULES */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF4500] flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#1D1D1F]">Anti-AI Slop Discipline</h3>
              <p className="text-xs text-[#6E6E73] leading-relaxed">
                Zero generic 3D glossy robot hands or purple SaaS gradient bubbles. Apex visual identity reflects physical systems, code, structural schematics, and measured metrics.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF4500] flex items-center justify-center">
                <Shapes className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#1D1D1F]">Restrained Visual Balance</h3>
              <p className="text-xs text-[#6E6E73] leading-relaxed">
                Strict hierarchy over borders. Trailing command arrows (<code className="text-[#FF4500] font-mono">ENGINEER YOUR SYSTEM →</code>). High contrast solid accents used with restraint.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF4500] flex items-center justify-center">
                <FileCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[#1D1D1F]">Founder Authority Badge</h3>
              <p className="text-xs text-[#6E6E73] leading-relaxed">
                Ground every campaign in Amar Pawar's 18+ years of UX and digital experience. Authentic studio environment, real client case studies (BRC Pune, Flightpath, Microcommerce).
              </p>
            </div>
          </div>

          {/* Core Tokens Matrix */}
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#1D1D1F] flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#FF4500]"></span>
              <span>15 Formal System Directives (Specification Checklist)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {[
                { name: '01. Typography', desc: 'Syne / Space Grotesk + JetBrains Mono' },
                { name: '02. Colour Palette', desc: 'Void Black #0A0B0E + Apex Orange #FF4500' },
                { name: '03. Product Coding', desc: 'Orange (Microcommerce) / Blue (Custom Web)' },
                { name: '04. Species Coding', desc: 'SPEC-01 to SPEC-05 Content Archetypes' },
                { name: '05. Photography', desc: 'Monochrome macro, tactile textures, 15% grain' },
                { name: '06. Iconography', desc: 'Strict 1.5px geometric line icons (Lucide)' },
                { name: '07. Logo Safe Area', desc: '48px minimum border margin / Monogram /\\' },
                { name: '08. CTA Treatment', desc: 'Sharp brutalist blocks, trailing arrows' },
                { name: '09. Data Vis', desc: 'Manual Work ➔ Rules + Data + AI ➔ System' },
                { name: '10. Carousel Grids', desc: '1080x1350 4:5 vertical 6-slide progression' },
                { name: '11. Video Intro/Outro', desc: '1.2s typographic snap cut / 2.5s dark outro' },
                { name: '12. Lower Thirds', desc: 'Dual-deck HUD anchored 120px from screen base' },
                { name: '13. Expert ID Cards', desc: 'Passport style cards for Amar Pawar' },
                { name: '14. Subtitle Style', desc: 'Kinetic bottom center with Orange keyword pop' },
                { name: '15. Thumbnail Matrix', desc: '3-4 word curiosity hooks with high contrast' },
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 bg-[#FBFBFD] rounded-xl border border-black/[0.04] flex flex-col justify-between">
                  <div className="text-[#1D1D1F] font-semibold">{item.name}</div>
                  <div className="text-[#6E6E73] text-[11px] mt-1">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. TYPOGRAPHY */}
      {activeSection === 'typography' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#1D1D1F]">Typography Hierarchy & Specimens</h3>
            <div className="space-y-4">
              {APEX_SOCIAL_DESIGN_SYSTEM.typography.hierarchy.map((item, idx) => (
                <div key={idx} className="p-5 bg-[#FBFBFD] rounded-2xl border border-black/[0.06] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#86868B]">
                    <span className="text-[#FF4500] font-semibold">{item.level}</span>
                    <span>Size: {item.size} · Weight: {item.weight} · Leading: {item.leading}</span>
                    <span className="bg-white px-2 py-0.5 rounded-md border border-black/[0.06] text-[#1D1D1F]">{item.useCase}</span>
                  </div>

                  {/* Specimen Render */}
                  <div className="pt-2 text-[#1D1D1F] border-t border-black/[0.04]">
                    {item.level === 'Hero Hook' && (
                      <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
                        THE WHATSAPP LEAD LEAK.
                      </div>
                    )}
                    {item.level === 'Section Header' && (
                      <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#FF4500]">
                        FROM CHAT CHAOS TO CONNECTED ENGINE
                      </div>
                    )}
                    {item.level === 'Editorial Subtext' && (
                      <div className="text-sm sm:text-base text-[#6E6E73] max-w-2xl leading-relaxed">
                        Why 60% of your business inquiries die in unread chats (and how we engineer the plumbing to capture every rupee).
                      </div>
                    )}
                    {item.level === 'Technical Monospace' && (
                      <div className="text-xs font-mono text-[#1D1D1F] bg-white p-2.5 rounded-lg border border-black/[0.06] inline-block">
                        SYS_ID: APEX_AUTOMATION_V2 // LATENCY: 4.2s // HUMAN_TOUCH: 0.00%
                      </div>
                    )}
                    {item.level === 'Footer Signature' && (
                      <div className="text-xs font-mono tracking-widest text-[#86868B] uppercase">
                        APEX ENGINEERING // PUNE, INDIA • WORKING GLOBALLY // APEX-ENGINEERING.CO.IN
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. COLOR & SPECIES CODING */}
      {activeSection === 'color' && (
        <div className="space-y-6">
          {/* Core Palette */}
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#1D1D1F]">Core Brand Color Tokens</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {APEX_SOCIAL_DESIGN_SYSTEM.colorSystem.corePalette.map((col, idx) => (
                <div key={idx} className="bg-[#FBFBFD] rounded-xl border border-black/[0.06] p-4 flex flex-col justify-between">
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="w-12 h-12 rounded-xl border border-black/[0.1] shadow-sm flex-shrink-0"
                      style={{ backgroundColor: col.hex }}
                    ></div>
                    <div>
                      <div className="text-[#1D1D1F] font-semibold text-xs">{col.name}</div>
                      <div className="text-[#FF4500] font-mono text-xs">{col.hex}</div>
                    </div>
                  </div>
                  <p className="text-xs text-[#6E6E73]">{col.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Product Color Coding */}
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#1D1D1F]">Product & Service Color Coding</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {APEX_SOCIAL_DESIGN_SYSTEM.colorSystem.productColorCoding.map((prod, idx) => (
                <div key={idx} className="p-4 bg-[#FBFBFD] rounded-xl border border-black/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#1D1D1F]">{prod.product}</span>
                    <span 
                      className="text-[11px] font-mono px-2 py-0.5 rounded-md font-medium border"
                      style={{ color: prod.hex, borderColor: prod.hex, backgroundColor: prod.accentBg }}
                    >
                      {prod.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#6E6E73]">{prod.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Species Coding (SPEC-01 to SPEC-05) */}
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#1D1D1F]">Species Coding (Content Archetypes)</h3>
            <div className="space-y-3">
              {APEX_SOCIAL_DESIGN_SYSTEM.colorSystem.speciesCoding.map((spec, idx) => (
                <div key={idx} className="p-3.5 bg-[#FBFBFD] rounded-xl border border-black/[0.06] flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <span 
                      className="px-2.5 py-1 text-xs font-mono font-semibold rounded-md text-white"
                      style={{ backgroundColor: spec.color === '#00FF66' ? '#059669' : spec.color }}
                    >
                      {spec.code}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-[#1D1D1F]">{spec.name}</div>
                      <div className="text-xs text-[#6E6E73]">{spec.description}</div>
                    </div>
                  </div>
                  <span className="hidden sm:inline-block text-[11px] text-[#86868B] bg-white px-2 py-0.5 rounded-md border border-black/[0.06]">
                    High Retention
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. CAROUSEL GRIDS (4:5) */}
      {activeSection === 'carousels' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[#1D1D1F]">Carousel Grid Anatomy (1080 × 1350 px · 4:5 Ratio)</h3>
                <p className="text-xs text-[#6E6E73] mt-0.5">Vertical 4:5 ratio gives 25% more screen estate on mobile feeds than 1:1 squares.</p>
              </div>
              <span className="text-xs font-medium text-[#FF4500] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100 self-start sm:self-auto">
                6-Slide Narrative Arc
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {APEX_SOCIAL_DESIGN_SYSTEM.carouselGrids.slideProgression.map((slide) => (
                <div key={slide.slide} className="bg-[#1D1D1F] text-white rounded-2xl p-5 flex flex-col justify-between aspect-[4/5] relative overflow-hidden group shadow-md">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 border-b border-white/10 pb-2">
                    <span className="text-[#FF4500]">SLIDE 0{slide.slide}/06</span>
                    <span>APEX</span>
                  </div>

                  {/* Body Content */}
                  <div className="my-auto py-3 space-y-2">
                    <span className="text-[10px] font-mono bg-[#FF4500]/20 text-[#FF4500] px-2 py-0.5 rounded inline-block">
                      {slide.role.toUpperCase()}
                    </span>
                    <h4 className="text-base font-bold font-mono text-white leading-tight">
                      {slide.slide === 1 && "THE WHATSAPP LEAD LEAK."}
                      {slide.slide === 2 && "ORDERS SCATTERED IN SPREADSHEETS."}
                      {slide.slide === 3 && "[RAW INTAKE] ➔ [AI INTENT] ➔ [AUTO-QUOTE]"}
                      {slide.slide === 4 && "STEP 01: UNDERSTAND\nSTEP 02: CONNECT\nSTEP 03: AUTOMATE"}
                      {slide.slide === 5 && "84% LEAD RECOVERY\n0 LOST ADDRESSES"}
                      {slide.slide === 6 && "YOU BRING THE PROBLEM.\nWE ENGINEER THE SYSTEM."}
                    </h4>
                    <p className="text-xs text-neutral-400 font-mono">
                      {slide.element}
                    </p>
                  </div>

                  {/* Base Bar */}
                  <div className="flex items-center justify-between text-[11px] font-mono border-t border-white/10 pt-2 text-neutral-400">
                    <span>apex-engineering.co.in</span>
                    <span className="text-white font-bold">SWIPE ➔</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. VIDEO, LOWER THIRDS & SUBTITLES */}
      {activeSection === 'video' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lower Thirds Specimen */}
            <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-[#1D1D1F] flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#FF4500]"></span>
                <span>Lower Thirds HUD Specification</span>
              </h3>
              <p className="text-xs text-[#6E6E73]">
                {APEX_SOCIAL_DESIGN_SYSTEM.lowerThirds.format}.
              </p>

              {/* Live Preview Container */}
              <div className="h-48 bg-[#1D1D1F] rounded-2xl relative flex items-end p-4 overflow-hidden shadow-inner">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                {/* Lower Third Render */}
                <div className="w-full bg-black/80 backdrop-blur-md border-l-4 border-[#FF4500] p-3 rounded-r-xl shadow-2xl">
                  <div className="text-xs font-mono font-bold text-white tracking-wider flex items-center space-x-2">
                    <span>AMAR PAWAR</span>
                    <span className="text-[10px] text-[#FF4500] bg-[#FF4500]/10 px-1.5 py-0.2 rounded">FOUNDER</span>
                  </div>
                  <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                    18+ YEARS UX & DIGITAL SYSTEMS · APEX ENGINEERING
                  </div>
                </div>
              </div>
            </div>

            {/* Subtitle Style Specimen */}
            <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-[#1D1D1F] flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#FF4500]"></span>
                <span>Kinetic Subtitle Engine</span>
              </h3>
              <p className="text-xs text-[#6E6E73]">
                {APEX_SOCIAL_DESIGN_SYSTEM.subtitleStyle.rule}.
              </p>

              {/* Subtitle Live Preview */}
              <div className="h-48 bg-[#1D1D1F] rounded-2xl relative flex flex-col items-center justify-center p-4 shadow-inner">
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-mono text-neutral-400 tracking-widest uppercase">On-Screen Caption</span>
                  <div className="text-lg sm:text-xl font-bold font-mono text-white tracking-tight uppercase">
                    BUSINESSES RARELY NEED <span className="text-[#FF4500] bg-[#FF4500]/20 px-1.5 py-0.5 rounded">ANOTHER SCREEN</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Intro / Outro Specs */}
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#1D1D1F]">Video Intro & Outro Timings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 bg-[#FBFBFD] rounded-xl border border-black/[0.06]">
                <div className="text-[#FF4500] font-bold mb-1">INTRO SHUTTER (0.0s – 1.2s)</div>
                <p className="text-[#6E6E73]">{APEX_SOCIAL_DESIGN_SYSTEM.videoIntroOutro.introStyle}</p>
                <div className="text-[11px] text-[#86868B] mt-2">Audio: {APEX_SOCIAL_DESIGN_SYSTEM.videoIntroOutro.audioSignature}</div>
              </div>
              <div className="p-4 bg-[#FBFBFD] rounded-xl border border-black/[0.06]">
                <div className="text-[#FF4500] font-bold mb-1">OUTRO SIGNATURE (2.5s)</div>
                <p className="text-[#6E6E73]">{APEX_SOCIAL_DESIGN_SYSTEM.videoIntroOutro.outroStyle}</p>
                <div className="text-[11px] text-[#86868B] mt-2">URL: apex-engineering.co.in</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. EXPERT ID & FOUNDER CARD */}
      {activeSection === 'expert_card' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#1D1D1F]">Founder Passport ID Card (Amar Pawar)</h3>
            <p className="text-xs text-[#6E6E73]">
              Used across LinkedIn and Instagram to ground the agency in genuine 18+ years of UX leadership.
            </p>

            {/* Passport Card Live Specimen */}
            <div className="max-w-xl mx-auto bg-white rounded-3xl border border-black/[0.08] p-6 shadow-xl relative">
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-[#FF4500] text-white font-bold text-xs flex items-center justify-center">
                    /\
                  </div>
                  <span className="text-xs font-semibold text-[#1D1D1F]">Apex Engineering · Verified Founder</span>
                </div>
                <span className="text-[11px] font-mono text-[#FF4500] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                  ID: APEX-AP-018
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="aspect-square bg-neutral-100 rounded-2xl border border-black/[0.06] overflow-hidden relative">
                    <img 
                      src={APEX_COMPANY_DATA.founder.photoPlaceholder} 
                      alt="Amar Pawar" 
                      className="w-full h-full object-cover grayscale contrast-125"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-white">
                      FOUNDER
                    </div>
                  </div>
                  <div className="text-[11px] text-[#86868B] text-center">
                    Pune, India
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <div>
                    <h4 className="text-base font-semibold text-[#1D1D1F]">{APEX_COMPANY_DATA.founder.name}</h4>
                    <p className="text-xs font-medium text-[#FF4500]">{APEX_COMPANY_DATA.founder.role}</p>
                    <p className="text-xs text-[#86868B]">{APEX_COMPANY_DATA.founder.experience}</p>
                  </div>

                  <blockquote className="text-xs text-[#1D1D1F] italic border-l-2 border-[#FF4500] pl-3 py-1 leading-relaxed">
                    "{APEX_COMPANY_DATA.founder.bio}"
                  </blockquote>

                  <div className="pt-2 flex flex-wrap gap-1 text-[10px]">
                    <span className="bg-[#F2F2F7] text-[#1D1D1F] px-2 py-0.5 rounded-md font-medium">UX Architecture</span>
                    <span className="bg-[#F2F2F7] text-[#1D1D1F] px-2 py-0.5 rounded-md font-medium">AI Systems</span>
                    <span className="bg-[#F2F2F7] text-[#1D1D1F] px-2 py-0.5 rounded-md font-medium">Microcommerce</span>
                    <span className="bg-[#F2F2F7] text-[#1D1D1F] px-2 py-0.5 rounded-md font-medium">Automation</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] text-[#86868B]">
                <span>apex-engineering.co.in</span>
                <span className="font-medium text-[#1D1D1F]">Strategy · Experience · Engineering · AI</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. CTA & DATA VISUALIZATION */}
      {activeSection === 'cta_data' && (
        <div className="space-y-6">
          {/* Data Visualization Specimen */}
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#1D1D1F]">Data Visualization Standard (The Apex Pipeline)</h3>
            <p className="text-xs text-[#6E6E73]">
              Used to deconstruct manual chaos into structured engineering nodes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-5 bg-red-50/50 rounded-2xl border border-red-100">
                <div className="text-[11px] font-semibold text-red-600 mb-1">Input Bottleneck</div>
                <div className="text-sm font-bold text-neutral-900">Manual Work</div>
                <p className="text-xs text-[#6E6E73] mt-2 leading-relaxed">Repetitive WhatsApp chat, manual order entry, lost leads, spreadsheet updates.</p>
              </div>

              <div className="p-5 bg-orange-50/50 rounded-2xl border border-orange-200">
                <div className="text-[11px] font-semibold text-[#FF4500] mb-1">The Apex Engine</div>
                <div className="text-sm font-bold text-[#FF4500]">Rules + Data + AI</div>
                <p className="text-xs text-[#6E6E73] mt-2 leading-relaxed">Webhook triggers, Gemini intent parsing, Google Sheets DB, 1-click UPI links.</p>
              </div>

              <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <div className="text-[11px] font-semibold text-emerald-600 mb-1">Commercial Outcome</div>
                <div className="text-sm font-bold text-neutral-900">Automated System</div>
                <p className="text-xs text-[#6E6E73] mt-2 leading-relaxed">24/7 instant quotes, zero order drop-offs, 25+ hours saved per week.</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#1D1D1F]">CTA Button Specifications</h3>
            <div className="flex flex-wrap items-center gap-3">
              <button className="px-5 py-2.5 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl shadow-sm transition-all flex items-center space-x-2 active:scale-95">
                <span>Engineer your system</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button className="px-5 py-2.5 bg-white hover:bg-neutral-50 border border-black/[0.08] text-[#1D1D1F] text-xs font-medium rounded-xl shadow-sm transition-all flex items-center space-x-2 active:scale-95">
                <span>Read real case studies</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF4500]" />
              </button>

              <button className="px-4 py-2.5 bg-[#FBFBFD] hover:bg-neutral-100 text-[#6E6E73] hover:text-[#1D1D1F] rounded-xl text-xs flex items-center space-x-2 transition-colors">
                <span>What is your business trying to solve?</span>
                <span className="text-[#FF4500]">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
