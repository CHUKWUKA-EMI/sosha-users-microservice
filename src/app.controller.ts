/* eslint-disable prettier/prettier */
import {
  Controller,
  HttpCode,
  Get,
  Query,
  UseFilters,
  Res,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AllRPCExceptionsFilter } from 'all-rpc-exception-filter';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { LoginUserInput } from './auth/dto/login-user.input';
import { AuthData } from './auth/interfaces/authData.interface';
import { Response } from 'express';

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

  // @UseFilters(new AllRPCExceptionsFilter())
  @MessagePattern({ role: 'auth', cmd: 'verifyToken' })
  validateToken(@Payload() idToken: string) {
    return this.authService.VerifyToken(idToken);
  }

  @MessagePattern({ role: 'auth', cmd: 'verifyEmail' })
  async verifyEmail(@Payload() token: string) {
    const isVerified = await this.appService.activateEmail(token);
    return isVerified;
  }

  @Get('cognito_callback')
  @HttpCode(200)
  async callback(@Query('code') code: string, @Res() res: Response) {
    const authData = await this.authService.exchangeGrantCodeForToken(code);
    const resData = await this.authService.VerifyToken(authData.id_token);
    console.log('resData', resData);
    const userData = {
      firstName: resData['custom:firstName'],
      lastName: resData['custom:lastName'],
      username: resData['custom:firstName'] + resData['custom:lastName'],
      email: resData['email'],
      imgUrl: resData['custom:imageUrl'],
      social_id: resData['sub'],
    };
    //save userDetails
    await this.userService.saveUserDetails(userData);
    // return authData;
    res.cookie('sosha_token', authData.id_token);
    res.cookie('cognito_accessToken', authData.access_token);
    res.cookie('cognito_refreshToken', authData.refresh_token);

    return res.redirect(`${process.env.FRONTEND_URL}/profile`);
  }
}
