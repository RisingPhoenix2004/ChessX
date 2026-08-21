# Tactix - Comprehensive System Architecture & Engineering Documentation

This document provides complete technical specifications, database schemas, authentication setup, and algorithmic documentation to build and deploy Tactix as a full-stack, production-grade platform.

---

## Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [Database Schemas (PostgreSQL / Prisma ORM)](#2-database-schemas-postgresql--prisma-orm)
3. [Google OAuth 2.0 Authentication Setup](#3-google-oauth-20-authentication-setup)
4. [PGN Parser & Position Extraction Engine](#4-pgn-parser--position-extraction-engine)
5. [Gamification & Leveling Engine](#5-gamification--leveling-engine)
6. [Spaced Repetition (SM-2) & Failed Review Queue](#6-spaced-repetition-sm-2--failed-review-queue)
7. [Radar Chart & Insights Analytics Engine](#7-radar-chart--insights-analytics-engine)
8. [Session Endurance & Fatigue Tracking](#8-session-endurance--fatigue-tracking)
9. [API Endpoint Specifications](#9-api-endpoint-specifications)

---

## 1. System Architecture Overview

Tactix uses a decoupled full-stack architecture:

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + `react-chessboard` + `chess.js` + `recharts` + Web Audio API.
- **Backend API**: Node.js + Express / Next.js API Routes.
- **Database**: PostgreSQL with Prisma ORM.
- **Authentication**: Google OAuth 2.0 (Google Identity Services GIS API).
- **Storage**: Client-side IndexedDB fallback & server-side PostgreSQL persistence.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          React Frontend (Vite)                         │
│   - Landing Page         - Interactive Chessboard (react-chessboard)   │
│   - Dopamine Web Audio   - Recharts Spider Radar Chart                 │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTPS / REST / JWT
┌──────────────────────────────────▼─────────────────────────────────────┐
│                          Node.js / Express API                         │
│   - Google OAuth Verifier   - PGN Parser & Converter                   │
│   - SM-2 SRS Scheduler      - Endurance & Insights Engine              │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Prisma ORM
┌──────────────────────────────────▼─────────────────────────────────────┐
│                           PostgreSQL Database                          │
│   - users    - collections    - puzzles    - puzzle_attempts    - srs  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schemas (PostgreSQL / Prisma ORM)

Below is the complete `schema.prisma` file for your backend database:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                        String           @id @default(uuid())
  googleId                  String           @unique
  email                     String           @unique
  name                      String
  avatar                    String?
  level                     Int              @default(1)
  completedCollectionsCount Int              @default(0)
  xp                        Int              @default(0)
  coins                     Int              @default(50)
  performanceRating         Int              @default(2006)
  currentStreak             Int              @default(1)
  bestStreak                Int              @default(1)
  lastActiveDate            DateTime         @default(now())
  createdAt                 DateTime         @default(now())
  updatedAt                 DateTime         @updatedAt

  collections               Collection[]
  puzzleAttempts            PuzzleAttempt[]
  srsStates                 SRSState[]
  achievements              UserAchievement[]

  @@map("users")
}

model Collection {
  id          String   @id @default(uuid())
  userId      String
  name        String
  category    String   // e.g. "Attraction", "Endgame", "Pin", "Fork"
  description String?
  icon        String   @default("📂")
  color       String   @default("from-emerald-500 to-teal-700")
  isCompleted Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  puzzles     Puzzle[]

  @@map("collections")
}

model Puzzle {
  id             String   @id @default(uuid())
  collectionId   String
  userCategory   String?
  fen            String
  sideToMove     String   // "w" or "b"
  solutionMoves  String[] // SAN notation e.g. ["Nxf7", "Kxf7", "Qe6#"]
  solutionUCI    String[] // UCI e.g. ["f3g5", "e8f7"]
  description    String?
  event          String?
  white          String?
  black          String?
  tags           String[] // ["Fork", "Sacrifice"]
  difficulty     String   @default("Medium") // Easy, Medium, Hard, Master
  rating         Int      @default(1400)
  comments       String?
  createdAt      DateTime @default(now())

  collection     Collection      @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  attempts       PuzzleAttempt[]
  srsState       SRSState?

  @@map("puzzles")
}

model PuzzleAttempt {
  id           String   @id @default(uuid())
  userId       String
  puzzleId     String
  solved       Boolean
  solveTimeMs  Int
  mistakes     Int
  xpEarned     Int
  coinsEarned  Int
  attemptedAt  DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  puzzle       Puzzle   @relation(fields: [puzzleId], references: [id], onDelete: Cascade)

  @@map("puzzle_attempts")
}

model SRSState {
  id             String   @id @default(uuid())
  userId         String
  puzzleId       String   @unique
  repetitions    Int      @default(0)
  easeFactor     Float    @default(2.5)
  intervalDays   Int      @default(0)
  dueDate        DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  puzzle         Puzzle   @relation(fields: [puzzleId], references: [id], onDelete: Cascade)

  @@map("srs_states")
}

model UserAchievement {
  id            String    @id @default(uuid())
  userId        String
  achievementId String    // e.g. "first_solve", "solves_100"
  unlocked      Boolean   @default(false)
  currentValue  Int       @default(0)
  unlockedAt    DateTime?

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, achievementId])
  @@map("user_achievements")
}
```

---

## 3. Google OAuth 2.0 Authentication Setup

### Step 1: Google Cloud Console Setup
1. Go to **Google Cloud Console** → API & Services → Credentials.
2. Click **Create Credentials** → **OAuth client ID**.
3. Select **Web Application**.
4. Set **Authorized JavaScript Origins**: `http://localhost:3000` (and your production domain).
5. Set **Authorized Redirect URIs**: `http://localhost:3000` (and `https://yourdomain.com/auth/callback`).
6. Copy your **Client ID** (e.g., `1234567890-abc.apps.googleusercontent.com`).

### Step 2: Server-Side Token Verification (`authController.ts`)
Install `google-auth-library`:
```bash
npm install google-auth-library jsonwebtoken
```

```typescript
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const prisma = new PrismaClient();

export async function verifyGoogleTokenAndLogin(credentialToken: string) {
  // 1. Verify credential token with Google
  const ticket = await client.verifyIdToken({
    idToken: credentialToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error('Invalid Google Token');
  }

  const { sub: googleId, email, name, picture } = payload;

  // 2. Upsert user in database
  let user = await prisma.user.upsert({
    where: { googleId },
    update: {
      name,
      avatar: picture,
      lastActiveDate: new Date(),
    },
    create: {
      googleId,
      email,
      name,
      avatar: picture,
    },
  });

  // 3. Generate JWT session token for frontend Authorization header
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '30d' }
  );

  return { user, token };
}
```

---

## 4. PGN Parser & Position Extraction Engine

The PGN Parser converts standard PGN text strings into structured puzzle objects:

```typescript
import { Chess } from 'chess.js';

export function parsePGNToPuzzles(pgnText: string, collectionId: string, userCategory: string) {
  const games = pgnText.split(/\n\s*\n(?=\[Event|\[FEN|1\.)/g).filter(g => g.trim().length > 0);

  return games.map((rawGame, idx) => {
    // 1. Extract headers [Header "Value"]
    const headers: Record<string, string> = {};
    const headerRegex = /\[(\w+)\s+"([^"]+)"\]/g;
    let match;
    while ((match = headerRegex.exec(rawGame)) !== null) {
      headers[match[1]] = match[2];
    }

    const fen = headers['FEN'] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const sideToMove = fen.includes(' b ') ? 'b' : 'w';

    // 2. Clean move text
    const movesText = rawGame.replace(/\[[^\]]+\]/g, '').trim();
    const cleanedMoves = movesText
      .replace(/\{[^}]+\}/g, '')
      .replace(/\([^)]+\)/g, '')
      .replace(/\$\d+/g, '')
      .replace(/\d+\.\.\.|\d+\./g, '')
      .replace(/1\/2-1\/2|1-0|0-1|\*/g, '')
      .trim();

    const solutionMoves = cleanedMoves.split(/\s+/).filter(m => m.length > 0);

    // 3. Generate UCI move format using chess.js
    const chess = new Chess(fen);
    const solutionUCI: string[] = [];
    solutionMoves.forEach((san) => {
      try {
        const res = chess.move(san);
        if (res) solutionUCI.push(res.from + res.to + (res.promotion || ''));
      } catch {}
    });

    return {
      collectionId,
      userCategory,
      fen,
      sideToMove,
      solutionMoves,
      solutionUCI,
      description: headers['Event'] || `Puzzle #${idx + 1}`,
      tags: [userCategory],
      rating: 1400 + solutionMoves.length * 50,
    };
  });
}
```

---

## 5. Gamification & Leveling Engine

### Level Formula Rule
> **Level strictly equals `completedCollectionsCount`** (minimum 1 for new players).

```typescript
export function calculateUserLevel(completedCollectionsCount: number): number {
  return Math.max(1, completedCollectionsCount);
}
```

### XP & Coin Calculation
```typescript
export function calculateXpGain(
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Master',
  solveTimeMs: number,
  mistakes: number,
  comboCount: number
): { xp: number; coins: number } {
  let base = 50;
  if (difficulty === 'Easy') base = 30;
  if (difficulty === 'Medium') base = 50;
  if (difficulty === 'Hard') base = 85;
  if (difficulty === 'Master') base = 120;

  // Speed Bonus (< 10 seconds)
  const speedMult = solveTimeMs < 10000 ? 1.5 : solveTimeMs < 20000 ? 1.2 : 1.0;

  // Accuracy Bonus
  const accuracyMult = mistakes === 0 ? 2.0 : mistakes === 1 ? 1.2 : 0.8;

  // Combo Multiplier
  const comboMult = Math.min(1 + (comboCount - 1) * 0.25, 3.0);

  const xp = Math.round(base * speedMult * accuracyMult * comboMult);
  const coins = Math.round(xp * 0.4);

  return { xp, coins };
}
```

---

## 6. Spaced Repetition (SM-2) & Failed Review Queue

### Failed-Puzzles-Only Review Query
```typescript
// Query to retrieve ONLY failed puzzles for SRS review
export async function getFailedPuzzlesForReview(userId: string) {
  return await prisma.puzzle.findMany({
    where: {
      collection: { userId },
      attempts: {
        some: {
          solved: false,
        },
      },
    },
    include: {
      collection: true,
    },
  });
}
```

### SuperMemo SM-2 Math
```typescript
export function updatePuzzleSRS(
  currentRepetitions: number,
  currentEaseFactor: number,
  currentIntervalDays: number,
  solved: boolean,
  mistakes: number,
  solveTimeMs: number
) {
  let quality = 0;
  if (!solved) {
    quality = mistakes > 2 ? 0 : 1;
  } else {
    quality = mistakes > 0 ? 2 : solveTimeMs > 25000 ? 3 : solveTimeMs > 10000 ? 4 : 5;
  }

  let repetitions = currentRepetitions;
  let easeFactor = currentEaseFactor;
  let intervalDays = currentIntervalDays;

  if (quality >= 3) {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
    repetitions += 1;
  } else {
    repetitions = 0;
    intervalDays = 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + intervalDays);

  return { repetitions, easeFactor, intervalDays, dueDate };
}
```

---

## 7. Radar Chart & Insights Analytics Engine

The Insights Dashboard displays performance across categories matching your UI design:

### Performance Rating Math per Category
$$\text{Performance Rating} = 2000 + (\text{Accuracy Rate} \times 115)$$

```typescript
export function generateRadarChartData(puzzles: Puzzle[], userAttempts: PuzzleAttempt[]) {
  const categories = [
    'Attraction', 'Checkmate', 'Endgame', 'Fork', 
    'Middlegame', 'Pin', 'Quiet move', 'Sacrifice', 'Trapped piece'
  ];

  return categories.map((cat) => {
    const catPuzzles = puzzles.filter(
      (p) => p.userCategory === cat || p.tags.includes(cat)
    );
    const puzzleIds = new Set(catPuzzles.map(p => p.id));
    const attempts = userAttempts.filter(a => puzzleIds.has(a.puzzleId));
    
    const solvedCount = attempts.filter(a => a.solved).length;
    const accuracy = attempts.length > 0 ? solvedCount / attempts.length : 0.8;
    const ratingScore = Math.round(2000 + accuracy * 115);

    return {
      category: cat,
      rating: ratingScore,
    };
  });
}
```

---

## 8. Session Endurance & Fatigue Tracking

Endurance tracks after how many consecutive puzzles a player begins to fail or make mistakes due to mental fatigue.

```typescript
export function calculateSessionEndurance(attemptsInSession: { solved: boolean; mistakes: number }[]): {
  maxCleanStreak: number;
  fatigueOnsetIndex: number | null;
} {
  let currentStreak = 0;
  let maxCleanStreak = 0;
  let fatigueOnsetIndex: number | null = null;

  attemptsInSession.forEach((attempt, idx) => {
    if (attempt.solved && attempt.mistakes === 0) {
      currentStreak++;
      if (currentStreak > maxCleanStreak) maxCleanStreak = currentStreak;
    } else {
      if (fatigueOnsetIndex === null) {
        fatigueOnsetIndex = idx + 1; // 1-indexed puzzle number where mistake occurred
      }
      currentStreak = 0;
    }
  });

  return { maxCleanStreak, fatigueOnsetIndex };
}
```

---

## 9. API Endpoint Specifications

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/google` | Verify Google OAuth credential token & login | No |
| `GET` | `/api/user/profile` | Fetch user profile, level, streak, XP | Yes |
| `GET` | `/api/collections` | Fetch all collections belonging to active user | Yes |
| `POST` | `/api/collections/upload` | Upload new PGN with Name & Category | Yes |
| `DELETE`| `/api/collections/:id` | Delete collection & associated puzzles | Yes |
| `GET` | `/api/puzzles/review` | Fetch ONLY failed puzzles for SRS review | Yes |
| `POST` | `/api/puzzles/attempt` | Submit puzzle solve attempt (time, mistakes) | Yes |
| `GET` | `/api/insights/radar` | Fetch category performance data for Spider Chart | Yes |

---

## 10. Verification & Build Commands

- **Run Frontend locally**: `npm run dev` (starts on `http://localhost:3000`)
- **Compile Production Bundle**: `npm run build`
- **Database Migrations**: `npx prisma migrate dev --name init`
