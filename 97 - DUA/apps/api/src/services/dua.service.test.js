import { duaService } from './dua.service.js';
import { duaRepo } from '../repositories/dua.repo.js';
import { userRepo } from '../repositories/user.repo.js';

jest.mock('../repositories/dua.repo.js', () => ({
  duaRepo: {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    listInbox: jest.fn(),
    count: jest.fn()
  }
}));

jest.mock('../repositories/user.repo.js', () => ({
  userRepo: { findByUsername: jest.fn() }
}));

jest.mock('../repositories/admin.repo.js', () => ({
  adminRepo: { createReport: jest.fn() }
}));

describe('duaService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('send rejects paused recipient', async () => {
    userRepo.findByUsername.mockResolvedValue({ id: '1', username: 'rafi', isPaused: true, isBanned: false });
    await expect(duaService.send('rafi', { message: 'May Allah bless you.' })).rejects.toThrow('not accepting');
  });

  test('deleteOwn rejects another user dua', async () => {
    duaRepo.findById.mockResolvedValue({ id: 'dua1', ownerId: 'owner1' });
    await expect(duaService.deleteOwn('owner2', 'dua1')).rejects.toThrow('Not authorized');
  });
});
