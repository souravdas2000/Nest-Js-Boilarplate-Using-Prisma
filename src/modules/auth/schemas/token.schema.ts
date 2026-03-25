import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { ETokenType } from '../constants';

export type TokenDocument = HydratedDocument<Token>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Token {
  @Prop({ required: true })
  token: string;

  @Prop({ type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true })
  user: any;

  @Prop({ enum: ETokenType, required: true })
  type: string;

  @Prop({ required: true })
  expires: Date;

  @Prop({ default: false })
  blacklisted: boolean;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
