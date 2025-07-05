"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User,
  Bot,
  Brain,
  Settings,
  CloudSun,
  Smartphone,
  Heart,
  Cat,
  Dices,
  Thermometer,
  BarChart3,
  LogOut,
  Edit3,
  Save,
  X,
  Network,
  Cpu,
  Languages,
  Bug,
  Lightbulb,
  ExternalLink,
  Quote,
  Info,
  Shuffle,
  Rainbow,
  Database,
  Hash,
  Download,
  Archive
} from "lucide-react";
import { RiTelegram2Line } from "react-icons/ri";
import { motion } from "framer-motion";
import { ModelPicker } from "@/components/account/model-picker";
import { useAuth } from "@/contexts/auth-context";
import { FaLastfm } from "react-icons/fa";
import { TiInfinity } from "react-icons/ti";

interface CommandCard {
  id: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  commands: string[];
  category: "ai" | "entertainment" | "utility" | "media" | "admin" | "animals";
  gradient: string;
  enabled: boolean;
}

const allCommands: CommandCard[] = [
  {
    id: "ai-ask-think",
    icon: Brain,
    title: "AI Chats",
    description: "Chat with AI models and use deep thinking",
    commands: ["/ask", "/think"],
    category: "ai",
    gradient: "from-purple-500 to-pink-500",
    enabled: true
  },
  {
    id: "ai-custom",
    icon: Bot,
    title: "Custom AI Model",
    description: "Use your personally configured AI model",
    commands: ["/ai"],
    category: "ai",
    gradient: "from-indigo-500 to-purple-500",
    enabled: true
  },
  {
    id: "ai-stats",
    icon: BarChart3,
    title: "AI Statistics",
    description: "View your AI usage statistics",
    commands: ["/aistats"],
    category: "ai",
    gradient: "from-purple-600 to-indigo-600",
    enabled: true
  },
  {
    id: "games-dice",
    icon: Dices,
    title: "Interactive Emojis",
    description: "Roll dice, play slots, and other interactive emojis",
    commands: ["/dice", "/slot", "/ball", "/dart", "/bowling"],
    category: "entertainment",
    gradient: "from-green-500 to-teal-500",
    enabled: true
  },
  {
    id: "fun-random",
    icon: Shuffle,
    title: "Fun Commands",
    description: "Random numbers and fun responses",
    commands: ["/random", "/furry", "/gay"],
    category: "entertainment",
    gradient: "from-pink-500 to-rose-500",
    enabled: true
  },
  {
    id: "infinite-dice",
    icon: TiInfinity,
    title: "Infinite Dice",
    description: "Sends an infinite dice sticker",
    commands: ["/idice"],
    category: "entertainment",
    gradient: "from-yellow-500 to-orange-500",
    enabled: true
  },
  {
    id: "animals-basic",
    icon: Cat,
    title: "Animal Pictures",
    description: "Get random cute animal pictures",
    commands: ["/cat", "/dog", "/duck", "/fox"],
    category: "animals",
    gradient: "from-orange-500 to-red-500",
    enabled: true
  },
  {
    id: "soggy-cat",
    icon: Heart,
    title: "Soggy Cat",
    description: "Wet cats!",
    commands: ["/soggy", "/soggycat"],
    category: "animals",
    gradient: "from-blue-500 to-purple-500",
    enabled: true
  },
  {
    id: "weather",
    icon: CloudSun,
    title: "Weather",
    description: "Get current weather for any location",
    commands: ["/weather", "/clima"],
    category: "utility",
    gradient: "from-blue-500 to-cyan-500",
    enabled: true
  },
  {
    id: "device-specs",
    icon: Smartphone,
    title: "Device Specifications",
    description: "Look up phone specifications via GSMArena",
    commands: ["/device", "/d"],
    category: "utility",
    gradient: "from-slate-500 to-gray-500",
    enabled: true
  },
  {
    id: "http-status",
    icon: Network,
    title: "HTTP Status Codes",
    description: "Look up HTTP status codes and meanings",
    commands: ["/http", "/httpcat"],
    category: "utility",
    gradient: "from-emerald-500 to-green-500",
    enabled: true
  },
  {
    id: "codename-lookup",
    icon: Hash,
    title: "Codename Lookup",
    description: "Look up codenames and meanings",
    commands: ["/codename", "/whatis"],
    category: "utility",
    gradient: "from-teal-500 to-cyan-500",
    enabled: true
  },
  {
    id: "info-commands",
    icon: Info,
    title: "Information",
    description: "Get chat and user information",
    commands: ["/chatinfo", "/userinfo"],
    category: "utility",
    gradient: "from-indigo-500 to-blue-500",
    enabled: true
  },
  {
    id: "quotes",
    icon: Quote,
    title: "Random Quotes",
    description: "Get random quotes",
    commands: ["/quote"],
    category: "utility",
    gradient: "from-amber-500 to-yellow-500",
    enabled: true
  },
  {
    id: "youtube-download",
    icon: Download,
    title: "Video Downloads",
    description: "Download videos from YouTube and 1000+ platforms",
    commands: ["/yt", "/ytdl", "/video", "/dl"],
    category: "media",
    gradient: "from-red-500 to-pink-500",
    enabled: true
  },
  {
    id: "lastfm",
    icon: FaLastfm,
    title: "Last.fm Integration",
    description: "Connect your music listening history",
    commands: ["/last", "/lfm", "/setuser"],
    category: "media",
    gradient: "from-violet-500 to-purple-500",
    enabled: true
  },
  {
    id: "mlp-content",
    icon: Database,
    title: "MLP Database",
    description: "My Little Pony content and information",
    commands: ["/mlp", "/mlpchar", "/mlpep", "/mlpcomic"],
    category: "media",
    gradient: "from-fuchsia-500 to-pink-500",
    enabled: true
  },
  {
    id: "modarchive",
    icon: Archive,
    title: "Mod Archive",
    description: "Access classic tracker music files",
    commands: ["/modarchive", "/tma"],
    category: "media",
    gradient: "from-cyan-500 to-blue-500",
    enabled: true
  },
  {
    id: "random-pony",
    icon: Rainbow,
    title: "Random Pony Art",
    description: "Get random My Little Pony artwork",
    commands: ["/rpony", "/randompony", "/mlpart"],
    category: "media",
    gradient: "from-pink-500 to-purple-500",
    enabled: true
  },
];

