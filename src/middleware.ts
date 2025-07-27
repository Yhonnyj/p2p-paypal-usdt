// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { clerkMiddlewareConfig } from "./clerk.config";

export default clerkMiddleware((_auth, req) => {
  // 1. Capturamos el parámetro ?r= de forma segura
  const referrerId = req.nextUrl.searchParams.get("r");

  if (referrerId) {
    // 2. Clonamos la respuesta para poder modificar cookies
    const response = NextResponse.next();
    response.cookies.set("referrerId", referrerId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });
    return response;
  }

  // 3. Si no hay referrer, devolvemos la respuesta original
  return NextResponse.next();
}, clerkMiddlewareConfig);

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
  regions: ["gru1"], // Mantiene tu configuración original (evita iad1)
};
