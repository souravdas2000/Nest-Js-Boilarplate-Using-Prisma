import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schemas/user.schema';
import { EDbModelName } from '@modules/database/constants';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EDbModelName.User, schema: UserSchema },
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [MongooseModule],
})
export class UserModule {}
