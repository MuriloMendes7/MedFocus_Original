import React from 'react';

export const MedFocusLogo = ({ size = 'md', showBadge = false, className = '' }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Símbolo Estruturado: Selo Médico Minimalista em Verde-Petróleo e Sálvia */}
      <div
        className={`relative ${iconSizes[size]} shrink-0 rounded-xl bg-[#1A3835] dark:bg-[#254641] text-[#FAF8F5] flex items-center justify-center border border-[#2D544F]/50 shadow-sm`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
        >
          {/* Cruz Médica estilizada com traço contínuo e ponto focal */}
          <rect x="13.5" y="6" width="5" height="20" rx="2.5" fill="#FAF8F5" fillOpacity="0.95" />
          <rect x="6" y="13.5" width="20" height="5" rx="2.5" fill="#FAF8F5" fillOpacity="0.95" />
          {/* Núcleo focal sutil em verde sálvia */}
          <circle cx="16" cy="16" r="3" fill="#8EA89D" />
        </svg>
      </div>

      {/* Tipografia Editorial Sóbria */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span
            className={`${textSizes[size]} font-bold tracking-tight text-[#1A3835] dark:text-[#F1F4F2] font-serif`}
          >
            Med<span className="text-[#4E6B5F] dark:text-[#A4B8AE]">Focus</span>
          </span>
          <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded-md bg-[#E8EFEA] dark:bg-[#1E2B27] text-[#244B45] dark:text-[#A4B8AE] border border-[#CCD8D1] dark:border-[#2D403A]">
            cards
          </span>
        </div>
        {showBadge && (
          <span className="text-[10px] tracking-wider font-medium text-[#657770] dark:text-[#8C9C95] mt-0.5">
            Método de Repetição Espaçada
          </span>
        )}
      </div>
    </div>
  );
};

export default MedFocusLogo;
