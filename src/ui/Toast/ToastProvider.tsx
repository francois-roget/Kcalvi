import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import Toast from './Toast';

const AUTO_DISMISS_MS = 2200;

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((next: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setMessage(next);
    timeoutRef.current = setTimeout(() => setMessage(null), AUTO_DISMISS_MS);
  }, []);

  // Clears the pending auto-dismiss on unmount. In the app this never fires -- the provider
  // sits at the root and lives as long as the process -- but under Jest each test unmounts it,
  // and a 2.2s timer left running keeps the worker alive past the run ("A worker process has
  // failed to exit gracefully", seen on CI).
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message ? <Toast message={message} /> : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
