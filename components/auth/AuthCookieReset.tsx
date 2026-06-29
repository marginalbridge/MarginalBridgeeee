"use client";

import { useEffect } from "react";

/**
 * Login sayfasinda eski NextAuth / mb_session cakismasini onler.
 * Gizli sekmede calisip normal sekmede calismama sorununu giderir.
 */
export function AuthCookieReset() {
  useEffect(() => {
    const key = "mb_auth_reset_done";
    const params = new URLSearchParams(window.location.search);
    const force = params.has("fresh") || params.has("reset") || params.has("error");

    if (!force && sessionStorage.getItem(key)) {
      return;
    }

    fetch("/api/auth/clear", {
      method: "POST",
      credentials: "same-origin",
    })
      .catch(() => {
        // sessiz
      })
      .finally(() => {
        sessionStorage.setItem(key, "1");
      });
  }, []);

  return null;
}
