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
import { TbRocket, TbSparkles } from "react-icons/tb";
import Link from "next/link";
import { TbPalette } from "react-icons/tb";
import Footer from "@/components/footer";

export default function About() {
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
            About Kowalski
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Kowalski is an open-source, feature-rich Telegram bot built with modern web technologies.
            From AI-powered conversations to video downloads, user management, and community features —
            it&apos;s designed to enhance your Telegram experience while respecting your privacy.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button size="lg" className="min-w-32" asChild>
              <Link href="https://github.com/abocn/TelegramBot" target="_blank">
                <SiGithub />
                View Source Code
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="min-w-32" asChild>
              <Link href="https://p0ntus.com/services/hosting" target="_blank">
                <TbRocket />
                Deploy free with p0ntus
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="min-w-32" asChild>
              <Link href="https://t.me/KowalskiNodeBot" target="_blank">
                <RiTelegram2Line />
                Try on Telegram
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Architecture</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We&apos;ve built Kowalski with modern technologies and best practices for reliability and maintainability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 text-blue-500">
                  <Code className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">The Stack</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Kowalski is built completely in TypeScript with Node.js and Telegraf.
                The web interface uses Next.js with Tailwind CSS, while data persistence is handled by PostgreSQL with Drizzle ORM.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <SiTypescript className="w-5 h-5 mx-3 text-blue-500" />
                  <div>
                    <div className="font-medium">TypeScript + Node.js</div>
                    <div className="text-sm text-muted-foreground">A solid, type-safe backend w/ Telegraf</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <SiNextdotjs className="w-5 h-5 mx-3 text-blue-500" />
                  <div>
                    <div className="font-medium">Next.js WebUI</div>
                    <div className="text-sm text-muted-foreground">Modern, responsive admin and user panel</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <SiPostgresql className="w-5 h-5 mx-3 text-blue-500" />
                  <div>
                    <div className="font-medium">PostgreSQL + Drizzle ORM</div>
                    <div className="text-sm text-muted-foreground">Reliable data persistence</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10 text-green-500">
                  <SiDocker className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">Deployment</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Kowalski is built to be deployed anywhere, and has been tested on multiple platforms.
                We prioritize support for Docker and Bun for easy deployment.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <SiDocker className="w-5 h-5 mx-3 text-green-500" />
                  <div>
                    <div className="font-medium">Docker Support</div>
                    <div className="text-sm text-muted-foreground">Easy containerized deployment w/ Docker Compose</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <SiBun className="w-5 h-5 mx-3 text-green-500" />
                  <div>
                    <div className="font-medium">Bun</div>
                    <div className="text-sm text-muted-foreground">A fast JavaScript runtime for best performance</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Layers className="w-5 h-5 mx-3 text-green-500" />
                  <div>                                  {/* some ppl probably don't know what af means :( */}
                    <div className="font-medium">Modular AF</div>
                    <div className="text-sm text-muted-foreground">We make it easy to extend and modify Kowalski</div>
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
            <h2 className="text-4xl font-bold mb-4">AI Integrations</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Kowalski has support for 50+ AI models, with customizable
              options for users and admins through its Ollama backend.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10 text-purple-500">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">Vast Model Support</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Kowalski has built-in support for 50+ models, both thinking and non-thinking. We have
                good Markdown parsing and customizable options for both users and admins.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <TbSparkles className="w-5 h-5 mx-3 text-purple-500" />
                  <div>
                    <div className="font-medium">/ask - Quick Responses</div>
                    <div className="text-sm text-muted-foreground">Fast answers using smaller non-thinking models</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Brain className="w-5 h-5 mx-3 text-purple-500" />
                  <div>
                    <div className="font-medium">/think - Deep Reasoning</div>
                    <div className="text-sm text-muted-foreground">Advanced thinking models with togglable reasoning visibility</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Bot className="w-5 h-5 mx-3 text-purple-500" />
                  <div>
                    <div className="font-medium">/ai - Your Custom Model!</div>
                    <div className="text-sm text-muted-foreground">Users can configure and use their favorite model</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-500/10 text-orange-500">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">Kowalski&apos;s <span className="italic">Powerful</span></h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                We have amazing Markdown V2 parsing, queue management, and usage statistics tracking.
                It&apos;s hella private, too. AI is disabled by default for a good user and admin experience.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Network className="w-5 h-5 mx-3 text-orange-500" />
                  <div>
                    <div className="font-medium">Streaming</div>
                    <div className="text-sm text-muted-foreground">Real-time streaming and parsing of messages during generation</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <BarChart3 className="w-5 h-5 mx-3 text-orange-500" />
                  <div>
                    <div className="font-medium">Usage Stats</div>
                    <div className="text-sm text-muted-foreground">Track your AI requests and usage with /aistats</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <UserCheck className="w-5 h-5 mx-3 text-orange-500" />
                  <div>
                    <div className="font-medium">Queues</div>
                    <div className="text-sm text-muted-foreground">High usage limits with intelligent request queuing</div>
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
            <h2 className="text-4xl font-bold mb-4">We&apos;re User-First</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Kowalski has privacy-focused user management with customizable settings,
              multilingual support, and transparent data handling.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">Privacy</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                User data is minimized and linked only by Telegram ID. No personal information
                is shared with third parties, and users maintain full control over their data
                with easy account deletion options.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Shield className="w-5 h-5 mx-3 text-emerald-500" />
                  <div>
                    <div className="font-medium">Limited Data Collection</div>
                    <div className="text-sm text-muted-foreground">Only essential data is stored, linked by Telegram ID</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <FileText className="w-5 h-5 mx-3 text-emerald-500" />
                  <div>
                    <div className="font-medium">Transparent Policies</div>
                    <div className="text-sm text-muted-foreground">Clear privacy policy accessible via /privacy</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Trash2 className="w-5 h-5 mx-3 text-emerald-500" />
                  <div>
                    <div className="font-medium">Easy Account Deletion</div>
                    <div className="text-sm text-muted-foreground">You can delete your data at any time</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 text-blue-500">
                  <TbPalette className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">Customization</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Personalize your experience with our extensive suite of custom AI
                preferences and detailed usage statistics.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Bot className="w-5 h-5 mx-3 text-blue-500" />
                  <div>
                    <div className="font-medium">AI Preferences</div>
                    <div className="text-sm text-muted-foreground">Choose from 50+ models, with the chance to configure your system prompt and temperature</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Languages className="w-5 h-5 mx-3 text-blue-500" />
                  <div>
                    <div className="font-medium">Multilingual Support</div>
                    <div className="text-sm text-muted-foreground">English and Portuguese language options</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <BarChart3 className="w-5 h-5 mx-3 text-blue-500" />
                  <div>
                    <div className="font-medium">Usage Analytics</div>
                    <div className="text-sm text-muted-foreground">Personal statistics and usage tracking</div>
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
            <h2 className="text-4xl font-bold mb-4">There&apos;s <span className="text-5xl">WAYYYYY</span> more!</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Kowalski has a ton of entertainment, utility, fun, configuration, and information
              commands.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10 text-red-500">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold">Media Downloads</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Download videos from YouTube and 1000s of other platforms using yt-dlp.
                Featuring automatic size checking for Telegram&apos;.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Tv className="w-4 h-4 text-red-500" />
                  <span>/yt [URL] - Video downloads</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-red-500" />
                  <span>Automatic size limit handling</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold">Information & Utilities</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Access real-world information like weather reports, device specifications,
                HTTP status codes, and a Last.fm music integration.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CloudSun className="w-4 h-4 text-blue-500" />
                  <span>/weather - Weather reports</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Smartphone className="w-4 h-4 text-blue-500" />
                  <span>/device - GSMArena specs</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Headphones className="w-4 h-4 text-blue-500" />
                  <span>/last - Last.fm integration</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10 text-green-500">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold">Entertainment</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Interactive emojis, random animal pictures, My Little Pony,
                and fun commands to engage you and your community.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Dices className="w-4 h-4 text-green-500" />
                  <span>/dice, /slot - Interactive games</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Cat className="w-4 h-4 text-green-500" />
                  <span>/cat, /dog - Random animals</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Music className="w-4 h-4 text-green-500" />
                  <span>/mlp - My Little Pony DB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Community</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Kowalski is built by developers, for developers. We use open licenses and
              take input from our development communities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10 text-purple-500">
                  <SiGithub className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">Open Development</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Kowalski is licensed under BSD-3-Clause with components under Unlicense. Our
                codebase is available on our GitHub, with lots of documentation.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <SiGithub className="w-5 h-5 mx-3 text-purple-500" />
                  <div>
                    <div className="font-medium">Public Code</div>
                    <div className="text-sm text-muted-foreground">Feel free to contribute or review our code</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <FileText className="w-5 h-5 mx-3 text-purple-500" />
                  <div>
                    <div className="font-medium">Documentation</div>
                    <div className="text-sm text-muted-foreground">We have documentation to help contributors, users, and admins</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <Users className="w-5 h-5 mx-3 text-purple-500" />
                  <div>
                    <div className="font-medium">Contributor Friendly</div>
                    <div className="text-sm text-muted-foreground">Our communities are welcoming to new contributors</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-orange-500/10 text-orange-500">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold">Community Centric</h3>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                Kowalski was created by Lucas Gabriel (lucmsilva). It is now also maintained by ihatenodejs,
                givfnz2, and other contributors. Thank you to all of our contributors!
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <MessageSquare className="w-5 h-5 mx-3 text-orange-500" />
                  <div>
                    <div className="font-medium">Active Maintenance</div>
                    <div className="text-sm text-muted-foreground">Regular updates and fixes w/ room for input and feedback</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Code className="w-5 h-5 mx-3 text-orange-500" />
                  <div>
                    <div className="font-medium">Quality Code</div>
                    <div className="text-sm text-muted-foreground">We use TypeScript, linting, and modern standards</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                  <Sparkles className="w-5 h-5 mx-3 text-orange-500" />
                  <div>
                    <div className="font-medium">Focus on New Features</div>
                    <div className="text-sm text-muted-foreground">We are always looking for new features to add</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-4 md:gap-10 p-6 rounded-lg bg-muted/50 border">
              <span className="font-medium">Ready to contribute?</span>
              <Button asChild>
                <Link href="https://github.com/abocn/TelegramBot" target="_blank">
                  <SiGithub />
                  View on GitHub
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
