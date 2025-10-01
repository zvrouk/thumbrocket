"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PayStackButton } from "@/components/PayStackButton"
import { supabase } from "@/lib/supabaseClient"
import { Check, Sparkles, Timer, TrendingUp } from "lucide-react"

type Plan = {
  id: "weekly" | "yearly"
  name: string
  headline: string
  price: string
  frequency: string
  ksh: string
  tagline: string
  badge?: string
  highlight?: string
}

const plans: Plan[] = [
  {
    id: "weekly",
    name: "Weekly Creator Pass",
    headline: "Sprint-friendly access",
    price: "$4",
    frequency: "per week",
    ksh: "Charged as KSh 600 weekly",
    tagline: "Stay agile and spin up campaigns whenever inspiration hits. Pause or resume anytime.",
    highlight: "Most flexible",
  },
  {
    id: "yearly",
    name: "Yearly Creator Pass",
    headline: "Longest runway, best value",
    price: "$67",
    frequency: "per year",
    ksh: "Charged as KSh 10,050 yearly",
    tagline: "Lock in Thumbrocket for every launch this year and skip weekly renewals.",
    badge: "Best value",
    highlight: "Save 20% vs weekly",
  },
]

const sharedFeatures = [
  {
    title: "Unlimited AI thumbnails",
    description: "Generate endless on-brand variations without worrying about quotas.",
  },
  {
    title: "Brand-ready presets",
    description: "Keep fonts, palettes, and layouts aligned across every campaign.",
  },
  {
    title: "Rapid collaboration",
    description: "Share links, capture feedback, and ship assets with zero friction.",
  },
  {
    title: "Launch insights",
    description: "Track which styles convert best so you can double down with confidence.",
  },
]

const comparisonRows: Array<{
  label: string
  description?: string
  weekly: string
  yearly: string
}> = [
  {
    label: "Full Thumbrocket studio",
    description: "AI generation, instant variations, brand kits, HD exports, and workflow automations.",
    weekly: "Included",
    yearly: "Included",
  },
  {
    label: "Support & onboarding",
    description: "Priority chat access from creative specialists and same-day onboarding.",
    weekly: "Included",
    yearly: "Included",
  },
  {
    label: "Billing cadence",
    description: "Choose the rhythm that matches your release schedule.",
    weekly: "$4 billed weekly (KSh 600)",
    yearly: "$67 billed yearly (KSh 10,050)",
  },
  {
    label: "Best for",
    weekly: "Testing new series, short runs, seasonal pushes.",
    yearly: "Year-long channels, agencies, growth operations.",
  },
  {
    label: "Savings",
    description: "Compared to paying weekly for a full year.",
    weekly: "Baseline",
    yearly: "~20% savings",
  },
]

export default function PricingPage() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) router.replace("/login")
    })
  }, [router])

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-950 via-purple-900 to-purple-700 text-white">
      <div className="pointer-events-none absolute -top-40 left-1/3 h-[26rem] w-[26rem] rounded-full bg-purple-500/40 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-[-12rem] right-[-4rem] h-[34rem] w-[34rem] rounded-full bg-purple-400/35 blur-[180px]" />

      <div className="relative mx-auto max-w-6xl px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-3xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-purple-100/80 backdrop-blur transition hover:bg-white/20">
            <span>Thumbrocket access</span>
            <span className="rounded-full bg-purple-200/30 px-2 py-0.5 text-[0.65rem] text-white">All features included</span>
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Choose the cadence that keeps your creative momentum.
          </h1>
          <p className="mt-4 text-lg text-purple-100/85">
            Weekly or yearly, both plans unlock the exact same AI-powered thumbnail studio. Pick the billing rhythm that fits your production cycle and start shipping scroll-stopping visuals faster than ever.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-purple-100/80 lg:justify-start">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <Sparkles className="h-4 w-4 text-purple-200" />
              Unlimited renders & presets
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <Timer className="h-4 w-4 text-purple-200" />
              Launch-ready in minutes
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <TrendingUp className="h-4 w-4 text-purple-200" />
              Data-backed creative decisions
            </span>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden border border-white/15 bg-white/10 text-white shadow-2xl shadow-purple-900/40 transition-all duration-300 backdrop-blur ${
                plan.id === "yearly"
                  ? "bg-gradient-to-br from-white/25 via-white/15 to-white/10 ring-1 ring-white/30"
                  : "hover:-translate-y-1 hover:border-white/25 hover:bg-white/12"
              }`}
            >
              {plan.badge && (
                <div className="pointer-events-none absolute right-6 top-6 rounded-full bg-purple-500/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
                  {plan.badge}
                </div>
              )}
              <CardHeader className="space-y-3">
                <CardTitle className="text-xl font-semibold text-white">{plan.name}</CardTitle>
                <p className="text-sm text-purple-100/80">{plan.headline}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
                    <span className="text-sm font-medium text-purple-100/70">{plan.frequency}</span>
                  </div>
                  <p className="mt-2 text-xs text-purple-100/70">{plan.ksh}</p>
                </div>

                <p className="text-sm text-purple-100/80">{plan.tagline}</p>

                {plan.highlight && (
                  <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-purple-50">
                    {plan.highlight}
                  </div>
                )}

                <PayStackButton
                  plan={plan.id}
                  label={plan.id === "weekly" ? "Get Weekly Access" : "Secure Yearly Access"}
                />

                <p className="text-center text-[0.7rem] text-purple-100/70">
                  Cancel anytime. Instant access to the full Thumbrocket suite after payment.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-14">
          <span className="text-xs uppercase tracking-[0.28em] text-purple-100/70">Everything in every plan</span>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sharedFeatures.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-3xl border border-white/15 bg-white/5 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/10 hover:shadow-xl hover:shadow-purple-900/40"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Check className="h-4 w-4 text-purple-200" />
                  {feature.title}
                </div>
                <p className="mt-2 text-sm leading-5 text-purple-100/85">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="mt-14 overflow-hidden border border-white/15 bg-white/10 text-white backdrop-blur">
          <CardHeader className="space-y-3">
            <span className="text-xs uppercase tracking-[0.28em] text-purple-100/70">Need more clarity?</span>
            <CardTitle className="text-2xl font-semibold text-white">Compare plans side by side</CardTitle>
            <p className="text-sm text-purple-100/80">
              The experience stays identical across weekly and yearly subscriptions-you're choosing commitment, not capability.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-[1.2fr,1fr,1fr] items-center bg-white/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-purple-200">
              <span>Feature</span>
              <span className="text-center">Weekly</span>
              <span className="text-center">Yearly</span>
            </div>
            <div className="divide-y divide-white/10">
              {comparisonRows.map((row) => (
                <div key={row.label} className="grid grid-cols-[1.2fr,1fr,1fr] items-center px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-white">{row.label}</p>
                    {row.description && (
                      <p className="mt-1 text-xs text-purple-100/75">{row.description}</p>
                    )}
                  </div>
                  <div className="text-center text-sm text-purple-100/80">{row.weekly}</div>
                  <div className="text-center text-sm text-purple-100/80">{row.yearly}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
