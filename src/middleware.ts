// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { clerkMiddlewareConfig } from "./clerk.config";

export default clerkMiddleware(clerkMiddlewareConfig);

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
  regions: ["gru1"], // 👈 Esto es lo que evita que el middleware se ejecute desde iad1 (Washington)
};
