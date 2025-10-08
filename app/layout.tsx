import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ThumbRocket - AI YouTube Thumbnail Generator",
  description:
    "Create high-converting YouTube thumbnails in seconds with AI. Boost your CTR with custom, professional thumbnails made in seconds.",
  keywords: [
    "youtube thumbnail generator",
    "ai thumbnails",
    "thumbnail maker",
    "youtube creator tools",
    "thumbnail designer",
  ],
  openGraph: {
    title: "ThumbRocket - AI YouTube Thumbnail Generator",
    description: "Create high-converting YouTube thumbnails in seconds with AI",
    url: "https://thumbrocket.xyz",
    images: [{ url: "https://thumbrocket.xyz/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: "https://thumbrocket.xyz",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/icon.svg"],
    apple: [
      { url: "/icon.svg" },
    ],
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#6235ff" },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>ThumbRocket - AI YouTube Thumbnail Generator</title>
        <meta
          name="description"
          content="Create high-converting YouTube thumbnails in seconds with AI. Boost your CTR with custom, professional thumbnails made in seconds."
        />
        <meta
          name="keywords"
          content="youtube thumbnail generator, ai thumbnails, thumbnail maker, youtube creator tools, thumbnail designer"
        />
        <meta property="og:title" content="ThumbRocket - AI YouTube Thumbnail Generator" />
        <meta property="og:description" content="Create high-converting YouTube thumbnails in seconds with AI" />
        <meta property="og:image" content="https://thumbrocket.xyz/og-image.png" />
        <meta property="og:url" content="https://thumbrocket.xyz" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://thumbrocket.xyz" />
        <link rel="icon" type="image/svg+xml" href="/icon.svg" />
        <link rel="shortcut icon" href="/icon.svg" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#6235ff" />
        <meta name="theme-color" content="#060b12" />
      </head>
      <body className={inter.className}>
        <Suspense fallback={<div>Loading...</div>}>
          {children}
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}



