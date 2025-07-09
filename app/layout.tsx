import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s",
    default: "Eject",
  },
  description: "Aplikasi manajemen yang powerful dan mudah digunakan",
  keywords: ["dashboard", "management", "nextjs", "react"],
  authors: [
    {
      name: "Danang Hapis Fadillah ",
      url: "https://www.linkedin.com/in/danang-hapis-fadillah-682878202/",
    },
  ],
  creator: "Your Name",
  metadataBase: new URL("https://yourapp.com"),
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://yourapp.com",
    title: "Your App Name",
    description: "Aplikasi manajemen yang powerful dan mudah digunakan",
    siteName: "Your App Name",
  },
  twitter: {
    card: "summary_large_image",
    title: "Your App Name",
    description: "Aplikasi manajemen yang powerful dan mudah digunakan",
    creator: "@yourusername",
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
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Skip to main content untuk accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
          >
            Skip to main content
          </a>

          <div id="main-content" className="relative">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
