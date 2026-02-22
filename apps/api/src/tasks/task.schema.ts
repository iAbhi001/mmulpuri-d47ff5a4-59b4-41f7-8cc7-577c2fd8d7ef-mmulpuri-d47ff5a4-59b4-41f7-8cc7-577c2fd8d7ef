import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TaskStatus, TaskCategory } from '@mmulpuri/data';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  title!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ type: String, enum: Object.values(TaskStatus), default: TaskStatus.TODO })
  status!: TaskStatus;

  @Prop({ type: String, enum: Object.values(TaskCategory), default: TaskCategory.WORK })
  category!: TaskCategory;

  @Prop({ default: 0 })
  priority!: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId!: Types.ObjectId;

  @Prop({ type: Date, default: null })
  dueDate!: Date | null;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
