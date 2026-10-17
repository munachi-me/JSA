import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);
  const inputRef = useRef(null);

  const close = useCallback((value) => {
    const resolve = resolver.current;
    resolver.current = null;
    setDialog(null);
    resolve?.(value);
  }, []);

  const open = useCallback((config) => new Promise((resolve) => {
    resolver.current?.(null);
    resolver.current = resolve;
    setDialog(config);
  }), []);

  const alert = useCallback((message, options = {}) => open({
    kind: 'alert', title: options.title || 'Notice', message: String(message), tone: options.tone || 'info',
  }), [open]);
  const confirm = useCallback((message, options = {}) => open({
    kind: 'confirm', title: options.title || 'Please confirm', message: String(message), tone: options.tone || 'warning',
    confirmText: options.confirmText || 'Confirm', cancelText: options.cancelText || 'Cancel',
  }), [open]);
  const prompt = useCallback((message, defaultValue = '', options = {}) => open({
    kind: 'prompt', title: options.title || 'Enter a value', message: String(message), value: String(defaultValue ?? ''),
    placeholder: options.placeholder || '', confirmText: options.confirmText || 'Save', cancelText: options.cancelText || 'Cancel',
  }), [open]);

  useEffect(() => {
    if (!dialog) return undefined;
    if (dialog.kind === 'prompt') inputRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); close(null); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dialog, close]);

  const value = { alert, confirm, prompt };
  const Icon = dialog?.tone === 'warning' ? AlertTriangle : dialog?.tone === 'success' ? CheckCircle2 : dialog?.tone === 'error' ? AlertCircle : Info;

  return (
    <DialogContext.Provider value={value}>
      {children}
      {dialog && (
        <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(null); }}>
          <section className="dialog-panel" role="alertdialog" aria-modal="true" aria-labelledby="jsa-dialog-title" aria-describedby="jsa-dialog-message">
            <div className={`dialog-icon ${dialog.tone || 'info'}`}><Icon size={21} aria-hidden /></div>
            <button type="button" className="dialog-close" aria-label="Close dialog" onClick={() => close(null)}><X size={18} aria-hidden /></button>
            <h2 id="jsa-dialog-title">{dialog.title}</h2>
            <p id="jsa-dialog-message">{dialog.message}</p>
            {dialog.kind === 'prompt' && <input ref={inputRef} className="dialog-input" aria-label="Value" value={dialog.value} placeholder={dialog.placeholder} onChange={(e) => setDialog((current) => ({ ...current, value: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); close(dialog.value); } }} />}
            <div className="dialog-actions">
              {dialog.kind !== 'alert' && <button type="button" className="btn" onClick={() => close(null)}>{dialog.cancelText || 'Cancel'}</button>}
              <button type="button" className="btn primary" onClick={() => close(dialog.kind === 'confirm' ? true : dialog.kind === 'prompt' ? dialog.value : true)}>{dialog.kind === 'alert' ? 'Got it' : dialog.confirmText || 'Confirm'}</button>
            </div>
          </section>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialogs() {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialogs must be used inside DialogProvider.');
  return context;
}
