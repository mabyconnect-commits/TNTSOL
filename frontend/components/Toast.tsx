"use client";

import { createContext, useCallback, useContext, useRef, useState, ReactNode } from "react";

type Kind = "pending" | "success" | "error" | "info";
type Toast = { id: number; kind: Kind; title: string; sub?: string };

type RunTx = {
  pending: { title: string; sub?: string };
  success: { title: string; sub?: string };
  errorTitle?: string;
  action?: () => Promise<void>;
  delay?: number;
};

type ToastApi = {
  push: (kind: Kind, title: string, sub?: string) => number;
  dismiss: (id: number) => void;
  runTx: (opts: RunTx) => Promise<void>;
};

const ToastContext = createContext<ToastApi | null>(null);

const ICON: Record<Kind, string> = { pending: "◌", success: "✓", error: "✕", info: "ⓘ" };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (kind: Kind, title: string, sub?: string) => {
      const id = ++idRef.current;
      setToasts((t) => [...t, { id, kind, title, sub }]);
      if (kind !== "pending") setTimeout(() => dismiss(id), 4200);
      return id;
    },
    [dismiss]
  );

  const update = useCallback((id: number, kind: Kind, title: string, sub?: string) => {
    setToasts((t) => t.map((x) => (x.id === id ? { ...x, kind, title, sub } : x)));
    if (kind !== "pending") setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  const runTx = useCallback(
    async ({ pending, success, errorTitle, action, delay = 1300 }: RunTx) => {
      const id = push("pending", pending.title, pending.sub);
      try {
        if (action) await action();
        else await new Promise((r) => setTimeout(r, delay));
        update(id, "success", success.title, success.sub);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Transaction failed";
        update(id, "error", errorTitle ?? "Transaction failed", msg);
      }
    },
    [push, update]
  );

  return (
    <ToastContext.Provider value={{ push, dismiss, runTx }}>
      {children}
      <div className="toast-wrap" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`} onClick={() => dismiss(t.id)}>
            <span className={`toast-ic ${t.kind === "pending" ? "spin" : ""}`}>{ICON[t.kind]}</span>
            <div className="toast-body">
              <div className="toast-title">{t.title}</div>
              {t.sub ? <div className="toast-sub">{t.sub}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
