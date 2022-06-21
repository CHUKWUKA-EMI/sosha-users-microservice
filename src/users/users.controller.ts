import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseFilters,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationPayload } from './entities/users.paginted';
import {
  PasswordChange,
  PasswordResetPayload,
  RetrieveUserPayload,
} from './interfaces/user.interfaces';
import { AllRPCExceptionsFilter } from 'all-rpc-exception-filter';

interface FindByUsernamePayload {
  username: string;
  token?: string;
}

interface ILogout {
  userId: string;
  refreshToken: string;
}

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseFilters(new AllRPCExceptionsFilter())
  @MessagePattern({ role: 'users', cmd: 'create' })
  create(@Payload() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseFilters(new AllRPCExceptionsFilter())
  @MessagePattern({ role: 'users', cmd: 'getAllUsers' })
  findAll(@Payload() payload: PaginationPayload) {
    return this.usersService.findAll(payload.page, payload.limit);
  }

  @UseFilters(new AllRPCExceptionsFilter())
  @MessagePattern({ role: 'users', cmd: 'findOne' })
  findOne(@Payload() email: string) {
    return this.usersService.findOne(email);
  }

  @UseFilters(new AllRPCExceptionsFilter())
  @MessagePattern({ role: 'users', cmd: 'getUserByUserName' })
  findByUserName(@Payload() payload: FindByUsernamePayload) {
    return this.usersService.findByUserName(payload.username);
  }

  @UseFilters(new AllRPCExceptionsFilter())
  @MessagePattern({ role: 'users', cmd: 'logout' })
  logout(@Payload() payload: ILogout) {
    return this.usersService.logout(payload.userId, payload.refreshToken);
  }

  @UseFilters(new AllRPCExceptionsFilter())
  @MessagePattern({ role: 'users', cmd: 'requestPasswordReset' })
  requestPasswordReset(@Payload() email: string) {
    return this.usersService.requestPasswordReset(email);
  }

  @UseFilters(new AllRPCExceptionsFilter())
  @MessagePattern({ role: 'users', cmd: 'resetPassword' })
  resetPassword(@Payload() payload: PasswordResetPayload) {
    return this.usersService.resetPassword(payload);
  }

  @UseFilters(new AllRPCExceptionsFilter())
  @MessagePattern({ role: 'users', cmd: 'changePassword' })
  changePassword(@Payload() payload: PasswordChange) {
    return this.usersService.changePassword(payload);
  }

  @UseFilters(new AllRPCExceptionsFilter())
  @MessagePattern({ role: 'users', cmd: 'retrieveUser' })
  retrieveUser(@Payload() payload: RetrieveUserPayload) {
    return this.usersService.retrieveUser(payload);
  }

  @UseFilters(new AllRPCExceptionsFilter())
  @MessagePattern({ role: 'users', cmd: 'updateProfile' })
  update(@Payload() updateUserDto: UpdateUserDto) {
    return this.usersService.update(updateUserDto);
  }

  @UseFilters(new AllRPCExceptionsFilter())
  @MessagePattern({ role: 'users', cmd: 'removeUser' })
  remove(@Payload() id: string) {
    return this.usersService.remove(id);
  }

  @Post('users')
  @HttpCode(200)
  async findUsersByIds(@Body() ids: string[]) {
    return await this.usersService.findByIds(ids);
  }

  @Get('users/:id')
  @HttpCode(200)
  async findUserById(@Param('id') id: string) {
    return await this.usersService.findOne(id);
  }
}
