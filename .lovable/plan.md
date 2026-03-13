
## Elemzés: Mi az aktuális helyzet?

### Screenshot alapján: az app BETÖLT a GitHub Pages-en

A screenshot egyértelműen mutatja:
- "MeetFix" felirat megjelenik (helyes branding)
- Hero kártya látható: "Plan group meetups effortlessly"
- "Continue with Google" gomb megjelenik
- "Guest mode active" szöveg látható
- PWA telepítő gomb (jobb alsó sarok)

Ez azt jelenti: **az app betölt, a Supabase kapcsolat működik** (a `VITE_SUPABASE_URL` és `VITE_SUPABASE_PUBLISHABLE_KEY` sikeresen be lettek állítva).

### Mi a probléma a Google bejelentkezéssel?

Az auth logokból kritikus hiba látható:
```
"error": "missing OAuth secret"
"msg": "400: Unsupported provider: missing OAuth secret"
```
Ez azt jelenti: a Supabase projektben **nincs beállítva a Google OAuth Client ID és Secret**. A natív `supabase.auth.signInWithOAuth({ provider: "google" })` hívás emiatt 400 hibával tér vissza.

### A tényleges probléma gyökere

Az `useAuth.tsx`-ben a Google signin natív Supabase OAuth-ot használ:
```ts
supabase.auth.signInWithOAuth({ provider: "google", ... })
```

Ez a Supabase saját Google OAuth integrációját hívja, aminek szüksége van Google Client ID + Secret beállítására a Supabase Authentication > Providers > Google menüben.

**VISZONT**: A projekt rendelkezik `src/integrations/lovable/index.ts` fájllal, ami a `@lovable.dev/cloud-auth-js` csomagot használja — ez a Lovable Cloud managed Google OAuth, ami NEM igényel külön Google Console beállítást.

A megoldás: migrálni a `signInWithGoogle` függvényt a `lovable.auth.signInWithOAuth("google")` hívásra a `src/hooks/useAuth.tsx`-ben és a `src/components/GoogleSignInButton.tsx`-ben.

### Összefoglalás

| Komponens | Státusz |
|---|---|
| App betöltés | MŰKÖDIK |
| Supabase DB kapcsolat | MŰKÖDIK |
| Google bejelentkezés | HIBÁS - missing OAuth secret |

### Terv

**1. `src/hooks/useAuth.tsx`** — `signInWithGoogle` metódus cseréje:
- `supabase.auth.signInWithOAuth({ provider: "google" })` helyett `lovable.auth.signInWithOAuth("google", { redirect_uri: "https://teddysnowden.github.io/MeetFix/#/auth" })`

**2. `src/components/GoogleSignInButton.tsx`** — ugyanaz, nem kell változtatni, mert a `signInWithGoogle` a `useAuth` hookból jön, tehát automatikusan frissül.

**3. `src/pages/AuthCallback.tsx`** — ellenőrzöm, megfelelően kezeli-e a Lovable Cloud OAuth visszatérést.

A `lovable.auth.signInWithOAuth` a `src/integrations/lovable/index.ts`-ben már implementálva van — csak az `useAuth.tsx`-ben kell átváltani.
