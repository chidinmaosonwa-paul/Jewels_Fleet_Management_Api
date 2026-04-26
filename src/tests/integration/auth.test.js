/**
 * Auth integration tests.
 * Uses jest.mock() to stub Mongoose models — no live DB required.
 */
import { jest } from '@jest/globals';

//Mocks (must come before any import that uses them)

const mockUserSave = jest.fn();
const mockUserFind = jest.fn();

jest.unstable_mockModule('../../app/models/user.js', () => ({
  default: class MockUser {
    constructor(data) { Object.assign(this, data); this._id = 'user-id-1'; }
    save = mockUserSave;
    static findOne = mockUserFind;
  },
}));

//Imports (after mocks)
const { generateToken, verifyPassword, createUser, findUserByEmail } =
  await import('../../app/services/authService.js');

//Helpers
const makeUser = (overrides = {}) => ({
  _id: 'user-id-1',
  username: 'testuser',
  email: 'test@example.com',
  password: '$2a$10$hashedpassword',
  role: 'user',
  ...overrides,
});

//Tests
beforeEach(() => { jest.clearAllMocks(); });

describe('generateToken', () => {
  it('returns a string token', () => {
    process.env.JWT_SECRET = 'test_secret';
    const token = generateToken(makeUser());
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // valid JWT format
  });

  it('encodes userId and role into the payload', async () => {
    const jwt = await import('jsonwebtoken');
    process.env.JWT_SECRET = 'test_secret';
    const token = generateToken(makeUser({ role: 'admin' }));
    const decoded = jwt.default.verify(token, 'test_secret');
    expect(decoded.role).toBe('admin');
  });
});

describe('verifyPassword', () => {
  it('returns true for a matching password', async () => {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.default.hash('secret123', 10);
    const result = await verifyPassword('secret123', hash);
    expect(result).toBe(true);
  });

  it('returns false for a wrong password', async () => {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.default.hash('secret123', 10);
    const result = await verifyPassword('wrongpass', hash);
    expect(result).toBe(false);
  });
});

describe('findUserByEmail', () => {
  it('calls User.findOne with the correct email', async () => {
    mockUserFind.mockResolvedValue(makeUser());
    const user = await findUserByEmail('test@example.com');
    expect(mockUserFind).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(user.email).toBe('test@example.com');
  });

  it('returns null when user does not exist', async () => {
    mockUserFind.mockResolvedValue(null);
    const user = await findUserByEmail('ghost@example.com');
    expect(user).toBeNull();
  });
});

describe('createUser', () => {
  it('saves a new user and returns it', async () => {
    mockUserSave.mockResolvedValue(undefined);
    const user = await createUser({ username: 'newuser', email: 'new@test.com', password: 'pass123' });
    expect(mockUserSave).toHaveBeenCalledTimes(1);
    expect(user.username).toBe('newuser');
  });
});