// middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { clerkMiddlewareConfig } from "./clerk.config";

export default clerkMiddleware(clerkMiddlewareConfig);

export const config = {
  matcher: [
    // Protege todo EXCEPTO rutas admin y archivos estáticos
    '/((?!.*\\.[\\w]+$|_next|admin|sign-in|sign-up).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
