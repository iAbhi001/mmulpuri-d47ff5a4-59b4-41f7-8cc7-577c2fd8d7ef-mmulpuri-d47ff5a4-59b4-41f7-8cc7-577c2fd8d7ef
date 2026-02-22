import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization, OrganizationDocument } from './organization.schema';
import { CreateOrganizationDto, RoleType } from '@mmulpuri/data';
import { UserDocument } from '../users/user.schema';
import { hasRoleLevel } from '@mmulpuri/auth';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private orgModel: Model<OrganizationDocument>,
  ) {}

  async create(dto: CreateOrganizationDto, user: UserDocument): Promise<Organization> {
    if (!hasRoleLevel(user.role, RoleType.OWNER)) {
      throw new ForbiddenException('Only owners can create organizations');
    }

    if (dto.parentId) {
      const parent = await this.orgModel.findById(dto.parentId);
      if (!parent) throw new NotFoundException('Parent organization not found');
    }

    return this.orgModel.create(dto);
  }

  async findAll(): Promise<Organization[]> {
    return this.orgModel.find().lean();
  }

  async findOne(id: string): Promise<Organization> {
    const org = await this.orgModel.findById(id).lean();
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async findAllRaw(): Promise<OrganizationDocument[]> {
    return this.orgModel.find();
  }

  async seed(): Promise<void> {
    const count = await this.orgModel.countDocuments();
    if (count > 0) return;

    const parent = await this.orgModel.create({ name: 'Acme Corp' });
    await this.orgModel.create({ name: 'Engineering', parentId: parent._id });
    await this.orgModel.create({ name: 'Marketing', parentId: parent._id });

    console.log('[SEED] Organizations seeded: Acme Corp > Engineering, Marketing');
  }
}
