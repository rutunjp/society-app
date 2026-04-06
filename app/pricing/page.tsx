import { CheckIcon } from "@heroicons/react/24/outline"
import Link from "next/link"

const tiers = [
  {
    name: "Essential",
    id: "tier-essential",
    href: "/login",
    priceMonthly: "Free",
    description: "Perfect for small societies starting to digitize.",
    features: [
      "Up to 50 Flats",
      "Member Directory",
      "Maintenance Billing (Manual)",
      "Notice Board",
      "Email Support",
    ],
    featured: false,
    ctaText: "Get Started for Free",
  },
  {
    name: "Professional",
    id: "tier-professional",
    href: "/login",
    priceMonthly: "₹15",
    priceUnit: "/flat/mo",
    description: "Everything you need to run a large, modern RWA on autopilot.",
    features: [
      "Unlimited Flats",
      "Automated Maintenance Invoices",
      "Income & Expense Tracking",
      "WhatsApp Receipt Integration",
      "Dedicated Account Manager",
      "Role-based Admin Access",
    ],
    featured: true,
    ctaText: "Start Professional Trial",
  },
  {
    name: "Zero-Cost Fintech",
    id: "tier-fintech",
    href: "#contact",
    priceMonthly: "₹0",
    priceUnit: " for the Society",
    description: "SaaS costs covered by a small 1.5% residents' convenience fee.",
    features: [
      "Everything in Professional",
      "Integrated Payment Gateway",
      "Zero SaaS Fees for the Society",
      "UPI Payments (0% Fee)",
      "Credit Card Payments (1.5% Fee)",
      "Automated Bank Reconciliation",
    ],
    featured: false,
    ctaText: "Contact Sales",
  },
]

export default function PricingPage() {
  return (
    <div className="bg-gray-900 py-24 sm:py-32 min-h-screen relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 bg-indigo-500/20 blur-[120px] rounded-full point-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 blur-[100px] rounded-full point-events-none"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-400">Pricing Strategy</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            SaaS built for Indian RWAs.
            <br />
            No committee debates required.
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-300">
          Whether you&apos;re a small standing committee or a massive township, we have a plan that fits your budget. Choose the model that works best for your society.
        </p>

        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-3xl p-8 xl:p-10 transition-all duration-300 ${
                tier.featured
                  ? "bg-white/5 ring-2 ring-indigo-500 shadow-2xl shadow-indigo-500/20 scale-105 z-10"
                  : "bg-white/5 ring-1 ring-white/10 hover:bg-white/10 backdrop-blur-md"
              }`}
            >
              <div className="flex items-center justify-between gap-x-4">
                <h3
                  id={tier.id}
                  className={`text-lg font-semibold leading-8 ${
                    tier.featured ? "text-indigo-400" : "text-white"
                  }`}
                >
                  {tier.name}
                </h3>
                {tier.featured ? (
                  <p className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold leading-5 text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                    Most Popular
                  </p>
                ) : null}
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-300">{tier.description}</p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-white">{tier.priceMonthly}</span>
                {tier.priceUnit && (
                  <span className="text-sm font-semibold leading-6 text-gray-300">{tier.priceUnit}</span>
                )}
              </p>
              <a
                href={tier.href}
                aria-describedby={tier.id}
                className={`mt-6 block rounded-xl px-3 py-2.5 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all ${
                  tier.featured
                    ? "bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/30 focus-visible:outline-indigo-500"
                    : "bg-white/10 text-white hover:bg-white/20 ring-1 ring-inset ring-white/20"
                }`}
              >
                {tier.ctaText}
              </a>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-300">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon className="h-6 w-5 flex-none text-indigo-400" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-2xl mt-20 text-center">
          <Link href="/login" className="text-sm font-semibold leading-6 text-white hover:text-indigo-400 transition-colors">
            Already have an account? Sign in <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
