# FinanzApp Mobile 📱

Una aplicación móvil moderna de administración financiera y portafolio de inversiones, diseñada para iOS con posibilidad de despliegue en Android.

## 🚀 Características Principales

### 📊 Presupuesto (Budget)
- **Vista mensual** con navegación entre meses
- **Gastos fijos y variables** claramente diferenciados
- **Agregar ingresos** en distintas categorías (sueldos, regalos, etc.)
- **Gráficos interactivos**:
  - Gráfico de torta para distribución de gastos por categoría
  - Gráfico de líneas para ingresos vs gastos
- **Métricas rápidas**: presupuesto total, disponible, gastado en el mes

### 💼 Portafolio de Inversiones
- **Sección "Mis Activos"** con solo los activos agregados por el usuario
- **Búsqueda y agregado de activos** (acciones, criptomonedas, ETFs, bonos)
- **Precios en tiempo real** con actualización automática cada 30 segundos
- **Cálculo automático** de ganancias/pérdidas por activo
- **Gráficos sparkline** para visualizar tendencias
- **Resumen consolidado** del portafolio total

### ⚙️ Configuración Personalizable
- **Temas**: Claro/Oscuro
- **Idiomas**: Español/Inglés
- **Monedas**: USD, EUR, MXN
- **Colores personalizables** para la interfaz
- **Gestión de datos**: Exportar/Importar/Borrar

## 🛠️ Tecnologías Utilizadas

- **React Native** con Expo
- **TypeScript** para tipado estático
- **React Navigation** para navegación
- **React Native Chart Kit** para gráficos
- **Expo Linear Gradient** para efectos visuales
- **AsyncStorage** para persistencia local
- **Ionicons** para iconografía

## 📱 Requisitos del Sistema

- **iOS**: 12.0 o superior
- **Android**: API level 21 o superior
- **Node.js**: 16.0 o superior
- **Expo CLI**: Última versión

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd FinanzAppMobile
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Expo
```bash
npx expo install
```

### 4. Ejecutar la aplicación

#### Para desarrollo:
```bash
npm start
```

#### Para iOS (requiere macOS):
```bash
npm run ios
```

#### Para Android:
```bash
npm run android
```

#### Para web:
```bash
npm run web
```

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Card.tsx        # Componente de tarjeta
│   └── Button.tsx      # Componente de botón
├── context/            # Contexto de React
│   └── AppContext.tsx  # Estado global de la aplicación
├── navigation/         # Navegación
│   └── AppNavigator.tsx # Navegador principal
├── screens/            # Pantallas de la aplicación
│   ├── BudgetScreen.tsx    # Pantalla de presupuesto
│   ├── PortfolioScreen.tsx # Pantalla de portafolio
│   └── SettingsScreen.tsx  # Pantalla de configuración
├── services/           # Servicios externos
│   └── marketService.ts # Servicio de datos de mercado
├── types/              # Definiciones de tipos TypeScript
│   └── index.ts        # Interfaces principales
└── utils/              # Utilidades y helpers
```

## 🎨 Diseño UI/UX

### Principios de Diseño
- **Mobile First**: Diseñado específicamente para dispositivos móviles
- **Minimalista**: Interfaz limpia y moderna
- **Intuitivo**: Navegación fluida con tabs inferiores
- **Accesible**: Contraste adecuado y tamaños de texto legibles

### Características Visuales
- **Cards con bordes redondeados** y sombras suaves
- **Gradientes sutiles** para elementos destacados
- **Animaciones ligeras** en transiciones
- **Iconografía consistente** con Ionicons
- **Paleta de colores** personalizable

## 📊 Funcionalidades de Datos

### Persistencia Local
- **AsyncStorage** para guardar datos localmente
- **Sincronización automática** de cambios
- **Backup y restauración** de datos

### Simulación de Mercados
- **Datos simulados** para desarrollo y pruebas
- **Actualización en tiempo real** cada 30 segundos
- **Variaciones aleatorias** para simular mercado real
- **Preparado para APIs reales** (CoinGecko, Yahoo Finance, etc.)

## 🔧 Configuración de APIs (Opcional)

Para usar datos reales de mercados financieros, puedes configurar las siguientes APIs:

### CoinGecko (Criptomonedas)
```typescript
// En src/services/marketService.ts
const COINGECKO_API_KEY = 'tu-api-key';
```

### Yahoo Finance (Acciones)
```typescript
// En src/services/marketService.ts
const YAHOO_FINANCE_API_KEY = 'tu-api-key';
```

## 📱 Despliegue

### Para iOS App Store:
1. Configurar certificados de desarrollo
2. Generar build de producción:
```bash
expo build:ios
```

### Para Google Play Store:
1. Configurar keystore de Android
2. Generar build de producción:
```bash
expo build:android
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación de [Expo](https://docs.expo.dev/)
2. Consulta los issues del repositorio
3. Crea un nuevo issue con detalles del problema

## 🔮 Próximas Características

- [ ] **Autenticación** con biometría
- [ ] **Sincronización en la nube** con Firebase
- [ ] **Notificaciones push** para alertas de mercado
- [ ] **Widgets** para iOS y Android
- [ ] **Modo offline** con sincronización automática
- [ ] **Análisis avanzado** de portafolio
- [ ] **Integración con bancos** para importación automática

---

**Desarrollado con ❤️ por el equipo de FinanzApp**