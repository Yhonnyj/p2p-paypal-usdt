// src/clerk.config.ts

export const clerkMiddlewareConfig = {
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
  afterSignInUrl: "/dashboard",
  afterSignUpUrl: "/dashboard",
  publicRoutes: ["/", "/sign-in", "/sign-up"], // ⬅️ ESTO ES LO QUE TE FALTABA
};
