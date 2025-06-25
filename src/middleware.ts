// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { clerkMiddlewareConfig } from "./clerk.config";

export default clerkMiddleware(clerkMiddlewareConfig);

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
