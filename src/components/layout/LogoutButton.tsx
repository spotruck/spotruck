"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/mock-auth";

const S = {
  muted: "#8C7B6E",
  sans: "'Inter', Helvetica, sans-serif",
};

export default function LogoutButton() {
  const router = useRouter();

  function handleLogout() {
    signOut();
    router.push("/auth/login");
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.75rem",
        background: "none",
        border: "none",
        cursor: "pointer",
        width: "100%",
        marginTop: "0.5rem",
      }}
    >
      <LogOut size={14} color={S.muted} strokeWidth={1.5} />
      <span
        style={{
          fontFamily: S.sans,
          fontSize: "0.6rem",
          letterSpacing: "0.2em",
          color: S.muted,
        }}
      >
        DÉCONNEXION
      </span>
    </button>
  );
}
