# CharlesVsWorld — 90s BBS Web Application

## Overview
A static web application hosted on GitHub Pages that faithfully recreates the experience of dialing into a mid-1990s PC BBS. Features a modem dial-up connection sequence with sound, then presents a BBS-style terminal interface where the main menu items correspond to projects and public GitHub repos for user **macBdog**.

## Design Decisions
- **GitHub username:** macBdog
- **Audio:** Modem dial-up/handshake sounds via Web Audio API synthesis (no external files)
- **Navigation:** Keyboard + mouse click
- **Repos:** Fetched live from GitHub API at runtime so the menu stays current
- **Hosting:** GitHub Pages (static HTML/CSS/JS only, no build step)

---

## File Structure
```
charlesvsworld/
├── index.html          # Single page shell, minimal markup
├── css/
│   └── bbs.css         # Terminal appearance, CRT effects, DOS palette
├── js/
│   ├── main.js         # Boot sequence orchestration, screen flow
│   ├── terminal.js     # Character-by-character text rendering engine
│   ├── modem.js        # Web Audio API modem sound synthesis
│   ├── ansi.js         # ANSI art rendering and color support
│   ├── menu.js         # Menu system (keyboard + click navigation)
│   └── github.js       # GitHub API fetch and repo data formatting
├── .gitignore
└── PLAN.md
```

---

## Visual Authenticity