const categoryColors = {
  ai: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800",
  entertainment: "bg-green-500/10 text-green-600 border-green-200 dark:border-green-800",
  utility: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800",
  media: "bg-red-500/10 text-red-600 border-red-200 dark:border-red-800",
  admin: "bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800",
  animals: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800"
};

const languageOptions = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
];

export default function AccountPage() {
  const [editingTemp, setEditingTemp] = useState(false);
  const [tempValue, setTempValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [reportTab, setReportTab] = useState("bug");
  const [commands, setCommands] = useState<CommandCard[]>(allCommands);

  const { user, loading, logout, refreshUser } = useAuth();

  useEffect(() => {
    if (user) {
      setTempValue(user.aiTemperature.toString());
      setCommands(allCommands.map(cmd => ({
        ...cmd,
        enabled: !user.disabledCommands.includes(cmd.id)
      })));
    }
  }, [user]);

  const updateSetting = async (setting: string, value: boolean | number | string) => {
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [setting]: value }),
        credentials: 'include'
      });

      if (response.ok) {
        await refreshUser();
      }
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const saveTemperature = () => {
    const temp = parseFloat(tempValue);
    if (temp >= 0.1 && temp <= 2.0) {
      updateSetting('aiTemperature', temp);
      setEditingTemp(false);
    }
  };

  const toggleCommand = async (commandId: string) => {
    if (!user) return;

    const commandToToggle = commands.find(cmd => cmd.id === commandId);
    if (!commandToToggle) return;

    const newEnabledState = !commandToToggle.enabled;

    setCommands(prev => prev.map(cmd =>
      cmd.id === commandId ? { ...cmd, enabled: newEnabledState } : cmd
    ));

    try {
      let newDisabledCommands: string[];

      if (newEnabledState) {
        newDisabledCommands = user.disabledCommands.filter(id => id !== commandId);
      } else {
        newDisabledCommands = [...user.disabledCommands, commandId];
      }

      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ disabledCommands: newDisabledCommands }),
        credentials: 'include'
      });

      if (response.ok) {
        await refreshUser();
      } else {
        setCommands(prev => prev.map(cmd =>
          cmd.id === commandId ? { ...cmd, enabled: !newEnabledState } : cmd
        ));
        console.error('Failed to update command state');
      }
    } catch (error) {
      setCommands(prev => prev.map(cmd =>
        cmd.id === commandId ? { ...cmd, enabled: !newEnabledState } : cmd
      ));
      console.error('Error updating command state:', error);
    }
  };

  const filteredCommands = selectedCategory
    ? commands.filter(cmd => cmd.category === selectedCategory)
    : commands;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center hidden md:flex">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.firstName}!</h1>
            <p className="text-muted-foreground">@{user.username}</p>
          </div>
        </div>
        <Button variant="outline" onClick={logout} className="gap-2">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          className="p-6 rounded-lg border bg-gradient-to-br from-purple-500/10 to-pink-500/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            <h3 className="text-xl font-semibold">AI Usage</h3>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold">{user.aiRequests}</p>
            <p className="text-sm text-muted-foreground">Total AI Requests</p>
            <p className="text-lg">{user.aiCharacters.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Characters Generated</p>
          </div>
        </motion.div>

        <motion.div
          className="p-6 rounded-lg border bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-8 h-8 text-blue-600" />
            <h3 className="text-xl font-semibold">AI Settings</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">AI Enabled</span>
              <Button
                size="sm"
                variant={user.aiEnabled ? "default" : "outline"}
                onClick={() => updateSetting('aiEnabled', !user.aiEnabled)}
                className="h-8 px-3"
              >
                {user.aiEnabled ? "ON" : "OFF"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Show Thinking</span>
              <Button
                size="sm"
                variant={user.showThinking ? "default" : "outline"}
                onClick={() => updateSetting('showThinking', !user.showThinking)}
                className="h-8 px-3"
              >
                {user.showThinking ? "ON" : "OFF"}
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="p-6 rounded-lg border bg-gradient-to-br from-green-500/10 to-emerald-500/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Thermometer className="w-8 h-8 text-green-600" />
            <h3 className="text-xl font-semibold">Temperature</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {editingTemp ? (
                <>
                  <Input
                    type="number"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="h-8 w-20"
                  />
                  <Button size="sm" onClick={saveTemperature} className="h-8 w-8 p-0">
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingTemp(false)} className="h-8 w-8 p-0">
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-2xl font-bold">{user.aiTemperature}</span>
                  <Button size="sm" variant="outline" onClick={() => setEditingTemp(true)} className="h-8 w-8 p-0">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Controls randomness in AI responses. Lower values (0.1-0.5) = more focused, higher values (0.7-2.0) = more creative.</p>
          </div>
        </motion.div>

        <motion.div
          className="p-6 rounded-lg border bg-gradient-to-br from-teal-500/10 to-cyan-500/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Languages className="w-8 h-8 text-teal-600" />
            <h3 className="text-xl font-semibold">Language Options</h3>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              {languageOptions.map((lang) => (
                <Button
                  key={lang.code}
                  variant={user.languageCode === lang.code ? "default" : "outline"}
                  onClick={() => updateSetting('languageCode', lang.code)}
                  className="justify-start gap-3 h-10"
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Choose your preferred language for bot responses and interface text.</p>
          </div>
        </motion.div>

        <motion.div
          className="p-6 rounded-lg border bg-gradient-to-br from-indigo-500/10 to-violet-500/10 col-span-1 md:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-8 h-8 text-indigo-600" />
            <h3 className="text-xl font-semibold">My Model</h3>
          </div>
          <div className="space-y-3">
            <ModelPicker
              value={user.customAiModel}
              onValueChange={(newModel) => updateSetting('customAiModel', newModel)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Your selected AI model for custom /ai commands. Different models have varying capabilities, speeds, and response styles.</p>
          </div>
        </motion.div>

        <motion.div
          className="p-6 rounded-lg border bg-gradient-to-br from-orange-500/10 to-red-500/10 col-span-1 md:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Bug className="w-8 h-8 text-orange-600" />
            <h3 className="text-xl font-semibold">Report An Issue</h3>
          </div>
          <div className="space-y-4">
            <Tabs value={reportTab} onValueChange={setReportTab}>
              <TabsList className="grid w-full grid-cols-2 gap-2">
                <TabsTrigger value="bug" className="gap-2">
                  <Bug className="w-4 h-4" />
                  Bug Report
                </TabsTrigger>
                <TabsTrigger value="feature" className="gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Feature Request
                </TabsTrigger>
              </TabsList>
              <div className="mt-4">
                <TabsContent value="bug" className="space-y-12">
                  <p className="text-sm text-muted-foreground">Found a bug or issue? Report it to help us improve Kowalski.</p>
                  <Button asChild className="w-full gap-2">
                    <a
                      href="https://libre-cloud.atlassian.net/jira/software/c/form/4a535b59-dc7e-4b55-b905-a79ff831928e?atlOrigin=eyJpIjoiNzQwYTcxZDdmMjJkNDljNzgzNTY2MjliYjliMjMzMDkiLCJwIjoiaiJ9"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Bug className="w-4 h-4" />
                      Report Bug
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </TabsContent>
                <TabsContent value="feature" className="space-y-12">
                  <p className="text-sm text-muted-foreground">Have an idea for a new feature? Let us know what you&apos;d like to see!</p>
                  <Button asChild className="w-full gap-2">
                    <a
                      href="https://libre-cloud.atlassian.net/jira/software/c/form/5ce1e6e9-9618-4b46-94ee-122e7bde2ba1?atlOrigin=eyJpIjoiZjMwZTc3MDVlY2MwNDBjODliYWNhMTgzN2ZjYzI5MDAiLCJwIjoiaiJ9"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Lightbulb className="w-4 h-4" />
                      Request Feature
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </motion.div>

      </div>

      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      >
        <h2 className="text-2xl font-bold mb-4">Command Management</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="mb-2"
          >
            All Commands
          </Button>
          {Object.entries(categoryColors).map(([category, colorClass]) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={`mb-2 capitalize ${selectedCategory === category ? '' : colorClass}`}
            >
              {category === "ai" ? "AI" : category}
            </Button>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      >
        {filteredCommands.map((command) => (
          <div
            key={command.id}
            className={`p-4 rounded-lg border transition-all duration-200 ${
              command.enabled
                ? 'bg-card hover:shadow-md shadow-sm'
                : 'bg-muted/30 border-muted-foreground/20'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${command.gradient} flex items-center justify-center ${
                command.enabled ? '' : 'grayscale opacity-50'
              }`}>
                <command.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-11 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
                    command.enabled
                      ? 'bg-green-500 dark:bg-green-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  onClick={() => toggleCommand(command.id)}
                >
                  <div className={`w-5 h-5 rounded-full shadow-sm transition-transform duration-200 ${
                    command.enabled
                      ? 'translate-x-5 bg-white dark:bg-gray-100'
                      : 'translate-x-0.5 bg-white dark:bg-gray-200'
                  } mt-0.5`} />
                </div>
              </div>
            </div>

            <h3 className={`text-base font-semibold mb-2 ${command.enabled ? '' : 'text-muted-foreground'}`}>
              {command.title}
            </h3>
            <p className={`text-sm mb-3 ${command.enabled ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
              {command.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {command.commands.slice(0, 2).map((cmd, idx) => (
                  <code key={idx} className={`px-1.5 py-0.5 rounded text-xs ${
                    command.enabled
                      ? 'bg-muted text-foreground'
                      : 'bg-muted-foreground/10 text-muted-foreground/60'
                  }`}>
                    {cmd}
                  </code>
                ))}
                {command.commands.length > 2 && (
                  <span className={`text-xs ${command.enabled ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                    +{command.commands.length - 2}
                  </span>
                )}
              </div>
              <div className={`px-2 py-1 rounded-full text-xs border ${
                command.enabled
                  ? categoryColors[command.category]
                  : 'bg-muted-foreground/10 text-muted-foreground/60 border-muted-foreground/20'
              }`}>
                {command.category === "ai" ? "AI" : command.category}
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div
        className="mt-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 1.0 }}
      >
        <div className="inline-flex items-center gap-16 p-6 px-8 rounded-lg bg-muted/50 border">
          <span className="font-medium">Ready to start using Kowalski?</span>
          <Button asChild>
            <a href="https://t.me/KowalskiNodeBot" target="_blank" rel="noopener noreferrer">
              <RiTelegram2Line />
              Open on Telegram
            </a>
          </Button>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
