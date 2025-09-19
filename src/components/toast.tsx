import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type ToastType = 'success' | 'info' | 'error';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, timeoutMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(1);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', timeoutMs = 2200) => {
    const id = idRef.current++;
    const toast: Toast = { id, message, type };
    setToasts((prev) => [...prev, toast]);
    window.setTimeout(() => remove(id), timeoutMs);
  }, [remove]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              'min-w-[220px] max-w-sm px-4 py-3 rounded-lg shadow-lg border text-sm text-white animate-toast-slide-in',
              t.type === 'success' ? 'bg-green-600 border-green-500' : '',
              t.type === 'info' ? 'bg-gray-800 border-gray-700' : '',
              t.type === 'error' ? 'bg-red-600 border-red-500' : '',
            ].join(' ')}
            role="status"
            aria-live="polite"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
