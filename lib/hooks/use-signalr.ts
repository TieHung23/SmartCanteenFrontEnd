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

type EventHandler = (data: NotificationItem) => void;

let globalConnection: HubConnection | null = null;
let eventHandlers: EventHandler[] = [];
let isStarting = false;

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
      .configureLogging(LogLevel.Warning)
      .build();

    globalConnection.on("NotificationReceived", (notification: NotificationItem) => {
      notifyHandlers(notification);
    });

    globalConnection.onreconnecting(() => {
      console.warn("[SignalR] Reconnecting...");
    });

    globalConnection.onreconnected(() => {
      console.info("[SignalR] Reconnected");
    });

    globalConnection.onclose(() => {
      console.warn("[SignalR] Connection closed");
    });

    await globalConnection.start();
    console.info("[SignalR] Connected");
  } catch (error) {
    console.error("[SignalR] Connection failed:", error);
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
