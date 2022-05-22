/* eslint-disable prettier/prettier */
import { Controller, HttpCode, Get, Query, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AllRPCExceptionsFilter } from 'all-rpc-exception-filter';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { LoginUserInput } from './auth/dto/login-user.input';
import { AuthData } from './auth/interfaces/authData.interface';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private authService: AuthService,
    private userService: UsersService,
  ) {}

  @UseFilters(new AllRPCExceptionsFilter())
  @MessagePattern({ role: 'users', cmd: 'login' })
  async login(@Payload() payload: LoginUserInput): Promise<AuthData> {
    const userData = await this.authService.loginUser(payload);
    return userData;
  }

  @UseFilters(new AllRPCExceptionsFilter())
  @MessagePattern({ role: 'auth', cmd: 'verifyToken' })
  validateToken(@Payload() token: string) {
    return this.authService.VerifyToken(token);
  }

  @MessagePattern({ role: 'auth', cmd: 'verifyEmail' })
  async verifyEmail(@Payload() token: string) {
    const isVerified = await this.appService.activateEmail(token);
    return isVerified;
  }

  @Get('cognito_callback')
  @HttpCode(200)
  async callback(@Query('code') code: string) {
    const authData = await this.authService.exchangeGrantCodeForToken(code);
    const resData = await this.authService.VerifyToken(authData.id_token);
    const userData = {
      firstName: resData['custom:firstName'],
      lastName: resData['custom:lastName'],
      username: resData['custom:firstName'] + resData['custom:lastName'],
      email: resData['email'],
      imgUrl: resData['custom:imageUrl'],
    };
    //save userDetails
    await this.userService.saveUserDetails(userData);
    return authData;
  }
}
