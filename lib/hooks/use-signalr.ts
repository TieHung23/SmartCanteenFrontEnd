"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  HubConnectionBuilder,
  HubConnection,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { env } from "@/config/env";
import { getAccessToken } from "@/lib/auth-token-storage";
import type { NotificationItem } from "@/types/notification.types";

const HUB_URL = `${env.NEXT_PUBLIC_API_URL}/hubs/notifications`;
const MAX_RECONNECT_ATTEMPTS = 5;

type EventHandler = (data: NotificationItem) => void;

let globalConnection: HubConnection | null = null;
let eventHandlers: EventHandler[] = [];
let isStarting = false;
let reconnectAttempts = 0;

function notifyHandlers(notification: NotificationItem) {
  eventHandlers.forEach((handler) => handler(notification));
}

async function startConnection() {
  if (isStarting) return;
  isStarting = true;

  try {
    const token = getAccessToken();
    if (!token) {
      isStarting = false;
      return;
    }

    if (globalConnection?.state === HubConnectionState.Connected) {
      isStarting = false;
      return;
    }

    if (globalConnection) {
      await globalConnection.stop();
    }

    globalConnection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => getAccessToken() ?? "",
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Error)
      .build();

    globalConnection.on("NotificationReceived", (notification: NotificationItem) => {
      notifyHandlers(notification);
    });

    globalConnection.onreconnecting(() => {
      reconnectAttempts++;
      if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
        console.warn(`[SignalR] Reconnecting... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
      }
    });

    globalConnection.onreconnected(() => {
      reconnectAttempts = 0;
      console.info("[SignalR] Reconnected");
    });

    globalConnection.onclose((error) => {
      if (error?.message?.includes("401")) {
        console.warn("[SignalR] Closed due to auth error, not retrying");
        return;
      }
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.warn("[SignalR] Max reconnect attempts reached, stopped retrying");
        return;
      }
    });

    await globalConnection.start();
    reconnectAttempts = 0;
    console.info("[SignalR] Connected");
  } catch {
    reconnectAttempts++;
    if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
      console.warn(`[SignalR] Connection failed (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    }
  } finally {
    isStarting = false;
  }
}

async function stopConnection() {
  isStarting = false;
  if (globalConnection) {
    try {
      await globalConnection.stop();
    } catch {}
    globalConnection = null;
  }
}

async function restartConnection() {
  reconnectAttempts = 0;
  await stopConnection();
  await startConnection();
}

export function useSignalr(handler?: EventHandler) {
  const handlerRef = useRef<EventHandler | undefined>(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const wrappedHandler: EventHandler = (notification) => {
      handlerRef.current?.(notification);
    };

    if (handler) {
      eventHandlers.push(wrappedHandler);
    }

    return () => {
      if (handler) {
        eventHandlers = eventHandlers.filter((h) => h !== wrappedHandler);
      }
    };
  }, [handler]);

  const connect = useCallback(async () => {
    await startConnection();
  }, []);

  const disconnect = useCallback(async () => {
    await stopConnection();
  }, []);

  return { connect, disconnect };
}

export {
  startConnection as connectSignalr,
  stopConnection as disconnectSignalr,
  restartConnection,
};
