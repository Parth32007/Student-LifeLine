import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, X, ArrowRight, CornerDownLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onRefresh }) => {
  const [command, setCommand] = useState('');
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{ message: string; action_taken: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setResult(null);
          setCommand('');
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || executing) return;

    setExecuting(true);
    setResult(null);
    try {
      const res = await api.executeCommand(command);
      setResult({ message: res.message, action_taken: res.action_taken });
      if (res.action_taken && onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      setResult({ message: err.message || 'Could not process command', action_taken: false });
    } finally {
      setExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl bg-card border border-border/80 shadow-2xl overflow-hidden">
        {/* Input Header */}
        <form onSubmit={handleExecute} className="flex items-center px-4 py-3.5 border-b border-border">
          <Sparkles className="h-5 w-5 text-indigo-500 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Type an academic command: 'Add DSA task for 30 mins', 'Plan DBMS in 7 days'..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {command && (
            <button
              type="button"
              onClick={() => setCommand('')}
              className="p-1 text-muted-foreground hover:text-foreground mr-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={executing || !command.trim()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
          >
            {executing ? (
              <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Run</span>
                <CornerDownLeft className="h-3 w-3" />
              </>
            )}
          </button>
        </form>

        {/* Result Area */}
        {result && (
          <div className="p-4 bg-secondary/30 border-b border-border text-sm flex items-start gap-2.5">
            {result.action_taken ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div className="text-foreground leading-relaxed">{result.message}</div>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div className="p-3 bg-card text-xs text-muted-foreground">
          <div className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground mb-2 px-1">
            Example Commands
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {[
              'What should I study now?',
              'Show my weakest topics',
              'Add DSA Binary Search practice for 45 mins',
              'Plan 7-day study countdown for DBMS',
            ].map((sugg) => (
              <button
                key={sugg}
                type="button"
                onClick={() => setCommand(sugg)}
                className="flex items-center justify-between p-2 rounded-xl text-left bg-secondary/40 hover:bg-secondary text-foreground text-xs transition-colors"
              >
                <span className="truncate">{sugg}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
