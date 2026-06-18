import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarginalBridge — Cross-Border Marj Koruma",
  description:
    "Dropshipping satıcıları için premium B2B SaaS. Gerçek zamanlı gümrük, navlun ve pazaryeri komisyonu ile otomatik buybox fiyatlandırma.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-white font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
