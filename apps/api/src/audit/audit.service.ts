import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './audit-log.schema';
import { AuditAction } from '@mmulpuri/data';

interface LogParams {
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  success?: boolean;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private auditModel: Model<AuditLogDocument>,
  ) {}

  async log(params: LogParams): Promise<void> {
    await this.auditModel.create({
      userId: params.userId ?? null,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId ?? null,
      details: params.details ?? null,
      ipAddress: params.ipAddress ?? null,
      success: params.success ?? true,
    });

    const level = params.success !== false ? 'INFO' : 'WARN';
    console.log(
      `[AUDIT][${level}] ${params.action} on ${params.resource}${params.resourceId ? `/${params.resourceId}` : ''} by user ${params.userId ?? 'anonymous'} | ${params.details ?? ''}`
    );
  }

  async findAll(page = 1, limit = 50): Promise<{ data: AuditLog[]; total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.auditModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'email firstName lastName')
        .lean(),
      this.auditModel.countDocuments(),
    ]);
    return { data: data as AuditLog[], total };
  }
}
