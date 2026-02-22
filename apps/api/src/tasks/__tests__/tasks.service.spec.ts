import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksService } from '../tasks.service';
import { Task } from '../task.schema';
import { Organization } from '../../organizations/organization.schema';
import { AuditService } from '../../audit/audit.service';
import { RoleType, TaskStatus, TaskCategory } from '@mmulpuri/data';

const makeUser = (role: RoleType, orgId = 'org-1', userId = 'user-1') => ({
  _id: userId,
  email: 'user@test.com',
  role,
  organizationId: { toString: () => orgId },
  toString: () => userId,
});

const makeTask = (ownerId = 'user-1', orgId = 'org-1') => ({
  _id: 'task-1',
  title: 'Test Task',
  status: TaskStatus.TODO,
  category: TaskCategory.WORK,
  priority: 0,
  ownerId: { toString: () => ownerId },
  organizationId: { toString: () => orgId },
  save: jest.fn().mockResolvedValue({ _id: 'task-1', title: 'Updated' }),
});

describe('TasksService', () => {
  let service: TasksService;
  let taskModel: any;
  let orgModel: any;
  let auditService: any;

  beforeEach(async () => {
    taskModel = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndDelete: jest.fn(),
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      }),
    };
    orgModel = {
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          { _id: { toString: () => 'org-1' }, parentId: null },
          { _id: { toString: () => 'org-child' }, parentId: { toString: () => 'org-1' } },
        ]),
      }),
    };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getModelToken(Task.name), useValue: taskModel },
        { provide: getModelToken(Organization.name), useValue: orgModel },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('create', () => {
    it('should create a task owned by current user', async () => {
      const user = makeUser(RoleType.VIEWER) as any;
      const task = makeTask();
      taskModel.create.mockResolvedValue(task);

      const result = await service.create({ title: 'Test', organizationId: 'org-1' }, user);
      expect(taskModel.create).toHaveBeenCalledWith(expect.objectContaining({ ownerId: user._id }));
      expect(result).toEqual(task);
    });

    it('should deny VIEWER creating task in unrelated org', async () => {
      const user = makeUser(RoleType.VIEWER, 'org-1') as any;
      await expect(service.create({ title: 'Task', organizationId: 'unrelated' }, user))
        .rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to create task in child org', async () => {
      const user = makeUser(RoleType.ADMIN, 'org-1') as any;
      const task = makeTask('user-1', 'org-child');
      taskModel.create.mockResolvedValue(task);

      const result = await service.create({ title: 'Task', organizationId: 'org-child' }, user);
      expect(result).toEqual(task);
    });
  });

  describe('update', () => {
    it('should allow task owner to update', async () => {
      const user = makeUser(RoleType.VIEWER, 'org-1', 'user-1') as any;
      const task = makeTask('user-1', 'org-1');
      taskModel.findById.mockResolvedValue(task);

      const result = await service.update('task-1', { title: 'Updated' }, user);
      expect(task.save).toHaveBeenCalled();
    });

    it('should deny VIEWER updating someone else\'s task', async () => {
      const user = makeUser(RoleType.VIEWER, 'org-1', 'user-999') as any;
      const task = makeTask('user-1', 'org-1');
      taskModel.findById.mockResolvedValue(task);

      await expect(service.update('task-1', { title: 'x' }, user))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for missing task', async () => {
      taskModel.findById.mockResolvedValue(null);
      await expect(service.update('bad-id', {}, makeUser(RoleType.ADMIN) as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should allow owner to delete own task', async () => {
      const user = makeUser(RoleType.VIEWER, 'org-1', 'user-1') as any;
      const task = makeTask('user-1');
      taskModel.findById.mockResolvedValue(task);
      taskModel.findByIdAndDelete.mockResolvedValue(task);

      await service.remove('task-1', user);
      expect(taskModel.findByIdAndDelete).toHaveBeenCalledWith('task-1');
    });

    it('should deny VIEWER deleting someone else\'s task', async () => {
      const user = makeUser(RoleType.VIEWER, 'org-1', 'user-999') as any;
      taskModel.findById.mockResolvedValue(makeTask('user-1'));

      await expect(service.remove('task-1', user)).rejects.toThrow(ForbiddenException);
    });
  });
});