### Terminal Appearance
- 80-column fixed-width layout, dark background (#000 or #0a0a18)
- DOS 16-color CGA/EGA palette for text colors
- Monospace font (IBM VGA / "Perfect DOS VGA 437" webfont, fallback to Courier New)
- Blinking cursor (block style)
- Subtle CRT scanline overlay via CSS (`repeating-linear-gradient`)
- Slight screen curvature/vignette via CSS `box-shadow` inset
- Optional subtle phosphor glow on text via `text-shadow`

### DOS 16-Color Palette
```
Black #000000    Dark Blue #0000AA    Dark Green #00AA00    Dark Cyan #00AAAA
Dark Red #AA0000 Dark Magenta #AA00AA Dark Yellow #AA5500   Light Gray #AAAAAA
Dark Gray #555555 Blue #5555FF        Green #55FF55         Cyan #55FFFF
Red #FF5555      Magenta #FF55FF     Yellow #FFFF55        White #FFFFFF
```

---

## ASCII Art 

Primary palette — grays, purples, blues (mapped to DOS colors in code):

```
 GRAYS                 PURPLES                BLUES
 ─────                 ───────                ─────
 #555555 Dark Gray     #AA00AA Dark Magenta   #0000AA Dark Blue
 #AAAAAA Light Gray    #FF55FF Magenta        #5555FF Blue
 #FFFFFF White         #AA5500 Plum accent    #55FFFF Cyan
                                              #00AAAA Dark Cyan
```

Colors per element:
- Box borders:         Blue (#5555FF) lines, Cyan (#55FFFF) highlights
- Menu text:           Light Gray (#AAAAAA) default, White (#FFFFFF) selected
- Labels/headers:      Magenta (#FF55FF) titles, Cyan (#55FFFF) accents
- Background glow:     Dark Blue (#0000AA) ambient wash behind character

Each line has a color key suffix: `[B]`=Blue, `[C]`=Cyan, `[M]`=Magenta,
`[DM]`=Dark Magenta, `[W]`=White, `[G]`=Light Gray, `[DG]`=Dark Gray,
`[DB]`=Dark Blue. Multiple colors on one line are annotated inline.


---

## Screen Flow

### 1. Boot / Dial-Up Sequence (3-5 seconds total)
Keep it snappy — just enough to set the mood, not enough to bore.

```
ATZ                          ← modem reset
OK
ATDT 555-0199                ← dial tone begins, then DTMF tones
CONNECT 14400/ARQ/V.32bis    ← handshake screech (short), connect
```

- **Sound:** Web Audio API synthesizes dial tone (~350+440 Hz), DTMF digit tones, then a short burst of modem handshake noise (filtered white noise + frequency sweeps)
- **Timing:** ~1s reset, ~1.5s dialing, ~1.5s handshake, ~0.5s connect message
- Text renders character-by-character at "modem speed"

### 2. Welcome / ANSI Art Screen (2-3 seconds)
After CONNECT, display:
- BBS name in ANSI block art: **"CHARLES vs WORLD"**
- Tagline / SysOp info line
- Node number, caller number, baud rate (cosmetic)
- "Press any key to continue..." prompt

```
═══════════════════════════════════════════════════════════════════
   ██████╗██╗  ██╗ █████╗ ██████╗ ██╗     ███████╗███████╗
  ██╔════╝██║  ██║██╔══██╗██╔══██╗██║     ██╔════╝██╔════╝
  ██║     ███████║███████║██████╔╝██║     █████╗  ███████╗
  ██║     ██╔══██║██╔══██║██╔══██╗██║     ██╔════╝╚════██║
  ╚██████╗██║  ██║██║  ██║██║  ██║███████╗███████╗███████║
   ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝
              ██╗   ██╗███████╗
              ██║   ██║██╔════╝     vs
              ██║   ██║███████╗
              ╚██╗ ██╔╝╚════██║
               ╚████╔╝ ███████║
                ╚═══╝  ╚══════╝
          ██╗    ██╗ ██████╗ ██████╗ ██╗     ██████╗
          ██║    ██║██╔═══██╗██╔══██╗██║     ██╔══██╗
          ██║ █╗ ██║██║   ██║██████╔╝██║     ██║  ██║
          ██║███╗██║██║   ██║██╔══██╗██║     ██║  ██║
          ╚███╔███╔╝╚██████╔╝██║  ██║███████╗██████╔╝
           ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═════╝
═══════════════════════════════════════════════════════════════════
  SysOp: macBdog  │  Node 1  │  14400 bps  │  ANSI Detected
  "Striving to be the best BBS this side of the internet!"
═══════════════════════════════════════════════════════════════════
```

### 3. Main Menu
Classic numbered BBS menu. Repos are fetched from GitHub API and mapped to "File Areas" / "Doors."

```
╔══════════════════════════════════════════════════════════════╗
║              CHARLES vs WORLD — MAIN MENU                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  [F] File Areas          - Browse Projects                   ║
║  [B] Bulletin Board      - Latest Updates                    ║
║  [I] System Info         - About the SysOp                   ║
║  [G] Goodbye             - Logoff                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  Time Left: 58 min │ Select: _
```

Selecting a number opens a detail view with repo description, language, stars, last updated, and a link that opens the actual GitHub repo.

### 6. System Info
About page — SysOp bio, system specs (played for laughs: "486 DX2-66, 8MB RAM, 14.4k USR Sportster"), link to GitHub profile.

### 7. Goodbye
Classic logoff sequence: "Thanks for calling! NO CARRIER"

---

## Technical Details

### terminal.js — Text Rendering Engine
- Maintains a virtual 80×25 character buffer
- `typeText(text, speed)` — renders text char-by-char with configurable delay
- `printLine(text)` — instant line print
- `clear()` — clears screen
- `setColor(fg, bg)` — sets current DOS color attribute
- Supports ANSI-style color codes embedded in strings (e.g., `\x1b[1;32m`)
- Scrolls when buffer exceeds 25 lines
- Blinking block cursor follows current write position

### modem.js — Sound Synthesis
All sounds generated with Web Audio API (no external audio files):
- **Dial tone:** 350 Hz + 440 Hz sine waves, ~0.5s
- **DTMF tones:** Standard DTMF frequency pairs for each digit, ~100ms each
- **Handshake:** Filtered white noise + sine wave sweeps (2600→1200 Hz), ~1.5s
- **Connect chime:** Optional short beep on successful "connection"
- Sounds triggered in sequence, timed to match the text animation

### github.js — Repo Fetching
- `GET https://api.github.com/users/macBdog/repos?type=public&sort=updated`
- Caches result in sessionStorage to avoid rate limits on navigation
- Falls back to a hardcoded repo list if API fails (GitHub rate limit)
- Extracts: name, description, language, html_url, stargazers_count, updated_at

### menu.js — Navigation
- Keyboard listener: number keys, letter keys for menu shortcuts, Enter to confirm
- Click handlers on menu items (highlighted on hover with DOS-style highlight color)
- Navigation stack for back/forward between screens
- Animated transitions between screens (quick clear + redraw)

### ansi.js — ANSI Art
- Pre-defined ASCII/block art for the BBS title
- Box-drawing characters for menus and borders (═ ║ ╔ ╗ ╚ ╝ ╠ ╣ ╦ ╩ ╬)
- Color attribute parsing for multi-color art

---

## CSS Approach (bbs.css)

```
/* Core terminal */
- Black background, 100vh fullscreen
- Monospace font at calculated size for 80-col fit
- No user-select on terminal output

/* CRT Effects */
- Scanlines: repeating-linear-gradient overlay (rgba black lines every 2px)
- Screen curvature: subtle border-radius + inset box-shadow vignette
- Phosphor glow: text-shadow with matching color at low opacity
- Optional flicker: subtle CSS animation on opacity

/* Colors */
- CSS custom properties for all 16 DOS colors
- Utility classes: .fg-green, .fg-cyan, .fg-yellow, etc.
- .bright class for high-intensity variants
```

---

## Implementation Order
1. **index.html + bbs.css** — Terminal container, CRT effects, font, palette
2. **terminal.js** — Core text rendering engine with cursor
3. **modem.js** — Web Audio API dial-up sound synthesis
4. **main.js** — Dial-up boot sequence (text + sound orchestration)
5. **ansi.js** — ANSI art title screen
6. **github.js** — Live repo fetching and caching
7. **menu.js** — Main menu, file areas, detail views, navigation
8. **Polish** — Timing tweaks, mobile responsiveness, edge cases
