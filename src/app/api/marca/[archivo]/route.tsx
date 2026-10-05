import { storedKit } from "@/lib/brand";
import { brandFile, isBrandFile } from "@/lib/brand-files";
import { createClient } from "@/lib/supabase/server";

// Descargas del kit de marca. Solo para el dueño, y solo si ya compró el kit.

export async function GET(_request: Request, ctx: RouteContext<"/api/marca/[archivo]">) {
  const { archivo } = await ctx.params;
  if (!isBrandFile(archivo)) return new Response("No encontrado", { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Inicia sesión", { status: 401 });
  const { data: b } = await supabase.from("businesses").select("*").order("created_at").limit(1).maybeSingle();
  const kit = b ? storedKit(b.brand_kit, b) : null;
  if (!b || !kit) return new Response("Todavía no eliges tu kit de marca", { status: 404 });
  if (b.brand_status !== "purchased") return new Response("Compra tu kit de marca para descargarlo", { status: 402 });

  return brandFile(kit, b, archivo);
}
