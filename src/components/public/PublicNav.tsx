import React from 'react';
import { ApexLogo } from '../ApexLogo';
import { ArrowLeft, ExternalLink, Shield, FileText, HelpCircle, LogIn } from 'lucide-react';

interface PublicNavProps {
  currentPage: 'about' | 'privacy' | 'terms' | 'support';
}

export const PublicNav: React.FC<PublicNavProps> = ({ currentPage }) => {
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <header className="sticky top-0 z-50 bg-[#F5F5F7]/80 backdrop-blur-md border-b border-black/[0.06]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <ApexLogo variant="mark" size="sm" />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-[#1D1D1F]">APEX AUTONOMA</span>
            <span className="text-[10px] text-[#86868B] font-mono tracking-wider uppercase">AI Campaign Operating System</span>
          </div>
        </div>

        <nav className="flex items-center space-x-1 sm:space-x-2 text-xs font-medium">
          <button
            onClick={() => navigate('/about')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentPage === 'about' ? 'bg-black/[0.06] text-[#1D1D1F] font-semibold' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            About
          </button>
          <button
            onClick={() => navigate('/privacy')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentPage === 'privacy' ? 'bg-black/[0.06] text-[#1D1D1F] font-semibold' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Privacy
          </button>
          <button
            onClick={() => navigate('/terms')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentPage === 'terms' ? 'bg-black/[0.06] text-[#1D1D1F] font-semibold' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Terms
          </button>
          <button
            onClick={() => navigate('/support')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentPage === 'support' ? 'bg-black/[0.06] text-[#1D1D1F] font-semibold' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            Support
          </button>
          <button
            onClick={() => navigate('/')}
            className="ml-2 px-3.5 py-1.5 bg-[#FF4500] hover:bg-[#EA3E00] text-white rounded-lg transition-all shadow-xs flex items-center space-x-1 font-semibold"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export const PublicFooter: React.FC = () => {
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <footer className="border-t border-black/[0.06] bg-[#FBFBFD] py-12 mt-16 text-xs text-[#86868B]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <ApexLogo variant="mark" size="sm" />
              <span className="font-bold text-[#1D1D1F]">Apex Autonoma</span>
            </div>
            <p className="text-[11px] text-[#6E6E73]">
              Built by Apex Engineering · Pune, India · Working Globally
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <button onClick={() => navigate('/about')} className="hover:text-[#1D1D1F] transition-colors">About</button>
            <button onClick={() => navigate('/privacy')} className="hover:text-[#1D1D1F] transition-colors">Privacy Policy</button>
            <button onClick={() => navigate('/terms')} className="hover:text-[#1D1D1F] transition-colors">Terms of Service</button>
            <button onClick={() => navigate('/support')} className="hover:text-[#1D1D1F] transition-colors">Support & Help</button>
            <button onClick={() => navigate('/')} className="hover:text-[#1D1D1F] transition-colors">Sign In</button>
          </div>
        </div>
        <div className="border-t border-black/[0.04] pt-6 flex flex-col sm:flex-row justify-between text-[11px] text-[#86868B] gap-2">
          <span>&copy; {new Date().getFullYear()} Apex Engineering. All rights reserved.</span>
          <span>Autonomous Creative & Multi-Tenant Social Engine</span>
        </div>
      </div>
    </footer>
  );
};
