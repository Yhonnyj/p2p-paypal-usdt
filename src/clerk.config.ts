import { createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

const isAdminSubdomain = (req: NextRequest) => {
  const host = req.headers.get("host") || "";
  return host.startsWith("admin.");
};

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export const clerkMiddlewareConfig = {
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
  afterSignInUrl: "/dashboard",
  afterSignUpUrl: "/dashboard",
  publicRoutes: ["/sign-in", "/sign-up", "/admin/login"], // ✅ FIX: quitamos "/"

  beforeAuth: (req: NextRequest) => {
    const pathname = req.nextUrl.pathname;
    const url = req.nextUrl.clone();
const isAuth = true;

    // 🔁 Redirige si entra a admin.tucapi.com/
    if (isAdminSubdomain(req) && pathname === "/") {
      url.pathname = isAuth ? "/admin/orders" : "/admin/login";
      return Response.redirect(url);
    }

    // 🔒 Bloquea rutas fuera de /admin en subdominio admin
    if (isAdminSubdomain(req) && !isAdminRoute(req)) {
      return new Response("No autorizado", { status: 403 });
    }
  },
};
