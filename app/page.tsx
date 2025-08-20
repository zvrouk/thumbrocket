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
  // --- NEW AUTH STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false); // Renamed to avoid conflict
  const [authView, setAuthView] = useState('sign_in'); // 'sign_in' or 'sign_up'

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

  // --- ADD THIS USEEFFECT HOOK ---
  useEffect(() => {
    // Get the current session on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for changes to auth state (login, logout, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Cleanup function to remove the listener when the component unmounts
    return () => subscription.unsubscribe();
  }, []);
  // --- ADD AUTH HANDLER FUNCTIONS HERE ---
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    if (error) {
      alert(error.message);
    } else {
      alert('Check your email for the confirmation link!');
    }
    setAuthLoading(false);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) {
      alert(error.message);
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(error.message);
    }
  };

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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI YouTube Thumbnail Generator</h1>
          <p className="text-lg text-gray-600">Powered by OpenAI DALL-E 3 for high-quality thumbnails</p>
        </div>

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
