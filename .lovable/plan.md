
## Root cause analysis

There are **3 separate issues** causing the blank page on GitHub Pages:

### Issue 1: `index.html` manifest link uses absolute path (no subpath)
```html
<link rel="manifest" href="/manifest.json" />
```
This resolves to `https://teddysnowden.github.io/manifest.json` (404). Should be `/MeetFix/manifest.json`.

### Issue 2: `index.html` service worker registration uses wrong path
```js
navigator.serviceWorker.register('/sw.js');
```
This resolves to `https://teddysnowden.github.io/sw.js` (404). Should be `/MeetFix/sw.js`.

### Issue 3: GitHub Actions — missing GitHub Secrets (user must set manually)
The workflow injects `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from repo secrets. If these are **not set** in the GitHub repository secrets, the build compiles with `undefined` values → `createClient(undefined, undefined)` → the app crashes silently on load (blank white page).

The Supabase client reads:
```ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;       // undefined if secret missing
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY; // undefined
```
`createClient(undefined, undefined)` throws, causing a blank screen.

### Issue 4: Console warning (non-blocking, but fix anyway)
`Badge` and `ChecklistModal` components receive refs but aren't wrapped in `React.forwardRef`. These are warnings, not blank-page causes.

---

## What I will fix (code changes)

**File: `index.html`**
- Change `href="/manifest.json"` → `href="/MeetFix/manifest.json"`
- Change `navigator.serviceWorker.register('/sw.js')` → `navigator.serviceWorker.register('/MeetFix/sw.js')`

**File: `src/integrations/supabase/client.ts`** — **AUTO-GENERATED, cannot edit**
Instead, add a crash guard in `src/main.tsx` that shows a readable error if env vars are missing, to help diagnose production builds.

Actually — the client.ts is auto-generated and always uses `import.meta.env.VITE_SUPABASE_URL`. The real fix is ensuring the GitHub secrets are set. I can add a fallback/guard in `src/App.tsx` or `src/main.tsx` that detects missing env vars and renders a helpful message instead of crashing silently.

**File: `src/main.tsx`** — add an early guard:
```tsx
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  // render error message
}
```

---

## What the user must do manually (GitHub repository settings)

The user needs to add 2 repository secrets in GitHub:

1. Go to: `https://github.com/teddysnowden/MeetFix/settings/secrets/actions`
2. Click **"New repository secret"** and add:
   - Name: `VITE_SUPABASE_URL` → Value: the Supabase project URL
   - Name: `VITE_SUPABASE_PUBLISHABLE_KEY` → Value: the anon/publishable key

The values come from the Lovable Cloud backend (shown in the plan to user).

The Supabase URL for this project is: `https://pohaovjuslsykzwdrcsp.supabase.co`
The anon key is: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvaGFvdmp1c2xzeWt6d2RyY3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MzM3MTYsImV4cCI6MjA4NjIwOTcxNn0.hLGMLeMAkwZMJdzPPia_N5xEdvagPmBjG0fDy30JShw`

---

## Plan summary

**Code fixes (I make these):**
1. `index.html` — fix manifest and service worker paths to include `/MeetFix/` prefix
2. `src/main.tsx` — add env var guard to show a clear error message instead of blank screen if secrets are missing

**Manual steps (user does these in GitHub):**
1. Add `VITE_SUPABASE_URL` secret → `https://pohaovjuslsykzwdrcsp.supabase.co`
2. Add `VITE_SUPABASE_PUBLISHABLE_KEY` secret → the anon key above
3. After adding secrets, re-run the GitHub Actions workflow (or push a commit to main) to trigger a new build with the correct env vars
