"use client";

import { Button } from "@/components/ui/button"
import {
  Sparkles,
  Users,
  Download,
  Brain,
  Shield,
  Zap,
  Tv,
  Heart,
  Code,
  Globe,
  MessageSquare,
  Layers,
  Network,
  Lock,
  UserCheck,
  BarChart3,
  Languages,
  Trash2,
  FileText,
  Headphones,
  CloudSun,
  Smartphone,
  Dices,
  Cat,
  Music,
  Bot
} from "lucide-react";
import { SiTypescript, SiPostgresql, SiDocker, SiNextdotjs, SiBun, SiGithub } from "react-icons/si";
import { RiTelegram2Line } from "react-icons/ri";
import { BsInfoLg } from "react-icons/bs";
import { TbSparkles } from "react-icons/tb";
import Link from "next/link";
import { TbPalette } from "react-icons/tb";
import Footer from "@/components/footer";
import { useTranslation } from "react-i18next";

export default function About() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col min-h-screen">
      <section className="flex flex-col items-center justify-center py-24 px-6 text-center bg-gradient-to-br from-background to-muted">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 p-4">
              <BsInfoLg className="w-10 h-10" />
            </div>
          </div>
          <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('about.title')}
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('about.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button size="lg" className="min-w-32" asChild>
              <Link href="https://github.com/abocn/TelegramBot" target="_blank">
                <SiGithub />
                {t('about.viewSourceCode')}
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="min-w-32" asChild>
              <Link href="https://t.me/KowalskiNodeBot" target="_blank">
                <RiTelegram2Line />
                {t('about.tryOnTelegram')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t('about.architecture')}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('about.architectureDescription')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 text-blue-500">
                  <Code className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">{t('about.theStack')}</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {t('about.theStackDescription')}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <SiTypescript className="w-5 h-5 mx-3 text-blue-500" />
                  <div>
                    <div className="font-medium">{t('about.typescriptNodeTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.typescriptNodeDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <SiNextdotjs className="w-5 h-5 mx-3 text-blue-500" />
                  <div>
                    <div className="font-medium">{t('about.nextjsTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.nextjsDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <SiPostgresql className="w-5 h-5 mx-3 text-blue-500" />
                  <div>
                    <div className="font-medium">{t('about.postgresqlTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.postgresqlDescription')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10 text-green-500">
                  <SiDocker className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">{t('about.deployment')}</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {t('about.deploymentDescription')}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <SiDocker className="w-5 h-5 mx-3 text-green-500" />
                  <div>
                    <div className="font-medium">{t('about.dockerTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.dockerDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <SiBun className="w-5 h-5 mx-3 text-green-500" />
                  <div>
                    <div className="font-medium">{t('about.bunTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.bunDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Layers className="w-5 h-5 mx-3 text-green-500" />
                  <div>                                  {/* some ppl probably don't know what af means :( */}
                    <div className="font-medium">{t('about.modularTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.modularDescription')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t('about.aiIntegrations')}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('about.aiIntegrationsDescription')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10 text-purple-500">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">{t('about.vastModelSupport')}</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {t('about.vastModelSupportDescription')}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <TbSparkles className="w-5 h-5 mx-3 text-purple-500" />
                  <div>
                    <div className="font-medium">{t('about.askTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.askDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Brain className="w-5 h-5 mx-3 text-purple-500" />
                  <div>
                    <div className="font-medium">{t('about.thinkTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.thinkDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Bot className="w-5 h-5 mx-3 text-purple-500" />
                  <div>
                    <div className="font-medium">{t('about.aiCustomTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.aiCustomDescription')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-500/10 text-orange-500">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">{t('about.kowalskiPowerful')}</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {t('about.kowalskiPowerfulDescription')}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Network className="w-5 h-5 mx-3 text-orange-500" />
                  <div>
                    <div className="font-medium">{t('about.streamingTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.streamingDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <BarChart3 className="w-5 h-5 mx-3 text-orange-500" />
                  <div>
                    <div className="font-medium">{t('about.usageStatsTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.usageStatsDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <UserCheck className="w-5 h-5 mx-3 text-orange-500" />
                  <div>
                    <div className="font-medium">{t('about.queuesTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.queuesDescription')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t('about.userFirst')}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('about.userFirstDescription')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">{t('about.privacy')}</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {t('about.privacyDescription')}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Shield className="w-5 h-5 mx-3 text-emerald-500" />
                  <div>
                    <div className="font-medium">{t('about.limitedDataTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.limitedDataDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <FileText className="w-5 h-5 mx-3 text-emerald-500" />
                  <div>
                    <div className="font-medium">{t('about.transparentPoliciesTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.transparentPoliciesDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Trash2 className="w-5 h-5 mx-3 text-emerald-500" />
                  <div>
                    <div className="font-medium">{t('about.easyDeletionTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.easyDeletionDescription')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 text-blue-500">
                  <TbPalette className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">{t('about.customization')}</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {t('about.customizationDescription')}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Bot className="w-5 h-5 mx-3 text-blue-500" />
                  <div>
                    <div className="font-medium">{t('about.aiPreferencesTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.aiPreferencesDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Languages className="w-5 h-5 mx-3 text-blue-500" />
                  <div>
                    <div className="font-medium">{t('about.multilingualTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.multilingualDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <BarChart3 className="w-5 h-5 mx-3 text-blue-500" />
                  <div>
                    <div className="font-medium">{t('about.usageAnalyticsTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.usageAnalyticsDescription')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t('about.moreFeatures')}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('about.moreFeaturesDescription')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10 text-red-500">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold">{t('about.mediaDownloads')}</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t('about.mediaDownloadsDescription')}
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Tv className="w-4 h-4 text-red-500" />
                  <span>{t('about.ytCommand')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-red-500" />
                  <span>{t('about.sizeHandling')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold">{t('about.informationUtilities')}</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t('about.informationUtilitiesDescription')}
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CloudSun className="w-4 h-4 text-blue-500" />
                  <span>{t('about.weatherCommand')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Smartphone className="w-4 h-4 text-blue-500" />
                  <span>{t('about.deviceCommand')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Headphones className="w-4 h-4 text-blue-500" />
                  <span>{t('about.lastCommand')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10 text-green-500">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold">{t('about.entertainment')}</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t('about.entertainmentDescription')}
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Dices className="w-4 h-4 text-green-500" />
                  <span>{t('about.gameCommands')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Cat className="w-4 h-4 text-green-500" />
                  <span>{t('about.animalCommands')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Music className="w-4 h-4 text-green-500" />
                  <span>{t('about.mlpCommand')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t('about.community')}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('about.communityDescription')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10 text-purple-500">
                  <SiGithub className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">{t('about.openDevelopment')}</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {t('about.openDevelopmentDescription')}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <SiGithub className="w-5 h-5 mx-3 text-purple-500" />
                  <div>
                    <div className="font-medium">{t('about.publicCodeTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.publicCodeDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <FileText className="w-5 h-5 mx-3 text-purple-500" />
                  <div>
                    <div className="font-medium">{t('about.documentationTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.documentationDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Users className="w-5 h-5 mx-3 text-purple-500" />
                  <div>
                    <div className="font-medium">{t('about.contributorFriendlyTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.contributorFriendlyDescription')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-500/10 text-orange-500">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">{t('about.communityCentric')}</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {t('about.communityCentricDescription')}
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <MessageSquare className="w-5 h-5 mx-3 text-orange-500" />
                  <div>
                    <div className="font-medium">{t('about.activeMaintenanceTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.activeMaintenanceDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Code className="w-5 h-5 mx-3 text-orange-500" />
                  <div>
                    <div className="font-medium">{t('about.qualityCodeTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.qualityCodeDescription')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Sparkles className="w-5 h-5 mx-3 text-orange-500" />
                  <div>
                    <div className="font-medium">{t('about.newFeaturesTitle')}</div>
                    <div className="text-sm text-muted-foreground">{t('about.newFeaturesDescription')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-4 md:gap-10 p-6 rounded-lg bg-muted/50 border">
              <span className="font-medium">{t('about.readyToContribute')}</span>
              <Button asChild>
                <Link href="https://github.com/abocn/TelegramBot" target="_blank">
                  <SiGithub />
                  {t('about.viewOnGitHub')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
