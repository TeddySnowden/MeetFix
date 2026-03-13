
## A tényleges probléma azonosítása

### Mi történik OAuth után GitHub Pages-en?

A Lovable Cloud managed OAuth flow így néz ki:
1. Felhasználó kattint: `lovable.auth.signInWithOAuth("google", { redirect_uri: "https://teddysnowden.github.io/MeetFix/#/auth" })`
2. Browser átirányítódik a Lovable Cloud OAuth proxy-ra (`/~oauth/...`)
3. Google autentikál
4. Lovable Cloud visszairányít az alkalmazásba a `redirect_uri`-ra

**A 404 gyökere: `redirect_uri`-ban hash fragment (`#/auth`)**

Az OAuth protokoll (RFC 6749) szerint a `redirect_uri` nem tartalmazhat hash fragmentet (`#`). A Lovable Cloud proxy (és általában az összes OAuth rendszer) ignorálja vagy eltávolítja a hash részt a redirect_uri-ból. Tehát a visszairányítás:

```
redirect_uri megadva:   https://teddysnowden.github.io/MeetFix/#/auth
ténylegesen kap vissza: https://teddysnowden.github.io/MeetFix/
```

De ez még nem okozna 404-et — a `/MeetFix/` létezik.

### A valódi 404 ok: a `vite.config.ts` `base: '/MeetFix/'` **a preview-ban is aktív**

A `vite.config.ts`-ben `base: '/MeetFix/'` feltétel nélkül van. Ezért a Lovable preview buildben (amely a `lovableproject.com` doménen fut) az összes JS/CSS asset `/MeetFix/assets/...` path-on vár. A Lovable preview szerver viszont a `/assets/...` path-on szolgálja ki ezeket — így a preview-ban a Google gombot megnyomva az OAuth flow a preview URL-en keresztül is fut, és az assets 404-esek lesznek.

**De ez a preview probléma.** A GitHub Pages-en `base: '/MeetFix/'` helyes.

### Tehát mi okoz 404-et a GitHub Pages-en?

Megvizsgálva a kódot: a `redirect_uri` a `#/auth` hash-t tartalmazza. A Lovable Cloud OAuth callback a hash-t **nem adja át** a redirect-ben (mert HTTP redirect nem tud hash-t küldeni a szervernek). A visszatérési URL `https://teddysnowden.github.io/MeetFix/` lesz (hash nélkül), ami betölt. **VAGY** a Lovable Cloud a `redirect_uri`-t pontosan a megadott formában próbálja visszaadni, és a `#/auth` path-részt URL path-ként értelmezi (`/auth`), ami nem létezik GitHub Pages-en → 404.

A biztos megoldás: a `redirect_uri`-t **hash nélkül** adjuk meg: `https://teddysnowden.github.io/MeetFix/`

### Másodlagos probléma: `vite.config.ts` preview-ban töri az app-ot

Mivel `base: '/MeetFix/'` mindig aktív, a Lovable preview-ban a Google auth gomb megnyomásakor az OAuth flow a preview URL-en indul, de az assets 404-esek → az AuthCallback oldal nem tölt be. Ez is okozhat látszólagos 404-et.

---

## Terv

### Változtatás 1: `src/hooks/useAuth.tsx` — redirect_uri javítása

A hash fragment eltávolítása a redirect_uri-ból:
```ts
// ELŐTTE
? "https://teddysnowden.github.io/MeetFix/#/auth"
: `${window.location.origin}/#/auth`;

// UTÁNA
? "https://teddysnowden.github.io/MeetFix/"
: window.location.origin + "/";
```

Az `AuthCallback.tsx` már kezeli a hazairányítást, az `onAuthStateChange` pedig a sessiont. A hash nélküli redirect teljesen biztonságos.

### Változtatás 2: `vite.config.ts` — feltételes base path

A preview-ban `base: '/'` legyen, GitHub Pages buildnél `base: '/MeetFix/'`:
```ts
base: process.env.GITHUB_PAGES === 'true' ? '/MeetFix/' : '/',
```

### Változtatás 3: `.github/workflows/deploy.yml` — GITHUB_PAGES env var

```yaml
env:
  VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
  VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
  GITHUB_PAGES: 'true'
```

### Változtatás 4: `public/404.html` — SPA fallback létrehozása

GitHub Pages statikus hosztolás: ha az OAuth visszairányítás valami nem létező path-ra kerül, a `404.html` átirányítja az `index.html`-re. HashRouter esetén ez egyszerű:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>MeetFix</title>
  <script>
    // GitHub Pages SPA fallback — redirect to index with hash preserved
    window.location.replace(
      'https://teddysnowden.github.io/MeetFix/' + window.location.hash
    );
  </script>
</head>
<body></body>
</html>
```

### Változtatás 5: `index.html` — manifest path dinamikus marad (már helyes)

A jelenlegi JS-es hostname detekció megfelelő, nem kell változtatni.

---

## Összefoglalás

| Fájl | Változtatás |
|---|---|
| `src/hooks/useAuth.tsx` | `redirect_uri`-ból hash fragment eltávolítása |
| `vite.config.ts` | Feltételes base: `/MeetFix/` csak `GITHUB_PAGES=true` esetén |
| `.github/workflows/deploy.yml` | `GITHUB_PAGES: 'true'` env var hozzáadása |
| `public/404.html` | Új fájl — GitHub Pages SPA fallback |
