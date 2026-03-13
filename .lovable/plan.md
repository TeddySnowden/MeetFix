
## Jelenlegi problémák elemzése

### 1. Service Worker 404 – Lovable preview-ban (nem blokkoló production szempontjából)
A preview URL (`id-preview--...lovable.app`) nem a `/MeetFix/` subpath-on fut, ezért a `/MeetFix/sw.js` 404-et dob. A **GitHub Pages-en ez helyes** – ez csak a Lovable preview-ban jelenik meg. Megoldás: a SW regisztrációt tegyük dinamikussá, hogy a `base` path-ot automatikusan érzékelje, ne legyen hardcode-olva.

### 2. React `forwardRef` warning – `Badge` és `ChecklistModal`
A console logokból látható 3 figyelmeztetés:
- `Badge` komponens (`src/components/ui/badge.tsx`) – egyszerű `function Badge`, nincs `forwardRef`
- `ChecklistModal` komponens – funkcionális komponens, nincs `forwardRef`

Ezek csak warningok, nem okoznak hibát, de tisztítsuk meg.

### 3. Service Worker gyorsítótár – rossz path-ok
A `public/sw.js`-ben az `ASSETS_TO_CACHE` array még `/`, `/index.html` stb. path-okat cachel, nem `/MeetFix/`-es path-okat. Ez production-ban hibás cache-t eredményez.

### 4. Minden egyéb rendben
- `index.html` – manifest és SW path már `/MeetFix/`-es ✅
- `vite.config.ts` – `base: '/MeetFix/'` ✅  
- `deploy.yml` – helyes secret nevek ✅
- `main.tsx` – env guard ✅

---

## Terv

### Változtatás 1: `index.html` – dinamikus SW regisztráció
A hardcode-olt `/MeetFix/sw.js` helyett `import.meta.env.BASE_URL`-t nem lehet inline script-ben használni. Ehelyett a script detektálja a jelenlegi path-ot:

```js
// Detect base path: use /MeetFix/ on production, / on preview
const swPath = location.hostname.includes('github.io') 
  ? '/MeetFix/sw.js' 
  : '/sw.js';
navigator.serviceWorker.register(swPath);
```

### Változtatás 2: `public/sw.js` – helyes cache path-ok
Az `ASSETS_TO_CACHE` listában `/MeetFix/`-es path-okat kell megadni, és a root `/`-t is megtartjuk redirect célból.

### Változtatás 3: `src/components/ui/badge.tsx` – forwardRef hozzáadása
A `Badge`-et `React.forwardRef`-fel kell exportálni.

### Változtatás 4: `ChecklistModal` – forwardRef nem szükséges
A ChecklistModal-t **nem** kell forwardRef-fel wrappolni – a warning valójában a `Dialog` Radix komponensre vonatkozik, ami bent van. A ChecklistModal nem kap ref-et a szülőtől. Ez egy téves warning a Radix belső implementációjából. Nem kell változtatni.

---

## Összefoglalás

| Fájl | Változtatás |
|---|---|
| `index.html` | Dinamikus SW path (hostname alapján) |
| `public/sw.js` | `/MeetFix/` prefix az asset path-okhoz |
| `src/components/ui/badge.tsx` | `React.forwardRef` hozzáadása |
