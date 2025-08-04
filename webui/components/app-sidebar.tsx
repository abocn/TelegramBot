"use client";

import * as React from "react"
import {
  Home,
  MessageSquare,
  User,
  Trash2,
  LogOut,
  Command
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { RiTelegram2Line } from "react-icons/ri"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"

interface AccountItem {
  title: string;
  url: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  danger?: boolean;
}

const navigation = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "About",
    url: "/about",
    icon: MessageSquare,
  },
  {
    title: "Commands",
    url: "/commands",
    icon: Command,
  },
]

export function AppSidebar() {
  const { isAuthenticated, loading, logout } = useAuth();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleMenuItemClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const accountItems: AccountItem[] = React.useMemo(() => {
    if (loading) {
      return [];
    }

    if (isAuthenticated) {
      return [
        {
          title: "My Account",
          url: "/account",
          icon: User,
        },
        {
          title: "Logout",
          url: "#",
          icon: LogOut,
          danger: true,
        },
        {
          title: "Delete Account",
          url: "/account/delete",
          icon: Trash2,
          danger: true,
        },
      ];
    } else {
      return [
        {
          title: "Sign in with Telegram",
          url: "/login",
          icon: RiTelegram2Line,
        },
      ];
    }
  }, [isAuthenticated, loading]);

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" className="flex flex-row items-center gap-2" onClick={handleMenuItemClick}>
                <div className="flex flex-row gap-3 items-center">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 p-1">
                    <Image
                      src="/kowalski.svg"
                      alt="Kowalski Logo"
                      width={20}
                      height={20}
                      className="dark:invert -mt-1"
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-lg">Kowalski</span>
                  </div>
                  <Badge className="text-xs">Beta</Badge>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} onClick={handleMenuItemClick}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!loading && (
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {accountItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.title === "Logout" ? (
                      <SidebarMenuButton
                        onClick={() => {
                          logout();
                          handleMenuItemClick();
                        }}
                        className={item.danger ? "text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" : ""}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton asChild>
                        <Link
                          href={item.url}
                          onClick={handleMenuItemClick}
                          className={item.danger ? "text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" : ""}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-end">
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
