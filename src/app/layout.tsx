import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";
import NavigationWrapper from "@/components/NavigationWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GoldTradeX | Premium Gold Trading Platform",
  description: "Trade gold price movements with real-time analysis and instant execution.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
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
