/**
 * CONTRACT.md: "Каталог: товари з ціною (ПДВ), статус наявності, бейдж
 * «новинка», кнопка «коли буде?» -> в чат."
 */
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AvailabilityBadge, NewBadge } from "../../components/Badge";
import { useCart } from "../../context/CartContext";
import { getCatalog } from "../../lib/api";
import { formatMoney, getAvailabilityStatus } from "../../lib/rules";
import type { Product } from "../../types";

export default function CatalogScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { addProduct, selectedPointId } = useCart();

  const load = useCallback(async () => {
    const data = await getCatalog(selectedPointId);
    setProducts(data);
  }, [selectedPointId]);

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  const askWhenAvailable = (product: Product) => {
    // Deep-link intent into the Chat tab with the product attached, per
    // COM-2 ("коли буде товар?" -> прикріплене повідомлення в чат). Full
    // chat wiring (pre-filling + auto-send) is stubbed via query params;
    // the chat screen picks these up and shows an attached product card.
    router.push({
      pathname: "/(tabs)/chat",
      params: { productId: product.id, productName: product.name },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Каталог</Text>
        <Text style={styles.headerSubtitle}>Усі ціни вказані з ПДВ</Text>
      </View>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>Немає товарів</Text> : null}
        renderItem={({ item }) => {
          const status = getAvailabilityStatus(item);
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.is_new && <NewBadge />}
              </View>
              <Text style={styles.unit}>{item.unit}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.price}>{formatMoney(item.base_price_with_vat)}</Text>
                <AvailabilityBadge status={status} />
              </View>
              {status === "out_of_stock" ? (
                <TouchableOpacity style={styles.whenButton} onPress={() => askWhenAvailable(item)}>
                  <Text style={styles.whenButtonText}>Коли буде?</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.addButton} onPress={() => addProduct(item)}>
                  <Text style={styles.addButtonText}>Додати в кошик</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#111827" },
  headerSubtitle: { fontSize: 13, color: "#6b7280", marginTop: 2 },
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
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  name: { fontSize: 16, fontWeight: "600", color: "#111827", flex: 1 },
  unit: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  price: { fontSize: 18, fontWeight: "700", color: "#111827" },
  addButton: {
    marginTop: 12,
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "600" },
  whenButton: {
    marginTop: 12,
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  whenButtonText: { color: "#92400e", fontWeight: "600" },
});
