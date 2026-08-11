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

export interface OrderStatusChangedPayload {
  orderId: string;
  status: number;
  statusName: string;
}

export type OrderStatusChangedHandler = (data: OrderStatusChangedPayload) => void;

export const ORDER_STATUS_LABELS_VI: Record<string | number, string> = {
  0: "Chờ xử lý",
  Pending: "Chờ xử lý",
  4: "Đang chuẩn bị",
  Preparing: "Đang chuẩn bị",
  1: "Sẵn sàng nhận món",
  ReadyForPickup: "Sẵn sàng nhận món",
  2: "Đã hoàn thành",
  Completed: "Đã hoàn thành",
  3: "Đã hủy đơn",
  Cancelled: "Đã hủy đơn",
  7: "Đã hết hạn",
  Expired: "Đã hết hạn",
};

export function getOrderStatusLabelVi(status: number | string, statusName?: string): string {
  if (statusName && ORDER_STATUS_LABELS_VI[statusName]) {
    return ORDER_STATUS_LABELS_VI[statusName];
  }
  if (status !== undefined && ORDER_STATUS_LABELS_VI[status]) {
    return ORDER_STATUS_LABELS_VI[status];
  }
  return statusName || `Trạng thái ${status}`;
}

let globalConnection: HubConnection | null = null;
let eventHandlers: EventHandler[] = [];
let orderStatusHandlers: OrderStatusChangedHandler[] = [];
let isStarting = false;
let reconnectAttempts = 0;

function notifyHandlers(notification: NotificationItem) {
  eventHandlers.forEach((handler) => handler(notification));
}

function notifyOrderStatusHandlers(payload: OrderStatusChangedPayload) {
  orderStatusHandlers.forEach((handler) => handler(payload));
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

    globalConnection.on("OrderStatusChanged", (payload: OrderStatusChangedPayload) => {
      notifyOrderStatusHandlers(payload);
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

export function useSignalr(
  handler?: EventHandler,
  onOrderStatusChanged?: OrderStatusChangedHandler,
) {
  const handlerRef = useRef<EventHandler | undefined>(handler);
  const orderStatusHandlerRef = useRef<OrderStatusChangedHandler | undefined>(onOrderStatusChanged);

  useEffect(() => {
    handlerRef.current = handler;
    orderStatusHandlerRef.current = onOrderStatusChanged;
  });

  useEffect(() => {
    if (!handler) return;
    const wrappedHandler: EventHandler = (notification) => {
      handlerRef.current?.(notification);
    };

    eventHandlers.push(wrappedHandler);

    return () => {
      eventHandlers = eventHandlers.filter((h) => h !== wrappedHandler);
    };
  }, [handler]);

  useEffect(() => {
    if (!onOrderStatusChanged) return;
    const wrappedOrderStatusHandler: OrderStatusChangedHandler = (payload) => {
      orderStatusHandlerRef.current?.(payload);
    };

    orderStatusHandlers.push(wrappedOrderStatusHandler);

    return () => {
      orderStatusHandlers = orderStatusHandlers.filter((h) => h !== wrappedOrderStatusHandler);
    };
  }, [onOrderStatusChanged]);

  const connect = useCallback(async () => {
    await startConnection();
  }, []);

  const disconnect = useCallback(async () => {
    await stopConnection();
  }, []);

  return { connect, disconnect };
}

export function useOrderStatusSignalr(handler: OrderStatusChangedHandler) {
  return useSignalr(undefined, handler);
}

export {
  startConnection as connectSignalr,
  stopConnection as disconnectSignalr,
  restartConnection,
};
