"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

// Botón de formulario que se desactiva y cambia el texto mientras el servidor trabaja.
export function SubmitButton({
  pendingText,
  children,
  disabled,
  ...props
}: ComponentProps<typeof Button> & { pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
