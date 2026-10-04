import { redirect } from "next/navigation";
import { Button, PageTitle } from "@/components/ui";
import { publicAssetUrl, requireBusiness } from "@/lib/business";
import { saveBrand } from "./actions";
import { Uploader } from "./uploader";

const OPTIONS = [
  { value: "new", label: "No tengo página / hazme una nueva", note: "Nuna diseña una página nueva para tu negocio." },
  {
    value: "keep_existing",
    label: "Sí tengo, quiero usar la mía",
    note: "Conservas tu página y le agregamos el chat de Nuna y el formulario de cotización.",
  },
  {
    value: "rebuild",
    label: "Sí tengo, pero quiero una nueva",
    note: "Nuna toma ideas de tu página actual y diseña una nueva.",
  },
];

export default async function BrandPage() {
  const { supabase, business } = await requireBusiness();
  if (business.onboarding_step === "interview") redirect("/onboarding/entrevista");

  const [{ data: assets }, { data: website }] = await Promise.all([
    supabase.from("brand_assets").select("id, kind, storage_path").eq("business_id", business.id).order("created_at"),
    supabase.from("websites").select("source, existing_url").eq("business_id", business.id).maybeSingle(),
  ]);
  const withUrls = (assets ?? []).map((a) => ({ id: a.id, kind: a.kind, url: publicAssetUrl(a.storage_path) }));
  const source = website?.source ?? "new";

  return (
    <>
      <PageTitle
        title="Logo, fotos y tu página actual"
        lead="Todo es opcional. Si tienes material, súbelo; si no, Nuna lo resuelve por ti."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Uploader
          businessId={business.id}
          kind="logo"
          label="Logo"
          emptyNote="Sin logo: Nuna usa las iniciales del negocio."
          multiple={false}
          assets={withUrls.filter((a) => a.kind === "logo")}
        />
        <Uploader
          businessId={business.id}
          kind="photo"
          label="Fotos de tus trabajos"
          emptyNote="Sin fotos: la página muestra espacios para agregarlas después."
          multiple
          assets={withUrls.filter((a) => a.kind === "photo")}
        />
      </div>

      <form action={saveBrand} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5">
          <legend className="px-1 font-semibold">¿Ya tienes página web?</legend>
          {OPTIONS.map((o) => (
            <label key={o.value} className="flex min-h-11 cursor-pointer items-start gap-3">
              <input type="radio" name="source" value={o.value} defaultChecked={source === o.value} className="mt-1.5 size-4 accent-lime" />
              <span className="flex flex-col">
                <span className="font-semibold">{o.label}</span>
                <span className="text-sm text-muted">{o.note}</span>
              </span>
            </label>
          ))}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="existing_url" className="text-sm font-semibold text-muted">
              Si tienes página, ¿cuál es la dirección?
            </label>
            <input
              id="existing_url"
              name="existing_url"
              defaultValue={website?.existing_url ?? ""}
              placeholder="www.minegocio.com"
              className="min-h-12 rounded-xl border border-line bg-ink px-4 placeholder:text-muted/70"
            />
          </div>
        </fieldset>
        <Button type="submit" className="self-start">
          Listo → diseñar mi página
        </Button>
      </form>
    </>
  );
}
