import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { prisma } from './prismaClient.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || 'tactix-dev-secret';
const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
const memoryUsers = new Map();
const memoryLibraries = new Map();
const memoryVideos = new Map();
const memoryFollows = new Set(); // Set of "followerId:followingId"
const memoryResetTokens = new Map();
const usingDatabase = Boolean(process.env.DATABASE_URL && prisma);

function extractYoutubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function cloneLibrarySnapshot(snapshot) {
  return {
    collections: Array.isArray(snapshot?.collections) ? structuredClone(snapshot.collections) : [],
    puzzles: Array.isArray(snapshot?.puzzles) ? structuredClone(snapshot.puzzles) : [],
  };
}

function getMemoryUserById(userId) {
  return memoryUsers.get(userId) || null;
}

function getMemoryUserByUsername(username) {
  if (!username) return null;
  const target = String(username).toLowerCase().trim();
  for (const user of memoryUsers.values()) {
    if (
      user.username?.toLowerCase() === target ||
      (user.usernameNormalized && user.usernameNormalized === target)
    ) {
      return user;
    }
  }
  return null;
}

function getMemoryUserByEmail(email) {
  if (!email) return null;
  const target = String(email).toLowerCase().trim();
  for (const user of memoryUsers.values()) {
    if (user.email?.toLowerCase() === target) return user;
  }
  return null;
}

function setMemoryLibrary(userId, collections, puzzles) {
  memoryLibraries.set(userId, cloneLibrarySnapshot({ collections, puzzles }));
}

function getMemoryLibrary(userId) {
  return memoryLibraries.get(userId) || { collections: [], puzzles: [] };
}

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

function makeToken() {
  return crypto.randomBytes(32).toString('hex');
}

function signToken(user) {
  return jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '30d' });
}

async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (!decoded?.userId) return null;
    if (!usingDatabase) {
      return getMemoryUserById(decoded.userId);
    }

    return prisma.user.findUnique({ where: { id: decoded.userId } });
  } catch {
    return null;
  }
}

async function getMailer() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendMail(to, subject, html) {
  const transporter = await getMailer();
  if (!transporter) return false;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });

  return true;
}

function userToProfile(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    avatar: user.avatar || defaultAvatar,
    bio: user.bio || '',
    dailyGoal: user.dailyGoal ?? 10,
    isLoggedIn: true,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, database: usingDatabase ? 'postgresql' : 'memory' });
});

// --- Case-Insensitive User Registration ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password, confirmPassword } = req.body ?? {};
    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Username, email, password, and confirm password are required.' });
    }

    if (confirmPassword && confirmPassword !== password) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const cleanUsername = String(username).trim();
    const normalizedUsername = cleanUsername.toLowerCase();
    const cleanEmail = String(email).trim().toLowerCase();

    let user;

    if (usingDatabase) {
      const emailExists = await prisma.user.findFirst({
        where: { email: { equals: cleanEmail, mode: 'insensitive' } },
      });
      if (emailExists) {
        return res.status(409).json({ message: 'Email is already registered.' });
      }

      const usernameExists = await prisma.user.findFirst({
        where: {
          OR: [
            { usernameNormalized: normalizedUsername },
            { username: { equals: cleanUsername, mode: 'insensitive' } },
          ],
        },
      });
      if (usernameExists) {
        return res.status(409).json({ message: 'Username is already taken.' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          username: cleanUsername,
          usernameNormalized: normalizedUsername,
          name: cleanUsername,
          passwordHash,
          avatar: defaultAvatar,
        },
      });
    } else {
      if (getMemoryUserByEmail(cleanEmail)) {
        return res.status(409).json({ message: 'Email is already registered.' });
      }

      if (getMemoryUserByUsername(cleanUsername)) {
        return res.status(409).json({ message: 'Username is already taken.' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      user = {
        id: crypto.randomUUID(),
        email: cleanEmail,
        username: cleanUsername,
        usernameNormalized: normalizedUsername,
        name: cleanUsername,
        avatar: defaultAvatar,
        passwordHash,
      };
      memoryUsers.set(user.id, user);
      setMemoryLibrary(user.id, [], []);
    }

    return res.json({
      message: 'Account created successfully.',
      token: signToken(user),
      user: userToProfile(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to register account.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// --- Case-Insensitive User Login ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const cleanUsername = String(username).trim();
    const normalizedUsername = cleanUsername.toLowerCase();

    let user;
    if (usingDatabase) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { usernameNormalized: normalizedUsername },
            { username: { equals: cleanUsername, mode: 'insensitive' } },
            { email: { equals: cleanUsername, mode: 'insensitive' } },
          ],
        },
      });
    } else {
      user = getMemoryUserByUsername(cleanUsername) || getMemoryUserByEmail(cleanUsername);
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = signToken(user);
    return res.json({ message: 'Login successful.', token, user: userToProfile(user) });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to login.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { emailOrUsername } = req.body ?? {};
    if (!emailOrUsername) {
      return res.status(400).json({ message: 'Email or username is required.' });
    }

    if (!usingDatabase) {
      return res.json({ message: 'Password reset is unavailable in local mode.' });
    }

    const target = String(emailOrUsername).trim();
    const normalized = target.toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: target, mode: 'insensitive' } },
          { usernameNormalized: normalized },
          { username: { equals: target, mode: 'insensitive' } },
        ],
      },
    });

    if (!user) {
      return res.json({ message: 'If the account exists, a reset link has been sent.' });
    }

    const resetToken = makeToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 30),
      },
    });

    const resetBase = process.env.APP_URL || 'http://localhost:3000';
    const resetLink = `${resetBase}/?reset=${resetToken}`;
    const sent = await sendMail(
      user.email,
      'Reset your Tactix password',
      `<p>Reset your password here: <a href="${resetLink}">${resetLink}</a></p>`
    );

    return res.json({
      message: 'Password reset link sent.',
      resetLink: sent ? undefined : resetLink,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to start password reset.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body ?? {};
    if (!token || !password) {
      return res.status(400).json({ message: 'Reset token and new password are required.' });
    }

    if (!usingDatabase) {
      const userId = memoryResetTokens.get(token);
      if (!userId) {
        return res.status(400).json({ message: 'Reset link is invalid or expired.' });
      }

      const user = getMemoryUserById(userId);
      if (!user) {
        return res.status(400).json({ message: 'Reset link is invalid or expired.' });
      }

      user.passwordHash = await bcrypt.hash(password, 12);
      memoryResetTokens.delete(token);
      return res.json({ message: 'Password reset successfully.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordTokenExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or expired.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordTokenExpiresAt: null,
      },
    });

    return res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to reset password.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    return res.json({ user: userToProfile(user) });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load current user.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/auth/logout', async (_req, res) => {
  return res.json({ message: 'Logged out.' });
});

