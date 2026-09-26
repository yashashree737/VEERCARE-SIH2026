import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import AppHeader from "@/components/AppHeader";
import VoiceAgent from "@/components/VoiceAgent";
import { AuthProvider } from "@/lib/auth";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const origin = process.env.DOMAIN || "https://veercare.vercel.app";

export const metadata: Metadata = {
  title: "VeerCare — Personnel Stress & Welfare Monitoring System",
  description: "AI-Based Predictive Personnel Stress and Welfare Monitoring System for Uniformed Forces",
  keywords: [
    "VeerCare",
    "Personnel Stress Monitoring",
    "Welfare Monitoring System",
    "AI-Powered Triage",
    "Mental Health",
    "Force Personnel Welfare",
    "Early Warning System",
  ],
  authors: [
    { name: "Ishaan Topkar" },
    { name: "Atharv Jagtap" },
    { name: "Yashashree Dalvi" },
    { name: "Mohana Rupa" },
  ],
  verification: {
    google: "1Z3acQvbffaTY47Awf2RoQz2JW3zvbUYPEXvyoA868I",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "VeerCare — Personnel Stress & Welfare Monitoring System",
    description: "AI-Based Predictive Personnel Stress and Welfare Monitoring System for Uniformed Forces",
    url: origin,
    siteName: "VeerCare",
    images: [
      {
        url: "/logo.jpeg",
        width: 800,
        height: 600,
        alt: "VeerCare Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "VeerCare — Personnel Stress & Welfare Monitoring System",
    description: "AI-Based Predictive Personnel Stress and Welfare Monitoring System for Uniformed Forces",
    images: ["/logo.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#f0f3f8",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "VeerCare",
  description: "AI-Powered Early Warning & Welfare Triage for Force Personnel",
  url: origin,
  applicationCategory: "HealthAndFitnessApplication",
  image: `${origin}/logo.jpeg`,
  offers: {
    "@type": "Offer",
    price: "0",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full antialiased ${manrope.variable}`}>
      <body className="min-h-full flex flex-col bg-[#f0f3f8] text-slate-800 selection:bg-blue-600 selection:text-white font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          <AppHeader />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <VoiceAgent />
        </AuthProvider>
      </body>
    </html>
  );
}