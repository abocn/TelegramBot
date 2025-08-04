"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TimezoneCombobox } from '@/components/account/timezone-combobox';
import {
  User,
  Settings,
  BarChart3,
  LogOut,
  Edit3,
  Save,
  X,
  Cpu,
  Languages,
  Bug,
  Lightbulb,
  ExternalLink,
  Info,
  AlignLeft,
  Thermometer,
  Calendar,
  Clock
} from "lucide-react";
import { RiTelegram2Line } from "react-icons/ri";
import { motion } from "framer-motion";
import { ModelPicker } from "@/components/account/model-picker";
import { useAuth } from "@/contexts/auth-context";

const languageOptions = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
];

export default function AccountPage() {
  const [editingTemp, setEditingTemp] = useState(false);
  const [tempValue, setTempValue] = useState("");
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [promptValue, setPromptValue] = useState("");
  const [reportTab, setReportTab] = useState("bug");
  const [timezoneValue, setTimezoneValue] = useState("");

  const { user, loading, logout, refreshUser } = useAuth();

  useEffect(() => {
    if (user) {
      setTempValue(user.aiTemperature.toString());
      setPromptValue(user.customSystemPrompt || "");
      setTimezoneValue(user.timezone || "UTC");
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

  const savePrompt = () => {
    updateSetting('customSystemPrompt', promptValue);
    setEditingPrompt(false);
  };

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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-primary/10 items-center justify-center flex shrink-0">
            <User className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">Welcome back, {user.firstName}!</h1>
            <p className="text-muted-foreground text-sm sm:text-base truncate">@{user.username}</p>
          </div>
        </div>
        <Button variant="outline" onClick={logout} className="gap-2 cursor-pointer shrink-0 w-full sm:w-auto">
          <LogOut className="w-4 h-4" />
          <span className="sm:inline">Logout</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <motion.div
          className="p-4 sm:p-6 rounded-lg border bg-gradient-to-br from-purple-500/10 to-pink-500/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 shrink-0" />
            <h3 className="text-lg sm:text-xl font-semibold">AI Usage</h3>
          </div>
          <div className="space-y-2">
            <p className="text-xl sm:text-2xl font-bold">{user.aiRequests}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Total AI Requests</p>
            <p className="text-base sm:text-lg">{user.aiCharacters.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Characters Generated</p>
          </div>
        </motion.div>

        <motion.div
          className="p-4 sm:p-6 rounded-lg border bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 shrink-0" />
            <h3 className="text-lg sm:text-xl font-semibold">AI Settings</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm flex-1">AI Enabled</span>
              <Button
                size="sm"
                variant={user.aiEnabled ? "default" : "outline"}
                onClick={() => updateSetting('aiEnabled', !user.aiEnabled)}
                className="h-7 sm:h-8 px-2 sm:px-3 cursor-pointer text-xs sm:text-sm shrink-0"
              >
                {user.aiEnabled ? "ON" : "OFF"}
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm flex-1">Show Thinking</span>
              <Button
                size="sm"
                variant={user.showThinking ? "default" : "outline"}
                onClick={() => updateSetting('showThinking', !user.showThinking)}
                className="h-7 sm:h-8 px-2 sm:px-3 cursor-pointer text-xs sm:text-sm shrink-0"
              >
                {user.showThinking ? "ON" : "OFF"}
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="p-4 sm:p-6 rounded-lg border bg-gradient-to-br from-green-500/10 to-emerald-500/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Thermometer className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 shrink-0" />
            <h3 className="text-lg sm:text-xl font-semibold">Temperature</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {editingTemp ? (
                <>
                  <div className="flex flex-col sm:flex-row justify-between w-full gap-2">
                    <Input
                      type="number"
                      min="0.1"
                      max="2.0"
                      step="0.1"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="h-8 w-full sm:w-20"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" onClick={saveTemperature} className="h-8 w-8 p-0 cursor-pointer">
                        <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingTemp(false)} className="h-8 w-8 p-0 cursor-pointer">
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-row justify-between w-full items-center">
                    <span className="text-xl sm:text-2xl font-bold">{user.aiTemperature}</span>
                    <Button size="sm" variant="outline" onClick={() => setEditingTemp(true)} className="h-8 w-8 p-0 cursor-pointer">
                      <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">Controls randomness in AI responses. Lower values (0.1-0.5) = more focused, higher values (0.7-2.0) = more creative.</p>
          </div>
        </motion.div>

        <motion.div
          className="p-4 sm:p-6 rounded-lg border bg-gradient-to-br from-teal-500/10 to-cyan-500/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Languages className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600 shrink-0" />
            <h3 className="text-lg sm:text-xl font-semibold">Language Options</h3>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              {languageOptions.map((lang) => (
                <Button
                  key={lang.code}
                  variant={user.languageCode === lang.code ? "default" : "outline"}
                  onClick={() => updateSetting('languageCode', lang.code)}
                  className="justify-start gap-2 sm:gap-3 h-9 sm:h-10 cursor-pointer text-sm sm:text-base"
                >
                  <span className="text-base sm:text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">Choose your preferred language for bot responses and interface text.</p>
          </div>
        </motion.div>

        <motion.div
          className="p-4 sm:p-6 rounded-lg border bg-gradient-to-br from-indigo-500/10 to-violet-500/10 col-span-1 sm:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Cpu className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 shrink-0" />
            <h3 className="text-lg sm:text-xl font-semibold">My Model</h3>
          </div>
          <div className="space-y-3">
            <ModelPicker
              value={user.customAiModel}
              onValueChange={(newModel) => updateSetting('customAiModel', newModel)}
              className="w-full cursor-pointer"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">Your selected AI model for custom /ai commands. Different models have varying capabilities, speeds, and response styles.</p>
          </div>
        </motion.div>

        <motion.div
          className="p-4 sm:p-6 rounded-lg border bg-gradient-to-br from-orange-500/10 to-red-500/10 col-span-1 sm:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Bug className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 shrink-0" />
            <h3 className="text-lg sm:text-xl font-semibold">Report An Issue</h3>
          </div>
          <div className="space-y-4">
            <Tabs value={reportTab} onValueChange={setReportTab}>
              <TabsList className="grid w-full grid-cols-2 gap-1 sm:gap-2 h-9 sm:h-10">
                <TabsTrigger value="bug" className="gap-1 sm:gap-2 cursor-pointer text-xs sm:text-sm px-2 sm:px-3">
                  <Bug className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  <span className="hidden xs:inline sm:inline">Report Bug</span>
                  <span className="xs:hidden sm:hidden">Bug</span>
                </TabsTrigger>
                <TabsTrigger value="feature" className="gap-1 sm:gap-2 cursor-pointer text-xs sm:text-sm px-2 sm:px-3">
                  <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  <span className="hidden xs:inline sm:inline">Feature Request</span>
                  <span className="xs:hidden sm:hidden">Feature</span>
                </TabsTrigger>
              </TabsList>
              <div className="mt-3 sm:mt-4">
                <TabsContent value="bug" className="space-y-3 sm:space-y-4">
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Found a bug or issue? Report it to help us improve Kowalski.</p>
                  <Button asChild className="w-full gap-2 h-9 sm:h-10">
                    <a
                      href="https://libre-cloud.atlassian.net/jira/software/c/form/4a535b59-dc7e-4b55-b905-a79ff831928e?atlOrigin=eyJpIjoiNzQwYTcxZDdmMjJkNDljNzgzNTY2MjliYjliMjMzMDkiLCJwIjoiaiJ9"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Bug className="w-4 h-4" />
                      <span className="text-sm sm:text-base">Report Bug</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </TabsContent>
                <TabsContent value="feature" className="space-y-3 sm:space-y-4">
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Have an idea for a new feature? Let us know what you&apos;d like to see!</p>
                  <Button asChild className="w-full gap-2 h-9 sm:h-10">
                    <a
                      href="https://libre-cloud.atlassian.net/jira/software/c/form/5ce1e6e9-9618-4b46-94ee-122e7bde2ba1?atlOrigin=eyJpIjoiZjMwZTc3MDVlY2MwNDBjODliYWNhMTgzN2ZjYzI5MDAiLCJwIjoiaiJ9"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Lightbulb className="w-4 h-4" />
                      <span className="text-sm sm:text-base">Request Feature</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </motion.div>

        <motion.div
          className="p-4 sm:p-6 rounded-lg border bg-gradient-to-br from-purple-500/10 to-indigo-500/10 col-span-1 sm:col-span-2 lg:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.55 }}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <AlignLeft className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 shrink-0" />
            <h3 className="text-lg sm:text-xl font-semibold">System Prompt</h3>
          </div>
          <div className="space-y-3">
            {editingPrompt ? (
              <>
                <textarea
                  className="w-full h-32 sm:h-40 p-3 border rounded-md bg-background text-sm resize-none focus:ring-2 focus:ring-primary/20"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  maxLength={10000}
                  placeholder="Enter your custom system prompt..."
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button size="sm" onClick={savePrompt} className="gap-2 h-9">
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingPrompt(false)} className="h-9">
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-xs sm:text-sm whitespace-pre-wrap break-words max-h-32 sm:max-h-40 overflow-auto border p-3 rounded-md bg-muted/20 leading-relaxed">
                  {promptValue ? promptValue : 'No custom system prompt set.'}
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditingPrompt(true)} className="gap-2 cursor-pointer h-9">
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Prompt</span>
                </Button>
              </>
            )}
            <p className="text-xs text-muted-foreground leading-relaxed">Override the default system prompt used for AI queries. You can use placeholders (see the sidebar) to customize the prompt with live information.</p>
          </div>
        </motion.div>

        <motion.div
          className="p-4 sm:p-6 rounded-lg border bg-gradient-to-br from-purple-500/10 to-indigo-500/10 col-span-1 sm:col-span-2 lg:col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.56 }}
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <Info className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 shrink-0" />
            <h3 className="text-lg sm:text-xl font-semibold">Placeholders</h3>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Timezone</label>
              <TimezoneCombobox
                value={timezoneValue}
                onValueChange={(value) => {
                  setTimezoneValue(value);
                  updateSetting('timezone', value);
                }}
                className="cursor-pointer w-full"
              />
            </div>
            <div className="space-y-3">
              <p className="font-medium text-xs sm:text-sm">Available Placeholders:</p>
              <div className="grid grid-cols-1 gap-2">
                <div className="p-2 sm:p-3 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800 shadow-sm">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-blue-500 flex items-center justify-center shrink-0">
                      <User className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                    </div>
                    <code className="text-xs sm:text-sm font-mono text-blue-700 dark:text-blue-300">{`{botName}`}</code>
                    <span className="text-xs text-muted-foreground hidden sm:inline">Bot display name</span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 shadow-sm">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-green-500 flex items-center justify-center shrink-0">
                      <Calendar className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                    </div>
                    <code className="text-xs sm:text-sm font-mono text-green-700 dark:text-green-300">{`{date}`}</code>
                    <span className="text-xs text-muted-foreground hidden sm:inline">Current date</span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 rounded-lg border bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800 shadow-sm">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-purple-500 flex items-center justify-center shrink-0">
                      <Clock className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                    </div>
                    <code className="text-xs sm:text-sm font-mono text-purple-700 dark:text-purple-300">{`{time}`}</code>
                    <span className="text-xs text-muted-foreground hidden sm:inline">Current time</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="mt-6 sm:mt-8 lg:mt-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 1.0 }}
      >
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-20 p-4 sm:p-6 lg:p-8 rounded-xl bg-gradient-to-r from-muted/30 to-muted/60 border border-border/50 shadow-lg backdrop-blur-sm">
            <h3 className="font-semibold text-base sm:text-lg lg:text-xl text-center sm:text-left flex-1 sm:flex-none">Ready to start using Kowalski?</h3>
            <Button asChild size="lg" className="shrink-0 shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto">
              <a href="https://t.me/KowalskiNodeBot" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                <RiTelegram2Line className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Open on Telegram</span>
              </a>
            </Button>
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
