import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllHttpExceptionsFilter } from 'all-http-exception-filters';
import ORMCONFIG from 'ormconfig';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ImagesModule } from './images/images.module';

@Module({
  imports: [TypeOrmModule.forRoot(ORMCONFIG), UsersModule, AuthModule, ImagesModule],
  controllers: [AppController],
  providers: [
    AppService,
    // {
    //   provide: APP_FILTER,
    //   useClass: AllHttpExceptionsFilter,
    // },
  ],
})
export class AppModule {}
