"use client";

import { useEffect, useRef, useState } from "react";
import { logService } from "@/services/log.service";
import type { LogDetail } from "@/types/log.types";
import { cn } from "@/lib/utils";

interface LogDetailDrawerProps {
  logId: string | null;
  onClose: () => void;
}

const LOG_LEVEL_META: Record<string, { color: string; bg: string; label: string }> = {
  ERROR: { color: "text-red-600", bg: "bg-red-50", label: "ERROR" },
  INFO: { color: "text-green-600", bg: "bg-green-50", label: "INFO" },
  DEBUG: { color: "text-yellow-600", bg: "bg-yellow-50", label: "DEBUG" },
};

function StatusBadge({ code }: { code: number }) {
  const color =
    code >= 500
      ? "text-red-600 bg-red-50"
      : code >= 400
        ? "text-yellow-600 bg-yellow-50"
        : "text-green-600 bg-green-50";
  return (
    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-semibold", color)}>
      {code}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function formatDuration(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return `${diff}ms`;
}

function tryFormatJson(text: string | null) {
  if (!text) return null;
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export default function LogDetailDrawer({ logId, onClose }: LogDetailDrawerProps) {
  const [detail, setDetail] = useState<LogDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchRef = useRef(0);

  useEffect(() => {
    if (!logId) return;

    const currentFetch = ++fetchRef.current;

    queueMicrotask(() => {
      if (currentFetch === fetchRef.current) {
        setDetail(null);
        setError(null);
      }
    });

    logService
      .getLogDetail(logId)
      .then((data) => {
        if (currentFetch === fetchRef.current) setDetail(data);
      })
      .catch((err) => {
        if (currentFetch === fetchRef.current) {
          setError(err instanceof Error ? err.message : "Failed to load log detail");
        }
      });
  }, [logId]);

  if (!logId) return null;

  const loading = logId !== null && detail === null && error === null;
  const levelMeta = detail ? LOG_LEVEL_META[detail.logLevel] : null;
  const showContent = detail !== null && !loading;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 transition-opacity" onClick={onClose} />

      <div className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white z-50 shadow-2xl overflow-y-auto animate-slide-in-right">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">Log Detail</h2>
            {detail && levelMeta && (
              <span
                className={cn(
                  "inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold",
                  levelMeta.color,
                  levelMeta.bg,
                )}
              >
                {detail.logLevel}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-[#D35400] border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-gray-500">Loading...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          {showContent && (
            <>
              <div className="text-xs text-gray-400">{formatDate(detail.createdDate)}</div>

              <Section title="Request">
                <InfoRow label="Method" value={detail.apiMethod} />
                <InfoRow label="URL" value={detail.apiUrl} />
                <InfoRow label="IP" value={detail.localIpAddress} />
                {detail.apiBody && <CodeBlock label="Body" code={tryFormatJson(detail.apiBody)} />}
              </Section>

              <Section title="Response">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <StatusBadge code={detail.statusCode} />
                </div>
                {detail.apiResponse && (
                  <CodeBlock label="Body" code={tryFormatJson(detail.apiResponse)} />
                )}
              </Section>

              {detail.errorTrace && (
                <Section title="Error Trace">
                  <pre className="bg-red-50 text-red-800 text-xs p-4 rounded-xl overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
                    {detail.errorTrace}
                  </pre>
                </Section>
              )}

              <Section title="Metadata">
                <InfoRow label="RequestId" value={detail.requestId} />
                <InfoRow
                  label="Duration"
                  value={formatDuration(detail.createdDate, detail.endDate)}
                />
                <InfoRow label="LoginId" value={detail.loginId || "—"} />
              </Section>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">{title}</h3>
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-sm font-medium text-gray-500 w-24 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-mono break-all">{value}</span>
    </div>
  );
}

function CodeBlock({ label, code }: { label: string; code: string | null }) {
  if (!code) return null;
  return (
    <div>
      <span className="text-sm font-medium text-gray-500 block mb-1">{label}</span>
      <pre className="bg-white border border-gray-200 text-gray-800 text-xs p-4 rounded-xl overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
        {code}
      </pre>
    </div>
  );
}
