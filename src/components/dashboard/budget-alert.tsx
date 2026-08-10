import { useState } from 'react';
import { AlertTriangle, CheckCircle2, DollarSign, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const KEY = 'cd-budget';

function loadBudget(): number | null {
  const raw = localStorage.getItem(KEY);
  const n = raw ? parseFloat(raw) : NaN;
  return isNaN(n) ? null : n;
}

function saveBudget(n: number | null) {
  if (n === null) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, String(n));
}

function formatCost(n: number): string {
  if (n >= 100) return `$${n.toFixed(0)}`;
  if (n >= 10) return `$${n.toFixed(1)}`;
  return `$${n.toFixed(2)}`;
}

interface BudgetAlertProps {
  currentMonthCost: number | null;
}

export function BudgetAlert({ currentMonthCost }: BudgetAlertProps) {
  const [budget, setBudget] = useState<number | null>(loadBudget);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');

  const spent = currentMonthCost ?? 0;
  const pct = budget ? Math.min((spent / budget) * 100, 100) : 0;
  const isOver = budget !== null && spent > budget;
  const isWarning = budget !== null && !isOver && pct >= 80;

  function commitBudget() {
    const n = parseFloat(inputVal);
    if (!isNaN(n) && n > 0) {
      saveBudget(n);
      setBudget(n);
    }
    setEditing(false);
    setInputVal('');
  }

  function clearBudget() {
    saveBudget(null);
    setBudget(null);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="px-3 pb-3">
        <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">Monthly budget</p>
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
            <input
              autoFocus
              type="number"
              min="0"
              step="1"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitBudget(); if (e.key === 'Escape') setEditing(false); }}
              placeholder="50"
              className="w-full rounded-md border border-input bg-background pl-5 pr-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <button
            onClick={commitBudget}
            className="rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground"
          >
            Set
          </button>
        </div>
      </div>
    );
  }

  if (budget === null) {
    return (
      <div className="px-3 pb-3">
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <DollarSign className="h-3 w-3" />
          Set monthly budget
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 pb-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {isOver ? (
            <AlertTriangle className="h-3 w-3 text-destructive" />
          ) : isWarning ? (
            <AlertTriangle className="h-3 w-3 text-amber-500" />
          ) : (
            <CheckCircle2 className="h-3 w-3 text-primary" />
          )}
          <span className={cn(
            'text-[11px] font-medium',
            isOver ? 'text-destructive' : isWarning ? 'text-amber-500' : 'text-foreground'
          )}>
            {formatCost(spent)} / {formatCost(budget)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setEditing(true)} className="text-[10px] text-muted-foreground hover:text-foreground">edit</button>
          <button onClick={clearBudget} className="text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', isOver ? 'bg-destructive' : isWarning ? 'bg-amber-500' : 'bg-primary')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isOver && (
        <p className="text-[10px] text-destructive">Budget exceeded by {formatCost(spent - budget)}</p>
      )}
    </div>
  );
}
