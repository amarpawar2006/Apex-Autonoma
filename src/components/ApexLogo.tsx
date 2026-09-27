import React from 'react';

interface ApexLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'mark' | 'lockup' | 'compact';
  showTagline?: boolean;
}

/**
 * Official Apex Engineering Brand Identity
 * Faithful vector rendering of the geometric AP monogram with High-Vis Orange accent
 */
export const ApexLogo: React.FC<ApexLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'mark',
  showTagline = true,
}) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const markSize = sizeMap[size] || sizeMap.md;

  // Exact vector path of the Apex Engineering monogram
  const LogoMark = (
    <div className={`relative shrink-0 flex items-center justify-center ${markSize} ${className}`}>
      <svg
        viewBox="0 0 1000 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain"
        aria-label="Apex Engineering Logo"
      >
        {/* Left diagonal leg of A */}
        <path
          d="M230 720L520 320L650 500L580 550L520 465L335 720H230Z"
          fill="#14161B"
        />
        {/* Apex High-Vis Orange Triangle Wedge */}
        <polygon
          points="596 720, 654 640, 712 720"
          fill="#FF4500"
        />
        {/* Upper rounded loop ("P" feature) */}
        <path
          d="M555 320H810C876 320 920 364 920 425C920 486 876 530 810 530H660L695 470H800C835 470 860 450 860 425C860 400 835 380 800 380H600L555 320Z"
          fill="#14161B"
        />
        {/* Lower right diagonal chevron */}
        <path
          d="M675 640L765 550L920 720H820L765 660L705 720H600L675 640Z"
          fill="#14161B"
        />
      </svg>
    </div>
  );

  if (variant === 'mark') {
    return LogoMark;
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center space-x-2.5 min-w-0">
        {LogoMark}
        <span className="font-semibold text-sm tracking-tight text-[#1D1D1F] truncate">
          Apex Autonoma
        </span>
      </div>
    );
  }

  // Full Brand Lockup
  return (
    <div className="flex items-center space-x-3 min-w-0">
      {LogoMark}
      <div className="min-w-0 flex flex-col">
        <div className="flex items-center space-x-2 min-w-0">
          <span className="font-semibold text-sm tracking-tight text-[#1D1D1F] truncate">
            Apex Autonoma
          </span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-black/[0.04] text-[#6E6E73] shrink-0">
            Pro Ops
          </span>
        </div>
        {showTagline && (
          <p className="text-[11px] text-[#86868B] truncate hidden sm:block">
            Social Intelligence & Production Studio
          </p>
        )}
      </div>
    </div>
  );
};
