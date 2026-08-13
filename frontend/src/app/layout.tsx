import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { OpsBootstrap } from "@/components/providers/OpsBootstrap";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrustMesh — Business Trust on Stellar",
  description:
    "Decentralized business trust & reputation network. Verify organizations, relationships, reviews, and reputation on Stellar Soroban.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${fraunces.variable} antialiased`}>
        <ThemeProvider>
          <OpsBootstrap />
          {children}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
