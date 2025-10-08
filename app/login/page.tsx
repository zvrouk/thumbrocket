"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabaseClient"

const spotlightStats = [
  { value: "10x faster", description: "workflow for busy creators" },
  { value: "30+ presets", description: "crafted for every niche" },
  { value: "24/7", description: "support from creative specialists" },
]

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [authView, setAuthView] = useState<"sign_in" | "sign_up">("sign_in")

  const isSignIn = authView === "sign_in"

  useEffect(() => {
    // If already logged in, go to the app
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) router.replace("/")
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) router.replace("/")
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      alert(error.message)
    } else {
      alert("Check your email for the confirmation link!")
      setAuthView("sign_in")
    }
    setAuthLoading(false)
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    setAuthLoading(false)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-950 via-purple-900 to-purple-700 text-white">
      <div className="pointer-events-none absolute -top-48 left-1/4 h-96 w-96 rounded-full bg-purple-500/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-purple-400/30 blur-[180px]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12 lg:px-12">
        <div className="grid w-full gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col justify-between">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-purple-100/80 backdrop-blur transition hover:bg-white/20">
                <span>Thumbrocket</span>
                <span className="rounded-full bg-purple-200/30 px-2 py-0.5 text-[0.65rem] text-white">Creator hub</span>
              </div>

              <div className="space-y-6">
                <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  AI YouTube Thumbnail Generator - Boost Your CTR
                </h1>
                <p className="max-w-xl text-lg text-purple-100/85">
                  Create high-converting, professional YouTube thumbnails in seconds with artificial intelligence. Perfect for creators, marketers, and businesses.
                </p>
              </div>
            </div>

            <div className="mt-12 space-y-6">
              <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur">
                <h2 className="text-2xl font-semibold text-white">How ThumbRocket Works</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2 rounded-2xl border border-white/15 bg-white/5 p-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">1</span>
                      Describe Your Video
                    </h3>
                    <p className="text-sm text-purple-100/80">
                      Share your title, target audience, and big idea so the AI understands the hook.
                    </p>
                  </div>
                  <div className="space-y-2 rounded-2xl border border-white/15 bg-white/5 p-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">2</span>
                      Choose Your Style
                    </h3>
                    <p className="text-sm text-purple-100/80">
                      Tap one of the signature presets—from Viral Clickbait to Cinematic—to guide the composition.
                    </p>
                  </div>
                  <div className="space-y-2 rounded-2xl border border-white/15 bg-white/5 p-4">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">3</span>
                      Generate Perfect Thumbnails
                    </h3>
                    <p className="text-sm text-purple-100/80">
                      Produce polished, click-ready thumbnails in seconds and download your favorite instantly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <span className="text-xs uppercase tracking-[0.25em] text-purple-100/75">Creators rely on Thumbrocket</span>
                <div className="grid gap-4 sm:grid-cols-3">
                  {spotlightStats.map((stat) => (
                    <div key={stat.value} className="rounded-2xl bg-white/5 p-4 text-white shadow-inner shadow-purple-900/40">
                      <div className="text-lg font-semibold">{stat.value}</div>
                      <p className="mt-1 text-xs text-purple-100/80">{stat.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Card className="relative overflow-hidden border border-white/15 bg-white/95 text-gray-900 shadow-2xl shadow-purple-900/40">
            <div className="pointer-events-none absolute -top-28 right-0 h-48 w-48 translate-x-10 rounded-full bg-purple-300/40 blur-3xl" />
            <CardContent className="relative z-10 p-10">
              <div className="flex flex-col gap-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center rounded-full bg-purple-100/80 p-1 text-xs font-semibold text-purple-800">
                    <button
                      type="button"
                      onClick={() => setAuthView("sign_in")}
                      className={`rounded-full px-4 py-1.5 transition ${
                        isSignIn ? "bg-white text-purple-900 shadow" : "hover:bg-white/70 hover:text-purple-900"
                      }`}
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthView("sign_up")}
                      className={`rounded-full px-4 py-1.5 transition ${
                        !isSignIn ? "bg-white text-purple-900 shadow" : "hover:bg-white/70 hover:text-purple-900"
                      }`}
                    >
                      Sign up
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {isSignIn ? "Welcome back" : "Start creating"}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {isSignIn ? "Sign in to jump back into your creative dashboard." : "Create an account to unlock AI-powered thumbnail workflows."}
                    </p>
                  </div>
                </div>

                <form onSubmit={isSignIn ? handleEmailSignIn : handleEmailSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 rounded-xl border border-purple-200/80 bg-white/80 text-gray-900 placeholder:text-purple-300 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-200/70 transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Password
                      </Label>
                      {isSignIn && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-purple-600 transition hover:text-purple-800"
                          onClick={() => router.push("/forgot-password")}
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 rounded-xl border border-purple-200/80 bg-white/80 text-gray-900 placeholder:text-purple-300 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-200/70 transition"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={authLoading}
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 transition hover:shadow-xl hover:shadow-purple-500/40 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                  >
                    {authLoading ? "Loading..." : isSignIn ? "Sign in" : "Create account"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-purple-100" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-[0.25em] text-purple-300">
                    <span className="bg-transparent px-4">or continue with</span>
                  </div>
                </div>

                <Button
                  onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
                  variant="outline"
                  className="group h-12 w-full rounded-xl border border-purple-200/70 bg-white/70 text-purple-700 transition hover:-translate-y-0.5 hover:border-purple-400 hover:bg-white"
                  type="button"
                >
                  <span className="flex items-center justify-center gap-2 text-sm font-semibold">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5 transition group-hover:ring-purple-200">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </span>
                    Google
                  </span>
                </Button>

                <p className="text-center text-xs text-gray-500">
                  By continuing, you agree to the Thumbrocket terms of service and privacy policy.
                </p>

                <div className="text-center text-sm text-gray-700">
                  {isSignIn ? (
                    <span>
                      Need an account?{' '}
                      <button
                        onClick={() => setAuthView("sign_up")}
                        className="font-semibold text-purple-600 transition hover:text-purple-800"
                        type="button"
                      >
                        Sign up
                      </button>
                    </span>
                  ) : (
                    <span>
                      Already have an account?{' '}
                      <button
                        onClick={() => setAuthView("sign_in")}
                        className="font-semibold text-purple-600 transition hover:text-purple-800"
                        type="button"
                      >
                        Sign in
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}



