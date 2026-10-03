import React, { useState } from 'react';
import { 
  Clock, 
  Building2, 
  Mail, 
  User, 
  LogOut, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { ApexLogo } from '../ApexLogo';
import { AuthSessionResponse } from '../../types/auth';
import { autonomaDataService } from '../../services/autonomaDataService';

interface AwaitingApprovalViewProps {
  session: AuthSessionResponse;
  onSignOut: () => void;
  onRefreshStatus: () => void;
}

export const AwaitingApprovalView: React.FC<AwaitingApprovalViewProps> = ({
  session,
  onSignOut,
  onRefreshStatus
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const user = session.user;
  const pendingReq = session.pendingRequest;
  const isRejected = pendingReq?.status === 'REJECTED';

  const handleRefresh = async () => {
    setRefreshing(true);
    setFeedback(null);
    try {
      const res = await autonomaDataService.getCurrentSession();
      if (res.success && res.activeCompany && res.role) {
        onRefreshStatus();
      } else {
        setFeedback('Your account is still pending Super Admin approval.');
      }
    } catch (err: any) {
      setFeedback('Unable to reach server. Please try again shortly.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col justify-between selection:bg-[#FF4500] selection:text-white">
      {/* Background blueprint grid */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(29,29,31,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(29,29,31,0.045) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Header with visible account identity & working Sign out */}
      <header className="relative z-10 border-b border-black/[0.07] bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ApexLogo variant="lockup" size="md" />
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <div className="hidden sm:flex items-center space-x-2 text-[#86868B]">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Account: <strong className="text-[#1D1D1F] font-mono">{user?.email}</strong></span>
          </div>

          <button
            onClick={onSignOut}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-black/[0.03] text-[#1D1D1F] border border-black/[0.08] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Status Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-lg bg-white border border-black/[0.08] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Card Icon & Header */}
          <div className="text-center space-y-2">
            <div className={`inline-flex p-3 rounded-2xl border ${
              isRejected 
                ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            } mb-1`}>
              {isRejected ? <ShieldAlert className="w-8 h-8" /> : <Clock className="w-8 h-8 animate-pulse" />}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F]">
              {isRejected ? 'Access Request Not Approved' : 'Awaiting Super Admin Approval'}
            </h1>

            <p className="text-xs sm:text-sm text-[#86868B] max-w-md mx-auto leading-relaxed">
              {isRejected
                ? 'Your access request could not be approved at this time. Please contact your organization administrator.'
                : 'Your verified account has been submitted to the Super Administrator for company workspace assignment.'}
            </p>
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Submission Record Details Card */}
          <div className="p-4 bg-[#FBFBFD] border border-black/[0.06] rounded-xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
              <span className="text-[#86868B]">Status:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                isRejected 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-amber-500/20 text-amber-400'
              }`}>
                {isRejected ? 'REJECTED' : 'PENDING_APPROVAL'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#86868B] flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-[#6E6E73]" />
                <span>Verified Name:</span>
              </span>
              <span className="text-[#1D1D1F] font-medium">{user?.name || pendingReq?.name || 'User'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#86868B] flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-[#6E6E73]" />
                <span>Verified Email:</span>
              </span>
              <span className="text-[#1D1D1F] font-medium">{user?.email || pendingReq?.email}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#86868B] flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#6E6E73]" />
                <span>Proposed Company:</span>
              </span>
              <span className="text-[#FF4500] font-semibold">
                {pendingReq?.proposedCompanyName || `${user?.name || 'User'}'s Company`}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] text-[10px] text-[#6E6E73]">
              <span>Requested At:</span>
              <span>{pendingReq?.requestedAt ? new Date(pendingReq.requestedAt).toLocaleString() : 'Just now'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Checking Approval...' : 'Check Approval Status'}</span>
            </button>

            <button
              onClick={onSignOut}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-[#FBFBFD] hover:bg-black/[0.03] text-[#6E6E73] hover:text-[#1D1D1F] text-xs font-medium border border-black/[0.08] transition-colors flex items-center justify-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Security Information */}
          <div className="p-3 rounded-xl bg-[#FBFBFD] border border-black/[0.05] text-[11px] text-[#86868B] space-y-1">
            <div className="flex items-center space-x-1.5 text-[#1D1D1F] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Access Gate Security</span>
            </div>
            <p className="text-[10px] text-[#6E6E73] leading-relaxed">
              Autonoma enforces strict multi-tenant company isolation. Until the Super Admin authorizes your organization and creates a verified membership record, protected company databases, campaigns, and AI generators remain inaccessible.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-black/[0.07] px-6 py-4 text-center text-xs text-[#86868B]">
        <span>Apex Autonoma • Server-Enforced Company Isolation</span>
      </footer>
    </div>
  );
};
