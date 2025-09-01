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
import { SiYoutube, SiGithub } from "react-icons/si";
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
        <div className="sm:max-w-4xl mx-auto space-y-8">
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
            {t('home.heroTitle')}
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("description")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button size="lg" className="min-w-32" asChild>
              <Link href="https://t.me/KowalskiNodeBot" target="_blank" rel="noopener noreferrer">
                <RiTelegram2Line />
                {t('home.tryOnTelegram')}
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="min-w-32" asChild>
              <Link href="https://docs.kowalski.social" target="_blank" rel="noopener noreferrer">
                <Settings />
                {t('home.documentation')}
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="min-w-32" asChild>
              <Link href="https://github.com/abocn/TelegramBot" target="_blank" rel="noopener noreferrer">
                <SiGithub />
                {t('home.viewOnGitHub')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16" id="ai-features">
            <h2 className="text-4xl font-bold mb-4">{t('home.featuresTitle')}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('home.featuresSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">{t('home.aiCommands')}</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {t('home.aiCommandsDescription')}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Bot className="w-5 h-5 mx-3 text-primary" />
                  <div>
                    <div className="font-medium">/ai</div>
                    <div className="text-sm text-muted-foreground">{t('home.aiCustomDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Zap className="w-5 h-5 mx-3 text-primary" />
                  <div>
                    <div className="font-medium">/ask</div>
                    <div className="text-sm text-muted-foreground">{t('home.askDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Brain className="w-5 h-5 mx-3 text-primary" />
                  <div>
                    <div className="font-medium">/think</div>
                    <div className="text-sm text-muted-foreground">{t('home.thinkDescription')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3" id="youtube-features">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-red-500/10 text-red-500">
                  <SiYoutube className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">{t('home.youtubeDownloads')}</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {t('home.youtubeDescription')}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Download className="w-5 h-5 mx-3 text-red-500" />
                  <div>
                    <div className="font-medium">/yt [URL]</div>
                    <div className="text-sm text-muted-foreground">{t('home.ytDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Shield className="w-5 h-5 mx-3 text-red-500" />
                  <div>
                    <div className="font-medium">{t('home.ratelimitTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('home.ratelimitDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Tv className="w-5 h-5 mx-3 text-red-500" />
                  <div>
                    <div className="font-medium">{t('home.qualityTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('home.qualityDescription')}</div>
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
              {t('home.controlAndFun')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('home.controlDescription')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 text-blue-500">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">{t('home.userAccounts')}</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {t('home.userAccountsDescription')}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Settings className="w-5 h-5 mx-3 text-blue-500" />
                  <div>
                    <div className="font-medium">{t('home.personalSettingsTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('home.personalSettingsDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Brain className="w-5 h-5 mx-3 text-blue-500" />
                  <div>
                    <div className="font-medium">{t('home.accountStatisticsTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('home.accountStatisticsDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Trash className="w-5 h-5 mx-3 text-blue-500" />
                  <div>
                    <div className="font-medium">{t('home.leaveAnytimeTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('home.leaveAnytimeDescription')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10 text-green-500">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">{t('home.webInterface')}</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {t('home.webInterfaceDescription')}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <TbEyeSpark className="w-5 h-5 mx-3 text-green-500" />
                  <div>
                    <div className="font-medium">{t('home.cleanInterfaceTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('home.cleanInterfaceDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Sparkles className="w-5 h-5 mx-3 text-green-500" />
                  <div>
                    <div className="font-medium">{t('home.doEverythingTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('home.doEverythingDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Lock className="w-5 h-5 mx-3 text-green-500" />
                  <div>
                    <div className="font-medium">{t('home.privateTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('home.privateDescription')}</div>
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
