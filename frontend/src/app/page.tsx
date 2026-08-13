import Link from "next/link";
import { APP } from "@/lib/config";

export default function LandingPage() {
  return (
    <div className="tm-mesh relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(45,212,191,0.22),_transparent_55%)]" />
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6 sm:py-6">
        <div>
          <p className="font-display text-xl text-deep sm:text-2xl">{APP.name}</p>
        </div>
        <Link
          href="/onboarding"
          className="min-h-11 rounded-xl bg-deep px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink"
        >
          Get started
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-center px-4 pb-16 pt-8 sm:min-h-[75vh] sm:px-6 sm:pb-20 sm:pt-10">
        <p className="animate-fade-up font-display text-4xl leading-[1.05] tracking-tight text-deep sm:text-6xl md:text-7xl lg:text-8xl">
          {APP.name}
        </p>
        <h1 className="mt-5 max-w-2xl animate-fade-up text-lg text-deep/80 sm:mt-6 sm:text-2xl" style={{ animationDelay: "80ms" }}>
          {APP.tagline}
        </h1>
        <p className="mt-4 max-w-xl animate-fade-up text-sm leading-relaxed text-slate sm:text-base" style={{ animationDelay: "140ms" }}>
          {APP.description} Connect a wallet, publish your organization, and leave
          a public trail of completed work — not likes, not ads, not fake reviews.
        </p>
        <div className="mt-8 flex flex-col gap-3 animate-fade-up sm:mt-10 sm:flex-row sm:flex-wrap" style={{ animationDelay: "200ms" }}>
          <Link
            href="/onboarding"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-deep px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-deep/20 transition hover:bg-ink"
          >
            Get started
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-deep/15 bg-white/70 px-6 py-3 text-sm font-semibold text-deep backdrop-blur transition hover:border-sea/40"
          >
            View the network
          </Link>
        </div>
      </main>

      <section className="relative z-10 border-t border-deep/10 bg-white/40 py-12 backdrop-blur sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:gap-10 sm:px-6 md:grid-cols-3">
          {[
            {
              title: "Register once",
              body: "Publish your organization so partners can find a real, wallet-owned profile.",
            },
            {
              title: "Complete real work",
              body: "Create a relationship, both sides accept, then both mark it complete.",
            },
            {
              title: "Earn public reputation",
              body: "Verified reviews and completed work update a trust score anyone can check.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="font-display text-xl text-deep">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
