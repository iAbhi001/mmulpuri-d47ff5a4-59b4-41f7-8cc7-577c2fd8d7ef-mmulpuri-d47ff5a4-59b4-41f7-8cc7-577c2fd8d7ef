import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '../../users/user.schema';
import { Organization } from '../../organizations/organization.schema';
import { AuditService } from '../../audit/audit.service';
import { RoleType } from '@mmulpuri/data';
import * as bcrypt from 'bcryptjs';

const hashedPassword = bcrypt.hashSync('password123', 10);

const mockOrg = { _id: 'org-id-1', name: 'Test Org', inviteCode: 'ABC123' };

const mockUser = {
  _id: 'user-id-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  password: hashedPassword,
  role: RoleType.VIEWER,
  organizationId: { toString: () => 'org-id-1' },
  toObject: () => ({
    _id: 'user-id-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: RoleType.VIEWER,
    organizationId: 'org-id-1',
  }),
};

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let orgModel: any;
  let jwtService: any;
  let auditService: any;

  beforeEach(async () => {
    userModel = { findOne: jest.fn(), create: jest.fn() };
    orgModel = { findById: jest.fn(), findOne: jest.fn(), create: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('mock-token') };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(Organization.name), useValue: orgModel },
        { provide: JwtService, useValue: jwtService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return token on valid credentials', async () => {
      userModel.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      const result = await service.login({ email: 'test@example.com', password: 'password123' });
      expect(result.accessToken).toBe('mock-token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      userModel.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      await expect(service.login({ email: 'test@example.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on unknown email', async () => {
      userModel.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      await expect(service.login({ email: 'x@x.com', password: 'pass' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should log failed login attempt in audit', async () => {
      userModel.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      try { await service.login({ email: 'x@x.com', password: 'pass' }); } catch {}
      expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });
  });

  describe('register', () => {
    it('should register as VIEWER when no invite code provided', async () => {
      userModel.findOne.mockResolvedValue(null);
      orgModel.findById.mockResolvedValue(mockOrg);
      userModel.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'new@test.com', password: 'pass123',
        firstName: 'New', lastName: 'User',
        organizationId: 'org-id-1',
      });
      expect(result.accessToken).toBe('mock-token');
    });

    it('should register as OWNER when master code 1001 is provided', async () => {
      const ownerUser = { ...mockUser, role: RoleType.OWNER };
      userModel.findOne.mockResolvedValue(null);
      orgModel.findOne.mockResolvedValue(null);
      orgModel.create.mockResolvedValue({ _id: { toString: () => 'new-org-id' }, name: 'My Corp', inviteCode: 'XYZ999' });
      userModel.create.mockResolvedValue(ownerUser);

      const result = await service.register({
        email: 'owner@test.com', password: 'pass123',
        firstName: 'Owner', lastName: 'User',
        inviteCode: '1001',
        organizationName: 'My Corp',
      });
      expect(result.accessToken).toBe('mock-token');
      expect(result.orgInviteCode).toBeDefined();
    });

    it('should register as ADMIN when valid org invite code provided', async () => {
      const adminUser = { ...mockUser, role: RoleType.ADMIN };
      userModel.findOne.mockResolvedValue(null);
      orgModel.findOne.mockResolvedValue(mockOrg);
      userModel.create.mockResolvedValue(adminUser);

      const result = await service.register({
        email: 'admin@test.com', password: 'pass123',
        firstName: 'Admin', lastName: 'User',
        inviteCode: 'ABC123',
      });
      expect(result.accessToken).toBe('mock-token');
    });

    it('should throw ConflictException if email already exists', async () => {
      userModel.findOne.mockResolvedValue(mockUser);
      await expect(service.register({
        email: 'test@example.com', password: 'pass',
        firstName: 'T', lastName: 'U',
      })).rejects.toThrow(ConflictException);
    });
  });
});
