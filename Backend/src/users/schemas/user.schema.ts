import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  password: string;

  // SHA-256 hashes of the user's live refresh tokens; entries are removed on use or revoke.
  @Prop({ type: [String], default: [], select: false })
  refreshTokens: string[];

  createdAt: Date;
}

export type UserDocument = HydratedDocument<User, { id: string }>;
export const UserSchema = SchemaFactory.createForClass(User);
