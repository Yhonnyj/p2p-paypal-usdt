'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const ADMIN_CLERK_ID = "user_2yyZX2DgvOUrxDtPBU0tRHgxsXH";

export default function RedirectFactorOne() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      if (user.id === ADMIN_CLERK_ID) {
        router.replace("/admin/orders");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [isSignedIn, isLoaded, user, router]);

  return null; // pantalla vacía
}
