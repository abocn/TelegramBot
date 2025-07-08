"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { I18nextProvider } from "react-i18next"
import i18n from "@/lib/i18n"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </NextThemesProvider>
  )
}