"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "./theme-provider"
import { useAuth } from "@/contexts/AuthContext"
import { Investment, Expense } from "@/types"
import {
  User,
  Download,
  Info,
  LogOut,
  Palette,
} from "lucide-react"

interface UserSettings {
  profile: {
    name: string
    email: string
    currency: string
    language: string
  }
  appearance: {
    colorTheme: string
    fontSize: string
    compactMode: boolean
  }
}

interface SettingsViewProps {
  userSettings: UserSettings
  setUserSettings: (settings: UserSettings) => void
  expenses: Expense[]
  investments: Investment[]
}

export function SettingsView({ userSettings, setUserSettings, expenses, investments }: SettingsViewProps) {
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    "profile" | "appearance" | "data" | "about"
  >("profile")

  // Cargar configuraciones desde localStorage al montar el componente
  useEffect(() => {
    const savedAppearanceSettings = localStorage.getItem('user-appearance-settings')
    if (savedAppearanceSettings) {
      try {
        const parsedSettings = JSON.parse(savedAppearanceSettings)
        setUserSettings({
          ...userSettings,
          appearance: {
            colorTheme: parsedSettings.colorTheme || 'emerald',
            fontSize: parsedSettings.fontSize || 'medium',
            compactMode: parsedSettings.compactMode || false,
          }
        })
      } catch (error) {
        console.error('Error loading appearance settings:', error)
      }
    }
  }, [])

  const updateSettings = (section: keyof UserSettings, key: string, value: any) => {
    const newSettings = {
      ...userSettings,
      [section]: {
        ...userSettings[section],
        [key]: value,
      },
    }
    setUserSettings(newSettings)
    
    // Guardar configuraciones de apariencia en localStorage
    if (section === 'appearance') {
      localStorage.setItem('user-appearance-settings', JSON.stringify(newSettings.appearance))
    }
  }

  const exportData = (format: "csv" | "pdf") => {
    const data = { expenses, investments }
    console.log(`Exporting data as ${format}:`, data)
    // Implement actual export logic here
  }

  const settingsTabs = [
    { id: "profile" as const, label: "Perfil", icon: User },
    { id: "appearance" as const, label: "Apariencia", icon: Palette },
    { id: "data" as const, label: "Datos", icon: Download },
    { id: "about" as const, label: "Acerca de", icon: Info },
  ]

  const renderSettingsContent = () => {
    switch (activeSettingsTab) {
      case "profile":
        return <ProfileSettings userSettings={userSettings} updateSettings={updateSettings} />
      case "appearance":
        return <AppearanceSettings userSettings={userSettings} updateSettings={updateSettings} />
      case "data":
        return <DataSettings exportData={exportData} />
      case "about":
        return <AboutSettings />
      default:
        return <ProfileSettings userSettings={userSettings} updateSettings={updateSettings} />
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Configuración</h1>
          <p className="text-slate-400 text-sm sm:text-base">Administra tu perfil y preferencias de la aplicación</p>
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 pb-4 sm:pb-6 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Settings Navigation */}
          <div className="lg:col-span-1 h-full lg:h-auto">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm h-full lg:h-auto">
              <div className="p-3 sm:p-4 h-full overflow-y-auto">
                <nav className="space-y-1 sm:space-y-2">
                  {settingsTabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <Button
                        key={tab.id}
                        variant="ghost"
                        className={`w-full justify-start gap-2 sm:gap-3 text-left h-auto py-2 sm:py-3 px-2 sm:px-3 cursor-pointer text-xs sm:text-sm ${
                          activeSettingsTab === tab.id
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                        } transition-all duration-200`}
                        onClick={() => setActiveSettingsTab(tab.id)}
                      >
                        <Icon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="font-medium truncate">{tab.label}</span>
                      </Button>
                    )
                  })}
                </nav>
              </div>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3 h-full overflow-y-auto">
            <div className="h-full">
              {renderSettingsContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AppearanceSettings({
  userSettings,
  updateSettings,
}: {
  userSettings: UserSettings
  updateSettings: (section: keyof UserSettings, key: string, value: any) => void
}) {
  const { colorTheme, setColorTheme } = useTheme()

  const colorThemes = [
    { id: "emerald", name: "Esmeralda", color: "#10b981" },
    { id: "blue", name: "Azul", color: "#3b82f6" },
    { id: "purple", name: "Púrpura", color: "#8b5cf6" },
    { id: "orange", name: "Naranja", color: "#f59e0b" },
    { id: "red", name: "Rojo", color: "#ef4444" },
    { id: "pink", name: "Rosa", color: "#ec4899" },
  ]

  const fontSizes = [
    { id: "small", name: "Pequeño", description: "Texto más compacto" },
    { id: "medium", name: "Mediano", description: "Tamaño estándar" },
    { id: "large", name: "Grande", description: "Texto más legible" },
  ]

  const handleColorThemeChange = (themeId: string) => {
    setColorTheme(themeId as any)
    updateSettings('appearance', 'colorTheme', themeId)
  }

  return (
    <div className="h-full overflow-y-auto space-y-4 sm:space-y-6">
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-3 sm:p-4 md:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Tema de Color</h3>
          <p className="text-slate-400 text-sm sm:text-base mb-4 sm:mb-6">Elige tu esquema de colores preferido para la interfaz</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {colorThemes.map((color) => (
              <Button
                key={color.id}
                variant={colorTheme === color.id ? "default" : "outline"}
                className={`h-12 sm:h-16 justify-start gap-2 sm:gap-4 cursor-pointer transition-all duration-200 text-xs sm:text-sm ${
                  colorTheme === color.id
                    ? "border-[var(--primary-border)] text-[var(--primary)]"
                    : "bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500/50"
                }`}
                style={colorTheme === color.id ? {
                  background: 'var(--primary-glow)',
                  borderColor: 'var(--primary-border)'
                } : {}}
                onClick={() => handleColorThemeChange(color.id)}
              >
                <div
                  className="w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 border-white/20 shadow-lg flex-shrink-0"
                  style={{ backgroundColor: color.color }}
                />
                <span className="font-medium truncate">{color.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-3 sm:p-4 md:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Tamaño de Fuente</h3>
          <p className="text-slate-400 text-sm sm:text-base mb-4 sm:mb-6">Ajusta el tamaño del texto para mejor legibilidad</p>
          <div className="space-y-2 sm:space-y-3">
            {fontSizes.map((size) => (
              <Button
                key={size.id}
                variant={userSettings.appearance?.fontSize === size.id ? "default" : "outline"}
                className={`w-full h-16 justify-start gap-4 cursor-pointer transition-all duration-200 ${
                  userSettings.appearance?.fontSize === size.id
                    ? "border-[var(--primary-border)] text-[var(--primary)]"
                    : "bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500/50"
                }`}
                style={userSettings.appearance?.fontSize === size.id ? {
                  background: 'var(--primary-glow)',
                  borderColor: 'var(--primary-border)'
                } : {}}
                onClick={() => updateSettings('appearance', 'fontSize', size.id)}
              >
                <div className="text-left">
                  <div className="font-medium">{size.name}</div>
                  <div className="text-sm opacity-70">{size.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-white mb-2">Modo de Visualización</h3>
          <p className="text-slate-400 mb-6">Personaliza la densidad de la información mostrada</p>
          <Button
            variant={userSettings.appearance?.compactMode ? "default" : "outline"}
            className={`w-full h-16 justify-start gap-4 cursor-pointer transition-all duration-200 ${
              userSettings.appearance?.compactMode
                ? "border-[var(--primary-border)] text-[var(--primary)]"
                : "bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500/50"
            }`}
            style={userSettings.appearance?.compactMode ? {
              background: 'var(--primary-glow)',
              borderColor: 'var(--primary-border)'
            } : {}}
            onClick={() => updateSettings('appearance', 'compactMode', !userSettings.appearance?.compactMode)}
          >
            <div className="text-left">
              <div className="font-medium">Modo Compacto</div>
              <div className="text-sm opacity-70">
                {userSettings.appearance?.compactMode ? 'Activado - Más información en menos espacio' : 'Desactivado - Interfaz espaciosa'}
              </div>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  )
}

function ProfileSettings({
  userSettings,
  updateSettings,
}: {
  userSettings: UserSettings
  updateSettings: (section: keyof UserSettings, key: string, value: any) => void
}) {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      // Error handled by AuthContext
    }
  };

  return (
    <div className="h-full overflow-y-auto space-y-4 sm:space-y-6">
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-full flex items-center justify-center border border-emerald-500/30 mx-auto sm:mx-0">
              <User className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-400" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-semibold text-white">{userSettings.profile.name}</h3>
              <p className="text-slate-400 text-sm sm:text-base">{userSettings.profile.email}</p>
            </div>
            <Button 
              variant="destructive" 
              onClick={handleSignOut}
              className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm w-full sm:w-auto"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-3 sm:p-4 md:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Información Personal</h3>
          <div className="space-y-4 sm:space-y-6">
            <div>
              <Label htmlFor="name" className="text-slate-300 font-medium">Nombre Completo</Label>
              <Input
                id="name"
                value={userSettings.profile.name}
                onChange={(e) => updateSettings("profile", "name", e.target.value)}
                className="mt-2 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-emerald-500/50 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-slate-300 font-medium">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={userSettings.profile.email}
                onChange={(e) => updateSettings("profile", "email", e.target.value)}
                className="mt-2 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-emerald-500/50 focus:ring-emerald-500/20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="currency" className="text-slate-300 font-medium">Moneda</Label>
                <Select
                  value={userSettings.profile.currency}
                  onValueChange={(value) => updateSettings("profile", "currency", value)}
                >
                  <SelectTrigger className="mt-2 bg-slate-700/50 border-slate-600/50 text-white focus:border-emerald-500/50 focus:ring-emerald-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="USD" className="text-white hover:bg-slate-700">USD ($)</SelectItem>
                    <SelectItem value="EUR" className="text-white hover:bg-slate-700">EUR (€)</SelectItem>
                    <SelectItem value="GBP" className="text-white hover:bg-slate-700">GBP (£)</SelectItem>
                    <SelectItem value="JPY" className="text-white hover:bg-slate-700">JPY (¥)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="language" className="text-slate-300 font-medium">Idioma</Label>
                <Select
                  value={userSettings.profile.language}
                  onValueChange={(value) => updateSettings("profile", "language", value)}
                >
                  <SelectTrigger className="mt-2 bg-slate-700/50 border-slate-600/50 text-white focus:border-emerald-500/50 focus:ring-emerald-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Spanish" className="text-white hover:bg-slate-700">Español</SelectItem>
                    <SelectItem value="English" className="text-white hover:bg-slate-700">English</SelectItem>
                    <SelectItem value="French" className="text-white hover:bg-slate-700">Français</SelectItem>
                    <SelectItem value="German" className="text-white hover:bg-slate-700">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function DataSettings({ exportData }: { exportData: (format: "csv" | "pdf") => void }) {
  return (
    <div className="h-full overflow-y-auto space-y-4 sm:space-y-6">
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-3 sm:p-4 md:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Exportar Datos</h3>
          <p className="text-slate-400 text-sm sm:text-base mb-4 sm:mb-6">
            Descarga todos tus datos financieros en diferentes formatos
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              onClick={() => exportData("csv")}
              variant="outline"
              className="bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white cursor-pointer text-xs sm:text-sm"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Exportar como CSV
            </Button>
            <Button
              onClick={() => exportData("pdf")}
              variant="outline"
              className="bg-slate-700/30 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white cursor-pointer text-xs sm:text-sm"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Exportar como PDF
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function AboutSettings() {
  return (
    <div className="h-full overflow-y-auto space-y-4 sm:space-y-6">
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <div className="p-3 sm:p-4 md:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Acerca de la Aplicación</h3>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-300">Versión</p>
              <p className="text-white text-sm sm:text-base">1.0.0</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-300">Desarrollado por</p>
              <p className="text-white text-sm sm:text-base">Tu Equipo de Desarrollo</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-300">Descripción</p>
              <p className="text-slate-400 text-xs sm:text-sm">
                Una aplicación completa para la gestión de finanzas personales con seguimiento
                de gastos, presupuestos e inversiones.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
