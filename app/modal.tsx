import { PremiumScrollView } from "@/components/premium-scroll-view";
import { Colors, type AppColorPalette } from "@/constants/theme";
import { usePremiumUI } from "@/hooks/use-premium-ui";
import { getAppVersion } from "@/lib/app-version";
import { Link } from "expo-router";
import { useMemo } from "react";
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ModalScreen() {
  const { colors, ui } = usePremiumUI();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const appVersion = getAppVersion();

  return (
    <PremiumScrollView contentContainerStyle={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>ACERCA DE LA APP</Text>
      </View>
      <Text style={ui.title}>Finanzas Personales</Text>
      <Text style={styles.versionText}>Version {appVersion}</Text>
      <View style={ui.section}>
        <Text style={styles.text}>
          Esta aplicacion te permite gestionar cuentas, categorias,
          transacciones y transferencias internas
        </Text>
      </View>
      <View style={[styles.infoApp, { backgroundColor: Colors.light.surface }]}>
        <TouchableOpacity
          onPress={() =>
            Linking.openURL("https://landing-page-ten-pi-77.vercel.app/")
          }
        >
          <Image
            source={require("@/assets/images/novadev1.png")}
            style={{ width: 150, height: 60 }}
          />
        </TouchableOpacity>
      </View>
      <Link href="/" dismissTo style={[styles.link, { color: colors.tint }]}>
        Volver al resumen
      </Link>
    </PremiumScrollView>
  );
}

const createStyles = (colors: AppColorPalette) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: "center",
      gap: 16,
    },
    infoApp: {
      marginHorizontal: 10,
      marginVertical: 10,
      padding: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.light.border,
      elevation: 5,

      alignItems: "center",
    },
    badge: {
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 5,
      backgroundColor: colors.surfaceMuted,
    },
    badgeText: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.9,
    },
    text: {
      color: colors.textMuted,
      fontSize: 15,
      lineHeight: 24,
    },
    versionText: {
      color: colors.textSubtle,
      fontSize: 13,
      fontWeight: "700",
      marginTop: -4,
    },
    link: {
      fontSize: 14,
      fontWeight: "700",
      textDecorationLine: "underline",
    },
  });
