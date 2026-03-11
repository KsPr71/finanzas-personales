import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import Constants from "expo-constants";
import { Link } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import Separator from "@/components/ui/separator";
import { Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

function AppDrawerContent(props: DrawerContentComponentProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[
        styles.drawerScroll,
        { backgroundColor: colors.surface },
      ]}
    >
      <View
        style={[
          styles.drawerHeader,
          {
            backgroundColor: colors.surfaceMuted,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Image
          source={require("../../assets/images/logo-main.png")}
          style={styles.drawerLogo1}
          resizeMode="contain"
        />
        <Text style={[styles.drawerTitle, { color: colors.text }]}>
          Finanzas Personales
        </Text>
        <Text style={[styles.drawerVersion, { color: colors.textMuted }]}>
          Version {appVersion}
        </Text>
        <Text style={[styles.drawerSubtitle, { color: colors.textSubtle }]}>
          Panel financiero
        </Text>
      </View>
      <View style={styles.drawerMenu}>
        <DrawerItemList {...props} />
      </View>
      <Separator />
      <View>
        <View
          style={[
            styles.info,
            {
              borderColor: colors.borderStrong,
              backgroundColor: colors.background,
            },
          ]}
        >
          <Link href="/modal" style={[styles.link, { color: colors.tint }]}>
            Informacion de la aplicacion
          </Link>
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Drawer
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        sceneStyle: {
          backgroundColor: colors.background,
        },
        drawerStyle: {
          backgroundColor: colors.surface,
          width: 292,
        },
        drawerActiveTintColor: colors.tint,
        drawerInactiveTintColor: colors.textMuted,
        drawerActiveBackgroundColor: `${colors.tint}1f`,
        drawerItemStyle: styles.drawerItem,
        drawerLabelStyle: [styles.drawerLabel, { color: colors.text }],
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: styles.headerTitle,
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            <Image
              source={require("../../assets/images/logo-main.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
        ),
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Resumen",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons size={size} name="dashboard" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="reports"
        options={{
          title: "Reportes",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons size={size} name="analytics" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="accounts"
        options={{
          title: "Cuentas",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons
              size={size}
              name="account-balance-wallet"
              color={color}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="transactions"
        options={{
          title: "Transacciones",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons size={size} name="receipt-long" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="categories"
        options={{
          title: "Categorias",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons size={size} name="category" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="transfers"
        options={{
          title: "Transferencias",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons size={size} name="swap-horiz" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: "Ajustes",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons size={size} name="settings" color={color} />
          ),
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerScroll: {
    paddingTop: 0,
  },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 10,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  drawerLogo: {
    width: 136,
    height: 62,
    marginBottom: 2,
  },
  drawerLogo1: {
    width: 136,
    height: 62,
    marginBottom: 2,
    marginTop: 40,
  },
  drawerTitle: {
    fontSize: 17,
    fontWeight: "800",
    fontFamily: Fonts.sans,
  },
  drawerVersion: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: "600",
  },
  drawerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  drawerMenu: {
    paddingTop: 4,
  },
  drawerItem: {
    borderRadius: 12,
    marginHorizontal: 10,
    marginVertical: 2,
  },
  drawerLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginLeft: -4,
    fontFamily: Fonts.sans,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.2,
    fontFamily: Fonts.sans,
  },
  headerRightContainer: {
    marginRight: 12,
  },
  headerLogo: {
    width: 150,
    height: 60,
  },
  link: {
    marginTop: 4,
    fontWeight: "700",
    fontSize: 14,
    //textDecorationLine: "underline",
    fontFamily: Fonts.sans,
  },
  info: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 10,
  },
});
