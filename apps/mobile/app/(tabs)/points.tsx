/**
 * CONTRACT.md: "Точки: список точок клієнта, додавання нової (назва,
 * адреса), індикатор блокування з поясненням."
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Pill } from "../../components/Badge";
import { createPoint, getOrders, getPoints } from "../../lib/api";
import { getPointBlockStatus } from "../../lib/rules";
import type { Order, PointOfSale } from "../../types";

export default function PointsScreen() {
  const [points, setPoints] = useState<PointOfSale[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async () => {
    const [pts, ords] = await Promise.all([getPoints(), getOrders()]);
    setPoints(pts);
    setOrders(ords);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load]);

  const handleAddPoint = async () => {
    if (!name.trim() || !address.trim()) return;
    setIsSubmitting(true);
    try {
      const point = await createPoint({ name: name.trim(), address: address.trim() });
      setPoints((prev) => [...prev, point]);
      setName("");
      setAddress("");
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <Text style={styles.headerTitle}>Точки</Text>
        <TouchableOpacity onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.addLink}>{showForm ? "Скасувати" : "+ Додати точку"}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Назва точки" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Адреса" value={address} onChangeText={setAddress} />
          <TouchableOpacity
            style={[styles.submitButton, (!name.trim() || !address.trim() || isSubmitting) && styles.submitButtonDisabled]}
            disabled={!name.trim() || !address.trim() || isSubmitting}
            onPress={handleAddPoint}
          >
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Зберегти</Text>}
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={points}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const block = getPointBlockStatus(item, orders);
          return (
            <View style={[styles.card, block.blocked && styles.cardBlocked]}>
              <View style={styles.cardTop}>
                <Text style={styles.pointName}>{item.name}</Text>
                {block.blocked ? <Pill label="Боржник" tone="danger" /> : <Pill label="Активна" tone="success" />}
              </View>
              <Text style={styles.pointAddress}>{item.address}</Text>
              {item.deferment_until && <Text style={styles.deferment}>Відстрочка до {item.deferment_until}</Text>}
              {block.blocked && block.reason && <Text style={styles.blockReason}>{block.reason}</Text>}
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#111827" },
  addLink: { color: "#2563eb", fontWeight: "600" },
  form: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  submitButton: { backgroundColor: "#2563eb", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: "#fff", fontWeight: "600" },
  listContent: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardBlocked: { borderColor: "#fecaca", backgroundColor: "#fef2f2" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pointName: { fontSize: 15, fontWeight: "600", color: "#111827", flex: 1, marginRight: 8 },
  pointAddress: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  deferment: { fontSize: 12, color: "#92400e", marginTop: 4 },
  blockReason: { fontSize: 12, color: "#991b1b", marginTop: 8, lineHeight: 17 },
});
