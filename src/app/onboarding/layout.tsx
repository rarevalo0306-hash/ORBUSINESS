import { Wordmark } from "@/components/fish";
import { getOwnerContext } from "@/lib/business";
import { signOut } from "@/app/login/actions";
import { StepNav } from "./step-nav";

export default async function OnboardingLayout({ children }: LayoutProps<"/onboarding">) {
  const { business } = await getOwnerContext();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-6 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Wordmark />
        <form action={signOut}>
          <button className="min-h-11 text-sm text-muted underline underline-offset-4 hover:text-bone">Salir</button>
        </form>
      </header>
      {business && <StepNav reached={business.onboarding_step} />}
      <main className="flex flex-1 flex-col gap-6">{children}</main>
    </div>
  );
}
