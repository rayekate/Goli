import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";
import NavigationWrapper from "@/components/NavigationWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GoldXchange | Institutional Gold Trading Terminal",
  description: "Trade gold price movements with real-time analysis, institutional-grade tools, and instant settlement on GoldXchange.",
  metadataBase: new URL("https://goldxchange.org"),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={inter.className} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }} suppressHydrationWarning>
        <AuthProvider>
          <UIProvider>
            <NavigationWrapper>
              {children}
            </NavigationWrapper>
          </UIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
