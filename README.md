# Plinko Game

A provably fair Plinko game built with Next.js, featuring a commit reveal protocol and deterministic outcomes.


## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Prisma + SQLite (via libSQL)
- **Rendering**: HTML5 Canvas
- **Styling**: Tailwind CSS
- **Hashing**: SHA-256 (Web Crypto API)
- **PRNG**: xorshift32

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd plinko-game

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open http://localhost:3000 to play the game.

### Production Build

```bash
npm run build
npm start
```

### Running Tests

```bash
npm test
```

## How It Works

### Game Flow

1. **Select Drop Column** (0-12) using arrow keys or buttons
2. **Enter Client Seed** (auto-generated, or enter your own)
3. **Enter Bet Amount** in cents
4. **Drop Ball** - watch it bounce through 12 rows of pegs
5. **View Result** - see bin landed (0-12) and payout multiplier
6. **Verify Fairness** - click "Verify Result" to prove the outcome

### Payout Table

| Bin | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|-----|---|---|---|---|---|---|---|---|---|---|----|----|---- |
| Multiplier | 110x | 40x | 20x | 10x | 4x | 2x | 1x | 2x | 4x | 10x | 20x | 40x | 110x |

## Provably Fair Protocol

### Commit-Reveal Protocol

```
1. SERVER generates:
   - serverSeed (32 random bytes)
   - nonce (16 random bytes)
   - commitHex = SHA256(serverSeed + ":" + nonce)
   
2. CLIENT provides:
   - clientSeed (user input)
   
3. GAME computes:
   combinedSeed = SHA256(serverSeed + ":" + clientSeed + ":" + nonce)
   
4. ALL randomness derived from combinedSeed using xorshift32 PRNG
   
5. AFTER GAME:
   - Server reveals serverSeed
   - Anyone can verify: SHA256(serverSeed + ":" + nonce) == commitHex
   - Anyone can replay the exact game outcome
```

### Deterministic Engine

1. **Seed PRNG** from first 4 bytes of combinedSeed (big-endian)
2. **Generate Peg Map**: For each of 78 pegs, generate leftBias = 0.5 ± 0.1
3. **Simulate Drop**: For each row, decide L/R based on peg bias + drop column offset
4. **Final Bin** = count of Right moves

### PRNG Order (CRITICAL)

The xorshift32 PRNG is consumed in this exact order:
1. 78 calls for peg map generation (rows 0-11, each row has row+1 pegs)
2. 12 calls for row decisions

This order must NEVER change for reproducibility.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rounds/commit` | Get commitment before game |
| POST | `/api/rounds/:id/start` | Start game with client seed |
| POST | `/api/rounds/:id/reveal` | Reveal server seed after game |
| GET | `/api/rounds/:id` | Get round details |
| GET | `/api/verify` | Verify any round |

### Verification API

```bash
curl "http://localhost:3000/api/verify?serverSeed=XXX&clientSeed=YYY&nonce=ZZZ&dropColumn=6"
```

Returns recomputed: `commitHex`, `combinedSeed`, `pegMapHash`, `binIndex`, `path`

## Controls

- **← → Arrow Keys**: Change drop column
- **Space / Enter**: Drop ball
- **Click**: All controls work with mouse too

## Accessibility

- **Reduced Motion**: Respects `prefers-reduced-motion` - instant animations
- **Sound Toggle**: Mute button for sound effects
- **Keyboard Navigation**: Full keyboard support

## Project Structure

```
plinko-game/
├── app/
│   ├── page.tsx              # Main game UI
│   ├── verify/               # Verification page
│   └── api/                  # API routes
├── components/
│   ├── PlinkoBoard.tsx       # Canvas game board
│   ├── GameControls.tsx      # Input controls
│   ├── GameResult.tsx        # Result display
│   └── SoundToggle.tsx       # Mute toggle
├── lib/
│   ├── fairness/
│   │   ├── hash.ts           # SHA-256 utilities
│   │   ├── prng.ts           # xorshift32 PRNG
│   │   ├── engine.ts         # Plinko simulation
│   │   └── payouts.ts        # Payout table
│   └── db/
│       └── prisma.ts         # Database client
├── prisma/
│   └── schema.prisma         # Database schema
└── tests/
    ├── hash.test.ts          # Hash function tests
    ├── prng.test.ts          # PRNG tests
    └── engine.test.ts        # Engine determinism tests
```

