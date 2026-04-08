# Flujo de trabajo Android + iOS (un solo repositorio)

Este proyecto esta preparado para trabajar Android e iOS en el mismo repo.
La clave es separar por ramas y mantener una disciplina de merges.

## Estructura recomendada de ramas

- `main`: rama estable de produccion.
- `develop`: integracion general de cambios.
- `platform/android`: integracion especifica de Android.
- `platform/ios`: integracion especifica de iOS.
- `feature/<area>-<descripcion>`: trabajo funcional (UI, servicios, DB, etc.).
- `fix/<area>-<descripcion>`: correcciones rapidas.

## Reglas de merge

1. No desarrollar directamente en `main`.
2. Funcionalidades multiplataforma:
   - `feature/*` -> `develop`
3. Cambios solo Android:
   - `feature/*` -> `platform/android` -> `develop`
4. Cambios solo iOS:
   - `feature/*` -> `platform/ios` -> `develop`
5. Releases:
   - `develop` -> `main`
   - Etiquetar version (`vX.Y.Z`) cuando corresponda.

## Estructura de carpetas (practica)

- `app/`, `components/`, `services/`, `database/`: codigo compartido.
- `android/`: ajustes nativos Android (si se usan builds nativos).
- `ios/`: ajustes nativos iOS (si se usan builds nativos).
- `docs/`: procesos, checklists y decisiones tecnicas.
- `tests/`: pruebas unitarias/integracion.

## Checklist diario recomendado

1. Actualizar rama base (`develop` o `platform/*`) con pull/rebase.
2. Crear rama de trabajo: `feature/<...>`.
3. Ejecutar pruebas y lint antes de merge.
4. Merge por PR (evitar pushes directos a ramas base).

## Builds APK con EAS (checklist)

Antes de cada actualización que genere **APK** para Android, sigue el protocolo detallado (lockfile con npm 10, carpeta `C:\dev\CoverLens`, qué evitar en Windows):

- **[PROTOCOLO_ACTUALIZACION_APK_EAS.md](./PROTOCOLO_ACTUALIZACION_APK_EAS.md)**

## Configuracion inicial

1. Haz el primer commit del repositorio (si aun no existe).
2. Ejecuta:

```powershell
npm run setup:gitflow
```

Ese script crea `develop`, `platform/android` y `platform/ios` si faltan.
