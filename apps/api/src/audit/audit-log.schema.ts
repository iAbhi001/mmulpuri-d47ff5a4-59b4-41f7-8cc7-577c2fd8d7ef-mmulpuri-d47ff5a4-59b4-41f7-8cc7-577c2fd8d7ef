import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AuditAction } from '@mmulpuri/data';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  userId: Types.ObjectId | null;

  @Prop({ type: String, enum: Object.values(AuditAction), required: true })
  action: AuditAction;

  @Prop({ required: true })
  resource: string;

  @Prop({ default: null })
  resourceId: string | null;

  @Prop({ default: null })
  details: string | null;

  @Prop({ default: null })
  ipAddress: string | null;

  @Prop({ default: true })
  success: boolean;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
