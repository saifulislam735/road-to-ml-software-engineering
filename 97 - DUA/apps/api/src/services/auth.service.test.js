import bcrypt from 'bcryptjs';
import { authService } from './auth.service.js';
import { userRepo } from '../repositories/user.repo.js';

jest.mock('../repositories/user.repo.js', () => ({
  userRepo: {
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    create: jest.fn()
  }
}));

process.env.JWT_SECRET = 'test-secret';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

describe('authService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('register hashes password and returns safe user', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.findByUsername.mockResolvedValue(null);
    userRepo.create.mockImplementation(async (data) => ({ id: '1', role: 'USER', ...data }));

    const result = await authService.register({ username: 'rafi', email: 'rafi@example.com', password: 'password123' });

    expect(result.token).toBeTruthy();
    expect(result.user.password).toBeUndefined();
    expect(await bcrypt.compare('password123', userRepo.create.mock.calls[0][0].password)).toBe(true);
  });

  test('login rejects banned user', async () => {
    const password = await bcrypt.hash('password123', 12);
    userRepo.findByEmail.mockResolvedValue({ id: '1', username: 'rafi', email: 'rafi@example.com', password, role: 'USER', isBanned: true });

    await expect(authService.login({ email: 'rafi@example.com', password: 'password123' })).rejects.toThrow('suspended');
  });
});
