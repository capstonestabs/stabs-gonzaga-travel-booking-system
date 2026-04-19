import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-12 overflow-hidden border-t border-border/70 text-primary-foreground">
      <div className="absolute inset-0">
        <img
          src="/assets/Background.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,41,28,0.8),rgba(11,60,38,0.72),rgba(17,87,54,0.7))]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,20,13,0.18),rgba(4,20,13,0.58))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,214,166,0.16),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.07),transparent_18%)]" />
        <div className="absolute right-8 top-8 hidden h-32 w-32 rounded-full border border-white/10 lg:block" />
        <div className="absolute bottom-[-3rem] left-[-2rem] hidden h-36 w-36 rounded-full border border-white/8 sm:block" />
        <div className="absolute right-24 top-12 hidden grid-cols-5 gap-1.5 lg:grid">
          {Array.from({ length: 20 }).map((_, index) => (
            <span key={index} className="h-1.5 w-1.5 rounded-full bg-white/28" />
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="page-shell grid grid-cols-1 gap-4 py-6 sm:gap-5 sm:py-8 lg:grid-cols-[1.15fr,0.72fr] lg:items-start">
          <div className="space-y-3">
            <p className="font-display text-[1.55rem] font-semibold tracking-tight sm:text-[1.7rem]">STABS</p>
            <p className="max-w-xl text-sm leading-6 text-primary-foreground/84">
              Discover Gonzaga escapes, compare destination details, and plan the kind of trip you
              want with ease.
            </p>
          </div>

          <div className="space-y-3 lg:justify-self-start">
            <Link
              href="/about"
              className="inline-flex min-h-11 items-center rounded-full border border-white/16 bg-white/6 px-4 py-2 text-sm font-medium text-primary-foreground/88 transition hover:bg-white/10 hover:text-white"
            >
              About us
            </Link>
          </div>
        </div>

        <div className="border-t border-white/14">
          <div className="page-shell flex flex-col gap-2 py-4 text-xs text-primary-foreground/78 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
            <p>{year} STABS. Made for Gonzaga trips and easy destination planning.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
