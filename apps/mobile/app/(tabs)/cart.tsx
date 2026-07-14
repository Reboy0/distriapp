/**
 * CONTRACT.md: "Кошик: позиції, довільна кількість, сума; кнопка «Замовити»
 * без екрана підтвердження." ORD-3: pressing "Замовити" creates the order
 * immediately - there is deliberately no confirmation screen/dialog here.
 */
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useCart } from "../../context/CartContext";
import { createOrder, getPoints } from "../../lib/api";
import { formatMoney } from "../../lib/rules";
import type { PointOfSale } from "../../types";

export default function CartScreen() {
  const { lines, setQty, removeProduct, clear, totalSum, selectedPointId, setSelectedPointId } = useCart();
  const [points, setPoints] = useState<PointOfSale[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getPoints().then((pts) => {
      setPoints(pts);
      if (!selectedPointId && pts.length > 0) {
        setSelectedPointId(pts[0].id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = lines.length > 0 && !!selectedPointId && !isSubmitting;

  const handleSubmit = async () => {
    if (!selectedPointId) {
      Alert.alert("Оберіть точку", "Спершу оберіть торгову точку для замовлення.");
      return;
    }
    setIsSubmitting(true);
    try {
      // Immediate submit - no confirmation step by design (ORD-3).
      await createOrder({
        point_id: selectedPointId,
        items: lines.map((l) => ({
          product_id: l.product.id,
          qty: l.qty,
          unit_price_with_vat: l.unit_price_with_vat,
        })),
      });
      clear();
      Alert.alert("Замовлення відправлено", "Замовлення передається дистриб'ютору.", [
        { text: "OK", onPress: () => router.push("/(tabs)/orders") },
      ]);
    } catch (e) {
      Alert.alert("Помилка", "Не вдалося створити замовлення. Спробуйте ще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Кошик</Text>
        <Text style={styles.headerSubtitle}>Ціни вказані з ПДВ</Text>
      </View>

      <View style={styles.pointSelector}>
        <Text style={styles.pointSelectorLabel}>Точка:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {points.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.pointChip, selectedPointId === p.id && styles.pointChipActive]}
              onPress={() => setSelectedPointId(p.id)}
            >
              <Text style={[styles.pointChipText, selectedPointId === p.id && styles.pointChipTextActive]} numberOfLines={1}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={lines}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>Кошик порожній. Додайте товари з каталогу.</Text>}
        renderItem={({ item }) => (
          <View style={styles.line}>
            <View style={styles.lineInfo}>
              <Text style={styles.lineName} numberOfLines={2}>
                {item.product.name}
              </Text>
              <Text style={styles.lineUnitPrice}>
                {formatMoney(item.unit_price_with_vat)} / {item.product.unit}
              </Text>
            </View>
            <TextInput
              style={styles.qtyInput}
              keyboardType="numeric"
              value={String(item.qty)}
              onChangeText={(text) => setQty(item.product.id, Number(text.replace(/[^0-9.]/g, "")) || 0)}
            />
            <Text style={styles.lineSum}>{formatMoney(item.qty * item.unit_price_with_vat)}</Text>
            <TouchableOpacity onPress={() => removeProduct(item.product.id)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>x</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Разом:</Text>
          <Text style={styles.totalValue}>{formatMoney(totalSum)}</Text>
        </View>
        <TouchableOpacity style={[styles.orderButton, !canSubmit && styles.orderButtonDisabled]} disabled={!canSubmit} onPress={handleSubmit}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.orderButtonText}>Замовити</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#111827" },
  headerSubtitle: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  pointSelector: { paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  pointSelectorLabel: { fontSize: 13, color: "#374151", fontWeight: "600" },
  pointChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    maxWidth: 220,
  },
  pointChipActive: { backgroundColor: "#2563eb" },
  pointChipText: { fontSize: 12, color: "#374151" },
  pointChipTextActive: { color: "#fff", fontWeight: "600" },
  listContent: { padding: 16, gap: 10, flexGrow: 1 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
  line: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  lineInfo: { flex: 1 },
  lineName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  lineUnitPrice: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  qtyInput: {
    width: 56,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    textAlign: "center",
    paddingVertical: 6,
  },
  lineSum: { width: 80, textAlign: "right", fontWeight: "700", color: "#111827" },
  removeButton: { paddingHorizontal: 6, paddingVertical: 2 },
  removeButtonText: { color: "#9ca3af", fontSize: 16, fontWeight: "700" },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  totalLabel: { fontSize: 16, color: "#374151" },
  totalValue: { fontSize: 20, fontWeight: "700", color: "#111827" },
  orderButton: { backgroundColor: "#16a34a", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  orderButtonDisabled: { opacity: 0.5 },
  orderButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
