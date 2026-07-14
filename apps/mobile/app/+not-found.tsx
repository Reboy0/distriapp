import { Link, Stack } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Не знайдено" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Цей екран не існує.</Text>
        <Link href="/(tabs)/catalog" style={styles.link}>
          <Text style={styles.linkText}>Повернутися до каталогу</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20, gap: 12 },
  title: { fontSize: 18, fontWeight: "600" },
  link: { marginTop: 8, paddingVertical: 12 },
  linkText: { color: "#2563eb", fontWeight: "600" },
});
