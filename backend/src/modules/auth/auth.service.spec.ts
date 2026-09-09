import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { HashingService } from '../../common/services/hashing.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    findByEmail: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    updateHashedRefreshToken: ReturnType<typeof vi.fn>;
  };
  let hashingService: {
    hash: ReturnType<typeof vi.fn>;
    compare: ReturnType<typeof vi.fn>;
  };
  let jwtService: {
    signAsync: ReturnType<typeof vi.fn>;
    verifyAsync: ReturnType<typeof vi.fn>;
  };
  let configService: {
    get: ReturnType<typeof vi.fn>;
  };

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    passwordHash: '$2b$10$hashedPasswordMock',
    hashedRefreshToken: '$2b$10$hashedRefreshTokenMock',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateHashedRefreshToken: vi.fn(),
    };

    hashingService = {
      hash: vi.fn().mockImplementation((val) => Promise.resolve(`hashed_${val}`)),
      compare: vi.fn(),
    };

    jwtService = {
      signAsync: vi.fn().mockImplementation((payload) => {
        return Promise.resolve(`mock-jwt-token-for-${payload.sub}`);
      }),
      verifyAsync: vi.fn(),
    };

    configService = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return 'test_access_secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret';
        if (key === 'JWT_ACCESS_EXPIRATION') return '15m';
        if (key === 'JWT_REFRESH_EXPIRATION') return '7d';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: HashingService, useValue: hashingService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    const registerDto = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      emailConfirmation: 'test@example.com',
      password: 'Password123!',
      passwordConfirmation: 'Password123!',
    };

    it('should successfully register a new user and return tokens', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);
      usersService.updateHashedRefreshToken.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(usersService.create).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw ConflictException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should successfully login and return tokens when password is valid', async () => {
      hashingService.compare.mockResolvedValue(true);
      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.updateHashedRefreshToken.mockResolvedValue(mockUser);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.id).toBe(mockUser.id);
    });
  });

  describe('logout', () => {
    it('should nullify the refresh token in database', async () => {
      usersService.updateHashedRefreshToken.mockResolvedValue({ ...mockUser, hashedRefreshToken: null });

      const result = await service.logout('user-uuid-1');

      expect(usersService.updateHashedRefreshToken).toHaveBeenCalledWith('user-uuid-1', null);
      expect(result).toEqual({ message: 'Successfully logged out' });
    });
  });

  describe('getProfile', () => {
    it('should return the user profile without sensitive fields', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const profile = await service.getProfile('user-uuid-1');

      expect(profile).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        createdAt: mockUser.createdAt,
      });
      expect(profile).not.toHaveProperty('passwordHash');
      expect(profile).not.toHaveProperty('hashedRefreshToken');
    });
  });
});
