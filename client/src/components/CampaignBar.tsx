import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

type Countdown = { expired: boolean; d: number; h: number; m: number; s: number } | null;

function useCountdown(target: Date | null): Countdown {
  const [now, setNow] = useState(() => Date.now());
  const targetTime = target ? target.getTime() : null;
  useEffect(() => {
    if (targetTime == null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetTime]);
  if (targetTime == null) return null;
  const diff = targetTime - now;
  if (diff <= 0) return { expired: true, d: 0, h: 0, m: 0, s: 0 };
  return {
    expired: false,
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

function CampaignLink({ href, children }: { href?: string | null; children: React.ReactNode }) {
  if (!href) return <>{children}</>;
  if (/^https?:\/\//i.test(href)) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className="block">{children}</a>;
  }
  return <Link href={href} className="block">{children}</Link>;
}

export function CampaignBar() {
  const utils = trpc.useUtils();
  const { data: campaign } = trpc.content.getActiveCampaign.useQuery(undefined, { refetchInterval: 60000 });
  const end = campaign ? new Date(campaign.endsAt) : null;
  const countdown = useCountdown(campaign?.showCountdown ? end : null);

  useEffect(() => {
    if (countdown?.expired) utils.content.getActiveCampaign.invalidate();
  }, [countdown?.expired, utils]);

  if (!campaign || countdown?.expired) return null;

  const promoLabel = campaign.promo
    ? campaign.promo.type === "percent"
      ? `-${campaign.promo.value}%`
      : `-${(campaign.promo.value / 100).toFixed(0)} CHF`
    : null;

  const cdText = campaign.showCountdown && countdown && !countdown.expired
    ? `${countdown.d > 0 ? `${countdown.d}j ` : ""}${String(countdown.h).padStart(2, "0")}h ${String(countdown.m).padStart(2, "0")}m ${String(countdown.s).padStart(2, "0")}s`
    : null;

  const content = (
    <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-sm font-semibold">
      {promoLabel && <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-extrabold">{promoLabel}</span>}
      <span>{campaign.message || campaign.name}</span>
      {campaign.promo?.code && <span className="rounded bg-black/30 px-2 py-0.5 text-xs font-bold tracking-wide">Code&nbsp;: {campaign.promo.code}</span>}
      {cdText && (
        <span className="inline-flex items-center gap-1 tabular-nums" data-testid="campaign-countdown">
          <span aria-hidden="true">⏳</span> {cdText}
        </span>
      )}
    </div>
  );

  if (campaign.imageDesktopUrl) {
    return (
      <CampaignLink href={campaign.linkUrl}>
        <div className="relative w-full overflow-hidden" data-testid="campaign-bar">
          <picture>
            {campaign.imageMobileUrl && <source media="(max-width: 640px)" srcSet={campaign.imageMobileUrl} />}
            <img src={campaign.imageDesktopUrl} alt={campaign.name} className="h-auto max-h-[220px] w-full object-cover" />
          </picture>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 py-3 text-white">
            {content}
          </div>
        </div>
      </CampaignLink>
    );
  }

  return (
    <CampaignLink href={campaign.linkUrl}>
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2 text-white" data-testid="campaign-bar">
        {content}
      </div>
    </CampaignLink>
  );
}
