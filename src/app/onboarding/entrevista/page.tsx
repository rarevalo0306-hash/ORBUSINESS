import { ButtonLink, Card, PageTitle } from "@/components/ui";
import { requireBusiness } from "@/lib/business";
import { QUESTIONS, describeAnswer, missingQuestions } from "@/lib/interview";
import { nunaUsesAI } from "@/lib/nuna";
import { completeMissing, startFix } from "./actions";
import { InterviewChat } from "./chat";
import { RestartButton } from "./restart-button";

export default async function InterviewPage() {
  const { supabase, business } = await requireBusiness();
  const [{ data: messages }, { data: services }] = await Promise.all([
    supabase
      .from("interview_messages")
      .select("id, role, content, step_key")
      .eq("business_id", business.id)
      .order("created_at"),
    supabase.from("services").select("name, price").eq("business_id", business.id).order("sort"),
  ]);

  const step = messages?.filter((m) => m.role === "nuna").at(-1)?.step_key ?? null;
  const open = step !== "done";
  const interviewDone = business.onboarding_step !== "interview";
  const fixingKey = step?.startsWith("fix:") ? step.slice(4).split(">")[0] : null;

  const answeredKeys = new Set(
    (messages ?? [])
      .filter((m) => m.role === "owner")
      .map((m) => (m.step_key ?? "").replace(/^fix:/, "").split(">")[0]),
  );
  const missing = step === "done" ? missingQuestions(business, services ?? [], answeredKeys) : [];

  const understood = QUESTIONS.filter((q) => !q.applies || q.applies(business)).map((q) => ({
    key: q.key,
    label: q.label,
    value: describeAnswer(q.key, business, services ?? [], interviewDone),
  }));

  return (
    <>
      <PageTitle
        title="Platícame de tu negocio"
        lead={
          nunaUsesAI()
            ? "Contesta con tus palabras. Nuna (con IA) entiende tus respuestas y arma todo con ellas."
            : "Contesta con tus palabras. Nuna está en modo básico (sin IA): entiende respuestas sencillas."
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <InterviewChat messages={messages ?? []} open={open} />
          {missing.length > 0 && (
            <form action={completeMissing} className="flex flex-wrap items-center gap-3 rounded-2xl border border-lime/40 bg-lime/10 p-4">
              <p className="flex-1">
                Nuna necesita {missing.length} dato{missing.length > 1 ? "s" : ""} más para dejar todo listo (
                {missing.map((q) => q.label.toLowerCase()).join(", ")}).
              </p>
              <button className="min-h-11 rounded-full bg-lime px-5 font-semibold text-lime-ink">Completar ahora</button>
            </form>
          )}
        </div>
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Lo que Nuna entendió</h2>
            <RestartButton />
          </div>
          <dl className="flex flex-col gap-3">
            {understood.map((item) => (
              <div key={item.key} className="flex items-start justify-between gap-2 border-b border-line pb-2">
                <div className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{item.label}</dt>
                  <dd className="break-words">{item.value ?? "—"}</dd>
                </div>
                {item.value && fixingKey !== item.key && (
                  <form action={startFix.bind(null, item.key)}>
                    <button
                      className="min-h-9 shrink-0 rounded-full border border-line px-3 text-xs text-muted hover:text-bone"
                      aria-label={`Corregir ${item.label.toLowerCase()}`}
                    >
                      Corregir
                    </button>
                  </form>
                )}
              </div>
            ))}
          </dl>
        </Card>
      </div>
      {interviewDone && !open && (
        <ButtonLink href="/onboarding/marca" className="self-start">
          Seguir: logo, fotos y web →
        </ButtonLink>
      )}
    </>
  );
}
