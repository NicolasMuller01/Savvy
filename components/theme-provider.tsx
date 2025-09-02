"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type ColorTheme = "emerald" | "blue" | "purple" | "orange" | "red" | "pink"

interface ThemeContextType {
  colorTheme: ColorTheme
  setColorTheme: (colorTheme: ColorTheme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorTheme] = useState<ColorTheme>("emerald")

  useEffect(() => {
    const savedColorTheme = localStorage.getItem("colorTheme") as ColorTheme
    if (savedColorTheme) setColorTheme(savedColorTheme)
    
    // Always set dark mode
    document.documentElement.classList.add("dark")
    document.documentElement.style.colorScheme = "dark"
  }, [])

  useEffect(() => {
    localStorage.setItem("colorTheme", colorTheme)
    document.documentElement.setAttribute("data-color-theme", colorTheme)
  }, [colorTheme])

  return (
    <ThemeContext.Provider value={{ colorTheme, setColorTheme }}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
