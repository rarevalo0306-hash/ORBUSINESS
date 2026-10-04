# Orbusiness

Plataforma para negocios pequeños: Nuna (IA) entrevista al dueño, publica su página web, le arma un CRM a la medida de cómo trabaja y se queda como su asistente.

## Fase 1 (este código)

- Login con correo y contraseña (Supabase Auth).
- Base de datos multi-negocio en Supabase con seguridad por fila (cada negocio solo ve lo suyo).
- Alta en 5 pasos: reconocimiento (entrevista con Nuna), logo/fotos/web actual, página web publicada, CRM a la medida, activar.
- Página pública por negocio en `/sitio/<nombre>` con formulario de cotización que crea el lead en el CRM.
- Panel con el CRM por etapas.

Nuna puede usar DeepSeek o Claude (variable `NUNA_AI_PROVIDER`). Sin llave de IA, o si la IA falla, entiende respuestas con reglas simples.

## Correr localmente

```bash
cp .env.example .env.local   # y llena los valores
npm install
npm run dev
```

## Stack

Next.js 16 · Supabase (Postgres, Auth, Storage) · DeepSeek o Claude · Vercel.
