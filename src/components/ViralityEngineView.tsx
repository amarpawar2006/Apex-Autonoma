import React from 'react';
import { BarChart3, Bookmark, MessageSquare, Target, Timer, Users } from 'lucide-react';

export const ViralityEngineView: React.FC = () => {
  const mechanics = [
    { icon: Bookmark, title: 'Save value', text: 'Create practical material people want to revisit: checklists, frameworks, comparisons and reference visuals.' },
    { icon: Timer, title: 'Fast comprehension', text: 'Make the first line or first frame immediately clear. Avoid generic introductions and unnecessary setup.' },
    { icon: MessageSquare, title: 'Conversation quality', text: 'Invite relevant responses with useful questions rather than engagement bait or guaranteed-growth claims.' },
    { icon: Target, title: 'Audience fit', text: 'Match the hook, format, language and call-to-action to the specific company audience and campaign goal.' }
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      <div className="rounded-3xl border border-black/[0.07] bg-white p-5 sm:p-8 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-[#FF4500]"><BarChart3 className="h-5 w-5" /></div>
          <div>
            <div className="text-[11px] font-medium text-[#86868B]">Planning heuristics · not a prediction engine</div>
            <h1 className="mt-0.5 text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">Growth Mechanics Lab</h1>
            <p className="mt-1 max-w-2xl text-xs sm:text-sm leading-relaxed text-[#6E6E73]">Use these principles to improve clarity, relevance and shareability. Autonoma does not promise virality, reach, or lead volumes without connected performance data.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mechanics.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FBFBFD] text-[#FF4500]"><Icon className="h-4 w-4" /></div>
            <h2 className="mt-3 text-sm font-semibold text-[#1D1D1F]">{title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#6E6E73]">{text}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm" aria-labelledby="score-meaning-title">
          <div className="flex items-center gap-2"><Target className="h-4 w-4 text-[#FF4500]" /><h2 id="score-meaning-title" className="text-sm font-semibold text-[#1D1D1F]">What the AI Content Score means</h2></div>
          <div className="mt-4 space-y-3 text-xs leading-relaxed text-[#6E6E73]">
            <p>It is an internal heuristic for reviewing hook clarity, platform fit, audience relevance and content structure.</p>
            <p>It is <strong className="text-[#1D1D1F]">not</strong> a forecast of impressions, engagement, sales or leads.</p>
            <p>When real platform analytics are connected later, performance data should be displayed separately from this planning score.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm" aria-labelledby="measurement-title">
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-[#FF4500]" /><h2 id="measurement-title" className="text-sm font-semibold text-[#1D1D1F]">Recommended measurement loop</h2></div>
          <ol className="mt-4 space-y-3 text-xs text-[#6E6E73]">
            <li><strong className="text-[#1D1D1F]">1.</strong> Publish approved content.</li>
            <li><strong className="text-[#1D1D1F]">2.</strong> Capture real platform metrics when available.</li>
            <li><strong className="text-[#1D1D1F]">3.</strong> Compare outcomes by platform, format, language and creative angle.</li>
            <li><strong className="text-[#1D1D1F]">4.</strong> Use observed performance to inform the next campaign.</li>
          </ol>
        </section>
      </div>
    </div>
  );
};
