import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  chatId: number;

  @Prop()
  username?: string;

  @Prop()
  firstName?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ chatId: 1 }, { unique: true });
