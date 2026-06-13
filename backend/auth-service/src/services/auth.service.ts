import jwt from 'jsonwebtoken';
import { UserModel, IUser } from '../models/User.model';
import { AppError } from '../../../shared/middleware/errorHandler';
import { AuthTokenPayload, UserRole } from '../../../shared/types';
import mongoose from 'mongoose';
interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult {
  user: Omit<IUser, 'password' | 'refreshToken'>;
  tokens: AuthTokens;
}

export class AuthService {
  // ── Token generation ──────────────────────────────────────
  private generateTokens(payload: AuthTokenPayload): AuthTokens {
    const secret = process.env.JWT_SECRET!;
    const refreshSecret = process.env.JWT_REFRESH_SECRET!;

    const accessToken = jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    } as jwt.SignOptions);

    const refreshToken = jwt.sign({ userId: payload.userId }, refreshSecret, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }


  // ── Register ──────────────────────────────────────────────
  async register(input: RegisterInput): Promise<AuthResult> {
     console.log('Global readyState:', mongoose.connection.readyState);
  console.log('Model readyState:', UserModel.db.readyState);
  console.log('Model db:', UserModel.db.name);
  console.log('mongodb.ts mongoose version:', mongoose.version);

    const existing = await UserModel.findOne({ email: input.email });
    if (existing) {
      throw new AppError('Email already registered', 409);
    }

    const user = await UserModel.create({
      email: input.email,
      password: input.password,
      name: input.name,
      role: input.role || 'customer',
    });

    const payload: AuthTokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const tokens = this.generateTokens(payload);

    // Store hashed refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      user: { ...user.toObject(), password: undefined, refreshToken: undefined } as any,
      tokens,
    };
  }

  // ── Login ─────────────────────────────────────────────────
  async login(input: LoginInput): Promise<AuthResult> {
    const user = await UserModel.findOne({ email: input.email }).select('+password');
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await user.comparePassword(input.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const payload: AuthTokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const tokens = this.generateTokens(payload);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    return {
      user: { ...user.toObject(), password: undefined, refreshToken: undefined } as any,
      tokens,
    };
  }

  // ── Refresh token ─────────────────────────────────────────
  async refreshToken(token: string): Promise<AuthTokens> {
    const refreshSecret = process.env.JWT_REFRESH_SECRET!;

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, refreshSecret) as { userId: string };
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await UserModel.findById(decoded.userId).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      throw new AppError('Refresh token revoked', 401);
    }

    const payload: AuthTokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const tokens = this.generateTokens(payload);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    return tokens;
  }
  // ── Logout ────────────────────────────────────────────────
  async logout(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
  }
}

export const authService = new AuthService();
