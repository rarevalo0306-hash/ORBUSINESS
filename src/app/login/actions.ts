"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { normalizePhone } from "@/lib/markets";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; notice?: string };

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) return { error: "Escribe tu correo y tu contraseña." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Correo o contraseña incorrectos." };
  redirect("/onboarding");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  if (!email) return { error: "Escribe tu correo." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });
  if (error) return { error: error.message };
  if (data.session) redirect("/onboarding");
  return { notice: "Te mandamos un correo para confirmar tu cuenta. Ábrelo y toca el enlace." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// Entrar con Google o Facebook (la cuenta se crea sola la primera vez).
export async function signInWithProvider(provider: "google" | "facebook") {
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${origin}/auth/confirm` } });
  if (error || !data.url) redirect("/login?error=proveedor");
  redirect(data.url);
}

// Entrar con WhatsApp: se manda un código de 6 números al WhatsApp y se escribe aquí.
export type WhatsappState = { error?: string; notice?: string; phone?: string };

export async function sendWhatsappCode(_prev: WhatsappState, formData: FormData): Promise<WhatsappState> {
  const phone = normalizePhone(String(formData.get("phone") ?? ""), null);
  if (!phone) return { error: "Escribe tu número con el código de país. Por ejemplo: +505 8888 7777 o +1 305 555 1234." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone, options: { channel: "whatsapp" } });
  if (error) return { error: "No pudimos mandar el código por WhatsApp. Revisa el número e intenta de nuevo." };
  return { phone, notice: "Te mandamos un código por WhatsApp. Escríbelo aquí." };
}

export async function verifyWhatsappCode(_prev: WhatsappState, formData: FormData): Promise<WhatsappState> {
  const phone = String(formData.get("phone") ?? "");
  const token = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (!phone || token.length < 6) return { phone, error: "Escribe los 6 números del código." };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error) return { phone, error: "El código no es correcto o ya venció. Pide otro." };
  redirect("/onboarding");
}
