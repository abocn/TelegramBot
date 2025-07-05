"use client";

import { Button } from "@/components/ui/button";
import { RiTelegram2Line } from "react-icons/ri";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

export function HeaderAuth() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-8 h-8 animate-pulse bg-muted rounded-md" />
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href="/login">
        <RiTelegram2Line />
        Sign in with Telegram
      </Link>
    </Button>
  );
}
