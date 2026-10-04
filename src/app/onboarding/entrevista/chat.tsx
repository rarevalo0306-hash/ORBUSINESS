"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Fish } from "@/components/fish";
import { Button } from "@/components/ui";
import { answerInterview } from "./actions";

type Message = { id: string; role: string; content: string };

export function InterviewChat({ messages, open }: { messages: Message[]; open: boolean }) {
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length, pending]);

  function send(text: string) {
    if (!text.trim() || pending) return;
    setDraft("");
    startTransition(() => answerInterview(text));
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={listRef}
        aria-live="polite"
        className="flex h-[26rem] flex-col gap-4 overflow-y-auto rounded-2xl border border-line bg-panel p-4"
      >
        {messages.map((m) =>
          m.role === "owner" ? (
            <p key={m.id} className="max-w-[80%] self-end rounded-2xl rounded-br-md bg-panel-2 px-4 py-2.5">
              {m.content}
            </p>
          ) : (
            <div key={m.id} className="flex max-w-[90%] gap-3">
              <Fish size={26} className="mt-0.5 shrink-0 text-lime" />
              <p className="leading-relaxed">{m.content}</p>
            </div>
          ),
        )}
        {pending && (
          <div className="flex gap-3 text-muted">
            <Fish size={26} className="shrink-0 text-lime" />
            <span>Nuna está escribiendo…</span>
          </div>
        )}
      </div>

      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
          className="flex gap-2"
        >
          <label htmlFor="answer" className="sr-only">
            Tu respuesta
          </label>
          <input
            id="answer"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoComplete="off"
            placeholder="Escribe tu respuesta…"
            className="min-h-12 flex-1 rounded-full border border-line bg-panel px-5 placeholder:text-muted/70"
          />
          <Button type="submit" disabled={pending || !draft.trim()}>
            Enviar
          </Button>
        </form>
      )}
    </div>
  );
}
