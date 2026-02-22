import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto, RegisterDto, AuthResponse, JwtPayload, RoleType } from '@mmulpuri/data';
import { User, UserDocument } from '../users/user.schema';
import { Organization, OrganizationDocument } from '../organizations/organization.schema';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@mmulpuri/data';

const OWNER_MASTER_CODE = '1001';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Organization.name) private orgModel: Model<OrganizationDocument>,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string): Promise<AuthResponse> {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existing) throw new ConflictException('Email already registered');

    let role: RoleType;
    let organizationId: string;
    let orgInviteCode: string | undefined;

    if (dto.inviteCode === OWNER_MASTER_CODE) {
      // ── Owner signup: create a brand-new organization ─────────────────────
      if (!dto.organizationName?.trim()) {
        throw new BadRequestException('Organization name is required for owner signup');
      }
      const existingOrg = await this.orgModel.findOne({
        name: dto.organizationName.trim(),
      });
      if (existingOrg) {
        throw new ConflictException('An organization with that name already exists');
      }

      // Generate random 6-char uppercase invite code
      orgInviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
      const org = await this.orgModel.create({
        name: dto.organizationName.trim(),
        inviteCode: orgInviteCode,
        parentId: null,
      });
      organizationId = org._id.toString();
      role = RoleType.OWNER;

    } else if (dto.inviteCode && dto.inviteCode.trim().length > 0) {
      // ── Admin signup: inviteCode must match an org's inviteCode ───────────
      const org = await this.orgModel.findOne({ inviteCode: dto.inviteCode.trim() });
      if (!org) {
        throw new BadRequestException('Invalid invite code. Please check with your organization owner.');
      }
      organizationId = org._id.toString();
      role = RoleType.ADMIN;

    } else {
      // ── Viewer signup: must select an existing organization ───────────────
      if (!dto.organizationId) {
        throw new BadRequestException('Please select an organization to join as a viewer');
      }
      const org = await this.orgModel.findById(dto.organizationId);
      if (!org) throw new NotFoundException('Organization not found');
      organizationId = dto.organizationId;
      role = RoleType.VIEWER;
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.userModel.create({
      email: dto.email.toLowerCase(),
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: hashedPassword,
      role,
      organizationId,
    });

    await this.auditService.log({
      userId: user._id.toString(),
      action: AuditAction.LOGIN,
      resource: 'auth',
      details: `User registered as ${role}`,
      ipAddress,
      success: true,
    });

    const response: AuthResponse = {
      accessToken: this.generateToken(user),
      user: this.sanitize(user),
    };

    // Return the org invite code to owner so they can share it with admins
    if (orgInviteCode) {
      response.orgInviteCode = orgInviteCode;
    }

    return response;
  }

  async login(dto: LoginDto, ipAddress?: string): Promise<AuthResponse> {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .select('+password');

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      await this.auditService.log({
        action: AuditAction.LOGIN,
        resource: 'auth',
        details: `Failed login attempt for: ${dto.email}`,
        ipAddress,
        success: false,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.auditService.log({
      userId: user._id.toString(),
      action: AuditAction.LOGIN,
      resource: 'auth',
      details: 'User logged in',
      ipAddress,
      success: true,
    });

    return { accessToken: this.generateToken(user), user: this.sanitize(user) };
  }

  private generateToken(user: UserDocument): string {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId.toString(),
    };
    return this.jwtService.sign(payload);
  }

  private sanitize(user: UserDocument) {
    const obj = user.toObject() as any;
    delete obj.password;
    return obj;
  }
}
