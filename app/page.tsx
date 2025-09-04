"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, Wand2, Download, Loader2, Lightbulb } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { supabase } from '@/lib/supabaseClient'; // Use your correct import path
import { User } from '@supabase/supabase-js';

interface GeneratedThumbnail {
  id: string
  url: string
  prompt: string
}

const PROMPT_EXAMPLES = [
  "neon text, gaming style, bright colors, excited expression",
  "professional business look, dark background, confident person",
  "viral clickbait style, shocked expression, bright yellow text",
  "educational content, clean design, trustworthy appearance",
  "fitness motivation, energetic, bold red and black colors",
  "tech review, modern minimalist, blue and white theme",
]

export default function ThumbnailGenerator() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  // Legacy auth UI state (kept to avoid TS errors; login moved to /login)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [authView, setAuthView] = useState<"sign_in" | "sign_up">("sign_in")

  // --- YOUR EXISTING STATE (stays the same) ---
  const [formData, setFormData] = useState({
    title: "",
    context: "",
    prompt: "",
    referenceImageUrl: "",
    personPhoto: null as File | null,
  })
  const [thumbnails, setThumbnails] = useState<GeneratedThumbnail[]>([])
  const [isGenerating, setIsGenerating] = useState(false) // This is your existing loading state

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
  }, [router]);

  // Legacy handlers (not used after redirect)
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "reference" | "person") => {
    const file = e.target.files?.[0]
    if (file) {
      if (type === "person") {
        setFormData((prev) => ({ ...prev, personPhoto: file }))
      } else {
        const url = URL.createObjectURL(file)
        setFormData((prev) => ({ ...prev, referenceImageUrl: url }))
      }
    }
  }

  const generateThumbnails = async () => {
    if (!formData.title.trim()) {
      alert("Please enter a video title")
      return
    }

    setIsGenerating(true)
    setThumbnails([])

    try {
      const response = await fetch("/api/generate-thumbnails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          personPhotoBase64: formData.personPhoto ? await fileToBase64(formData.personPhoto) : null,
        }),
      })

      // Safely parse JSON only when the response contains it
      let data: any = null
      const contentType = response.headers.get("content-type") ?? ""

      if (contentType.includes("application/json")) {
        data = await response.json()
      } else {
        // Fallback to plain-text (e.g., "Internal Server Error")
        const text = await response.text()
        throw new Error(text || "Unknown error")
      }

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate thumbnails")
      }

      setThumbnails(data.thumbnails)
    } catch (error) {
      console.error("Error generating thumbnails:", error)
      alert(error instanceof Error ? error.message : "Failed to generate thumbnails. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const regenerateThumbnail = async () => {
    if (!formData.title.trim()) {
      alert("Please enter a video title")
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/generate-thumbnails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          personPhotoBase64: formData.personPhoto ? await fileToBase64(formData.personPhoto) : null,
        }),
      })

      // Safely parse JSON only when the response contains it
      let data: any = null
      const contentType = response.headers.get("content-type") ?? ""

      if (contentType.includes("application/json")) {
        data = await response.json()
      } else {
        // Fallback to plain-text (e.g., "Internal Server Error")
        const text = await response.text()
        throw new Error(text || "Unknown error")
      }

      if (!response.ok) {
        throw new Error(data?.error || "Failed to regenerate thumbnail")
      }

      setThumbnails(data.thumbnails)
    } catch (error) {
      console.error("Error regenerating thumbnail:", error)
      alert(error instanceof Error ? error.message : "Failed to regenerate thumbnail. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
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

  const addExamplePrompt = (example: string) => {
    setFormData((prev) => ({ ...prev, prompt: example }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/*<div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI YouTube Thumbnail Generator</h1>
          <p className="text-lg text-gray-600">Powered by OpenAI DALL-E 3 for high-quality thumbnails</p>
        </div>*/}

        <div className="text-center mb-8">
  <h1 className="text-4xl font-bold text-gray-900 mb-2">AI YouTube Thumbnail Generator</h1>
  <p className="text-lg text-gray-600">Powered by OpenAI DALL-E 3 for high-quality thumbnails</p>
</div>

{/* --- ADD THIS AUTH UI SECTION --- */}
<div className="w-full max-w-md mx-auto mb-8">
  {!user ? (
    // Show login/signup form if no user is logged in
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={authView === 'sign_in' ? handleEmailSignIn : handleEmailSignUp}>
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
            <Button 
              type="submit" 
              disabled={authLoading}
              className="w-full"
            >
              {authLoading ? 'Loading...' : authView === 'sign_in' ? 'Sign In' : 'Sign Up'}
            </Button>
          </div>
        </form>
        {/* --- ADD GOOGLE SIGN-IN BUTTON HERE --- */}
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-300" />
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-2 bg-white text-gray-500">Or continue with</span>
    </div>
  </div>
  
  <Button 
    onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
    variant="outline" 
    className="w-full flex items-center justify-center gap-2"
    type="button"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
    Sign in with Google
  </Button>
  {/* --- END GOOGLE BUTTON --- */}
        <div className="text-center mt-4">
          <button 
            onClick={() => setAuthView(authView === 'sign_in' ? 'sign_up' : 'sign_in')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {authView === 'sign_in' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
          </button>
        </div>
      </CardContent>
    </Card>
  ) : (
    // Show user info and logout button if logged in
    <div className="text-center p-4 bg-green-50 rounded-lg">
      <p className="text-green-800">Logged in as: <strong>{user.email}</strong></p>
      <Button 
        onClick={handleSignOut} 
        variant="outline" 
        size="sm" 
        className="mt-2"
      >
        Sign Out
      </Button>
    </div>
  )}
</div>
{/* --- END AUTH UI SECTION --- */}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Thumbnail Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Video Title *</Label>
                <Input
                  id="title"
                  placeholder="How I Made $10,000 in 24 Hours with AI"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="context">Context/Summary</Label>
                <Textarea
                  id="context"
                  placeholder="This video explains my step-by-step method using AI tools to earn money fast..."
                  value={formData.context}
                  onChange={(e) => setFormData((prev) => ({ ...prev, context: e.target.value }))}
                  className="mt-1 min-h-[100px]"
                />
              </div>

              {/* Prompt Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">Style Instructions</h3>
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <Label htmlFor="prompt">Additional Instructions (Optional)</Label>
                  <Textarea
                    id="prompt"
                    placeholder="e.g., neon text, shocked expression, bright colors, gaming style, professional look..."
                    value={formData.prompt}
                    onChange={(e) => setFormData((prev) => ({ ...prev, prompt: e.target.value }))}
                    className="mt-1 min-h-[80px]"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Describe the style, colors, mood, or specific elements you want in your thumbnail
                  </p>
                </div>

                {/* Example Prompts */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Quick Examples:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PROMPT_EXAMPLES.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => addExamplePrompt(example)}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded-full transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>Reference Image URL (Optional)</Label>
                <Input
                  placeholder="https://example.com/reference-thumbnail.jpg"
                  value={formData.referenceImageUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, referenceImageUrl: e.target.value }))}
                  className="mt-1"
                />
                <div className="mt-2">
                  <Label htmlFor="reference-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                      <Upload className="h-4 w-4" />
                      Or upload reference image
                    </div>
                  </Label>
                  <Input
                    id="reference-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "reference")}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <Label>Person Photo (Optional)</Label>
                <Label htmlFor="person-upload" className="cursor-pointer">
                  <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.personPhoto ? formData.personPhoto.name : "Upload a photo to include in thumbnails"}
                    </p>
                  </div>
                </Label>
                <Input
                  id="person-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "person")}
                  className="hidden"
                />
              </div>

              <Button
                onClick={generateThumbnails}
                disabled={isGenerating || !formData.title.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating with DALL-E 3...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5 mr-2" />
                    Generate Thumbnail
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Thumbnails</CardTitle>
            </CardHeader>
            <CardContent>
              {isGenerating && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
                  <p className="text-gray-600">Creating your perfect thumbnail with DALL-E 3...</p>
                  <p className="text-sm text-gray-500 mt-2">This usually takes 10-20 seconds</p>
                </div>
              )}

              {thumbnails.length > 0 && (
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="aspect-video relative rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-400 transition-colors">
                      <Image
                        src={thumbnails[0]?.url || "/placeholder.svg"}
                        alt="Generated Thumbnail"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                        <Button
                          onClick={() => downloadThumbnail(thumbnails[0]?.url, "youtube-thumbnail.jpg")}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-900 hover:bg-gray-100"
                          size="lg"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Thumbnail
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3 text-center line-clamp-3">{thumbnails[0]?.prompt}</p>
                  </div>

                  {/* Add the regenerate button here */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={regenerateThumbnail}
                      disabled={isGenerating}
                      variant="outline"
                      className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 bg-transparent"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Regenerate
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => downloadThumbnail(thumbnails[0]?.url, "youtube-thumbnail.jpg")}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      size="lg"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              )}

              {!isGenerating && thumbnails.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Wand2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Your generated thumbnail will appear here</p>
                  <p className="text-sm mt-2">Powered by OpenAI DALL-E 3</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
