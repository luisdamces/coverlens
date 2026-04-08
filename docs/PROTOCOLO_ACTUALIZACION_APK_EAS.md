# Protocolo de actualización de la app (APK / EAS Build)

Documento de **checklist obligatoria** antes de cada actualización que vaya a generar una **APK** o una build en **EAS**. Resume problemas que ya nos han ocurrido y cómo evitarlos.

## 1. Dónde trabajamos (una sola verdad)

- **Código y builds Android con EAS:** usar la copia en disco local **`C:\dev\CoverLens`** (ruta corta, sin OneDrive). Es la que está enlazada al proyecto EAS `@luisutr/coverlens`.
- **Repo Git / Expo Go en el día a día:** puede ser la carpeta de **OneDrive** (`PokedexGamer`), pero **antes de construir la APK** hay que **traer los mismos cambios** a `C:\dev\CoverLens` (merge, pull o copia controlada) para no subir a EAS código viejo o distinto.
- **No mezclar** builds Gradle nativos entre dos carpetas con **distintos `node_modules`**: en el pasado eso rompió rutas CMake (reanimated / worklets) y librerías nativas.

## 2. Antes de tocar dependencias (`package.json`)

Cada vez que añadas, quites o cambies versiones en `package.json`:

1. En la carpeta del build (**`C:\dev\CoverLens`**), regenera el lock con la **misma major de npm que usa EAS** (hoy **npm 10.x**):

   ```powershell
   cd C:\dev\CoverLens
   npx --yes npm@10.9.3 install --package-lock-only
   ```

2. Comprueba que **`npm ci` funcionaría en los servidores de Expo** (EAS ejecuta `npm ci --include=dev`):

   ```powershell
   npx --yes npm@10.9.3 ci --include=dev
   ```

3. **Sube siempre `package-lock.json` a Git** en el mismo commit/PR que el cambio de `package.json`.

### Por qué es obligatorio

- **Ya falló EAS** con `npm error EUSAGE` / “package.json and package-lock.json are not in sync” y paquetes “Missing … from lock file”.
- En tu PC puedes tener **npm 11**; EAS usa **npm 10**. Un lock generado solo con npm 11 a veces **no es válido** para `npm ci` en EAS. Por eso el comando con **`npx npm@10.9.3`**.

## 3. Antes de lanzar `eas build` (APK)

En **`C:\dev\CoverLens`**:

1. `git status` limpio o solo cambios que quieras incluir en la build.
2. `eas login` si hace falta (`eas whoami`).
3. Perfil **`preview`** en `eas.json` con **`"android": { "buildType": "apk" }`** (ya lo tenemos; no cambiar a AAB si quieres instalar directo en móviles).
4. Comando:

   ```powershell
   eas build -p android --profile preview
   ```

5. **Cola gratuita de EAS:** puede tardar mucho (horas en cola). La build en sí, una vez arranca, suele ser razonable. El enlace de seguimiento sale en consola y en [expo.dev](https://expo.dev).

## 4. Después de que termine la build

- Descargar la **APK** desde el enlace que da Expo (o QR en la página del build).
- Opcional: copiar al móvil por USB con `adb push` a `/sdcard/Download/…` para instalar desde el gestor de archivos.

## 5. Compartir con amigos (Android)

- **Sí:** enlace o QR al **`.apk`**.
- **No:** iPhone **no instala APK**. Para iOS hace falta flujo Apple (p. ej. TestFlight) + cuenta de desarrollador de pago; sin eso, **Expo Go** en iPhone.

## 6. Build nativa local en Windows (Gradle) — solo si la necesitas

- Primera compilación puede tardar **mucho** (módulos nativos: Expo, Reanimated, Worklets, etc.).
- En Windows ha aparecido el error de **`libc++_shared.so` “not a regular file”** (hardlinks / reparse y Gradle 8). Si vuelve a pasar, priorizar **EAS Build** o revisar parches en `android/build.gradle` del proyecto nativo.
- Trabajar **solo desde una ruta** de proyecto y un solo `node_modules` coherente.

## 7. Checklist rápido (copiar antes de cada release APK)

- [ ] Cambios integrados en **`C:\dev\CoverLens`** (al día con Git / OneDrive según tu flujo).
- [ ] Si hubo cambios en **`package.json`**: lock regenerado con **`npx npm@10.9.3 install --package-lock-only`** y verificado con **`npx npm@10.9.3 ci --include=dev`**.
- [ ] **`package-lock.json`** commiteado y subido a GitHub.
- [ ] **`eas build -p android --profile preview`**
- [ ] Guardar enlace del build / APK para testers o para copiar al móvil.

## 8. Referencias internas

- Flujo general de ramas: [WORKFLOW_ANDROID_IOS.md](./WORKFLOW_ANDROID_IOS.md)

---

*Última revisión: protocolo redactado tras incidencias de `npm ci` en EAS y builds nativas en Windows.*
