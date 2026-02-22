import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrganizationDocument = Organization & Document;

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', default: null })
  parentId: Types.ObjectId | null;

  @Prop({ default: null })
  inviteCode: string | null;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
