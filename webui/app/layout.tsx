import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/contexts/auth-context";
import { HeaderAuth } from "@/components/header-auth";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kowalski",
  description: "A powerful, multi-function Telegram bot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className={`${sora.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset className="h-[calc(100vh-16px)] overflow-hidden rounded-lg border bg-background flex flex-col">
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b bg-background">
                  <SidebarTrigger className="-ml-1" />
                  <div className="ml-auto">
                    <HeaderAuth />
                  </div>
                </header>
                <main className="flex-1 overflow-auto scroll-smooth">
                  {children}
                </main>
              </SidebarInset>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
