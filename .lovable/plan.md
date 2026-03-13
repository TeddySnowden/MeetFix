
## A projekt jelenlegi állapota és hiányosságai

### MI KÉSZ (működő funkciók)

**Alap infrastruktúra**
- Lovable Cloud (Supabase) backend csatlakoztatva, 20 migrációs fájl
- HashRouter alapú routing (GitHub Pages kompatibilis)
- Google OAuth belépés (natív Supabase, helyes redirect: `/#/auth`)
- PWA manifest + service worker + telepítő gomb
- GitHub Actions CI/CD workflow (deploy to GitHub Pages)
- Vite config: `base: '/MeetFix/'`, lovable-tagger integráció

**Oldalak és funkciók**
- `Index (/)`: hero kártya a következő eseménnyel, csoportok listája, gyors műveletek grid
- `GroupDetail (/g/:id)`: eseménylista, meghívó link másolás/generálás, max tag szám beállítás, esemény törlés, csoport törlés
- `EventDetail (/e/:id)`: időpont szavazás, aktivitás szavazás, finalizálás (owner), Pack Up + Reopen, .ics naptár letöltés, Bring Items lista, realtime frissítés
- `GetReady (/get-ready)`: visszaszámláló, készülési idősor (öltözés/utazás), "Ki mit hoz" lista
- `Profile (/profile)`: felhasználói adatok, csoportok listája, badge placeholder, XP placeholder
- `Groups (/groups)`: saját csoportok listája
- `JoinGroup (/join/:code, /invite/:code)`: meghívó kód alapján csatlakozás

**Backend táblák (adatbázis)**
- `groups`, `group_members`, `events`, `time_slots`, `activities`, `activity_votes`, `bring_items`, `item_claims`, `event_user_timeline`, `notifications`

**Értesítési rendszer**
- In-app notifikáció (NotificationBell komponens), realtime feliratkozással
- Pack Up után automatikus értesítések ütemezése (T-24h, T-4h, öltözés, indulás)

---

### MI HIÁNYZIK (önálló, release-kész apphoz)

**1. Kritikus / UX-blokkoló**

| Hiányosság | Hatás |
|---|---|
| `index.html` title még "Lovable App" | Rossz SEO és PWA megjelenés |
| `manifest.json` neve/leírása nem frissített | App névtelen az asztalon |
| Meghívó link generálásakor `window.location.origin` van → Lovable preview URL-t másol, nem a GitHub Pages URL-t | Megtört meghívók |
| Nincs valódi push értesítés (Web Push API) | Az in-app notifikáció csak nyitott appnál működik; a felhasználók nem kapnak telefon-értesítést |
| GitHub Actions workflow: `VITE_SUPABASE_ANON_KEY` titkos neve nem egyezik a `.env`-ben lévő `VITE_SUPABASE_PUBLISHABLE_KEY`-jel | Produkciós build hibás Supabase kapcsolattal fut |

**2. Közepes prioritás**

| Hiányosság | Hatás |
|---|---|
| Nincs "Kijelentkezés" megerősítő párbeszéd | Véletlen kilépés |
| Nincs "Esemény szerkesztése" funkció (csak törlés) | Elütési hibákat nem lehet javítani |
| A "Get Ready" oldal csak a legközelebbi finalizált eseményt mutatja, több esemény esetén nem választható | Korlátozott használat |
| Checklist Modal adatai nem perzisztensek (sessionStorage vagy DB?) | Érdemes ellenőrizni |
| `AutoFixVoteButton` – az AI automatikusan szavaz; ez félrevezető lehet, ha nincs felhasználói megerősítés |  |
| Nincs "Elfelejtett csoport" – ha a meghívó link nem GitHub Pages URL-lel lett másolva, nem működik |  |

**3. Nice-to-have / Jövő**

| Funkció | Megjegyzés |
|---|---|
| Badge / XP rendszer | Profilban placeholder, backend nincs |
| Streak számlálás | Placeholder, backend nincs |
| Dark/Light mód váltó | Jelenleg csak sötét téma |
| Felhasználónév szerkesztése | Csak Google névből dolgozik |
| Esemény komment/chat | Nem létezik |
| Push értesítés (Web Push) | Service worker kész, de push logika nincs |

---

### LEGFONTOSABB AZONNALI JAVÍTANDÓK

1. **`index.html` + `manifest.json`** – app neve "MeetFix" legyen
2. **GitHub Actions secret neve** – `VITE_SUPABASE_ANON_KEY` → `VITE_SUPABASE_PUBLISHABLE_KEY` (vagy fordítva, szinkronizálni kell)
3. **Meghívó link URL** – hardcode-olni `https://teddysnowden.github.io/MeetFix` alapú link generálást a `window.location.origin` helyett
