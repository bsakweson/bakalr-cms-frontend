import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { PreferencesProvider } from "@/contexts/preferences-context";
import { getRuntimeConfigScript } from "@/lib/runtime-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bakalr CMS - Headless Content Management System",
  description: "Modern headless CMS with multi-language support and dark chocolate brown theme",
  icons: {
    icon: '/favicon.ico',
    apple: '/bakalr-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Inject runtime configuration for client-side access */}
        <script
          dangerouslySetInnerHTML={{
            __html: getRuntimeConfigScript(),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <PreferencesProvider>
            {children}
            <Toaster richColors position="top-right" />
          </PreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
