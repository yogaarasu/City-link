import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)
const LEGACY_THEME_KEY = "citylink_theme"

const resolveStoredTheme = (storageKey: string, fallback: Theme): Theme => {
  const current = localStorage.getItem(storageKey) as Theme | null
  if (current === "light" || current === "dark" || current === "system") {
    localStorage.removeItem(LEGACY_THEME_KEY)
    return current
  }

  const legacy = localStorage.getItem(LEGACY_THEME_KEY) as Theme | null
  if (legacy === "light" || legacy === "dark" || legacy === "system") {
    localStorage.setItem(storageKey, legacy)
    localStorage.removeItem(LEGACY_THEME_KEY)
    return legacy
  }

  localStorage.removeItem(LEGACY_THEME_KEY)
  return fallback
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => resolveStoredTheme(storageKey, defaultTheme)
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
