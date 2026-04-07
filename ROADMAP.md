# PokedexGamer — Roadmap y pendientes

## Estado actual (funciona en Expo Go)
- Catálogo local con SQLite
- Escáner de barcode (EAN/UPC) → búsqueda automática en IGDB
- Búsqueda manual por título → IGDB
- Metadatos completos: título, plataforma, año, género, desarrollador, publisher, descripción, puntuación, franquicia
- Carátulas via IGDB + SteamGridDB como fallback
- Pantalla de detalle con portada a pantalla completa
- Edición manual de todos los campos (icono lápiz)
- Favorito / Solo disco toggles
- Exportación del catálogo en JSON
- Ajustes con diagnóstico de APIs

---

## Pendientes de desarrollo

### Alta prioridad
- [ ] Búsqueda/filtro en el catálogo (por título, plataforma, estado metadata)
- [ ] Ordenar catálogo (por nombre, plataforma, fecha de añadido, puntuación)
- [ ] Mostrar puntuación (rating) visualmente en la tarjeta (estrellas o barra)

### Media prioridad
- [ ] Pantalla de estadísticas (total juegos, por plataforma, favoritos, etc.)
- [ ] Filtro de favoritos y solo disco en el catálogo
- [ ] Mejoras visuales: animaciones al abrir tarjeta, transiciones
- [ ] Icono de la app y splash screen personalizados

### Baja prioridad / futuro
- [ ] Exportación compatible con Playnite (formato XML/JSON de Playnite)

---

## OCR de portadas — pendiente por hardware

### Por qué está pausado
El Mac actual (Intel Core i7, ~2013, macOS 12.7.6) no puede actualizar
a macOS 13 Ventura, que es el mínimo para Xcode 15+, requerido por RN 0.81.

### Opciones cuando se tenga hardware compatible

**Opción A — Mac moderno (macOS 13+)**
1. `npm install @infinitered/react-native-mlkit-text-recognition`
   (ya está en package.json, solo falta el build nativo)
2. `rm -rf ios && npx expo run:ios --device`
3. Configurar firma en Xcode → Settings → Accounts → añadir Apple ID
4. El código del escáner OCR ya está implementado en `app/(tabs)/escaner.tsx`
   y el parser en `services/utils/ocrParser.ts`

**Opción B — EAS Build (nube, sin Mac moderno)**
1. `npm install -g eas-cli && eas login`
2. `eas build:configure`
3. `eas build --profile development --platform ios`
4. Requiere Apple Developer Account ($99/año) para instalar en iPhone real
5. Sin cuenta: solo simulador iOS (sin cámara real)

**Opción C — Expo Go + OCR.space API (sin build nativo)**
- API gratuita: 25.000 peticiones/mes con cuenta gratuita
- Key embebida en el código, usuarios no configuran nada
- REST puro, funciona en Expo Go
- Registrar en https://ocr.space y hardcodear la key en el provider

---

## ScreenScraper como proveedor secundario — pendiente

Playnite embebe su propio devid/devpassword en el plugin.
Para replicarlo en PokedexGamer:
1. Registrar la app en https://www.screenscraper.fr/devzone.php
2. Recibir devid + devpassword por email
3. Hardcodearlos en `services/providers/screenScraperProvider.ts` → buildBaseParams()
4. Eliminar campos Dev ID / Dev Password de la pantalla Ajustes
5. Resultado: usuarios solo ponen usuario + password, igual que en Playnite

---

## Notas de arquitectura
- Proveedor principal: IGDB (Twitch) — igual que Playnite
- Fallback: ScreenScraper (cuando tenga devid propio)
- Carátulas adicionales: SteamGridDB
- Algoritmo de scoring: Playnite-style (cleanGameTitle + scoreMatch + bestMatchIndex)
  en `services/utils/titleUtils.ts`
- Base de datos local: SQLite via expo-sqlite
- Credenciales: expo-secure-store (cifrado en dispositivo)
