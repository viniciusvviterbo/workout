import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '~/modules/database/database.module';
import { SessionModule } from '~/modules/session/session.module';
import { UsersModule } from '~/modules/users/users.module';
import JwtService from '~/services/jwt/jsonwebtoken';

@Global()
@Module({
  imports: [
    UsersModule,
    SessionModule,
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [],
  exports: [JwtService],
  providers: [JwtService],
})
export class AppModule {}
