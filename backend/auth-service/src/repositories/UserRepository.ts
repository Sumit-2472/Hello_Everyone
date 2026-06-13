import { FilterQuery } from 'mongoose';
import { BaseRepository } from '@shared/repositories/BaseRepository';
import { UserModel, IUser } from '../models/User.model';
import { UserRole } from '../../../shared/types/enums';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserModel);
  }

  // ── Domain-specific finders ──────────────────────────────

  /** Find by email — includes password field for auth */
  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email: email.toLowerCase() })
      .select('+password +refreshToken')
      .exec();
  }

  /** Find by email without sensitive fields */
  async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email: email.toLowerCase() }).exec();
  }

  /** Find by refresh token — used during token rotation */
  async findByRefreshToken(token: string): Promise<IUser | null> {
    return UserModel.findOne({ refreshToken: token })
      .select('+refreshToken')
      .exec();
  }

  /** Increment return count atomically */
  async incrementReturnCount(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, { $inc: { returnCount: 1 } }).exec();
  }

  /** Add green credits atomically (use negative value to deduct) */
  async adjustGreenCredits(userId: string, delta: number): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      { $inc: { greenCredits: delta } },
      { new: true, runValidators: true }
    )
      .lean<IUser>()
      .exec();
  }

  /** Revoke refresh token on logout */
  async revokeRefreshToken(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      $unset: { refreshToken: 1 },
    }).exec();
  }

  /** Update last login timestamp */
  async touchLastLogin(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, {
      lastLoginAt: new Date(),
    }).exec();
  }

  /** Get leaderboard by green credits */
  async getLeaderboard(limit = 10): Promise<IUser[]> {
    return UserModel.find({})
      .sort({ greenCredits: -1 })
      .limit(limit)
      .select('name email greenCredits role')
      .lean<IUser[]>()
      .exec();
  }

  /** Find all users by role */
  async findByRole(role: UserRole): Promise<IUser[]> {
    return UserModel.find({ role }).lean<IUser[]>().exec();
  }

  /** Check if email is already taken */
  async isEmailTaken(email: string): Promise<boolean> {
    return this.exists({ email: email.toLowerCase() } as FilterQuery<IUser>);
  }
}

// Export a singleton instance
export const userRepository = new UserRepository();
