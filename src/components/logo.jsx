

export const LightLogo = () => (
  <div className="flex justify-center mb-6">
    <div className="w-[48px] h-[48px] bg-[#EFEEFE] rounded-xl flex items-center justify-center border border-white/50 shadow-sm">
      <svg width="28" height="28" viewBox="0 0 44 44" fill="none">
        <path d="M10 12L22 30L34 12" stroke="#7F77DD" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="22" cy="33" r="5" fill="#3ECFAA" />
      </svg>
    </div>
  </div>
);

export const DarkLogo = ({ primary, accent }) => (
  <div className="flex justify-center mb-6">
    <svg width="48" height="48" viewBox="0 0 44 44" fill="none">
      <rect width="44" height="44" rx="10" fill="#1E1B3A" />
      <path d="M12 13L22 29L32 13" stroke={primary} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="22" cy="31" r="2.5" fill={accent} />
    </svg>
</div>
);