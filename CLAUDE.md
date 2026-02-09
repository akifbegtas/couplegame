# CLAUDE.md - Couple Game

## Project Overview

Real-time multiplayer party game web application built for couples and groups. Uses Node.js (Express + Socket.io) on the backend and vanilla JavaScript on the frontend. All game text and UI is in **Turkish**.

## Tech Stack

- **Runtime**: Node.js
- **Server**: Express 4.x + Socket.io 4.x
- **Frontend**: Vanilla JavaScript, HTML, CSS (no framework)
- **External CDN libs**: SweetAlert2 (dialogs), canvas-confetti (effects)
- **Fonts**: Google Fonts (Pacifico, Poppins)

## File Structure

```
couplegame/
├── server.js            # Express + Socket.io server, all game logic (~840 lines)
├── package.json         # Minimal config: express + socket.io deps
├── public/
│   ├── index.html       # Single-page HTML with all screens (~320 lines)
│   ├── client.js        # Client-side Socket.io handlers + UI logic (~860 lines)
│   ├── style.css        # Glassmorphism UI, mobile-first (~810 lines)
│   └── photos/
│       └── arkaplan2.jpg  # Background image
└── .gitignore           # Only ignores node_modules/
```

No build step, no bundler, no TypeScript, no tests, no linter config.

## Commands

```bash
npm install    # Install dependencies (express, socket.io)
npm start      # Run server (node server.js) on port 3000
```

Port is configurable via `PORT` environment variable.

## Architecture

### Client-Server Communication

All communication uses Socket.io events. The server manages game state in an in-memory `rooms` object. There is no database.

### Game Modes

Three games, each playable in two modes:

| Game | Turkish Name | Mode: Couples (`cift`) | Mode: Solo (`tek`) |
|------|-------------|----------------------|-------------------|
| **Telepati** | Telepati | Pairs write words hoping to match | N/A (couples only) |
| **Name-City-Animal** | İsim Şehir | Pairs write words for letter+category | N/A (couples only) |
| **Pictionary** | Resim Çiz | One draws, partner guesses | One draws, all guess |

Solo mode (`tek`) only supports Pictionary.

### Room Lifecycle

1. Host creates room -> gets 5-char room code
2. Players join via room code -> select team slots (couples mode) or join player list (solo mode)
3. Host starts game -> rounds play out with timers
4. Game over -> scores displayed

### Key Data Structures (server.js)

**Room object** (`rooms[roomId]`):
- `id`, `gameMode` ("cift"/"tek"), `gameType` ("telepati"/"isimSehir"/"pictionary")
- `teams[]` (couples mode) or `players[]` (solo mode)
- `spectators[]`, `roundCount`, `roundTime`, `currentRound`, `status`
- Game-specific state: `moves`, `scores`, `currentLetter`, `currentCategory`, etc.

**Player object**: `{ id, username, gender, isHost }`

**Team object**: `{ id, name, p1, p2 }`

### Socket Events

**Client -> Server:**
| Event | Purpose |
|-------|---------|
| `createRoom` | Create a new game room |
| `joinRoom` | Join existing room by code |
| `selectTeam` | Pick a team slot (couples mode) |
| `startGame` | Host starts the game |
| `submitWord` | Submit word in Telepati |
| `submitIsimSehirWord` | Submit word in Name-City |
| `drawData` | Send drawing coordinates |
| `pictionaryGuess` | Submit a guess in Pictionary |

**Server -> Client:**
| Event | Purpose |
|-------|---------|
| `roomCreated` | Room ID sent to host |
| `joinedRoom` | Confirm join success |
| `updateLobby` | Refresh lobby/team display |
| `gameInit` | Game starting, send initial state |
| `turnStarted` | New turn begins |
| `partnerSubmitted` | Partner has submitted their word |
| `revealOneMove` | Reveal a pair's answers |
| `spectatorUpdate` | Update spectator view |
| `updateScoreboard` | Refresh scores |
| `levelFinished` / `roundChanged` | Round progression |
| `gameOver` | Game ended with final results |
| `letterSelected` / `categoryStart` | İsim Şehir flow |
| `isimSehirResult` / `isimSehirGameOver` | İsim Şehir results |
| `pictionaryStart` / `pictionaryRound` | Pictionary flow |
| `pictionaryCorrect` / `pictionaryWrongGuess` / `pictionaryRoundEnd` / `pictionaryGameOver` | Pictionary results |

## Code Conventions

- **Language**: All user-facing text, comments, variable names for game concepts, and data constants are in Turkish
- **Variable naming**: camelCase for variables/functions, UPPER_SNAKE_CASE for constants
- **No modules**: Server is a single `server.js` file; client is a single `client.js` file
- **DOM manipulation**: Direct `document.getElementById` / `innerHTML` — no virtual DOM or templating
- **Screen switching**: `showScreen(name)` function toggles `.screen` elements by adding/removing `.active` class
- **Alerts**: SweetAlert2 (`Swal.fire()`) for game notifications and results
- **Styling**: CSS glassmorphism (backdrop-filter blur), red/pink gradient theme, mobile-first (max-width 500px)

## Important Implementation Details

- Room IDs are random 5-character uppercase alphanumeric strings
- Turkish alphabet (27 letters including Ç, İ, Ö, Ş, Ü) is used for İsim Şehir letter selection
- Telepati has an elimination mechanic: 20 failed attempts = pair eliminated
- Pictionary scoring: first correct guesser gets most points, later guessers get fewer
- All game state is in-memory only — restarting the server clears all rooms
- Timers are managed server-side with `setTimeout`/`setInterval`
- Canvas drawing in Pictionary sends coordinate data via socket events
- The `disconnect` handler cleans up players from rooms and notifies remaining players
