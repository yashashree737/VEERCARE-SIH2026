import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const domain = process.env.DOMAIN || "veercare.vercel.app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(`https://${domain}`),

  title: {
    default: "VeerCare: Care for our Bravehearts",
    template: "%s | VeerCare",
  },

  description:
    "VeerCare is a mental healthcare for our bravehearts, providing accessible and reliable support for their mental well-being.",

  keywords: [
    "VeerCare",
    "mental healthcare",
    "bravehearts",
    "mental well-being",
    "web application",
    "online platform",
    "productivity",
    "technology",
  ],

  authors: [
    {
      name: "Ishaan Topkar",
    }
  ],

  creator: "VeerCare Team",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  // manifest: "/manifest.json",

  icons: {
    icon: "/vercel.svg",
    apple: "/vercel.svg",
  },

  openGraph: {
    title: "VeerCare | Care for our Bravehearts",
    description:
      "VeerCare is a mental healthcare for our bravehearts, providing accessible and reliable support for their mental well-being.",
    url: `https://${domain}`,
    siteName: "VeerCare",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/vercel.svg",
        width: 1200,
        height: 630,
        alt: "VeerCare",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "VeerCare | Care for our Bravehearts",
    description:
      "VeerCare is a mental healthcare for our bravehearts, providing accessible and reliable support for their mental well-being.",
    images: ["/vercel.svg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
