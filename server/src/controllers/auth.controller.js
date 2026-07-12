import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';

function signTokens(user) {
  const accessToken = jwt.sign({ sub: user._id, role: user.role }, env.jwtAccessSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: user._id }, env.jwtRefreshSecret, { expiresIn: '30d' });
  return { accessToken, refreshToken };
}

function cookieOpts() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    // 'none' is required for cookies to be sent cross-domain (your frontend
    // and backend are on different domains once deployed). Browsers require
    // secure:true whenever sameSite is 'none', so both must flip together.
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction
  };
}

export async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 8) {
      return res.status(400).json({ code: 'INVALID_INPUT', message: 'Name, email, and an 8+ character password are required.' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ code: 'EMAIL_TAKEN', message: 'That email is already registered.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, trialStartedAt: new Date() });

    const { accessToken, refreshToken } = signTokens(user);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    res.cookie('accessToken', accessToken, cookieOpts());
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, trialStartedAt: user.trialStartedAt },
      accessToken
    });
  } catch (err) { next(err); }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user) return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' });

    const valid = await bcrypt.compare(password || '', user.passwordHash);
    if (!valid) return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' });

    const { accessToken, refreshToken } = signTokens(user);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    user.lastLoginAt = new Date();
    await user.save();

    res.cookie('accessToken', accessToken, cookieOpts());
    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, trialStartedAt: user.trialStartedAt },
      accessToken
    });
  } catch (err) { next(err); }
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -refreshTokenHash');
    if (!user) return res.status(404).json({ code: 'NOT_FOUND' });
    res.json({ user });
  } catch (err) { next(err); }
}

export async function logout(req, res) {
  res.clearCookie('accessToken', cookieOpts());
  res.json({ message: 'Logged out.' });
}