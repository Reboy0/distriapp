import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { AvailabilityStatus } from "../types";
import { AVAILABILITY_LABELS } from "../lib/rules";

const AVAILABILITY_COLORS: Record<AvailabilityStatus, { bg: string; fg: string }> = {
  available: { bg: "#dcfce7", fg: "#166534" },
  low_stock: { bg: "#fef3c7", fg: "#92400e" },
  out_of_stock: { bg: "#fee2e2", fg: "#991b1b" },
};

export function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  const colors = AVAILABILITY_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.fg }]}>{AVAILABILITY_LABELS[status]}</Text>
    </View>
  );
}

export function NewBadge() {
  return (
    <View style={[styles.badge, { backgroundColor: "#dbeafe" }]}>
      <Text style={[styles.text, { color: "#1e40af" }]}>новинка</Text>
    </View>
  );
}

export function Pill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "danger" | "success" | "warning" }) {
  const palette = {
    neutral: { bg: "#e5e7eb", fg: "#374151" },
    danger: { bg: "#fee2e2", fg: "#991b1b" },
    success: { bg: "#dcfce7", fg: "#166534" },
    warning: { bg: "#fef3c7", fg: "#92400e" },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
