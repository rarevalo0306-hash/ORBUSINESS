"use server";

import { kitPalette, type BrandKit } from "@/lib/brand";
import { proposeKits } from "@/lib/brand-ai";
import { drawSymbols, recraftEnabled } from "@/lib/brand-recraft";
import { requireBusiness } from "@/lib/business";
import type { Provider } from "@/lib/nuna";

// Prueba interna: la misma entrevista pasa por varios "cerebros" y se comparan sus 3 propuestas de
// marca. No guarda nada en el negocio. Cuesta alrededor de US$1 por prueba (símbolos incluidos).

const BRAINS: { id: string; label: string; provider: Provider; model?: string; needs: string }[] = [
  { id: "deepseek", label: "DeepSeek", provider: "deepseek", needs: "DEEPSEEK_API_KEY" },
  { id: "astra", label: "OpenAI GPT-6 Astra (el más potente)", provider: "openai", model: "gpt-6-astra", needs: "OPENAI_API_KEY" },
];
const DAILY_TESTS = 3;

export type BrainResult = { id: string; label: string; seconds: number; kits: BrandKit[]; error?: string };

export async function compareBrains(): Promise<{ results: BrainResult[]; error?: string }> {
  const { supabase, user, business } = await requireBusiness();
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await supabase
    .from("audit_log")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("action", "brand.brain_compare")
    .gte("created_at", since);
  if ((count ?? 0) >= DAILY_TESTS) return { results: [], error: `Ya se hicieron ${DAILY_TESTS} pruebas hoy. Intenta mañana.` };

  const { data: services } = await supabase.from("services").select("name").eq("business_id", business.id).order("sort");
  const brains = BRAINS.filter((b) => process.env[b.needs]?.trim());

  const results = await Promise.all(
    brains.map(async (brain): Promise<BrainResult> => {
      const start = Date.now();
      try {
        const kits = await proposeKits(business, services ?? [], { provider: brain.provider, model: brain.model });
        const seconds = Math.round((Date.now() - start) / 1000);
        // Mismo dibujante (Recraft) para todos: 1 símbolo por propuesta, con la idea que escribió cada cerebro.
        const drawn = recraftEnabled()
          ? await Promise.all(
              kits.map(async (kit) => {
                const p = kitPalette(kit);
                const [symbol] = await drawSymbols({ idea: kit.symbolIdea || kit.concept, industry: business.industry, colors: [p.primary, p.accent, p.dark], n: 1 });
                return symbol ? { ...kit, mark: "ia" as const, aiMark: symbol, aiChoices: [symbol] } : kit;
              }),
            )
          : kits;
        return { id: brain.id, label: brain.label, seconds, kits: drawn };
      } catch (error) {
        console.error(`Comparación de cerebros (${brain.id}) falló:`, error);
        return { id: brain.id, label: brain.label, seconds: Math.round((Date.now() - start) / 1000), kits: [], error: "No respondió bien" };
      }
    }),
  );

  await supabase.from("audit_log").insert({
    business_id: business.id,
    actor: "owner",
    actor_user_id: user.id,
    action: "brand.brain_compare",
    data: { results: results.map((r) => ({ id: r.id, seconds: r.seconds, kits: r.kits.map((k) => k.name), error: r.error ?? null })) },
  });
  return { results };
}