// --- Library Endpoints ---
app.get('/api/library', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    if (!usingDatabase) {
      return res.json(getMemoryLibrary(user.id));
    }

    const [collections, puzzles] = await Promise.all([
      prisma.collection.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.puzzle.findMany({
        where: { collection: { userId: user.id } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.json({ collections, puzzles });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load library data.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.put('/api/library', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const collections = Array.isArray(req.body?.collections) ? req.body.collections : [];
    const puzzles = Array.isArray(req.body?.puzzles) ? req.body.puzzles : [];

    if (!usingDatabase) {
      setMemoryLibrary(user.id, collections, puzzles);
      return res.json({ ok: true });
    }

    await prisma.$transaction(async (tx) => {
      for (const col of collections) {
        await tx.collection.upsert({
          where: { id: col.id },
          create: {
            id: col.id,
            userId: user.id,
            name: col.name,
            category: col.category,
            description: col.description,
            icon: col.icon || '📂',
            color: col.color || 'from-[#171717] to-[#262626]',
            coverImage: col.coverImage || null,
            isCompleted: Boolean(col.isCompleted),
            createdAt: col.createdAt ? new Date(col.createdAt) : new Date(),
            updatedAt: new Date(),
          },
          update: {
            name: col.name,
            category: col.category,
            description: col.description,
            icon: col.icon || '📂',
            color: col.color || 'from-[#171717] to-[#262626]',
            coverImage: col.coverImage || null,
            isCompleted: Boolean(col.isCompleted),
            updatedAt: new Date(),
          },
        });
      }

      for (const puzzle of puzzles) {
        const existing = await tx.puzzle.findUnique({ where: { id: puzzle.id } });
        const hasFailed = puzzle.hasFailed !== undefined
          ? Boolean(puzzle.hasFailed)
          : Boolean(existing?.hasFailed || false);
        const attempts = Math.max(existing?.attempts || 0, puzzle.attempts || 0);
        const solvedCount = Math.max(existing?.solvedCount || 0, puzzle.solvedCount || 0);
        const failedCount = Math.max(existing?.failedCount || 0, puzzle.failedCount || 0);

        await tx.puzzle.upsert({
          where: { id: puzzle.id },
          create: {
            id: puzzle.id,
            collectionId: puzzle.collectionId,
            userCategory: puzzle.userCategory,
            fen: puzzle.fen,
            sideToMove: puzzle.sideToMove,
            solutionMoves: puzzle.solutionMoves || [],
            solutionUCI: puzzle.solutionUCI || [],
            description: puzzle.description,
            event: puzzle.event,
            white: puzzle.white,
            black: puzzle.black,
            tags: puzzle.tags || [],
            difficulty: puzzle.difficulty || 'Medium',
            rating: puzzle.rating || 1400,
            comments: puzzle.comments,
            rawPgn: puzzle.rawPgn,
            movesData: puzzle.movesData ? puzzle.movesData : undefined,
            hasFailed,
            attempts,
            solvedCount,
            failedCount,
            avgSolveTimeMs: puzzle.avgSolveTimeMs || existing?.avgSolveTimeMs || 0,
            personalBestMs: puzzle.personalBestMs || existing?.personalBestMs || null,
            lastAttemptDate: puzzle.lastAttemptDate ? new Date(puzzle.lastAttemptDate) : existing?.lastAttemptDate || null,
            srsDueDate: puzzle.srsDueDate ? new Date(puzzle.srsDueDate) : existing?.srsDueDate || null,
            srsRepetitions: puzzle.srsRepetitions || existing?.srsRepetitions || 0,
            srsEaseFactor: puzzle.srsEaseFactor || existing?.srsEaseFactor || 2.5,
            srsIntervalDays: puzzle.srsIntervalDays || existing?.srsIntervalDays || 0,
            isFavorite: Boolean(puzzle.isFavorite || existing?.isFavorite),
            createdAt: puzzle.createdAt ? new Date(puzzle.createdAt) : new Date(),
          },
          update: {
            collectionId: puzzle.collectionId,
            userCategory: puzzle.userCategory,
            fen: puzzle.fen,
            sideToMove: puzzle.sideToMove,
            solutionMoves: puzzle.solutionMoves || [],
            solutionUCI: puzzle.solutionUCI || [],
            description: puzzle.description,
            event: puzzle.event,
            white: puzzle.white,
            black: puzzle.black,
            tags: puzzle.tags || [],
            difficulty: puzzle.difficulty || 'Medium',
            rating: puzzle.rating || 1400,
            comments: puzzle.comments,
            rawPgn: puzzle.rawPgn || existing?.rawPgn,
            movesData: puzzle.movesData ? puzzle.movesData : existing?.movesData || undefined,
            hasFailed,
            attempts,
            solvedCount,
            failedCount,
            avgSolveTimeMs: puzzle.avgSolveTimeMs || existing?.avgSolveTimeMs || 0,
            personalBestMs: puzzle.personalBestMs || existing?.personalBestMs || null,
            lastAttemptDate: puzzle.lastAttemptDate ? new Date(puzzle.lastAttemptDate) : existing?.lastAttemptDate || null,
            srsDueDate: puzzle.srsDueDate ? new Date(puzzle.srsDueDate) : existing?.srsDueDate || null,
            srsRepetitions: puzzle.srsRepetitions || existing?.srsRepetitions || 0,
            srsEaseFactor: puzzle.srsEaseFactor || existing?.srsEaseFactor || 2.5,
            srsIntervalDays: puzzle.srsIntervalDays || existing?.srsIntervalDays || 0,
            isFavorite: Boolean(puzzle.isFavorite || existing?.isFavorite),
          },
        });
      }
    });

    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to save library data.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// --- Record Puzzle Attempt Endpoint (1-Mistake Limit & Replay Success Handling) ---
app.post('/api/puzzles/:id/attempt', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ message: 'Not authenticated.' });

    const puzzleId = req.params.id;
    const { solved, solveTimeMs, mistakes = 0, xpEarned = 10, coinsEarned = 2, collectionId } = req.body ?? {};
    
    // 1-MISTAKE MAXIMUM RULE:
    // If mistakes >= 1, the puzzle is immediately marked failed!
    const isSolved = Boolean(solved) && Number(mistakes || 0) === 0;
    const recordedMistakes = isSolved ? 0 : Math.max(1, Number(mistakes) || 1);
    const timeMs = Number(solveTimeMs) || 0;
    const today = new Date().toISOString().split('T')[0];

    if (!usingDatabase) {
      return res.json({ ok: true });
    }

    // 1. Log attempt
    await prisma.puzzleAttempt.create({
      data: {
        userId: user.id,
        puzzleId,
        collectionId: collectionId || null,
        solved: isSolved,
        solveTimeMs: timeMs,
        mistakes: recordedMistakes,
        xpEarned: isSolved ? Number(xpEarned) || 10 : 0,
        coinsEarned: isSolved ? Number(coinsEarned) || 2 : 0,
      },
    });

    // 2. Update Puzzle stats
    const puzzle = await prisma.puzzle.findUnique({ where: { id: puzzleId } });
    let updatedPuzzle = puzzle;
    if (puzzle) {
      const attempts = (puzzle.attempts || 0) + 1;
      const solvedCount = (puzzle.solvedCount || 0) + (isSolved ? 1 : 0);
      const failedCount = (puzzle.failedCount || 0) + (isSolved ? 0 : 1);
      
      // CRITICAL: If successfully solved, clear hasFailed so it is removed from the failed replay queue!
      const hasFailed = isSolved ? false : true;

      const avgSolveTimeMs = puzzle.avgSolveTimeMs
        ? Math.round((puzzle.avgSolveTimeMs * (attempts - 1) + timeMs) / attempts)
        : timeMs;
      const personalBestMs = isSolved && (puzzle.personalBestMs === null || timeMs < puzzle.personalBestMs)
        ? timeMs
        : puzzle.personalBestMs;

      updatedPuzzle = await prisma.puzzle.update({
        where: { id: puzzleId },
        data: {
          attempts,
          solvedCount,
          failedCount,
          hasFailed,
          avgSolveTimeMs,
          personalBestMs,
          lastAttemptDate: new Date(),
        },
      });
    }

    // 3. Update User Heatmap and Stats
    const userRecord = await prisma.user.findUnique({ where: { id: user.id } });
    const currentHeatmap =
      userRecord.heatmapData && typeof userRecord.heatmapData === 'object'
        ? { ...userRecord.heatmapData }
        : {};
    const todayEntry = currentHeatmap[today] || { solved: 0, failed: 0 };
    const newSolved = (todayEntry.solved || 0) + (isSolved ? 1 : 0);
    const newFailed = (todayEntry.failed || 0) + (isSolved ? 0 : 1);
    currentHeatmap[today] = { solved: newSolved, failed: newFailed };

    const newXp = (userRecord.xp || 0) + (isSolved ? Number(xpEarned) || 10 : 0);
    const newCoins = (userRecord.coins || 0) + (isSolved ? Number(coinsEarned) || 2 : 0);
    const newTotalAttempts = (userRecord.totalAttempts || 0) + 1;
    const newTotalSolved = (userRecord.totalSolved || 0) + (isSolved ? 1 : 0);

    // Streak calculation
    let streak = userRecord.currentStreak || 1;
    let bestStreak = userRecord.bestStreak || 1;
    const lastActive = userRecord.lastActiveDate
      ? userRecord.lastActiveDate.toISOString().split('T')[0]
      : '';
    if (lastActive !== today && isSolved) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastActive === yesterday) {
        streak += 1;
      } else if (lastActive && lastActive < yesterday) {
        streak = 1;
      }
      if (streak > bestStreak) bestStreak = streak;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: newXp,
        coins: newCoins,
        currentStreak: streak,
        bestStreak,
        lastActiveDate: new Date(),
        heatmapData: currentHeatmap,
      },
    });

    return res.json({
      puzzle: updatedPuzzle,
      userStats: {
        totalSolved: newTotalSolved,
        totalAttempts: newTotalAttempts,
        accuracy: Math.round((newTotalSolved / newTotalAttempts) * 100),
        currentStreak: streak,
        bestStreak,
        lastActiveDate: today,
        totalThinkingTimeMs: 0,
        dailyGoal: updatedUser.dailyGoal || 10,
        xp: newXp,
        level: updatedUser.level || 1,
        completedCollectionsCount: updatedUser.completedCollectionsCount || 0,
        levelTitle: updatedUser.level >= 10 ? 'Grandmaster' : 'Novice Solver',
        coins: newCoins,
        performanceRating: updatedUser.performanceRating || 2006,
        streakFreezeAvailable: 1,
        heatmapData: currentHeatmap,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Failed to record attempt',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// --- User Stats Endpoint ---
app.get('/api/user/stats', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ message: 'Not authenticated.' });

    if (!usingDatabase) {
      return res.json({
        userStats: {
          totalSolved: 0,
          totalAttempts: 0,
          accuracy: 100,
          currentStreak: 1,
          bestStreak: 1,
          lastActiveDate: new Date().toISOString().split('T')[0],
          totalThinkingTimeMs: 0,
          dailyGoal: user.dailyGoal || 10,
          xp: 0,
          level: 1,
          completedCollectionsCount: 0,
          levelTitle: 'Novice Solver',
          coins: 50,
          performanceRating: 2006,
          streakFreezeAvailable: 1,
          heatmapData: {},
        },
      });
    }

    const [attempts, userRecord] = await Promise.all([
      prisma.puzzleAttempt.findMany({ where: { userId: user.id } }),
      prisma.user.findUnique({ where: { id: user.id } }),
    ]);

    const totalAttempts = attempts.length;
    const totalSolved = attempts.filter((a) => a.solved).length;
    const accuracy = totalAttempts > 0 ? Math.round((totalSolved / totalAttempts) * 100) : 100;
    const heatmapData =
      userRecord.heatmapData && typeof userRecord.heatmapData === 'object'
        ? userRecord.heatmapData
        : {};

    return res.json({
      userStats: {
        totalSolved,
        totalAttempts,
        accuracy,
        currentStreak: userRecord.currentStreak || 1,
        bestStreak: userRecord.bestStreak || 1,
        lastActiveDate: userRecord.lastActiveDate
          ? userRecord.lastActiveDate.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        totalThinkingTimeMs: attempts.reduce((sum, a) => sum + (a.solveTimeMs || 0), 0),
        dailyGoal: userRecord.dailyGoal || 10,
        xp: userRecord.xp || 0,
        level: userRecord.level || 1,
        completedCollectionsCount: userRecord.completedCollectionsCount || 0,
        levelTitle:
          userRecord.level >= 10 ? 'Grandmaster' : userRecord.level >= 5 ? 'Master Solver' : 'Novice Solver',
        coins: userRecord.coins || 50,
        performanceRating: userRecord.performanceRating || 2006,
        streakFreezeAvailable: 1,
        heatmapData,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Failed to load user stats',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// --- User Profile & Avatar Endpoints ---
app.put('/api/user/profile', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ message: 'Not authenticated.' });

    const { name, bio, avatar } = req.body ?? {};
    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = String(name).trim();
    if (bio !== undefined) dataToUpdate.bio = String(bio).trim();
    if (avatar !== undefined) dataToUpdate.avatar = String(avatar).trim();

    if (usingDatabase) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: dataToUpdate,
      });
      return res.json({ user: userToProfile(updated) });
    } else {
      Object.assign(user, dataToUpdate);
      return res.json({ user: userToProfile(user) });
    }
  } catch (err) {
    return res.status(500).json({
      message: 'Failed to update profile',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

app.post('/api/user/avatar', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ message: 'Not authenticated.' });

    const { avatarData } = req.body ?? {};
    if (!avatarData || typeof avatarData !== 'string') {
      return res.status(400).json({ message: 'Avatar image data is required.' });
    }

    if (usingDatabase) {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatar: avatarData },
      });
    } else {
      user.avatar = avatarData;
    }

    return res.json({ avatar: avatarData });
  } catch (err) {
    return res.status(500).json({
      message: 'Failed to upload avatar',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// --- User Preferences Endpoints (With Theme Support) ---
app.get('/api/user/preferences', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ message: 'Not authenticated.' });

    const defaultPrefs = {
      theme: 'dark',
      boardTheme: 'dark',
      pieceSet: 'standard',
      showCoordinates: true,
      coordinateStyle: 'inside',
      highlightLastMove: true,
      showLegalMoves: true,
      soundEnabled: true,
      moveSound: true,
      captureSound: true,
      checkSound: true,
      errorSound: true,
      autoNext: false,
      autoNextDelaySec: 2,
      streakFreezeActive: true,
    };

    if (!usingDatabase) {
      return res.json({ preferences: defaultPrefs });
    }

    let prefs = await prisma.userPreferences.findUnique({ where: { userId: user.id } });
    if (!prefs) {
      prefs = await prisma.userPreferences.create({
        data: {
          userId: user.id,
          ...defaultPrefs,
        },
      });
    }

    return res.json({ preferences: prefs });
  } catch (err) {
    return res.status(500).json({
      message: 'Failed to get preferences',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

const ALLOWED_PREF_FIELDS = [
  'theme', 'boardTheme', 'pieceSet', 'showCoordinates', 'coordinateStyle',
  'highlightLastMove', 'showLegalMoves', 'soundEnabled', 'moveSound',
  'captureSound', 'checkSound', 'errorSound', 'autoNext', 'autoNextDelaySec',
  'streakFreezeActive'
];

app.put('/api/user/preferences', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ message: 'Not authenticated.' });

    const { preferences } = req.body ?? {};
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ message: 'Invalid preferences payload.' });
    }

    if (usingDatabase) {
      const cleanPrefs = {};
      for (const key of ALLOWED_PREF_FIELDS) {
        if (preferences[key] !== undefined) {
          cleanPrefs[key] = preferences[key];
        }
      }

      const updated = await prisma.userPreferences.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...cleanPrefs },
        update: cleanPrefs,
      });
      return res.json({ preferences: updated, ok: true });
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({
      message: 'Failed to save preferences',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// --- Video Library API Endpoints (Auto-Title & Categorization) ---
app.get('/api/videos', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const { category, search, sort = 'recent' } = req.query;

    if (!usingDatabase) {
      let userVideos = memoryVideos.get(user.id) || [];
      if (category && category !== 'All') {
        userVideos = userVideos.filter((v) => v.category?.toLowerCase() === String(category).toLowerCase());
      }
      if (search) {
        const q = String(search).toLowerCase();
        userVideos = userVideos.filter(
          (v) => v.title.toLowerCase().includes(q) || v.notes?.toLowerCase().includes(q)
        );
      }
      if (sort === 'oldest') {
        userVideos.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else if (sort === 'alphabetical') {
        userVideos.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        userVideos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      return res.json({ videos: userVideos });
    }

    const whereClause = { userId: user.id };
    if (category && category !== 'All') {
      whereClause.category = { equals: String(category), mode: 'insensitive' };
    }
    if (search) {
      const q = String(search).trim();
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ];
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (sort === 'alphabetical') orderBy = { title: 'asc' };

    const videos = await prisma.videoLibraryItem.findMany({
      where: whereClause,
      orderBy,
    });

    return res.json({ videos });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch video library.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/videos', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const { youtubeUrl, title, category, notes } = req.body ?? {};
    if (!youtubeUrl || typeof youtubeUrl !== 'string') {
      return res.status(400).json({ message: 'YouTube URL is required.' });
    }

    const youtubeVideoId = extractYoutubeVideoId(youtubeUrl);
    if (!youtubeVideoId) {
      return res.status(400).json({ message: 'Invalid YouTube URL format.' });
    }

    let videoTitle = title?.trim();

    // AUTOMATIC YOUTUBE TITLE EXTRACTION VIA OEMBED IF TITLE IS EMPTY
    if (!videoTitle) {
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeVideoId}&format=json`;
        const resp = await fetch(oembedUrl);
        if (resp.ok) {
          const data = await resp.json();
          if (data?.title) {
            videoTitle = String(data.title).trim();
          }
        }
      } catch (oembedErr) {
        console.warn('YouTube title extraction failed, falling back:', oembedErr);
      }
    }

    if (!videoTitle) {
      videoTitle = `Chess Video (${youtubeVideoId})`;
    }

    const cleanCategory = category?.trim() || 'Opening';
    let videoItem;

    if (!usingDatabase) {
      const userVideos = memoryVideos.get(user.id) || [];
      videoItem = {
        id: crypto.randomUUID(),
        userId: user.id,
        youtubeUrl,
        youtubeVideoId,
        title: videoTitle,
        category: cleanCategory,
        notes: notes?.trim() || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      userVideos.unshift(videoItem);
      memoryVideos.set(user.id, userVideos);
    } else {
      videoItem = await prisma.videoLibraryItem.create({
        data: {
          userId: user.id,
          youtubeUrl,
          youtubeVideoId,
          title: videoTitle,
          category: cleanCategory,
          notes: notes?.trim() || null,
        },
      });
    }

    return res.json({ message: 'Video saved to library.', video: videoItem });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to add video.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.delete('/api/videos/:id', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const videoId = req.params.id;
    if (!videoId) {
      return res.status(400).json({ message: 'Video ID is required.' });
    }

    if (!usingDatabase) {
      const userVideos = memoryVideos.get(user.id) || [];
      const filtered = userVideos.filter((v) => v.id !== videoId);
      memoryVideos.set(user.id, filtered);
      return res.json({ message: 'Video removed.' });
    }

    await prisma.videoLibraryItem.deleteMany({
      where: {
        id: videoId,
        userId: user.id,
      },
    });

    return res.json({ message: 'Video removed.' });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete video.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// --- Daily Goal API Endpoint ---
app.put('/api/user/daily-goal', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const goal = Number(req.body?.dailyGoal);
    if (!goal || goal < 1 || goal > 500) {
      return res.status(400).json({ message: 'Invalid daily goal value.' });
    }

    if (usingDatabase) {
      await prisma.user.update({
        where: { id: user.id },
        data: { dailyGoal: goal },
      });
    } else {
      user.dailyGoal = goal;
    }

    return res.json({ message: 'Daily goal updated successfully.', dailyGoal: goal });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update daily goal.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// --- Change Password API Endpoint ---
app.post('/api/user/change-password', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body ?? {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    if (usingDatabase) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    } else {
      user.passwordHash = passwordHash;
    }

    return res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to change password.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==========================================
// --- COMMUNITY & SOCIAL API ENDPOINTS ---
// ==========================================

// --- 1. User Search (Case-Insensitive, Partial) ---
app.get('/api/community/search', async (req, res) => {
  try {
    const currentUser = await getAuthenticatedUser(req);
    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.json({ users: [] });
    }

    const normalizedQ = q.toLowerCase();

    if (!usingDatabase) {
      const results = [];
      for (const u of memoryUsers.values()) {
        if (
          u.username?.toLowerCase().includes(normalizedQ) ||
          u.name?.toLowerCase().includes(normalizedQ)
        ) {
          const isFollowing = currentUser ? memoryFollows.has(`${currentUser.id}:${u.id}`) : false;
          results.push({
            id: u.id,
            username: u.username,
            name: u.name,
            avatar: u.avatar || defaultAvatar,
            bio: u.bio || '',
            currentStreak: u.currentStreak || 1,
            bestStreak: u.bestStreak || 1,
            totalSolved: 0,
            accuracy: 100,
            followersCount: 0,
            followingCount: 0,
            isFollowing,
            isSelf: currentUser?.id === u.id,
          });
        }
      }
      return res.json({ users: results.slice(0, 20) });
    }

    const foundUsers = await prisma.user.findMany({
      where: {
        OR: [
          { usernameNormalized: { contains: normalizedQ } },
          { username: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        currentStreak: true,
        bestStreak: true,
        followers: currentUser ? { where: { followerId: currentUser.id } } : false,
        _count: {
          select: {
            followers: true,
            following: true,
            puzzleAttempts: { where: { solved: true } },
          },
        },
      },
      take: 20,
    });

    const formatted = foundUsers.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      avatar: u.avatar || defaultAvatar,
      bio: u.bio || '',
      currentStreak: u.currentStreak || 1,
      bestStreak: u.bestStreak || 1,
      totalSolved: u._count?.puzzleAttempts || 0,
      accuracy: 85,
      followersCount: u._count?.followers || 0,
      followingCount: u._count?.following || 0,
      isFollowing: Boolean(currentUser && u.followers && u.followers.length > 0),
      isSelf: currentUser?.id === u.id,
    }));

    return res.json({ users: formatted });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to search users.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// --- 2. Public User Profile Endpoint ---
app.get('/api/community/profile/:username', async (req, res) => {
  try {
    const currentUser = await getAuthenticatedUser(req);
    const rawUsername = String(req.params.username || '').trim();
    const normalized = rawUsername.toLowerCase();

    if (!usingDatabase) {
      const u = getMemoryUserByUsername(rawUsername);
      if (!u) return res.status(404).json({ message: 'User not found.' });

      return res.json({
        user: {
          id: u.id,
          username: u.username,
          name: u.name,
          avatar: u.avatar || defaultAvatar,
          bio: u.bio || '',
          currentStreak: u.currentStreak || 1,
          bestStreak: u.bestStreak || 1,
          totalSolved: 0,
          totalAttempts: 0,
          accuracy: 100,
          friendsCount: 0,
          followersCount: 0,
          followingCount: 0,
          isFollowing: currentUser ? memoryFollows.has(`${currentUser.id}:${u.id}`) : false,
          isSelf: currentUser?.id === u.id,
          heatmapData: u.heatmapData || {},
        },
      });
    }

    const u = await prisma.user.findFirst({
      where: {
        OR: [
          { usernameNormalized: normalized },
          { username: { equals: rawUsername, mode: 'insensitive' } },
        ],
      },
      include: {
        puzzleAttempts: true,
        followers: currentUser ? { where: { followerId: currentUser.id } } : false,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!u) return res.status(404).json({ message: 'User not found.' });

    const totalAttempts = u.puzzleAttempts.length;
    const totalSolved = u.puzzleAttempts.filter((a) => a.solved).length;
    const accuracy = totalAttempts > 0 ? Math.round((totalSolved / totalAttempts) * 100) : 100;
    const followersCount = u._count?.followers || 0;
    const followingCount = u._count?.following || 0;
    const friendsCount = Math.min(followersCount, followingCount);

    return res.json({
      user: {
        id: u.id,
        username: u.username,
        name: u.name,
        avatar: u.avatar || defaultAvatar,
        bio: u.bio || '',
        currentStreak: u.currentStreak || 1,
        bestStreak: u.bestStreak || 1,
        totalSolved,
        totalAttempts,
        accuracy,
        friendsCount,
        followersCount,
        followingCount,
        isFollowing: Boolean(currentUser && u.followers && u.followers.length > 0),
        isSelf: currentUser?.id === u.id,
        heatmapData: u.heatmapData || {},
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load public profile.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// --- 3. Follow User Endpoint ---
app.post('/api/community/follow/:userId', async (req, res) => {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) return res.status(401).json({ message: 'Not authenticated.' });

    const targetUserId = req.params.userId;
    if (!targetUserId) return res.status(400).json({ message: 'User ID is required.' });

    if (currentUser.id === targetUserId) {
      return res.status(400).json({ message: 'You cannot follow yourself.' });
    }

    if (!usingDatabase) {
      memoryFollows.add(`${currentUser.id}:${targetUserId}`);
      return res.json({ isFollowing: true });
    }

    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      },
      create: {
        followerId: currentUser.id,
        followingId: targetUserId,
      },
      update: {},
    });

    const followersCount = await prisma.follow.count({ where: { followingId: targetUserId } });

    return res.json({ isFollowing: true, followersCount });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to follow user.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// --- 4. Unfollow User Endpoint ---
app.delete('/api/community/follow/:userId', async (req, res) => {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) return res.status(401).json({ message: 'Not authenticated.' });

    const targetUserId = req.params.userId;
    if (!targetUserId) return res.status(400).json({ message: 'User ID is required.' });

    if (!usingDatabase) {
      memoryFollows.delete(`${currentUser.id}:${targetUserId}`);
      return res.json({ isFollowing: false });
    }

    await prisma.follow.deleteMany({
      where: {
        followerId: currentUser.id,
        followingId: targetUserId,
      },
    });

    const followersCount = await prisma.follow.count({ where: { followingId: targetUserId } });

    return res.json({ isFollowing: false, followersCount });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to unfollow user.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// --- 5. Community Leaderboard Endpoint ---
app.get('/api/community/leaderboard', async (req, res) => {
  try {
    const currentUser = await getAuthenticatedUser(req);
    const { period = 'weekly', filter = 'global' } = req.query;

    let startDate = new Date();
    if (period === 'daily') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'monthly') {
      startDate.setDate(startDate.getDate() - 30);
    } else {
      startDate = new Date(0); // All time
    }

    if (!usingDatabase) {
      let memoryList = Array.from(memoryUsers.values());
      if (filter === 'friends' && currentUser) {
        const friendIds = new Set();
        for (const key of memoryFollows) {
          const [follower, following] = key.split(':');
          if (follower === currentUser.id && memoryFollows.has(`${following}:${currentUser.id}`)) {
            friendIds.add(following);
          }
        }
        friendIds.add(currentUser.id);
        memoryList = memoryList.filter((u) => friendIds.has(u.id));
      }
      const mapped = memoryList.map((u, idx) => ({
        rank: idx + 1,
        id: u.id,
        username: u.username,
        name: u.name,
        avatar: u.avatar || defaultAvatar,
        currentStreak: u.currentStreak || 1,
        score: Math.max(10, 50 - idx * 5),
        isSelf: currentUser?.id === u.id,
      }));
      return res.json({
        leaderboard: mapped,
        currentUserRank: mapped.find((m) => m.isSelf) || null,
        period,
        filter,
      });
    }

    // Get mutual friends list if friends filter is requested (User A follows User B AND User B follows User A)
    let targetUserIds = undefined;
    if (filter === 'friends' && currentUser) {
      const userFollowing = await prisma.follow.findMany({
        where: { followerId: currentUser.id },
        select: { followingId: true },
      });
      const followingIds = userFollowing.map((f) => f.followingId);

      const mutualFollowers = await prisma.follow.findMany({
        where: {
          followerId: { in: followingIds },
          followingId: currentUser.id,
        },
        select: { followerId: true },
      });

      const friendIds = mutualFollowers.map((f) => f.followerId);
      targetUserIds = [currentUser.id, ...friendIds];
    }

    if (period === 'streak') {
      const users = await prisma.user.findMany({
        where: targetUserIds ? { id: { in: targetUserIds } } : undefined,
        orderBy: { currentStreak: 'desc' },
        take: 1000,
        select: {
          id: true,
          username: true,
          name: true,
          avatar: true,
          currentStreak: true,
          bestStreak: true,
        },
      });

      const leaderboard = users.map((u, idx) => ({
        rank: idx + 1,
        id: u.id,
        username: u.username,
        name: u.name,
        avatar: u.avatar || defaultAvatar,
        currentStreak: u.currentStreak || 1,
        score: u.currentStreak || 1,
        metricLabel: `${u.currentStreak || 1} day streak`,
        isSelf: currentUser?.id === u.id,
      }));

      const currentUserRank = leaderboard.find((item) => item.isSelf) || null;

      return res.json({ leaderboard, currentUserRank, period, filter });
    }

    // Solved attempts in time window
    const attempts = await prisma.puzzleAttempt.findMany({
      where: {
        solved: true,
        attemptedAt: { gte: startDate },
        ...(targetUserIds ? { userId: { in: targetUserIds } } : {}),
      },
      select: {
        userId: true,
      },
    });

    const userSolveCounts = {};
    for (const a of attempts) {
      userSolveCounts[a.userId] = (userSolveCounts[a.userId] || 0) + 1;
    }

    const allUsers = await prisma.user.findMany({
      where: targetUserIds ? { id: { in: targetUserIds } } : undefined,
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        currentStreak: true,
      },
      take: 1000,
    });

    const userScores = allUsers.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      avatar: u.avatar || defaultAvatar,
      currentStreak: u.currentStreak || 1,
      score: userSolveCounts[u.id] || 0,
      metricLabel: `${userSolveCounts[u.id] || 0} solved`,
      isSelf: currentUser?.id === u.id,
    }));

    userScores.sort((a, b) => b.score - a.score || b.currentStreak - a.currentStreak);

    const leaderboard = userScores.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

    let currentUserRank = leaderboard.find((item) => item.isSelf) || null;
    if (!currentUserRank && currentUser) {
      const selfIndex = userScores.findIndex((item) => item.isSelf);
      if (selfIndex !== -1) {
        currentUserRank = {
          ...userScores[selfIndex],
          rank: selfIndex + 1,
        };
      }
    }

    return res.json({ leaderboard, currentUserRank, period, filter });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load leaderboard.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// --- 6. Community Discover Endpoint (Suggested Learners) ---
app.get('/api/community/discover', async (req, res) => {
  try {
    const currentUser = await getAuthenticatedUser(req);

    if (!usingDatabase) {
      const suggested = Array.from(memoryUsers.values())
        .filter((u) => u.id !== currentUser?.id)
        .slice(0, 10)
        .map((u) => ({
          id: u.id,
          username: u.username,
          name: u.name,
          avatar: u.avatar || defaultAvatar,
          bio: u.bio || '',
          currentStreak: u.currentStreak || 1,
          bestStreak: u.bestStreak || 1,
          totalSolved: 120,
          accuracy: 88,
          followersCount: 5,
          followingCount: 4,
          isFollowing: currentUser ? memoryFollows.has(`${currentUser.id}:${u.id}`) : false,
        }));
      return res.json({ users: suggested });
    }

    let followingIds = [];
    if (currentUser) {
      const records = await prisma.follow.findMany({
        where: { followerId: currentUser.id },
        select: { followingId: true },
      });
      followingIds = records.map((r) => r.followingId);
    }

    const excludeIds = currentUser ? [currentUser.id, ...followingIds] : [];

    const candidates = await prisma.user.findMany({
      where: {
        id: { notIn: excludeIds },
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        currentStreak: true,
        bestStreak: true,
        _count: {
          select: {
            followers: true,
            following: true,
            puzzleAttempts: { where: { solved: true } },
          },
        },
      },
      orderBy: { currentStreak: 'desc' },
      take: 12,
    });

    const formatted = candidates.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      avatar: u.avatar || defaultAvatar,
      bio: u.bio || '',
      currentStreak: u.currentStreak || 1,
      bestStreak: u.bestStreak || 1,
      totalSolved: u._count?.puzzleAttempts || 0,
      accuracy: 85,
      followersCount: u._count?.followers || 0,
      followingCount: u._count?.following || 0,
      isFollowing: false,
    }));

    return res.json({ users: formatted });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to load suggested learners.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

const server = app.listen(port, () => {
  console.log(`Tactix API running on http://localhost:${port}`);
});

server.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') {
    console.log(`Tactix API already running on http://localhost:${port}`);
    process.exit(0);
  }

  console.error(error);
  process.exit(1);
});