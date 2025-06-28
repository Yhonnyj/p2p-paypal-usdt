import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";
import AddToHomeModal from "@/components/AddToHomeModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "TuCapi | Cambia PayPal a USDT o Moneda fiat como Bolívares al instante",
  description:
    "Convierte PayPal a USDT o Moneda fiat comoBolívares con rapidez, seguridad y atención directa. Plataforma P2P regulada pensada para la comunidad latina.",
  keywords:
    "paypal a usdt, paypal a bolívares, cambiar paypal, el dorado alternativa, p2p regulado, crypto venezuela",
  manifest: "/manifest.json",
  themeColor: "#10B981",
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
  openGraph: {
    title: "TuCapi | Tu dinero directo a tu wallet",
    description:
      "Plataforma P2P regulada para convertir PayPal en cripto o moneda local. Rápida, segura y confiable.",
    url: "https://tucapi.com",
    type: "website",
    siteName: "TuCapi",
  },
  twitter: {
    card: "summary_large_image",
    title: "TuCapi | Plataforma P2P para latinos",
    description:
      "Convierte PayPal a USDT o fiat en segundos. Alternativa a El Dorado App. 100% regulada.",
    creator: "@tucapi", // cámbialo si tienes un Twitter
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
          <link
            rel="icon"
            type="image/png"
            sizes="512x512"
            href="/icon-512x512-maskable.png"
          />
          <script src="https://cdn.getdidit.com/verify.js" defer></script>
        </head>
        <body className={inter.className}>
            <AddToHomeModal />
            {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
