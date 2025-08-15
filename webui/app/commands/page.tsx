'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from "@/components/ui/switch"
import { useAuth } from '@/contexts/auth-context'
import { useTranslation } from 'react-i18next'
import {
  Filter,
  Command,
  Brain,
  Bot,
  BarChart3,
  Dices,
  Shuffle,
  Cat,
  Heart,
  CloudSun,
  Smartphone,
  Network,
  Hash,
  Info,
  Quote,
  Download,
  Database,
  Archive,
  Rainbow,
  Shield,
  Settings
} from 'lucide-react'
import {
  TiInfinity
} from 'react-icons/ti'
import {
  FaLastfm
} from 'react-icons/fa'

interface CommandCard {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  commands: string[]
  category: string
  gradient: string
  enabled: boolean
}

const regularCommands: CommandCard[] = [
  {
    id: "ai-ask-think",
    icon: <Brain className="w-6 h-6" />,
    title: "AI Chats",
    description: "Chat with AI models and use deep thinking",
    commands: ["/ask", "/think"],
    category: "ai",
    gradient: "from-purple-500/10 to-pink-500/10",
    enabled: true
  },
  {
    id: "ai-custom",
    icon: <Bot className="w-6 h-6" />,
    title: "Custom AI Model",
    description: "Use your personally configured AI model",
    commands: ["/ai"],
    category: "ai",
    gradient: "from-indigo-500/10 to-purple-500/10",
    enabled: true
  },
  {
    id: "ai-stats",
    icon: <BarChart3 className="w-6 h-6" />,
    title: "AI Statistics",
    description: "View your AI usage statistics",
    commands: ["/aistats"],
    category: "ai",
    gradient: "from-purple-600/10 to-indigo-600/10",
    enabled: true
  },
  {
    id: "games-dice",
    icon: <Dices className="w-6 h-6" />,
    title: "Interactive Emojis",
    description: "Roll dice, play slots, and other interactive emojis",
    commands: ["/dice", "/slot", "/ball", "/dart", "/bowling"],
    category: "entertainment",
    gradient: "from-green-500/10 to-teal-500/10",
    enabled: true
  },
  {
    id: "fun-random",
    icon: <Shuffle className="w-6 h-6" />,
    title: "Fun Commands",
    description: "Random numbers and fun responses",
    commands: ["/random", "/furry", "/gay"],
    category: "entertainment",
    gradient: "from-pink-500/10 to-rose-500/10",
    enabled: true
  },
  {
    id: "infinite-dice",
    icon: <TiInfinity className="w-6 h-6" />,
    title: "Infinite Dice",
    description: "Sends an infinite dice sticker",
    commands: ["/idice"],
    category: "entertainment",
    gradient: "from-yellow-500/10 to-orange-500/10",
    enabled: true
  },
  {
    id: "animals-basic",
    icon: <Cat className="w-6 h-6" />,
    title: "Animal Pictures",
    description: "Get random cute animal pictures",
    commands: ["/cat", "/dog", "/duck", "/fox"],
    category: "animals",
    gradient: "from-orange-500/10 to-red-500/10",
    enabled: true
  },
  {
    id: "soggy-cat",
    icon: <Heart className="w-6 h-6" />,
    title: "Soggy Cat",
    description: "Wet cats!",
    commands: ["/soggy", "/soggycat"],
    category: "animals",
    gradient: "from-blue-500/10 to-purple-500/10",
    enabled: true
  },
  {
    id: "weather",
    icon: <CloudSun className="w-6 h-6" />,
    title: "Weather",
    description: "Get current weather for any location",
    commands: ["/weather", "/clima"],
    category: "utility",
    gradient: "from-blue-500/10 to-cyan-500/10",
    enabled: true
  },
  {
    id: "device-specs",
    icon: <Smartphone className="w-6 h-6" />,
    title: "Device Specifications",
    description: "Look up phone specifications via GSMArena",
    commands: ["/device", "/d"],
    category: "utility",
    gradient: "from-slate-500/10 to-gray-500/10",
    enabled: true
  },
  {
    id: "http-status",
    icon: <Network className="w-6 h-6" />,
    title: "HTTP Status Codes",
    description: "Look up HTTP status codes and meanings",
    commands: ["/http", "/httpcat"],
    category: "utility",
    gradient: "from-emerald-500/10 to-green-500/10",
    enabled: true
  },
  {
    id: "codename-lookup",
    icon: <Hash className="w-6 h-6" />,
    title: "Codename Lookup",
    description: "Look up codenames and meanings",
    commands: ["/codename", "/whatis"],
    category: "utility",
    gradient: "from-teal-500/10 to-cyan-500/10",
    enabled: true
  },
  {
    id: "info-commands",
    icon: <Info className="w-6 h-6" />,
    title: "Information",
    description: "Get chat and user information",
    commands: ["/chatinfo", "/userinfo"],
    category: "utility",
    gradient: "from-indigo-500/10 to-blue-500/10",
    enabled: true
  },
  {
    id: "quotes",
    icon: <Quote className="w-6 h-6" />,
    title: "Random Quotes",
    description: "Get random quotes",
    commands: ["/quote"],
    category: "utility",
    gradient: "from-amber-500/10 to-yellow-500/10",
    enabled: true
  },
  {
    id: "youtube-download",
    icon: <Download className="w-6 h-6" />,
    title: "Video Downloads",
    description: "Download videos from YouTube and 1000+ platforms",
    commands: ["/yt", "/ytdl", "/video", "/dl"],
    category: "media",
    gradient: "from-red-500/10 to-pink-500/10",
    enabled: true
  },
  {
    id: "lastfm",
    icon: <FaLastfm className="w-6 h-6" />,
    title: "Last.fm Integration",
    description: "Connect your music listening history",
    commands: ["/last", "/lfm", "/setuser"],
    category: "media",
    gradient: "from-violet-500/10 to-purple-500/10",
    enabled: true
  },
  {
    id: "mlp-content",
    icon: <Database className="w-6 h-6" />,
    title: "MLP Database",
    description: "My Little Pony content and information",
    commands: ["/mlp", "/mlpchar", "/mlpep", "/mlpcomic"],
    category: "media",
    gradient: "from-fuchsia-500/10 to-pink-500/10",
    enabled: true
  },
  {
    id: "modarchive",
    icon: <Archive className="w-6 h-6" />,
    title: "Mod Archive",
    description: "Access classic tracker music files",
    commands: ["/modarchive", "/tma"],
    category: "media",
    gradient: "from-cyan-500/10 to-blue-500/10",
    enabled: true
  },
  {
    id: "random-pony",
    icon: <Rainbow className="w-6 h-6" />,
    title: "Random Pony Art",
    description: "Get random My Little Pony artwork",
    commands: ["/rpony", "/randompony", "/mlpart"],
    category: "media",
    gradient: "from-pink-500/10 to-purple-500/10",
    enabled: true
  },
];

