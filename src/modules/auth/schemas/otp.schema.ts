import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { EOtpType } from '../constants';

export type OtpDocument = HydratedDocument<Otp>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Otp {
  @Prop({ required: true })
  otp: string;

  @Prop({ type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true })
  user: any;

  @Prop({ enum: EOtpType, required: true })
  type: string;

  @Prop({ required: true })
  expires: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
