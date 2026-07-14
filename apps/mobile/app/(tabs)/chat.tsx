/**
 * CONTRACT.md: "Чат: тред з дистриб'ютором." + COM-2: a "коли буде?" tap on
 * an out-of-stock product (see catalog.tsx) deep-links here with the product
 * attached so the client can send a "when available?" message in one tap.
 */
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { getChatMessages, postChatMessage } from "../../lib/api";
import type { ChatMessage } from "../../types";

export default function ChatScreen() {
  const { client } = useAuth();
  const params = useLocalSearchParams<{ productId?: string; productName?: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [attachedProduct, setAttachedProduct] = useState<{ id: string; name: string } | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (client) {
      getChatMessages(client.id).then(setMessages);
    }
  }, [client]);

  useEffect(() => {
    if (params.productId && params.productName) {
      setAttachedProduct({ id: String(params.productId), name: String(params.productName) });
      setText(`Коли буде «${params.productName}»?`);
    }
  }, [params.productId, params.productName]);

  const handleSend = async () => {
    if (!client || !text.trim()) return;
    const message = await postChatMessage(client.id, text.trim(), attachedProduct?.id ?? null);
    setMessages((prev) => [...prev, message]);
    setText("");
    setAttachedProduct(null);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Чат з дистриб&apos;ютором</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender_type === "client" ? styles.bubbleClient : styles.bubbleDistributor]}>
            {item.product_id && <Text style={styles.attachedTag}>Товар: {item.product_id}</Text>}
            <Text style={item.sender_type === "client" ? styles.bubbleTextClient : styles.bubbleTextDistributor}>
              {item.text}
            </Text>
          </View>
        )}
      />

      {attachedProduct && (
        <View style={styles.attachmentBar}>
          <Text style={styles.attachmentText}>Прикріплено: {attachedProduct.name}</Text>
          <TouchableOpacity onPress={() => setAttachedProduct(null)}>
            <Text style={styles.attachmentRemove}>Прибрати</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Повідомлення..."
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={!text.trim()}>
          <Text style={styles.sendButtonText}>Надіслати</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f9fafb" },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", backgroundColor: "#fff" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  listContent: { padding: 16, gap: 8 },
  bubble: { maxWidth: "80%", borderRadius: 14, padding: 10, marginBottom: 8 },
  bubbleClient: { backgroundColor: "#2563eb", alignSelf: "flex-end" },
  bubbleDistributor: { backgroundColor: "#e5e7eb", alignSelf: "flex-start" },
  bubbleTextClient: { color: "#fff" },
  bubbleTextDistributor: { color: "#111827" },
  attachedTag: { fontSize: 11, color: "#facc15", marginBottom: 4, fontWeight: "600" },
  attachmentBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fef3c7",
  },
  attachmentText: { fontSize: 12, color: "#92400e", flex: 1 },
  attachmentRemove: { fontSize: 12, color: "#92400e", fontWeight: "700" },
  inputBar: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: { backgroundColor: "#2563eb", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  sendButtonText: { color: "#fff", fontWeight: "600" },
});
