"use client";

import { paymentService, type TopUpPolicy } from "@/services/payment.service";
import { useApiData } from "./useApiData";

export function useCurrency() {
  const { data } = useApiData<TopUpPolicy>(() => paymentService.getTopUpPolicy(), []);

  const vndPerPoint = data?.vndPerPoint ?? 1000;
  const pointName = data?.pointName ?? "Point";
  const currency = data?.currency ?? "VND";
  const minTopUpAmount = data?.minTopUpAmount ?? 10000;
  const maxTopUpAmount = data?.maxTopUpAmount ?? 10000000;

  const formatPoints = (points: number) => new Intl.NumberFormat("vi-VN").format(points);

  const formatPointCurrency = (points: number) =>
    `${new Intl.NumberFormat("vi-VN").format(points * vndPerPoint)} ${currency}`;

  const convertVndToPoints = (vnd: number) => Math.floor(vnd / vndPerPoint);

  return {
    vndPerPoint,
    pointName,
    currency,
    minTopUpAmount,
    maxTopUpAmount,
    formatPoints,
    formatPointCurrency,
    convertVndToPoints,
  };
}
