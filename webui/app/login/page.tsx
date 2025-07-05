"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RiTelegram2Line } from "react-icons/ri";
import { TbLoader } from "react-icons/tb";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export const dynamic = 'force-dynamic'

type FormStep = "username" | "twofa";

type VerifyResponse = {
  success: boolean;
  message?: string;
  redirectTo?: string;
  sessionToken?: string;
  error?: string;
};

const buttonVariants = {
  initial: { scale: 1 },
  tap: { scale: 0.98 },
};

function LoginForm() {
  const [step, setStep] = useState<FormStep>("username");
  const [username, setUsername] = useState("");
  const [twoFaCode, setTwoFaCode] = useState("");
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/account';

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setUserId(result.userId);
        setStep("twofa");
      } else {
        setError(result.error || "Failed to find user");
      }
    } catch (err) {
      console.error("Username submission error:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFaCode.trim() || twoFaCode.length !== 6) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, code: twoFaCode }),
      });

      const result: VerifyResponse = await response.json();

      if (result.success) {
        const redirectTo = result.redirectTo || returnTo;
        if (result.sessionToken) {
          try {
            localStorage.setItem('kowalski-session', result.sessionToken);
          } catch (storageError) {
            console.error('localStorage error:', storageError);
          }
        }

        window.location.href = redirectTo;
      } else {
        setError(result.error || "Invalid 2FA code");
      }
    } catch (err) {
      console.error("2FA verification error:", err);
      console.log("Error details:", {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace',
        name: err instanceof Error ? err.name : 'Unknown error type'
      });
      const errorMessage = err instanceof Error ?
        `Error: ${err.message}` :
        "Network error. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep("username");
    setUsername("");
    setTwoFaCode("");
    setUserId("");
    setError("");
  };

  const LoadingSpinner = ({ text }: { text: string }) => (
    <div className="flex items-center gap-3">
      <TbLoader className="w-4 h-4 animate-spin" />
      <span className="text-muted-foreground">{text}</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <section className="flex flex-col items-center justify-center py-24 px-6 text-center bg-gradient-to-br from-background to-muted flex-1">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 p-4">
              <RiTelegram2Line className="w-10 h-10" />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === "username" && (
              <motion.div
                key="username-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="max-w-md mx-auto"
              >
                <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
                  Login to Kowalski
                </h1>

                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
                  Please enter your Telegram username to continue.
                </p>

                <form onSubmit={handleUsernameSubmit} className="max-w-md mx-auto space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Enter your Telegram username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                      className="text-center text-lg py-6"
                      autoFocus
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        className="text-red-500 text-sm"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.div
                    variants={buttonVariants}
                    initial="initial"
                    whileTap={!isLoading && username.trim() ? "tap" : undefined}
                  >
                    <Button
                      type="submit"
                      disabled={!username.trim() || isLoading}
                      className="w-full py-6 text-lg"
                    >
                      {isLoading ? (
                        <LoadingSpinner text="Finding your account..." />
                      ) : (
                        "Continue"
                      )}
                    </Button>
                  </motion.div>
                </form>
              </motion.div>
            )}

            {step === "twofa" && (
              <motion.div
                key="twofa-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="max-w-md mx-auto"
              >
                <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-4">
                  Enter 2FA Code
                </h1>

                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
                  We&apos;ve sent a 6-digit code to your Telegram. Please enter it below.
                </p>

                <form onSubmit={handleTwoFaSubmit} className="max-w-md mx-auto space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="000000"
                      value={twoFaCode}
                      onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      disabled={isLoading}
                      className="text-center text-2xl font-mono tracking-widest py-6"
                      maxLength={6}
                      autoFocus
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        className="text-red-500 text-sm"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-2">
                    <motion.div
                      variants={buttonVariants}
                      initial="initial"
                      whileTap="tap"
                      className="flex-1"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        disabled={isLoading}
                        className="w-full py-6"
                      >
                        Back
                      </Button>
                    </motion.div>

                    <motion.div
                      variants={buttonVariants}
                      initial="initial"
                      whileTap={!isLoading && twoFaCode.length === 6 ? "tap" : undefined}
                      className="flex-1"
                    >
                      <Button
                        type="submit"
                        disabled={twoFaCode.length !== 6 || isLoading}
                        className="w-full py-6 text-lg"
                      >
                        {isLoading ? (
                          <LoadingSpinner text="Verifying..." />
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
