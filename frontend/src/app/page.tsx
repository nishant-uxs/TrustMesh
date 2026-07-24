import Link from "next/link";
import { APP } from "@/lib/config";

export default function LandingPage() {
  return (
    <div className="tm-mesh relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(45,212,191,0.22),_transparent_55%)]" />
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div>
          <p className="font-display text-2xl text-deep">{APP.name}</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-xl bg-deep px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink"
        >
          Open app
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[75vh] max-w-6xl flex-col justify-center px-6 pb-20 pt-10">
        <p className="animate-fade-up font-display text-5xl leading-[1.05] tracking-tight text-deep sm:text-6xl md:text-7xl lg:text-8xl">
          {APP.name}
        </p>
        <h1 className="mt-6 max-w-2xl animate-fade-up text-xl text-deep/80 sm:text-2xl" style={{ animationDelay: "80ms" }}>
          {APP.tagline}
        </h1>
        <p className="mt-4 max-w-xl animate-fade-up text-base text-slate" style={{ animationDelay: "140ms" }}>
          {APP.description} Built with advanced Soroban contracts, live event
          streaming, and a production-ready Testnet deployment.
        </p>
        <div className="mt-10 flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: "200ms" }}>
          <Link
            href="/dashboard"
            className="rounded-xl bg-deep px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-deep/20 transition hover:bg-ink"
          >
            Enter dashboard
          </Link>
          <Link
            href="/organizations"
            className="rounded-xl border border-deep/15 bg-white/70 px-6 py-3 text-sm font-semibold text-deep backdrop-blur transition hover:border-sea/40"
          >
            Browse organizations
          </Link>
        </div>
      </main>

      <section className="relative z-10 border-t border-deep/10 bg-white/40 py-16 backdrop-blur">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-3">
          {[
            {
              title: "Verifiable organizations",
              body: "Onboard businesses, agencies, freelancers, and vendors with immutable registry records.",
            },
            {
              title: "Trust relationships",
              body: "Create, accept, complete, and dispute business relationships with cross-contract reputation updates.",
            },
            {
              title: "Live reputation graph",
              body: "Stream OrganizationRegistered, ReviewVerified, DisputeResolved, and TrustScoreUpdated events in real time.",
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
