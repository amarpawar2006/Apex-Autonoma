import React, { useState } from 'react';
import { 
  TrendingUp, 
  MessageSquare, 
  Sparkles, 
  Target, 
  Zap, 
  CheckCircle2, 
  Users, 
  BarChart3, 
  Flame, 
  ArrowUpRight,
  Send,
  HelpCircle
} from 'lucide-react';
import { AUTOMATED_LEAD_TRIGGERS } from '../data/initialCampaigns';

export const ViralityEngineView: React.FC = () => {
  const [selectedKeyword, setSelectedKeyword] = useState<string>('LEAK');
  const [simulatedComment, setSimulatedComment] = useState<string>('Hey, comment LEAK please send the guide!');
  const [showAutoReply, setShowAutoReply] = useState<boolean>(true);

  const activeTrigger = AUTOMATED_LEAD_TRIGGERS.find(t => t.keyword === selectedKeyword) || AUTOMATED_LEAD_TRIGGERS[0];

  return (
    <div className="space-y-6 pb-20">
      {/* Editorial Header */}
      <div className="bg-white rounded-3xl border border-black/[0.06] p-4 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-[#86868B]">
              <Zap className="w-3.5 h-3.5 text-[#FF4500]" />
              <span className="font-medium text-[#1D1D1F]">Algorithmic Engine</span>
              <span>·</span>
              <span>B2B Growth Mechanics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
              Virality & Community Engine
            </h1>
            <p className="text-xs sm:text-sm text-[#6E6E73] mt-1 max-w-2xl leading-relaxed">
              Engineered mechanics for B2B viral distribution: optimizing for high-value saves, bookmark ratios, dwell time, and comment-to-lead automation.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 text-xs w-full sm:w-auto">
            <div className="p-3 sm:p-4 bg-[#FBFBFD] rounded-2xl border border-black/[0.04] text-left sm:text-right">
              <div className="text-[10px] sm:text-[11px] text-[#86868B]">Estimated Reach</div>
              <div className="text-lg sm:text-xl font-semibold text-[#FF4500] mt-0.5">542,000+</div>
            </div>
            <div className="p-3 sm:p-4 bg-[#FBFBFD] rounded-2xl border border-black/[0.04] text-left sm:text-right">
              <div className="text-[10px] sm:text-[11px] text-[#86868B]">Expected Leads</div>
              <div className="text-lg sm:text-xl font-semibold text-emerald-600 mt-0.5">180+ leads</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars of B2B Virality */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm space-y-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF4500] flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-[#1D1D1F]">1. The Private Save Trigger</h4>
          <p className="text-xs text-[#6E6E73] leading-relaxed">
            B2B leaders rarely click "Like" publicly. But they obsessively <strong className="text-[#1D1D1F]">Save & Bookmark</strong> architecture schematics to review with their teams.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm space-y-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF4500] flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-[#1D1D1F]">2. 3-Second Retention Hook</h4>
          <p className="text-xs text-[#6E6E73] leading-relaxed">
            Never start with generic introductions. Open with friction: <em className="text-[#1D1D1F]">"Stop doing manual order entry in 2026."</em> Holds drop-off under 15%.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm space-y-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF4500] flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-[#1D1D1F]">3. Comment Keyword Loop</h4>
          <p className="text-xs text-[#6E6E73] leading-relaxed">
            Asking users to comment a 4-letter keyword (<code className="text-[#FF4500] font-mono">LEAK</code>, <code className="text-[#FF4500] font-mono">STORE</code>) classifies the post as high-engagement.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm space-y-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF4500] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-[#1D1D1F]">4. Conversation to Cash</h4>
          <p className="text-xs text-[#6E6E73] leading-relaxed">
            Autonomous webhook sends the promised schematic or Microcommerce demo directly to user DMs within 3 seconds, accelerating calendar bookings.
          </p>
        </div>
      </div>

      {/* Interactive Comment-to-Lead Automation Simulator */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-[#1D1D1F] text-sm font-semibold flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#FF4500]"></span>
              <span>Comment-to-Lead Automation Simulator</span>
            </h3>
            <p className="text-xs text-[#6E6E73] mt-0.5">
              Simulates how the automated social bot responds to inbound buyer keywords in real time.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[#86868B]">Trigger keyword:</span>
            <div className="flex gap-1 bg-[#F2F2F7] p-1 rounded-xl">
              {AUTOMATED_LEAD_TRIGGERS.map((t) => (
                <button
                  key={t.keyword}
                  onClick={() => setSelectedKeyword(t.keyword)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                    selectedKeyword === t.keyword
                      ? 'bg-white text-[#FF4500] font-semibold shadow-sm'
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  {t.keyword}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Simulation Playground */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Simulated Inbound Comment */}
          <div className="p-5 bg-[#FBFBFD] rounded-2xl border border-black/[0.06] space-y-3">
            <div className="flex items-center justify-between text-[11px] text-[#86868B] border-b border-black/[0.06] pb-2">
              <span className="font-medium text-[#1D1D1F]">Inbound Social Comment</span>
              <span className="text-emerald-600 font-medium">Keyword detected: '{activeTrigger.keyword}'</span>
            </div>

            <div className="flex items-start space-x-3 pt-1">
              <div className="w-8 h-8 rounded-full bg-neutral-200 text-[#1D1D1F] flex items-center justify-center font-semibold text-xs flex-shrink-0">
                RP
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-[#1D1D1F]">Rahul Patil (Operations Director, Pune)</div>
                <p className="text-xs text-[#6E6E73] leading-relaxed">
                  "Our orders are a complete mess right now. Commenting <strong className="text-[#1D1D1F]">{activeTrigger.keyword}</strong>, please send the system breakdown!"
                </p>
                <div className="text-[10px] text-[#86868B]">Just now · Instagram / LinkedIn</div>
              </div>
            </div>
          </div>

          {/* Autonomous Bot DM Response */}
          <div className="p-5 bg-[#FBFBFD] rounded-2xl border border-black/[0.06] space-y-3 relative">
            <div className="flex items-center justify-between text-[11px] text-[#86868B] border-b border-black/[0.06] pb-2">
              <span className="font-medium text-[#1D1D1F]">Automated DM Response</span>
              <span className="text-xs font-medium text-[#FF4500] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                Response: 1.8s
              </span>
            </div>

            <div className="space-y-2 pt-1">
              <div className="text-[11px] text-[#86868B]">Sent from Apex Engineering verified assistant</div>
              <div className="text-xs text-[#1D1D1F] bg-white p-3.5 rounded-xl border border-black/[0.06] shadow-xs leading-relaxed">
                {activeTrigger.autoReplyText}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Stage: {activeTrigger.targetStage.replace('_', ' ')} · Deliverable verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Yearly Growth & ROI Projections */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm space-y-4">
        <h3 className="text-[#1D1D1F] text-sm font-semibold flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-[#FF4500]" />
          <span>Annual Operational & Cost Comparison</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-[#FBFBFD] rounded-2xl border border-black/[0.04] space-y-2">
            <div className="text-xs font-medium text-[#86868B]">Traditional Agency</div>
            <div className="text-2xl font-semibold text-neutral-800">₹1,20,000 / mo</div>
            <p className="text-xs text-[#6E6E73] leading-relaxed">
              ₹14,40,000 / year for generic graphic design without system thinking or architecture depth.
            </p>
          </div>

          <div className="p-5 bg-orange-50/40 rounded-2xl border border-orange-200/80 space-y-2">
            <div className="text-xs font-semibold text-[#FF4500]">Apex Autonoma (Our Stack)</div>
            <div className="text-2xl font-semibold text-[#1D1D1F]">₹0 – ₹1,200 / mo</div>
            <p className="text-xs text-[#6E6E73] leading-relaxed">
              Google Sheets master database, Gemini free tier text synthesis, and Webhooks. <strong className="text-[#1D1D1F]">&gt;98% cost savings</strong>.
            </p>
          </div>

          <div className="p-5 bg-[#FBFBFD] rounded-2xl border border-black/[0.04] space-y-2">
            <div className="text-xs font-medium text-[#86868B]">Projected Annual Reach</div>
            <div className="text-2xl font-semibold text-emerald-600">6,500,000+</div>
            <p className="text-xs text-[#6E6E73] leading-relaxed">
              Compounding reach across India, Europe, and global founders seeking custom AI and web engineering.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
