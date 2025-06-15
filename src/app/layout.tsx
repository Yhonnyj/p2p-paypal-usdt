import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  
  description: "Tu plataforma privada de cambio",

    title: "TuCapi",
  icons: {
    icon: "/favicon.ico", // usa tu ícono personalizado
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

