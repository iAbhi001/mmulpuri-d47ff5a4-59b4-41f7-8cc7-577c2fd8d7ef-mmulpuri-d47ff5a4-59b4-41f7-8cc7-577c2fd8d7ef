// ─── Enums ────────────────────────────────────────────────────────────────────

export enum RoleType {
  OWNER = 'owner',
  ADMIN = 'admin',
  VIEWER = 'viewer',
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum TaskCategory {
  WORK = 'work',
  PERSONAL = 'personal',
  OTHER = 'other',
}

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ACCESS_DENIED = 'ACCESS_DENIED',
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IOrganization {
  id: string;
  name: string;
  parentId?: string;
  inviteCode?: string | null;
  parent?: IOrganization;
  children?: IOrganization[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleType;
  organizationId: string;
  organization?: IOrganization;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  category: TaskCategory;
  priority: number;
  ownerId: string;
  owner?: IUser;
  organizationId: string;
  organization?: IOrganization;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog {
  id: string;
  userId: string;
  user?: IUser;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  success: boolean;
  createdAt: Date;
}

// ─── Auth DTOs ────────────────────────────────────────────────────────────────

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  inviteCode?: string;        // '1001' = owner, org inviteCode = admin, blank = viewer
  organizationName?: string;  // required when signing up as owner
  organizationId?: string;    // required when signing up as viewer
}

export interface AuthResponse {
  accessToken: string;
  user: Omit<IUser, 'organization'>;
  orgInviteCode?: string;     // returned only on owner registration
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: RoleType;
  organizationId: string;
}

// ─── Task DTOs ────────────────────────────────────────────────────────────────

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: number;
  dueDate?: string;
  organizationId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: number;
  dueDate?: string;
}

export interface TaskFilterDto {
  status?: TaskStatus;
  category?: TaskCategory;
  search?: string;
  organizationId?: string;
}

// ─── Organization DTOs ────────────────────────────────────────────────────────

export interface CreateOrganizationDto {
  name: string;
  parentId?: string;
}

// ─── API Response wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
