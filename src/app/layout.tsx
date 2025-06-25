import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "TuCapi",
  description: "Tu plataforma privada de cambio",
  manifest: "/manifest.json",
  themeColor: "#10B981", // color de status bar en Android
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="es">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#10B981" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />
          <link rel="icon" href="/icon-192x192.png" />
          <script
            src="https://cdn.getdidit.com/verify.js"
            defer
          ></script>
        </head>
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
