import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SamarohSathi AI — Adaptive Event Planning Assistant",
  description: "An AI-powered event planning web application that helps individuals and families plan, organize, and manage celebrations without unnecessary stress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (var i = 0; i < registrations.length; i++) {
                      registrations[i].unregister();
                    }
                  });
                }
                if ('caches' in window) {
                  caches.keys().then(function(keys) {
                    for (var i = 0; i < keys.length; i++) {
                      caches.delete(keys[i]);
                    }
                  });
                }
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#FBF9F5] text-[#1F1A17] font-sans">
        {children}
      </body>
    </html>
  );
}
