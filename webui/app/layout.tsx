import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/contexts/auth-context";
import { HeaderAuth } from "@/components/header-auth";
import { LanguageChooser } from "@/components/language-chooser";

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
      <body className={`${sora.variable} antialiased lg:p-2 p-0 m-0 w-full h-full`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset className="h-screen lg:h-[calc(100vh-16px)] overflow-hidden lg:rounded-lg lg:border border-0 bg-background flex flex-col">
                <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b bg-background">
                  <SidebarTrigger className="ml-1 cursor-pointer" />
                  <div className="flex flex-row items-center gap-3 ml-auto">
                    <HeaderAuth />
                    <LanguageChooser />
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
