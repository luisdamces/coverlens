# QA Matrix - CoverLens (Mobile Hardening)

## Scope
- Plataforma objetivo principal: Android (release)
- Plataforma secundaria: iOS (ready for TestFlight/App Store)
- Áreas: Colección, Escáner, Ajustes, Detalle de juego, Metadatos, Exportación

## Smoke técnico (ejecutado)
| Check | Command | Resultado |
|---|---|---|
| Lint | `npm run lint` | PASS |
| Typecheck | `npx tsc --noEmit` | PASS |
| Config Expo | `npx expo config --type public` | PASS |
| Parse config | `node -e JSON.parse(app.json)` | PASS |

## Matriz funcional de regresión

### 1) Colección
- [ ] Abre app con catálogo vacío y muestra estado vacío correctamente.
- [ ] Tocar tarjeta abre detalle full-screen.
- [ ] Eliminar juego desde tarjeta pide confirmación y elimina.
- [ ] FAB abre escáner siempre.

### 2) Escáner barcode
- [ ] Escanear barcode válido crea juego automáticamente.
- [ ] Escanear barcode duplicado no crea duplicado ni rompe flujo.
- [ ] Si barcode no encontrado, abre modal manual.
- [ ] Confirmar título manual guarda juego correctamente.
- [ ] Cancelar modal reactiva escáner.

### 3) OCR y alta manual
- [ ] OCR sin librería instalada muestra mensaje informativo.
- [ ] OCR con título detectado permite editar y guardar.
- [ ] Alta manual por título guarda en catálogo.

### 4) Ajustes y mantenimiento
- [ ] Guardar credenciales persiste tras reiniciar app.
- [ ] Diagnóstico IGDB muestra estado y resultados.
- [ ] Reintento masivo de metadatos procesa pendientes.
- [ ] Limpieza de duplicados elimina entradas repetidas.
- [ ] Exportar JSON genera y comparte archivo.

### 5) Metadatos y consistencia
- [ ] Status `resolved/partial/error` se refleja en tarjetas.
- [ ] No degrade en reintento (no pisa datos buenos con desconocidos).
- [ ] Plataforma consistente (GameCube, PlayStation 4, etc.).
- [ ] Versión especial detectada (Hits/Player's Choice/Platinum).

### 6) Accesibilidad básica
- [ ] Botones principales con etiquetas en lector de pantalla.
- [ ] Acciones pequeñas (trash/FAB) tienen área táctil suficiente.
- [ ] Contraste correcto en textos secundarios y estados.
- [ ] Flujo usable con tamaño de fuente aumentado.

## Criterios de salida QA
- 0 bloqueantes P0 abiertos.
- Flujos críticos (scan -> save -> open -> retry -> export) verificados en dispositivo real.
- Sin crashes en sesión de 15+ minutos de uso continuo.
