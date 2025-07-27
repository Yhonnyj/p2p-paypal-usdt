// lib/useReferrer.ts
"use client";
import { useEffect } from "react";

export function useReferrer() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("r");
    if (ref) {
      localStorage.setItem("referrerId", ref);
    }
  }, []);
}
