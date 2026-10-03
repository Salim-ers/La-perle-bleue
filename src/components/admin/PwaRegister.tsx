"use client";

import { useEffect } from "react";

/** Enregistre le service worker de l'application cuisine (portée /admin/). */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/admin/sw.js", { scope: "/admin/" }).catch(() => {});
    }
  }, []);
  return null;
}
