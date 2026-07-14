/**
 * CONTRACT.md: "Замовлення: історія зі статусами життєвого циклу та оплати,
 * фільтр за точкою."
 */
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Pill } from "../../components/Badge";
import { getOrderItems, getOrders, getPoints } from "../../lib/api";
import { ORDER_PAYMENT_LABELS, ORDER_STATUS_LABELS, formatMoney, shortId } from "../../lib/rules";
import type { Order, OrderItem, PointOfSale } from "../../types";

const PAYMENT_TONE: Record<Order["payment_status"], "neutral" | "danger" | "success"> = {
  none: "neutral",
  unpaid: "danger",
  paid: "success",
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [points, setPoints] = useState<PointOfSale[]>([]);
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, OrderItem[]>>({});
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (pointId: string | null) => {
    const [ords, pts] = await Promise.all([getOrders({ pointId }), getPoints()]);
    setOrders(ords);
    setPoints(pts);
    const entries = await Promise.all(ords.map(async (o) => [o.id, await getOrderItems(o.id)] as const));
    setItemsByOrder(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    load(selectedPointId).finally(() => setIsLoading(false));
  }, [load, selectedPointId]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Замовлення</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, selectedPointId === null && styles.filterChipActive]}
          onPress={() => setSelectedPointId(null)}
        >
          <Text style={[styles.filterChipText, selectedPointId === null && styles.filterChipTextActive]}>Усі точки</Text>
        </TouchableOpacity>
        {points.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.filterChip, selectedPointId === p.id && styles.filterChipActive]}
            onPress={() => setSelectedPointId(p.id)}
          >
            <Text style={[styles.filterChipText, selectedPointId === p.id && styles.filterChipTextActive]} numberOfLines={1}>
              {p.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>Замовлень немає</Text>}
        renderItem={({ item }) => {
          const point = points.find((p) => p.id === item.point_id);
          const items = itemsByOrder[item.id] ?? [];
          const total = items.reduce((sum, i) => sum + i.sum, 0);
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.orderId}>№{shortId(item.id)}</Text>
                <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString("uk-UA")}</Text>
              </View>
              <Text style={styles.pointName}>{point?.name ?? item.point_id}</Text>
              <View style={styles.badgeRow}>
                <Pill label={ORDER_STATUS_LABELS[item.status]} tone={item.status === "cancelled" ? "danger" : "neutral"} />
                <Pill label={ORDER_PAYMENT_LABELS[item.payment_status]} tone={PAYMENT_TONE[item.payment_status]} />
              </View>
              {item.cancel_comment && <Text style={styles.cancelComment}>Причина скасування: {item.cancel_comment}</Text>}
              <Text style={styles.total}>{formatMoney(total)}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#111827" },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "#e5e7eb", marginRight: 8, maxWidth: 200 },
  filterChipActive: { backgroundColor: "#2563eb" },
  filterChipText: { fontSize: 12, color: "#374151" },
  filterChipTextActive: { color: "#fff", fontWeight: "600" },
  listContent: { padding: 16, gap: 12 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between" },
  orderId: { fontWeight: "700", color: "#111827" },
  orderDate: { color: "#9ca3af", fontSize: 12 },
  pointName: { fontSize: 13, color: "#374151", marginTop: 4 },
  badgeRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  cancelComment: { fontSize: 12, color: "#991b1b", marginTop: 8 },
  total: { fontSize: 16, fontWeight: "700", color: "#111827", marginTop: 10, textAlign: "right" },
});
