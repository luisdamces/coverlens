# iOS Readiness (TestFlight / App Store)

## Estado actual
- Configuración base lista en `app.json`:
  - `ios.bundleIdentifier = com.coverlens.app`
  - Permisos de cámara/fotos con textos de privacidad
- Pipeline EAS listo en `eas.json` (`preview`/`production`)

## Requisitos obligatorios
- [ ] Cuenta Apple Developer activa.
- [ ] App creada en App Store Connect (`CoverLens`).
- [ ] Certificados/profiles gestionados por EAS o manualmente.

## Build iOS recomendado (sin Mac moderno local)
- [ ] Login EAS: `npx eas login`
- [ ] Configurar credenciales automáticas: `npx eas credentials`
- [ ] Build TestFlight: `npx eas build --platform ios --profile production`
- [ ] Subida a App Store Connect: `npx eas submit --platform ios --profile production`

## Checklist funcional iOS
- [ ] Permisos de cámara solicitados correctamente.
- [ ] Escaneo barcode estable (no bloqueos de cámara).
- [ ] Modal de no encontrado usable con teclado iOS.
- [ ] Exportar JSON y compartir funciona con Share Sheet.
- [ ] Navegación tabs/detalle sin regresiones.

## Checklist App Store Connect
- [ ] Nombre app: CoverLens
- [ ] Subtítulo y descripción localizadas (es-ES)
- [ ] Keywords
- [ ] URL de soporte
- [ ] URL de política de privacidad
- [ ] Capturas iPhone (6.7" y 6.1" mínimo)
- [ ] Clasificación por edades
- [ ] Declaración de uso de datos (Privacy Nutrition Labels)

## Riesgos conocidos / mitigación
- Hardware local antiguo para build iOS nativo -> usar EAS Build en la nube.
- OCR nativo depende de build dev/production, no Expo Go -> validar en build EAS.
- Dependencia de APIs externas (IGDB/ScreenScraper) -> fallback y diagnósticos en Ajustes.

## Criterio de "iOS Ready"
- [ ] Build iOS de producción generado en EAS.
- [ ] Subida correcta a TestFlight.
- [ ] Smoke test ejecutado en iPhone real.
- [ ] Sin bloqueantes P0 abiertos.
