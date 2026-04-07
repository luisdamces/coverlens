# Hardening Audit Baseline (Android first)

## Estado inicial
- `lint`: OK (sin errores)
- `tsc --noEmit`: OK (sin errores de tipos)
- Build blockers corregidos: exportación JSON y tipado `expo-file-system`

## Priorización de riesgos

### P0 (bloqueante de publicación)
- Corregido: uso de API de `expo-file-system` incompatible con tipos actuales.
- Corregido: inconsistencias de nombre interno de app en exportación (`PokedexGamer` -> `CoverLens`).

### P1 (alta prioridad pre-release)
- Accesibilidad: faltan labels/roles/hitSlop en acciones clave (scanner, tarjetas, ajustes).
- Feedback UX: uniformar mensajes de éxito/error y estados de carga.
- Robustez de red: endurecer timeout/reintentos en resolución de metadatos.
- Capa visual: consolidar tokens en `theme` (espaciados, tipografías, colores de estado).

### P2 (mejora importante)
- QA repetible con matriz de pruebas manual documentada.
- Tests automáticos para utilidades y reglas de resolución.
- Checklist de release Android/iOS documentada para repetir el proceso.

## Criterios de entrada a hardening
- No introducir features nuevas mientras se cierra P0/P1.
- Cada cambio debe pasar `lint` + `tsc`.
- Todo cambio de UX debe incluir validación de accesibilidad mínima.
