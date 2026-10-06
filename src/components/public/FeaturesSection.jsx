import {
  BadgePercent,
  CalendarCheck,
  CalendarClock,
  CreditCard,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

const features = [
  {
    title: "Instant booking",
    description:
      "See open slots and book a stylist without calling the front desk.",
    icon: CalendarClock,
  },
  {
    title: "Verified salons",
    description:
      "Every partner salon is reviewed before it appears on the marketplace.",
    icon: ShieldCheck,
  },
  {
    title: "Services that fit",
    description:
      "Hair, skin, nails, bridal, and grooming — filter by what you actually need.",
    icon: Scissors,
  },
  {
    title: "Honest reviews",
    description:
      "Read ratings from guests who finished the visit, then pick with confidence.",
    icon: Star,
  },
  {
    title: "Offers & coupons",
    description:
      "Apply salon and platform offers at checkout so the price stays clear.",
    icon: BadgePercent,
  },
  {
    title: "Secure payments",
    description:
      "Pay online or at the chair, with a record of every booking and payout.",
    icon: CreditCard,
  },
];

const steps = [
  {
    step: "01",
    title: "Find a salon",
    text: "Search by area, service, or rating and open a profile you trust.",
    icon: Search,
  },
  {
    step: "02",
    title: "Pick a slot",
    text: "Choose the stylist, service, and time that works for your day.",
    icon: CalendarCheck,
  },
  {
    step: "03",
    title: "Show up ready",
    text: "Get a confirmation, pay securely, and leave a review after the visit.",
    icon: Sparkles,
  },
];

export default function FeaturesSection() {
  return (
    <>
      <section
        id="features"
        className="scroll-mt-20 flex min-h-screen items-center bg-[#f7f1ea] lg:h-screen"
      >
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:py-8">
          <div className="max-w-md">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#9a7040]">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              Built for guests and the salons they love.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-stone-600 sm:text-base">
              Discovery through payment, in one visit. No phone call required.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-[#e8d2a2]/50 bg-white/80 p-4 shadow-sm"
                >
                  <span className="flex size-10 items-center justify-center rounded-full border border-[#e8d2a2]/70 bg-[#f7f1ea] text-[#9a7040]">
                    <Icon className="size-4" strokeWidth={1.6} />
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-stone-900">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-stone-600 sm:text-sm">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-[#0c0c0c] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#e8d2a2]">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Three steps from search to the chair.
            </h2>
          </div>

          <ol className="relative mt-12 grid gap-4 md:grid-cols-3 md:gap-6">
            <div className="pointer-events-none absolute left-[18%] right-[18%] top-9 hidden h-px bg-gradient-to-r from-transparent via-[#e8d2a2]/60 to-transparent md:block" />
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.step}
                  className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-full border border-[#e8d2a2]/70 bg-[#0c0c0c] text-[#f3ddb0]">
                      <Icon className="size-5" strokeWidth={1.5} />
                    </span>
                    <span className="text-3xl font-semibold tracking-tight text-[#e8d2a2]/80">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-400">
                    {item.text}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </>
  );
}
