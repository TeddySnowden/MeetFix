

# Profile Screen -- Cyberpunk Neon Theme

## Overview
Create a new Profile page adapted from the reference `ProfileScreen.tsx.txt`, restyled with the MeetFix V2 cyberpunk neon theme, and wired into the existing auth/data hooks. Since there is no `profiles` table in the database, the profile will use data from the auth user and existing group/event data.

## What Gets Built

### 1. New Page: `src/pages/Profile.tsx`
Adapted from the reference file, but rewritten to:
- Use `useAuth()` instead of the non-existent `useApp()` context
- Use `useGroups()` for group data
- Use `useNavigate()` / `navigate(-1)` for back navigation (matching app pattern)
- Remove features that have no backing data (badges, leaderboard, streak, attendance rate) -- these will be shown as placeholder/coming-soon sections
- Remove translations (the app doesn't have i18n)

### 2. Cyberpunk Neon Styling (exact specs)

| Element | Style |
|---|---|
| Page background | `background: linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #000 100%)` |
| Text headings | `color: #00ffff; text-shadow: 0 0 10px #00ffff` |
| Cards | `bg-black/40 border border-[#00ff41] shadow-[0_0_20px_rgba(0,255,65,0.15)]` |
| Badges | `bg-[#00ff41]/20 border-[#00ff41] rounded-xl` with neon glow |
| Progress bars | Gradient from `#00ff41` to `#00ffff` |
| Avatar | `border-[#ff00ff] shadow-[0_0_20px_rgba(255,0,255,0.4)]` |
| Streak flame | `color: #ffaa00; text-shadow: 0 0 10px #ffaa00` |
| Buttons | Purple-to-cyan gradient with hover pulse (matching existing dialogs) |

### 3. Sections on the Profile Page
- **Header**: Back button + "Profile" title (neon cyan)
- **User Card**: Avatar (magenta glow border), display name, email, streak (placeholder: 0), stats grid (groups count from real data, events attended as placeholder)
- **Account Card**: Shows linked Google account + Sign Out button
- **Badges Card**: Show all badges as locked/coming-soon with cyberpunk styling
- **Groups Card**: Real group data from `useGroups()`, each group navigates to `/g/:id`

### 4. Route Addition: `src/App.tsx`
- Add `<Route path="/profile" element={<Profile />} />`

### 5. Navigation: Homepage Quick Actions
- Add a "Profile" button to the quick actions grid on `src/pages/Index.tsx`
- Neon user icon (`User` from lucide-react)
- Navigates to `/profile`

## Technical Notes
- No database changes needed -- all data comes from `useAuth()` and `useGroups()`
- No new dependencies required
- Custom components from the reference (GamerCard, NeonBadge, ProgressBar) will NOT be created as separate components; their styling will be inlined using Tailwind classes matching the cyberpunk spec
- The Progress component from `src/components/ui/progress.tsx` will be used for progress bars, with custom className overrides for the neon gradient

## Files Changed
1. **New**: `src/pages/Profile.tsx` -- full profile page
2. **Edit**: `src/App.tsx` -- add `/profile` route
3. **Edit**: `src/pages/Index.tsx` -- add Profile quick action button

