# LoveNest

A responsive romantic website-builder MVP built with React, Vite and Supabase.

## Included
- Premium pink/white landing page and 30 starter templates
- Email/password authentication
- Simple form-based editor (title, names, message, colors)
- Save projects to Supabase
- Publish a public site and generate a downloadable QR code
- Anonymous page-view / QR-entry / button-click event tracking
- My Projects dashboard with basic analytics
- Admin route protected by a server-managed `user_roles` table
- SQL schema and Supabase Edge Function

## Important scope note
This is a working MVP foundation, not a finished Canva-level drag-and-drop editor.
The initial editor is form-based. Drag-and-drop canvas, image uploads, template marketplace,
advanced analytics charts, moderation workflows, and robust anti-abuse/rate-limiting
must be added and tested before a public production launch.

## Setup
1. Install Node.js LTS and Git.
2. Extract this folder and open a terminal in it.
3. Run `npm install`.
4. Copy `.env.example` to `.env.local`.
5. Create a Supabase project and put its Project URL and publishable/anon key in `.env.local`.
6. In Supabase SQL Editor, run `supabase/schema.sql`.
7. Create an account from the app.
8. Promote your own account to `super_admin` using the secure one-time SQL instructions in `supabase/ADMIN_SETUP.md`.
9. Run `npm run dev`.

Never put a Supabase service-role key in `.env.local` or any frontend file.

## Build
`npm run build`

## Deploy to Cloudflare Pages
- Push this project to a GitHub repository.
- In Cloudflare Pages, create a project from that repository.
- Build command: `npm run build`
- Build output directory: `dist`
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build environment variables.
- Add an SPA fallback: this package includes `public/_redirects`.
- Deploy, then add your custom domain if you have one.

## Supabase Edge Function
Deploy the analytics function:
`npx supabase login`
`npx supabase link --project-ref YOUR_PROJECT_REF`
`npx supabase functions deploy track-event`

The function uses Supabase's automatically provided `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` in its server environment. Configure `ALLOWED_ORIGIN`
as a Supabase Function secret to your deployed site origin. For local development,
use your local origin.

## Privacy
Analytics are anonymous and limited to event counts and random browser-session identifiers.
No name, email, phone number, GPS location, or message content is intentionally collected
by the analytics code. Hosting providers may independently retain technical logs.
Provide a clear privacy notice and configure appropriate retention before launch.
