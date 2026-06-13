import { UserModel } from './models/User.model';
import { createLogger } from '../../shared/config/logger';

const logger = createLogger('auth-service:seed');

/**
 * Seeds a default user into the database if one doesn't already exist.
 * This allows you to always sign in with these credentials.
 */
export async function seedDefaultUser(): Promise<void> {
  const DEFAULT_EMAIL = 'admin@relife.com';
  const DEFAULT_PASSWORD = 'Admin@1234';
  const DEFAULT_NAME = 'Admin User';

  try {
    const existingUser = await UserModel.findOne({ email: DEFAULT_EMAIL });

    if (existingUser) {
      logger.info('Default user already exists, skipping seed.');
      return;
    }

    await UserModel.create({
      name: DEFAULT_NAME,
      email: DEFAULT_EMAIL,
      password: DEFAULT_PASSWORD,
      role: 'customer',
      isEmailVerified: true,
      greenCredits: 100,
    });

    logger.info('Default user seeded successfully.', { email: DEFAULT_EMAIL });
  } catch (error) {
    logger.error('Failed to seed default user', {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
