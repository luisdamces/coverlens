import { Orbitron_700Bold, Orbitron_900Black, useFonts } from '@expo-google-fonts/orbitron';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ApiCredentials,
  getApiCredentials,
  hasIgdbConfigured,
  providerLinks,
  saveApiCredentials,
} from '../services/credentialsStore';
import { completeFirstRunTour, enableFirstRunTour } from '../services/firstRunTour';
import { setOnboardingDone } from '../services/onboardingState';

const BRAND = {
  blue: '#0b74de',
  blueDark: '#0856a8',
  ink: '#142a40',
  muted: '#5c6d7e',
  cardBg: '#f5f9ff',
  border: '#cfe0f5',
};

const TOTAL_STEPS = 5;

function Badge({ label, tone }: { label: string; tone: 'core' | 'recommended' | 'optional' }) {
  const bg =
    tone === 'core'
      ? 'rgba(11,116,222,0.15)'
      : tone === 'recommended'
        ? 'rgba(46,204,113,0.15)'
        : 'rgba(149,165,166,0.2)';
  const color = tone === 'core' ? BRAND.blue : tone === 'recommended' ? '#1e8449' : BRAND.muted;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Orbitron_700Bold,
    Orbitron_900Black,
  });
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState<ApiCredentials>({
    screenScraperUsername: '',
    screenScraperPassword: '',
    screenScraperDevId: '',
    screenScraperDevPassword: '',
    steamGridDbApiKey: '',
    igdbClientId: '',
    igdbClientSecret: '',
    priceChartingToken: '',
    ebayClientId: '',
    ebayClientSecret: '',
    ebayMarketplaceId: 'EBAY_ES',
  });

  React.useEffect(() => {
    getApiCredentials().then(setForm).catch(() => {});
  }, []);

  const openLink = React.useCallback((url: string) => {
    void Linking.openURL(url);
  }, []);

  const setField = React.useCallback((key: keyof ApiCredentials, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const goNext = React.useCallback(() => {
    if (step < TOTAL_STEPS - 1) setStep((prev) => prev + 1);
  }, [step]);

  const goBack = React.useCallback(() => {
    if (step > 0) setStep((prev) => prev - 1);
  }, [step]);

  const skipEntireOnboarding = React.useCallback(() => {
    Alert.alert(
      '¿Saltar configuración?',
      'Podrás rellenar las APIs más tarde en Ajustes. No iniciaremos la guía práctica del escáner.',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Saltar',
          style: 'destructive',
          onPress: async () => {
            await completeFirstRunTour();
            await setOnboardingDone(true);
            router.replace('/(tabs)');
          },
        },
      ]
    );
  }, [router]);

  const finish = React.useCallback(async () => {
    if (!hasIgdbConfigured(form)) {
      Alert.alert(
        'Sin IGDB',
        'Sin Client ID y Secret de IGDB, al escanear códigos de barras los metadatos suelen salir incompletos y las cabeceras de imagen peor. ¿Seguir igualmente?',
        [
          { text: 'Volver', style: 'cancel' },
          {
            text: 'Continuar',
            onPress: async () => {
              await saveApiCredentials(form);
              await setOnboardingDone(true);
              await enableFirstRunTour();
              router.replace('/(tabs)/escaner');
            },
          },
        ]
      );
      return;
    }
    await saveApiCredentials(form);
    await setOnboardingDone(true);
    await enableFirstRunTour();
    router.replace('/(tabs)/escaner');
  }, [form, router]);

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={BRAND.blue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Text style={styles.progress}>
            Paso {step + 1} / {TOTAL_STEPS}
          </Text>
          {step === 0 ? (
            <Pressable onPress={skipEntireOnboarding} hitSlop={12}>
              <Text style={styles.skipLink}>Saltar</Text>
            </Pressable>
          ) : (
            <View style={{ width: 48 }} />
          )}
        </View>

        {step === 0 ? (
          <View style={styles.heroCard}>
            <View style={styles.logoRow}>
              <Image source={require('../assets/images/icon.png')} style={styles.logo} contentFit="contain" />
              <View style={{ flex: 1 }}>
                <Text style={styles.brandName}>CoverLens</Text>
                <Text style={styles.tagline}>Tu colección de videojuegos, clara y visual</Text>
              </View>
            </View>
            <Text style={styles.heroBody}>
              Organiza juegos con portadas, metadatos y valoración orientativa. Importa desde Playnite, escanea códigos de
              barras o añade títulos a mano.
            </Text>
            <Text style={styles.heroBody}>
              Algunas imágenes (p. ej. GameplayStores en la cadena de portadas) no necesitan cuenta. Para{' '}
              <Text style={styles.heroEm}>códigos de barras y metadatos fiables</Text>, IGDB es la pieza más importante.
            </Text>
            <Text style={styles.heroBodyMuted}>
              En los siguientes pasos podrás pegar claves opcionales que mejoran carátulas y fuentes de respaldo. Todo se
              guarda en Ajustes y lo puedes cambiar cuando quieras.
            </Text>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.title, { fontFamily: 'Orbitron_700Bold' }]}>IGDB</Text>
              <Badge label="Núcleo escáner" tone="core" />
            </View>
            <Text style={styles.body}>
              Conecta con Twitch Developer Console. Estos datos son los que usa la app para resolver título, plataforma y
              datos al leer un barcode, y para cabeceras oficiales cuando aplica.
            </Text>
            <TextInput
              style={styles.input}
              value={form.igdbClientId}
              onChangeText={(v) => setField('igdbClientId', v)}
              placeholder="Client ID"
              placeholderTextColor={BRAND.muted}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              value={form.igdbClientSecret}
              onChangeText={(v) => setField('igdbClientSecret', v)}
              placeholder="Client Secret"
              placeholderTextColor={BRAND.muted}
              autoCapitalize="none"
              secureTextEntry
            />
            <Pressable onPress={() => openLink(providerLinks.igdb)}>
              <Text style={styles.link}>Crear credenciales en Twitch →</Text>
            </Pressable>
            <Pressable
              style={styles.textBtn}
              onPress={() =>
                Alert.alert(
                  'Continuar sin IGDB',
                  'Podrás configurarlo luego en Ajustes. El escáner y los metadatos funcionarán peor hasta que lo hagas.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Siguiente paso', onPress: goNext },
                  ]
                )
              }
            >
              <Text style={styles.textBtnLabel}>Continuar sin IGDB →</Text>
            </Pressable>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.title, { fontFamily: 'Orbitron_700Bold' }]}>SteamGridDB</Text>
              <Badge label="Recomendado" tone="recommended" />
            </View>
            <Text style={styles.body}>
              Muchas portadas del catálogo pueden resolverse sin clave propia, pero con tu API key sube mucho la tasa de
              aciertos cuando el título no coincide a la primera.
            </Text>
            <TextInput
              style={styles.input}
              value={form.steamGridDbApiKey}
              onChangeText={(v) => setField('steamGridDbApiKey', v)}
              placeholder="API Key (opcional)"
              placeholderTextColor={BRAND.muted}
              autoCapitalize="none"
              secureTextEntry
            />
            <Pressable onPress={() => openLink(providerLinks.steamGridDb)}>
              <Text style={styles.link}>Obtener API key →</Text>
            </Pressable>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.title, { fontFamily: 'Orbitron_700Bold' }]}>ScreenScraper</Text>
              <Badge label="Opcional" tone="optional" />
            </View>
            <Text style={styles.body}>
              Último recurso en la cadena de portadas cuando otras fuentes no devuelven imagen. Solo necesario si quieres
              exprimir al máximo las carátulas «difíciles».
            </Text>
            <TextInput
              style={styles.input}
              value={form.screenScraperUsername}
              onChangeText={(v) => setField('screenScraperUsername', v)}
              placeholder="Usuario"
              placeholderTextColor={BRAND.muted}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              value={form.screenScraperPassword}
              onChangeText={(v) => setField('screenScraperPassword', v)}
              placeholder="Contraseña"
              placeholderTextColor={BRAND.muted}
              autoCapitalize="none"
              secureTextEntry
            />
            <Pressable onPress={() => openLink(providerLinks.screenScraper)}>
              <Text style={styles.link}>Crear cuenta ScreenScraper →</Text>
            </Pressable>
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.card}>
            <Text style={[styles.title, { fontFamily: 'Orbitron_700Bold' }]}>Guía práctica</Text>
            <Text style={styles.body}>
              Al pulsar «Guardar y guía», guardamos lo que hayas escrito y te llevamos al Escaner. Verás indicaciones en
              pantalla: pestaña escáner → leer un código → abrir el juego en la colección → «Actualizar portadas» en la
              ficha.
            </Text>
            <Text style={styles.bodyMuted}>
              PriceCharting y eBay se configuran en Ajustes cuando los necesites; no hacen falta para este primer recorrido.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={goBack} disabled={step === 0} style={[styles.btnSecondary, step === 0 && styles.btnDisabled]}>
          <Text style={styles.btnSecondaryText}>Atrás</Text>
        </Pressable>
        {step < TOTAL_STEPS - 1 ? (
          <Pressable onPress={goNext} style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryText}>Siguiente</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => void finish()} style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryText}>Guardar y guía</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 130 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  progress: {
    fontSize: 12,
    color: BRAND.muted,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipLink: { color: BRAND.blue, fontWeight: '700', fontSize: 14 },
  heroCard: {
    backgroundColor: BRAND.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 20,
    gap: 12,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logo: { width: 64, height: 64, borderRadius: 14 },
  brandName: {
    fontFamily: 'Orbitron_900Black',
    fontSize: 28,
    color: BRAND.ink,
    letterSpacing: 1,
  },
  tagline: { fontSize: 14, color: BRAND.blue, fontWeight: '700', marginTop: 4 },
  heroBody: { fontSize: 15, lineHeight: 23, color: BRAND.ink },
  heroEm: { fontWeight: '800', color: BRAND.blueDark },
  heroBodyMuted: { fontSize: 13, lineHeight: 20, color: BRAND.muted },
  card: {
    backgroundColor: BRAND.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND.border,
    padding: 18,
    gap: 10,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  title: { fontSize: 20, fontWeight: '800', color: BRAND.ink },
  body: { fontSize: 14, lineHeight: 21, color: BRAND.ink },
  bodyMuted: { fontSize: 13, lineHeight: 19, color: BRAND.muted },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: BRAND.ink,
  },
  link: { color: BRAND.blue, fontSize: 14, fontWeight: '700', textDecorationLine: 'underline', marginTop: 4 },
  textBtn: { marginTop: 6 },
  textBtnLabel: { color: BRAND.muted, fontSize: 13, fontWeight: '600' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: BRAND.blue,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  btnPrimaryText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#eef3f8',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  btnSecondaryText: { color: BRAND.ink, fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.45 },
});
