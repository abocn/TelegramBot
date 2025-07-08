"use client";

import { Button } from "@/components/ui/button"
import {
  Bot,
  Sparkles,
  Users,
  Settings,
  Download,
  Brain,
  Shield,
  Zap,
  Tv,
  Trash,
  Lock,
} from "lucide-react";
import { SiYoutube, SiForgejo } from "react-icons/si";
import { RiTelegram2Line } from "react-icons/ri";
import { TbEyeSpark } from "react-icons/tb";
import Image from "next/image";
import Footer from "@/components/footer";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col">
      <section className="flex flex-col items-center justify-center py-24 px-6 text-center bg-gradient-to-br from-background to-muted">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 p-4">
              <Image
                src="/kowalski.svg"
                alt="Kowalski Logo"
                width={48}
                height={48}
                className="dark:invert -mt-3"
              />
            </div>
          </div>
          <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Kowalski
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("description")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button size="lg" className="min-w-32" asChild>
              <Link href="https://t.me/KowalskiNodeBot">
                <RiTelegram2Line />
                Try on Telegram
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="min-w-32">
              <Settings />
              Documentation
            </Button>
            <Button variant="outline" size="lg" className="min-w-32" asChild>
              <Link href="https://git.p0ntus.com/ABOCN/TelegramBot">
                <SiForgejo />
                View on Forgejo
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16" id="ai-features">
            <h2 className="text-4xl font-bold mb-4">Features You&apos;ll Love</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powered by TypeScript, Telegraf, Next.js, and AI.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">AI Commands</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Interact with over 50 AI models through simple commands. Get intelligent responses,
                assistance, or problem-solving help right in Telegram.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Bot className="w-5 h-5 mx-3 text-primary" />
                  <div>
                    <div className="font-medium">/ai</div>
                    <div className="text-sm text-muted-foreground">Ask questions to a custom AI model of your choice</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Zap className="w-5 h-5 mx-3 text-primary" />
                  <div>
                    <div className="font-medium">/ask</div>
                    <div className="text-sm text-muted-foreground">Quick AI responses for everyday questions</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Brain className="w-5 h-5 mx-3 text-primary" />
                  <div>
                    <div className="font-medium">/think</div>
                    <div className="text-sm text-muted-foreground">Deep reasoning with optional visible thinking</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3" id="youtube-features">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-500/10 text-red-500">
                  <SiYoutube className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">YouTube/Video Downloads</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Download videos directly from YouTube and other platforms and watch them in Telegram.
                Supports thousands of sites with integrated yt-dlp.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Download className="w-5 h-5 mx-3 text-red-500" />
                  <div>
                    <div className="font-medium">/yt [URL]</div>
                    <div className="text-sm text-muted-foreground">Quickly download videos up to 50MB</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Shield className="w-5 h-5 mx-3 text-red-500" />
                  <div>
                    <div className="font-medium">Automatic Ratelimit Detection</div>
                    <div className="text-sm text-muted-foreground">We&apos;ll notify you if something goes wrong</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Tv className="w-5 h-5 mx-3 text-red-500" />
                  <div>
                    <div className="font-medium">High Quality Downloads</div>
                    <div className="text-sm text-muted-foreground">Kowalski automatically chooses the best quality for you</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="user-features" className="py-24 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Control <span className="italic mr-1.5">and</span> Fun
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your user data is always minimized and under your control. That certainly
              doesn&apos;t mean the experience is lacking!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 text-blue-500">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">User Accounts</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Your user data is linked only by your Telegram ID. No data is ever sent to third parties
                or used for anything other than providing you with the best experience.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Settings className="w-5 h-5 mx-3 text-blue-500" />
                  <div>
                    <div className="font-medium">Personal Settings</div>
                    <div className="text-sm text-muted-foreground">Custom AI models, temperature, and language preferences</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Brain className="w-5 h-5 mx-3 text-blue-500" />
                  <div>
                    <div className="font-medium">Account Statistics</div>
                    <div className="text-sm text-muted-foreground">Track AI requests, characters processed, and more</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Trash className="w-5 h-5 mx-3 text-blue-500" />
                  <div>
                    <div className="font-medium">Leave at Any Time</div>
                    <div className="text-sm text-muted-foreground">We make it easy to delete your account at any time</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10 text-green-500">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">Web Interface</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Kowalski includes a web interface, made with Next.js, to make it easier to manage your
                bot, user account, and more. It&apos;s tailored to both users and admins.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <TbEyeSpark className="w-5 h-5 mx-3 text-green-500" />
                  <div>
                    <div className="font-medium">Everything&apos;s Clean</div>
                    <div className="text-sm text-muted-foreground">We don&apos;t clutter your view with ads or distractions.</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Sparkles className="w-5 h-5 mx-3 text-green-500" />
                  <div>
                    <div className="font-medium">Do Everything!</div>
                    <div className="text-sm text-muted-foreground">We aim to integrate every feature into the web interface.</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Lock className="w-5 h-5 mx-3 text-green-500" />
                  <div>
                    <div className="font-medium">Private</div>
                    <div className="text-sm text-muted-foreground">We don&apos;t use any analytics, tracking, or third-party scripts.</div>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
      </section>
      <Footer />
    </div>
  );
}
