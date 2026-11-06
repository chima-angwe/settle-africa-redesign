import { LogoMark } from "@/shared/ui";

export interface WelcomeBannerProps {
  title: string;
  subtitle: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function WelcomeBanner({
  title,
  subtitle,
  actionText = "Start a transfer",
  onAction,
  className = "",
}: WelcomeBannerProps) {
  return (
    <div className={`welcome-banner relative flex min-h-[245px] overflow-hidden mb-[17px] rounded border border-line/20 bg-[#101010] text-white ${className}`}>
      <div className="welcome-copy relative z-10 max-w-[57%] p-[30px_34px]">
        <span className="banner-kicker flex items-center gap-2 text-[#bcbcbc] text-[8px] font-bold tracking-[1.4px]">
          <i className="inline-block w-[5px] h-[5px] rounded-full bg-current" /> SETTLE PLATFORM
        </span>
        <h2 className="my-4 font-heading font-semibold text-[clamp(20px,2.5vw,27px)] leading-snug tracking-[-0.8px] text-white">
          {title}
        </h2>
        <p className="text-[#aaa] text-[10px] leading-relaxed max-w-md">
          {subtitle}
        </p>
        {onAction && (
          <button
            type="button"
            className="text-button mt-5 text-white font-bold text-[10px] inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
            onClick={onAction}
          >
            {actionText} <span className="text-sm">→</span>
          </button>
        )}
      </div>
      <div className="banner-visual absolute -top-[35%] right-[2%] w-[48%] min-w-[380px] h-[175%] opacity-90 pointer-events-none" aria-hidden="true">
        <div className="banner-glow absolute top-[20%] left-[22%] w-[260px] h-[260px] border border-white/10 rounded-full" />
        <div className="banner-arc arc-a absolute top-[24%] left-0 w-[365px] h-[190px] border border-white/20 rounded-full -rotate-[26deg]" />
        <div className="banner-arc arc-b absolute top-[14%] -left-[35px] w-[445px] h-[230px] border border-white/20 rounded-full -rotate-[26deg]" />
        <div className="banner-center absolute top-[43%] left-[45%] grid w-[58px] h-[58px] place-items-center border border-white rounded-full bg-[#101010] shadow-[0_0_0_11px_rgba(255,255,255,0.05)]">
          <LogoMark className="w-[42px]! h-[42px]!" />
        </div>
        <span className="floating-currency currency-one absolute z-10 top-[34%] left-[8%] grid w-[39px] h-[39px] place-items-center border border-[#555] rounded-full bg-[#222] text-white font-bold text-xs">
          ₦<small className="absolute -bottom-3 text-[#aaa] text-[6px]">NGN</small>
        </span>
        <span className="floating-currency currency-two absolute z-10 top-[63%] right-[15%] grid w-[39px] h-[39px] place-items-center border border-[#555] rounded-full bg-[#222] text-white font-bold text-xs">
          ₵<small className="absolute -bottom-3 text-[#aaa] text-[6px]">GHS</small>
        </span>
        <span className="floating-currency currency-three absolute z-10 top-[19%] right-[33%] grid w-[39px] h-[39px] place-items-center border border-[#555] rounded-full bg-[#222] text-white font-bold text-xs">
          KSh<small className="absolute -bottom-3 text-[#aaa] text-[6px]">KES</small>
        </span>
      </div>
    </div>
  );
}