const adminCommands: CommandCard[] = [
  {
    id: "admin-stats",
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Bot Statistics",
    description: "Get system stats and performance metrics",
    commands: ["/getbotstats"],
    category: "admin",
    gradient: "from-red-500/10 to-orange-500/10",
    enabled: true
  },
  {
    id: "admin-commit",
    icon: <Settings className="w-6 h-6" />,
    title: "Git Information",
    description: "Get current git commit hash",
    commands: ["/getbotcommit"],
    category: "admin",
    gradient: "from-green-500/10 to-teal-500/10",
    enabled: true
  },
  {
    id: "admin-config",
    icon: <Shield className="w-6 h-6" />,
    title: "Bot Configuration",
    description: "Manage bot name and description",
    commands: ["/setbotname", "/setbotdesc"],
    category: "admin",
    gradient: "from-purple-500/10 to-pink-500/10",
    enabled: true
  },
  {
    id: "admin-leave",
    icon: <Shield className="w-6 h-6" />,
    title: "Leave Chat",
    description: "Make the bot leave current chat",
    commands: ["/botkickme"],
    category: "admin",
    gradient: "from-gray-500/10 to-slate-500/10",
    enabled: true
  }
];

const categoryColors = {
  'AI': 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  'Entertainment': 'bg-pink-500/10 text-pink-700 dark:text-pink-300',
  'Utility': 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  'Media': 'bg-green-500/10 text-green-700 dark:text-green-300',
  'Admin': 'bg-red-500/10 text-red-700 dark:text-red-300'
}

