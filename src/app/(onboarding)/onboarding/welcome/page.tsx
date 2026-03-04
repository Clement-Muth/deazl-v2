import Link from "next/link";
import Image from "next/image";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { initLinguiFromCookie } from "@/lib/i18n/server";

type StickerProps = {
  src: string;
  alt: string;
  rotate: string;
  style: React.CSSProperties;
  delay: number;
  size?: number;
};

function Sticker({ src, alt, rotate, style, delay, size = 72 }: StickerProps) {
  return (
    <div
      className={`absolute rounded-2xl bg-white p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.10)] animate-fade-in ${rotate}`}
      style={{ ...style, animationDelay: `${delay}ms` }}
    >
      <Image src={src} alt={alt} width={size} height={size} className="object-contain" />
    </div>
  );
}

export default async function WelcomePage() {
  const i18n = await initLinguiFromCookie();

  const features = [
    {
      label: <Trans>Plan your meals for the week</Trans>,
      bg: "bg-primary-light",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
    {
      label: <Trans>Shopping list generated automatically</Trans>,
      bg: "bg-orange-50",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      ),
    },
    {
      label: <Trans>Price comparison across stores</Trans>,
      bg: "bg-red-50",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white">

      <div className="pointer-events-none flex justify-center pt-8">
        <div className="relative h-64 w-80">
          <Sticker src="/img/broccoli.jpg" alt={i18n._(msg`Broccoli`)} rotate="-rotate-12" style={{ left:  "0",     top: "12px"  }} delay={40}  size={72} />
          <Sticker src="/img/carrot.jpg"   alt={i18n._(msg`Carrot`)}   rotate="rotate-12"  style={{ left: "178px", top:  "4px"  }} delay={80}  size={64} />
          <Sticker src="/img/avocado.jpg"  alt={i18n._(msg`Avocado`)}  rotate="-rotate-12" style={{ left:  "96px", top: "50px"  }} delay={0}   size={88} />
          <Sticker src="/img/lemon.jpg"    alt={i18n._(msg`Lemon`)}    rotate="rotate-12"  style={{ left:  "20px", top: "150px" }} delay={120} size={64} />
          <Sticker src="/img/tomato.jpg"   alt={i18n._(msg`Tomato`)}   rotate="-rotate-8"  style={{ left: "200px", top: "150px" }} delay={160} size={80} />
          <Sticker src="/img/leaf.jpg"     alt={i18n._(msg`Leaf`)}     rotate="rotate-18"  style={{ left: "160px", top: "130px" }} delay={200} size={46} />
        </div>
      </div>

      <div className="relative flex flex-1 flex-col px-7 pb-10 pt-2">

        <div className="animate-fade-up text-center [animation-delay:200ms]">
          <h1 className="text-[78px] font-black leading-none tracking-[-5px] text-gray-900">
            Deazl<span className="text-primary">.</span>
          </h1>
          <p className="mt-3 text-lg font-medium leading-relaxed text-gray-400">
            <Trans>Plan your meals.</Trans><br />
            <Trans>Shop smarter.</Trans>
          </p>
        </div>

        <div className="mb-8 mt-auto space-y-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-4 py-3.5 shadow-sm animate-fade-up"
              style={{ animationDelay: `${360 + i * 80}ms` }}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${f.bg}`}>
                {f.icon}
              </div>
              <span className="text-sm font-medium text-gray-700">{f.label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3 animate-fade-up [animation-delay:620ms]">
          <Link
            href="/onboarding/household"
            className="flex w-full items-center justify-between rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-white transition active:scale-[0.98]"
          >
            <span><Trans>Get started</Trans></span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
          <p className="text-center text-xs text-gray-400"><Trans>Free · Set up in 2 minutes</Trans></p>
        </div>

      </div>
    </div>
  );
}
