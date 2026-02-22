import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from './task.schema';
import { Organization, OrganizationDocument } from '../organizations/organization.schema';
import { AuditService } from '../audit/audit.service';
import { UserDocument } from '../users/user.schema';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilterDto,
  AuditAction,
  RoleType,
} from '@mmulpuri/data';
import { hasRoleLevel, roleHasPermission, Permission } from '@mmulpuri/auth';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name)
    private taskModel: Model<TaskDocument>,
    @InjectModel(Organization.name)
    private orgModel: Model<OrganizationDocument>,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateTaskDto, user: UserDocument): Promise<Task> {
    const orgId = dto.organizationId ?? user.organizationId.toString();

    // Verify org access
    if (orgId !== user.organizationId.toString()) {
      const accessible = await this.getAccessibleOrgIds(user.organizationId.toString());
      if (!accessible.includes(orgId)) {
        throw new ForbiddenException('Cannot create tasks in this organization');
      }
    }

    const task = await this.taskModel.create({
      ...dto,
      ownerId: user._id,
      organizationId: new Types.ObjectId(orgId),
    });

    await this.auditService.log({
      userId: user._id.toString(),
      action: AuditAction.CREATE,
      resource: 'task',
      resourceId: task._id.toString(),
      details: `Created task: ${task.title}`,
      success: true,
    });

    return task;
  }

  async findAll(user: UserDocument, filters: TaskFilterDto): Promise<Task[]> {
    const query: any = {};

    if (hasRoleLevel(user.role, RoleType.ADMIN)) {
      const accessibleOrgIds = await this.getAccessibleOrgIds(user.organizationId.toString());
      query.organizationId = { $in: accessibleOrgIds.map(id => new Types.ObjectId(id)) };
    } else {
      // Viewers only see their own tasks
      query.ownerId = user._id;
    }

    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const tasks = await this.taskModel
      .find(query)
      .populate('ownerId', 'email firstName lastName')
      .populate('organizationId', 'name')
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    await this.auditService.log({
      userId: user._id.toString(),
      action: AuditAction.READ,
      resource: 'task',
      details: `Listed tasks (${tasks.length} results)`,
      success: true,
    });

    return tasks as Task[];
  }

  async findOne(id: string, user: UserDocument): Promise<Task> {
    const task = await this.taskModel.findById(id);
    if (!task) throw new NotFoundException('Task not found');
    await this.assertCanRead(task, user);

    await this.auditService.log({
      userId: user._id.toString(),
      action: AuditAction.READ,
      resource: 'task',
      resourceId: id,
      success: true,
    });

    return task;
  }

  async update(id: string, dto: UpdateTaskDto, user: UserDocument): Promise<Task> {
    const task = await this.taskModel.findById(id);
    if (!task) throw new NotFoundException('Task not found');
    await this.assertCanModify(task, user);

    Object.assign(task, dto);
    const saved = await task.save();

    await this.auditService.log({
      userId: user._id.toString(),
      action: AuditAction.UPDATE,
      resource: 'task',
      resourceId: id,
      details: `Updated task: ${JSON.stringify(dto)}`,
      success: true,
    });

    return saved;
  }

  async remove(id: string, user: UserDocument): Promise<void> {
    const task = await this.taskModel.findById(id);
    if (!task) throw new NotFoundException('Task not found');
    await this.assertCanDelete(task, user);

    await this.taskModel.findByIdAndDelete(id);

    await this.auditService.log({
      userId: user._id.toString(),
      action: AuditAction.DELETE,
      resource: 'task',
      resourceId: id,
      details: `Deleted task: ${task.title}`,
      success: true,
    });
  }

  // ─── Access Checks ──────────────────────────────────────────────────────────

  private async assertCanRead(task: TaskDocument, user: UserDocument): Promise<void> {
    if (hasRoleLevel(user.role, RoleType.ADMIN)) {
      const accessible = await this.getAccessibleOrgIds(user.organizationId.toString());
      if (!accessible.includes(task.organizationId.toString())) {
        throw new ForbiddenException('Access denied');
      }
    } else {
      if (task.ownerId.toString() !== user._id.toString()) {
        throw new ForbiddenException('Access denied: you can only view your own tasks');
      }
    }
  }

  private async assertCanModify(task: TaskDocument, user: UserDocument): Promise<void> {
    const isOwner = task.ownerId.toString() === user._id.toString();
    const canUpdateAny = roleHasPermission(user.role, Permission.TASK_UPDATE_ANY);

    if (!isOwner && !canUpdateAny) {
      await this.auditService.log({
        userId: user._id.toString(),
        action: AuditAction.ACCESS_DENIED,
        resource: 'task',
        resourceId: task._id.toString(),
        details: 'Attempted to update task without permission',
        success: false,
      });
      throw new ForbiddenException('You can only edit your own tasks');
    }

    if (canUpdateAny) {
      const accessible = await this.getAccessibleOrgIds(user.organizationId.toString());
      if (!accessible.includes(task.organizationId.toString())) {
        throw new ForbiddenException('Task is outside your organization scope');
      }
    }
  }

  private async assertCanDelete(task: TaskDocument, user: UserDocument): Promise<void> {
    const isOwner = task.ownerId.toString() === user._id.toString();
    const canDeleteAny = roleHasPermission(user.role, Permission.TASK_DELETE_ANY);

    if (!isOwner && !canDeleteAny) {
      await this.auditService.log({
        userId: user._id.toString(),
        action: AuditAction.ACCESS_DENIED,
        resource: 'task',
        resourceId: task._id.toString(),
        details: 'Attempted to delete task without permission',
        success: false,
      });
      throw new ForbiddenException('You can only delete your own tasks');
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async getAccessibleOrgIds(rootOrgId: string): Promise<string[]> {
    const allOrgs = await this.orgModel.find().lean();
    const ids = [rootOrgId];
    const findChildren = (parentId: string) => {
      allOrgs
        .filter((o) => o.parentId?.toString() === parentId)
        .forEach((child) => {
          ids.push(child._id.toString());
          findChildren(child._id.toString());
        });
    };
    findChildren(rootOrgId);
    return ids;
  }
}