export default function CommandsPage() {
  const { user, loading, refreshUser } = useAuth()
  const { t } = useTranslation()
  const [commands, setCommands] = useState<CommandCard[]>(regularCommands)
  const [adminCommandsList, setAdminCommandsList] = useState<CommandCard[]>(adminCommands)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  const allCommands = user?.isAdmin ? [...regularCommands, ...adminCommands] : regularCommands
  const categories = ['all', ...Array.from(new Set(allCommands.map(cmd => cmd.category)))]
  const totalCommands = allCommands.reduce((total, cmd) => total + cmd.commands.length, 0)

  useEffect(() => {
    if (user) {
      const updatedRegularCommands = regularCommands.map(cmd => ({
        ...cmd,
        enabled: !user.disabledCommands.includes(cmd.id)
      }))
      setCommands(updatedRegularCommands)

      if (user.isAdmin) {
        const updatedAdminCommands = adminCommands.map(cmd => ({
          ...cmd,
          enabled: !user.disabledAdminCommands.includes(cmd.id)
        }))
        setAdminCommandsList(updatedAdminCommands)
      }
    }
    setIsLoading(false)
  }, [user])

  const toggleCommand = async (commandId: string) => {
    if (!user) return

    const isAdminCommand = commandId.startsWith('admin-')
    const commandList = isAdminCommand ? adminCommandsList : commands
    const setCommandList = isAdminCommand ? setAdminCommandsList : setCommands

    const commandToToggle = commandList.find(cmd => cmd.id === commandId)
    if (!commandToToggle) return

    const newEnabledState = !commandToToggle.enabled

    setCommandList(prev => prev.map(cmd =>
      cmd.id === commandId ? { ...cmd, enabled: newEnabledState } : cmd
    ))

    try {
      const updateData: Record<string, string[]> = {}

      if (isAdminCommand) {
        let newDisabledAdminCommands: string[]
        if (newEnabledState) {
          newDisabledAdminCommands = user.disabledAdminCommands.filter(id => id !== commandId)
        } else {
          newDisabledAdminCommands = [...user.disabledAdminCommands, commandId]
        }
        updateData.disabledAdminCommands = newDisabledAdminCommands
      } else {
        let newDisabledCommands: string[]
        if (newEnabledState) {
          newDisabledCommands = user.disabledCommands.filter(id => id !== commandId)
        } else {
          newDisabledCommands = [...user.disabledCommands, commandId]
        }
        updateData.disabledCommands = newDisabledCommands
      }

      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
        credentials: 'include'
      })

      if (response.ok) {
        await refreshUser()
      } else {
        setCommandList(prev => prev.map(cmd =>
          cmd.id === commandId ? { ...cmd, enabled: !newEnabledState } : cmd
        ))
        console.error('Failed to update command state')
      }
    } catch (error) {
      setCommandList(prev => prev.map(cmd =>
        cmd.id === commandId ? { ...cmd, enabled: !newEnabledState } : cmd
      ))
      console.error('Error updating command state:', error)
    }
  }

  const displayCommands = user?.isAdmin ? [...commands, ...adminCommandsList] : commands
  const filteredCommands = selectedCategory === 'all' 
    ? displayCommands 
    : displayCommands.filter(cmd => cmd.category === selectedCategory)

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('commands.loadingCommands')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 items-center justify-center flex sm:hidden md:flex">
              <Command className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">{t('commands.title')}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">{t('commands.description', { count: totalCommands })}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">{t('commands.filterByCategory')}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="transition-all duration-200 cursor-pointer text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
              >
                {category === 'all' ? t('commands.all') : t(`commands.${category.toLowerCase()}`)}
              </Button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {filteredCommands.map((command, index) => (
            <motion.div
              key={command.id}
              className={`p-4 sm:p-6 rounded-lg border bg-gradient-to-br ${command.gradient}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -2, scale: 1.02 }}
            >
              <div className="flex items-start sm:items-center gap-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-background/50 flex items-center justify-center flex-shrink-0">
                  <div className="w-5 h-5 sm:w-6 sm:h-6">
                    {command.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold truncate">{t(`commands.cards.${command.id}.title`)}</h3>
                  <Badge className={`${categoryColors[command.category as keyof typeof categoryColors]} text-xs`}>
                    {t(`commands.${command.category}`)}
                  </Badge>
                </div>
                {user && (
                  <div className="flex items-center flex-shrink-0">
                    <Switch
                      checked={command.enabled}
                      onCheckedChange={() => toggleCommand(command.id)}
                      className="data-[state=checked]:bg-primary scale-110 sm:scale-125"
                    />
                  </div>
                )}
              </div>

              <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                {t(`commands.cards.${command.id}.description`)}
              </p>

              <div className="space-y-2 sm:space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('commands.commandsList')}
                </p>
                <div className="flex flex-wrap gap-1">
                  {command.commands.map((cmd) => (
                    <code key={cmd} className="px-1.5 sm:px-2 py-1 text-xs bg-muted rounded font-mono">
                      {cmd}
                    </code>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredCommands.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 sm:py-12"
          >
            <Command className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">{t('commands.noCommandsFound')}</h3>
            <p className="text-sm sm:text-base text-muted-foreground px-4">
              {t('commands.noCommandsDescription')}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}