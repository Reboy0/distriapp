"use client";

import { useEffect, useRef } from "react";
import { getToken } from "./auth";
import { API_BASE_URL } from "./api";
import type { ChatMessage, Order } from "@/types";

export type WsEvent =
  | { type: "chat_message"; client_id: string; message: ChatMessage }
  | { type: "order_update"; order: Order };

function wsUrl(token: string): string {
  const httpUrl = new URL(API_BASE_URL);
  const protocol = httpUrl.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${httpUrl.host}${httpUrl.pathname}/ws?token=${encodeURIComponent(token)}`;
}

/**
 * Live-update channel (chat messages, order changes) so screens don't need
 * a manual refresh or polling. Reconnects with backoff on drop; silently
 * does nothing if there's no token yet (login page).
 */
export function useLiveUpdates(onEvent: (event: WsEvent) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    function connect() {
      socket = new WebSocket(wsUrl(token!));
      socket.onmessage = (ev) => {
        try {
          onEventRef.current(JSON.parse(ev.data) as WsEvent);
        } catch {
          // ignore malformed frames
        }
      };
      socket.onclose = () => {
        if (!stopped) retryTimer = setTimeout(connect, 3000);
      };
      socket.onerror = () => socket?.close();
    }

    connect();
    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, []);
}
