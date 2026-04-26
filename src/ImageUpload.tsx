import { useRef, useState, useEffect } from 'react';

const CLOUDINARY_SCRIPT_URL = 'https://upload-widget.cloudinary.com/global/all.js';

let scriptState: 'idle' | 'loading' | 'ready' = 'idle';
const pendingCallbacks: (() => void)[] = [];

function ensureScript(onReady: () => void) {
  if (scriptState === 'ready') { onReady(); return; }
  pendingCallbacks.push(onReady);
  if (scriptState === 'loading') return;
  scriptState = 'loading';
  const s = document.createElement('script');
  s.src = CLOUDINARY_SCRIPT_URL;
  s.async = true;
  s.onload = () => {
    scriptState = 'ready';
    pendingCallbacks.splice(0).forEach(cb => cb());
  };
  document.body.appendChild(s);
}

declare global {
  interface Window {
    cloudinary: {
      createUploadWidget: (
        config: Record<string, unknown>,
        callback: (
          error: unknown,
          result: { event?: string; info?: Record<string, unknown> } | null
        ) => void
      ) => { open: () => void; destroy: () => void };
    };
  }
}

type Props = {
  uwConfig: Record<string, unknown>;
  onUpload: (url: string) => void;
};

export default function CloudinaryUploadWidget({ uwConfig, onUpload }: Props) {
  const [loading, setLoading] = useState(false);
  const onUploadRef  = useRef(onUpload);
  const uwConfigRef  = useRef(uwConfig);
  const widgetRef    = useRef<{ open: () => void; destroy: () => void } | null>(null);

  // Always keep refs current
  onUploadRef.current = onUpload;
  uwConfigRef.current = uwConfig;
  console.log(uwConfig)

  // Pre-load the script on mount so it's ready before first click
  useEffect(() => {
    ensureScript(() => {});
    return () => {
      widgetRef.current?.destroy?.();
      widgetRef.current = null;
    };
  }, []);

  const openWidget = () => {
    // Always read config from ref — guaranteed to have latest values
    const config = uwConfigRef.current;

    // Safety check before opening
    console.log('Opening widget with config:', config);

    if (!config.cloudName || !config.uploadPreset) {
      console.error('Missing cloudName or uploadPreset:', config);
      return;
    }

    // Destroy stale widget and create fresh one with current config
    widgetRef.current?.destroy?.();
    widgetRef.current = window.cloudinary.createUploadWidget(
      config,
      (error, result) => {
        if (error) { console.error('Cloudinary error:', error); return; }
        if (result?.event === 'success' && result.info) {
          const url = result.info['secure_url'] as string | undefined;
          if (url) onUploadRef.current(url);
        }
      }
    );
    widgetRef.current.open();
  };

  const handleClick = () => {
    if (scriptState === 'ready') {
      openWidget();
    } else {
      setLoading(true);
      ensureScript(() => {
        setLoading(false);
        openWidget();
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? '⏳ Loading...' : '📤 Upload Image'}
    </button>
  );
}