import type { Metadata } from "next";
import Script from "next/script";
import { IBM_Plex_Mono, Sora } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";
import { APP_DESCRIPTION, APP_TITLE } from "./config";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: APP_TITLE,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-intro="true">
      <body className={`${sora.variable} ${plexMono.variable} antialiased`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var stored=localStorage.getItem('visiongrid.theme');var next=(stored==='light'||stored==='dark')?stored:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');var root=document.documentElement;root.dataset.theme=next;root.dataset.intro='true';root.style.colorScheme=next;root.classList.add('theme-loaded');}catch(e){}})();`}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
