"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Upload, Wand2, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabaseClient"
import type { User } from "@supabase/supabase-js"
import { cn } from "@/lib/utils"

interface GeneratedThumbnail {
  id: string
  url: string
  prompt: string
}

const STYLE_OPTIONS = [
  "Cartoon",
  "Realism",
  "Anime",
  "3D Render",
  "Minimalist",
  "Viral Clickbait",
  "Professional",
  "Gaming",
  "Cinematic",
  "Comic Book",
]

const BASE_INSTRUCTION =
  "Create a YouTube thumbnail, 1280x720 pixels, 16:9 aspect ratio, high quality, no mistakes."

export default function ThumbnailGenerator() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [checkingSubscription, setCheckingSubscription] = useState(false)

  // Legacy auth UI state (kept to avoid TS errors; login moved to /login)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [authView, setAuthView] = useState<"sign_in" | "sign_up">("sign_in")

  const [userPrompt, setUserPrompt] = useState("")
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [faceFile, setFaceFile] = useState<File | null>(null)
  const [referenceFile, setReferenceFile] = useState<File | null>(null)
  const [facePreview, setFacePreview] = useState<string | null>(null)
  const [referencePreview, setReferencePreview] = useState<string | null>(null)
  const [faceDragActive, setFaceDragActive] = useState(false)
  const [referenceDragActive, setReferenceDragActive] = useState(false)
  const [thumbnails, setThumbnails] = useState<GeneratedThumbnail[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastPromptSummary, setLastPromptSummary] = useState("")

  const faceInputRef = useRef<HTMLInputElement | null>(null)
  const referenceInputRef = useRef<HTMLInputElement | null>(null)

  // Enforce auth: redirect to /login when not authenticated
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setCheckingSession(false)
      if (!session?.user) router.replace("/login")
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) router.replace("/login")
    })

    return () => subscription.unsubscribe()
  }, [router])

  // After login, ensure subscription is active
  useEffect(() => {
    const checkSub = async () => {
      if (!user) return
      setCheckingSubscription(true)
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("subscription_status,current_period_end")
          .eq("id", user.id)
          .maybeSingle()
        if (error) {
          console.error("Subscription check error", error)
          return router.replace("/pricing")
        }
        const status = data?.subscription_status
        const end = data?.current_period_end ? new Date(data.current_period_end) : null
        const active = status === "active" && end && end > new Date()
        if (!active) {
          return router.replace("/pricing")
        }
      } finally {
        setCheckingSubscription(false)
      }
    }
    if (user) checkSub()
  }, [user, router])

  useEffect(() => {
    return () => {
      if (facePreview) URL.revokeObjectURL(facePreview)
      if (referencePreview) URL.revokeObjectURL(referencePreview)
    }
  }, [facePreview, referencePreview])

  if (checkingSession || checkingSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      alert(error.message)
    } else {
      alert("Check your email for the confirmation link!")
    }
    setAuthLoading(false)
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert(error.message)
    }
    setAuthLoading(false)
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      alert(error.message)
    }
  }

  const updatePreview = (file: File, type: "face" | "reference") => {
    const objectUrl = URL.createObjectURL(file)
    if (type === "face") {
      setFaceFile(file)
      setFacePreview((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return objectUrl
      })
    } else {
      setReferenceFile(file)
      setReferencePreview((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return objectUrl
      })
    }
  }

  const handleFileSelect = (files: FileList | null, type: "face" | "reference") => {
    const file = files?.[0]
    if (file) {
      updatePreview(file, type)
    }
  }

  const handleFaceDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setFaceDragActive(false)
    handleFileSelect(event.dataTransfer.files, "face")
  }

  const handleReferenceDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setReferenceDragActive(false)
    handleFileSelect(event.dataTransfer.files, "reference")
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }
  const runGeneration = async (isRegeneration = false) => {
    const trimmedPrompt = userPrompt.trim()
    if (!trimmedPrompt) {
      alert("Please describe your thumbnail before generating.")
      return
    }

    setIsGenerating(true)
    if (!isRegeneration) {
      setThumbnails([])
    }

    try {
      const personPhotoBase64 = faceFile ? await fileToBase64(faceFile) : null
      const referenceImageBase64 = referenceFile ? await fileToBase64(referenceFile) : ""

      const styleInstruction = selectedStyle ? `Style: ${selectedStyle}.` : ""
      const faceInstruction = faceFile ? "Include the uploaded face photo when appropriate." : ""
      const referenceInstruction = referenceFile
        ? "Match the energy and layout of the uploaded reference image."
        : ""

      const combinedPrompt = [
        trimmedPrompt,
        styleInstruction,
        faceInstruction,
        referenceInstruction,
        BASE_INSTRUCTION,
      ]
        .filter(Boolean)
        .join(" ")

      const contextDetails = [
        selectedStyle && `Preferred style: ${selectedStyle}.`,
        faceFile && "Use the provided face photo if it improves the design.",
        referenceFile && "Use the reference image as stylistic inspiration.",
      ]
        .filter(Boolean)
        .join(" ")

      const response = await fetch("/api/generate-thumbnails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedPrompt,
          context: contextDetails,
          prompt: combinedPrompt,
          referenceImageUrl: referenceImageBase64,
          personPhotoBase64,
        }),
      })

      let data: any = null
      const contentType = response.headers.get("content-type") ?? ""
      if (contentType.includes("application/json")) {
        data = await response.json()
      } else {
        const text = await response.text()
        throw new Error(text || "Unknown error")
      }

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate thumbnails")
      }

      setThumbnails(data.thumbnails)
      setLastPromptSummary(combinedPrompt)
    } catch (error) {
      console.error("Error generating thumbnails:", error)
      alert(error instanceof Error ? error.message : "Failed to generate thumbnails. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadThumbnail = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error("Error downloading thumbnail:", error)
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">ThumbRocket Thumbnail Studio</h1>
          <p className="mt-2 text-lg text-gray-600">
            Describe it once, pick a style, and generate scroll-stopping YouTube thumbnails in seconds.
          </p>
        </header>

        <div className="w-full max-w-md mx-auto">
          {!user ? (
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={authView === "sign_in" ? handleEmailSignIn : handleEmailSignUp}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={authLoading} className="w-full">
                      {authLoading ? "Loading..." : authView === "sign_in" ? "Sign In" : "Sign Up"}
                    </Button>
                  </div>
                </form>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">Or continue with</span>
                  </div>
                </div>
                <Button
                  onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
                  variant="outline"
                  className="flex w-full items-center justify-center gap-2"
                  type="button"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </Button>
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setAuthView(authView === "sign_in" ? "sign_up" : "sign_in")}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {authView === "sign_in" ? "Need an account? Sign Up" : "Already have an account? Sign In"}
                  </button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="text-green-800">
                Logged in as: <strong>{user.email}</strong>
              </p>
              <Button onClick={handleSignOut} variant="outline" size="sm" className="mt-2">
                Sign Out
              </Button>
            </div>
          )}
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Card className="h-full backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Build Your Thumbnail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="thumbnailPrompt" className="text-sm font-semibold uppercase tracking-wide text-purple-700">
                  Main Instructions
                </Label>
                <Textarea
                  id="thumbnailPrompt"
                  placeholder="Describe your thumbnail..."
                  value={userPrompt}
                  onChange={(event) => setUserPrompt(event.target.value)}
                  className="min-h-[140px] resize-none text-base"
                />
                <p className="text-sm text-gray-500">
                  Tell the AI what the thumbnail should feel like, what text to include, and any must-have visuals.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-purple-700">Choose a style</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {STYLE_OPTIONS.map((style) => {
                    const isSelected = selectedStyle === style
                    return (
                      <Button
                        key={style}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => setSelectedStyle(isSelected ? null : style)}
                        className={cn(
                          "h-12 justify-center rounded-lg border text-sm font-medium transition-all",
                          isSelected
                            ? "border-transparent bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                            : "border-purple-100 bg-white/60 text-purple-700 hover:border-purple-300 hover:bg-purple-50"
                        )}
                      >
                        {style}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div
                  onClick={() => faceInputRef.current?.click()}
                  onDragEnter={(event) => {
                    event.preventDefault()
                    setFaceDragActive(true)
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setFaceDragActive(true)
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault()
                    setFaceDragActive(false)
                  }}
                  onDrop={handleFaceDrop}
                  className={cn(
                    "group cursor-pointer rounded-xl border-2 border-dashed border-purple-200 bg-white/70 p-6 text-center transition-colors",
                    faceDragActive && "border-purple-500 bg-purple-50",
                    facePreview && "border-solid border-purple-400"
                  )}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="h-8 w-8 text-purple-400" />
                    <div>
                      <p className="font-semibold text-gray-800">Add your face to the thumbnail</p>
                      <p className="text-sm text-gray-500">Drag & drop or click to upload</p>
                    </div>
                    {facePreview && (
                      <div className="w-full overflow-hidden rounded-lg border border-purple-200">
                        <img src={facePreview} alt="Face preview" className="h-32 w-full object-cover" />
                      </div>
                    )}
                  </div>
                  <Input
                    ref={faceInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      handleFileSelect(event.target.files, "face")
                      event.target.value = ""
                    }}
                  />
                </div>

                <div
                  onClick={() => referenceInputRef.current?.click()}
                  onDragEnter={(event) => {
                    event.preventDefault()
                    setReferenceDragActive(true)
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setReferenceDragActive(true)
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault()
                    setReferenceDragActive(false)
                  }}
                  onDrop={handleReferenceDrop}
                  className={cn(
                    "group cursor-pointer rounded-xl border-2 border-dashed border-blue-200 bg-white/70 p-6 text-center transition-colors",
                    referenceDragActive && "border-blue-500 bg-blue-50",
                    referencePreview && "border-solid border-blue-400"
                  )}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="h-8 w-8 text-blue-400" />
                    <div>
                      <p className="font-semibold text-gray-800">Upload a thumbnail to copy the style</p>
                      <p className="text-sm text-gray-500">Optional reference for composition</p>
                    </div>
                    {referencePreview && (
                      <div className="w-full overflow-hidden rounded-lg border border-blue-200">
                        <img src={referencePreview} alt="Reference preview" className="h-32 w-full object-cover" />
                      </div>
                    )}
                  </div>
                  <Input
                    ref={referenceInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      handleFileSelect(event.target.files, "reference")
                      event.target.value = ""
                    }}
                  />
                </div>
              </div>

              <p className="text-sm text-gray-500">
                We automatically combine your prompt, style choice, and uploads with smart AI instructions so every
                generation follows YouTube best practices.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => runGeneration(false)}
                  disabled={isGenerating || !userPrompt.trim()}
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-5 w-5" />
                      Generate
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => runGeneration(true)}
                  disabled={isGenerating || thumbnails.length === 0}
                  variant="outline"
                  size="lg"
                  className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    "Regenerate"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="h-full backdrop-blur">
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              {isGenerating && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 className="mb-4 h-12 w-12 animate-spin text-purple-600" />
                  <p className="text-gray-600">Creating your perfect thumbnail...</p>
                  <p className="mt-2 text-sm text-gray-500">This usually takes 10-20 seconds.</p>
                </div>
              )}

              {!isGenerating && thumbnails.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  <Wand2 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p>Your generated thumbnails will appear here.</p>
                  <p className="mt-1 text-sm">Stay tuned—your next viral video needs a standout cover.</p>
                </div>
              )}

              {thumbnails.length > 0 && (
                <div className="space-y-6">
                  {thumbnails.map((thumbnail, index) => (
                    <div key={thumbnail.id} className="space-y-3">
                      <div className="group relative aspect-video overflow-hidden rounded-xl border-2 border-gray-200">
                        <Image
                          src={thumbnail.url || "/placeholder.svg"}
                          alt="Generated thumbnail"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                          <Button
                            onClick={() => downloadThumbnail(thumbnail.url, "youtube-thumbnail-" + (index + 1) + ".jpg")}
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                            size="lg"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                      <Button
                        onClick={() => downloadThumbnail(thumbnail.url, "youtube-thumbnail-" + (index + 1) + ".jpg")}
                        variant="outline"
                        className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Save Thumbnail {thumbnails.length > 1 ? index + 1 : ""}
                      </Button>
                    </div>
                  ))}

                  {lastPromptSummary && (
                    <div className="rounded-lg bg-white/70 p-4 text-sm text-gray-600">
                      <p className="font-semibold text-gray-800">Prompt sent to AI</p>
                      <p className="mt-2 leading-relaxed">{lastPromptSummary}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
