"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { Proposal } from "../proposal-card";
import { compareBrains, type BrainResult } from "./actions";

const LETTERS = ["A", "B", "C", "D"];

// Prueba a ciegas: los cerebros salen en orden al azar como A, B, C; al final se revela cuál es cuál.
export function CompareBrains({ name }: { name: string }) {
  const [results, setResults] = useState<BrainResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [pending, start] = useTransition();

  function run() {
    setError(null);
    setRevealed(false);
    start(async () => {
      try {
        const out = await compareBrains();
        if (out.error) setError(out.error);
        setResults([...out.results].sort(() => Math.random() - 0.5));
      } catch {
        setError("La prueba no terminó. Intenta de nuevo.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={run} disabled={pending}>
          {pending ? "Los cerebros están pensando… (1 a 2 minutos)" : results ? "Hacer otra prueba" : "Hacer la prueba"}
        </Button>
        {results && results.length > 0 && (
          <Button type="button" variant="ghost" onClick={() => setRevealed((r) => !r)}>
            {revealed ? "Ocultar cuál es cuál" : "Mostrar cuál es cuál"}
          </Button>
        )}
      </div>
      {error && <p role="alert" className="text-muted">{error}</p>}

      {results?.map((r, i) => (
        <section key={r.id} className="flex flex-col gap-4" aria-labelledby={`cerebro-${r.id}`}>
          <h2 id={`cerebro-${r.id}`} className="font-display text-2xl font-bold">
            Cerebro {LETTERS[i]}
            {revealed && <span className="text-lime"> = {r.label}</span>}
            <span className="ml-3 text-sm font-normal text-muted">tardó {r.seconds} s</span>
          </h2>
          {r.error ? (
            <p className="text-muted">{r.error}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {r.kits.map((kit) => (
                <Proposal key={kit.name} kit={kit} name={name} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
