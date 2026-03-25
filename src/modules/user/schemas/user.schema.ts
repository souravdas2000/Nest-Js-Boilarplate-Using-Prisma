import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { EAccountType, ERole, ESignupBy } from '../constants';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
  @Prop({ required: true })
  first_name: string;

  @Prop({ required: true })
  last_name: string;

  @Prop()
  user_name?: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  date_of_birth?: Date;

  @Prop({ default: '', trim: true, private: true })
  password: string;

  @Prop()
  social_id?: string;

  @Prop()
  gender?: string;

  @Prop({ enum: ESignupBy, default: ESignupBy.CUSTOM })
  signup_by: string;

  @Prop()
  last_login_time: Date;

  @Prop()
  about?: string;

  @Prop({ default: '' })
  profile_picture: string;

  @Prop()
  cover_picture?: string;

  @Prop()
  video_picture?: string;

  @Prop()
  facebook_profile?: string;

  @Prop()
  twitter_profile?: string;

  @Prop()
  instagram_profile?: string;

  @Prop()
  youtube_profile?: string;

  @Prop()
  customer_id?: string;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop({ default: true })
  is_accept_term_condition: boolean;

  @Prop({ default: false })
  is_email_verified: boolean;

  @Prop({ enum: EAccountType, default: EAccountType.PUBLIC })
  account_type: string;

  @Prop({ default: false })
  is_account_private: boolean;

  @Prop({ default: true })
  is_show_followers: boolean;

  @Prop({ default: true })
  is_show_friends: boolean;

  @Prop({ default: true })
  is_show_likes: boolean;

  @Prop({ trim: true })
  user_location?: string;

  @Prop({ default: false })
  is_live: boolean;

  @Prop({ trim: true })
  letterbox?: string;

  @Prop({ default: false })
  is_banned: boolean;

  @Prop()
  banned_start_time: Date;

  @Prop()
  banned_end_time?: Date;

  @Prop({ enum: ERole, default: ERole.CUSTOMER })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
