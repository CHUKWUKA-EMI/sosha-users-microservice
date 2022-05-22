import { Injectable } from '@nestjs/common';
import { UsersService } from './users/users.service';

@Injectable()
export class AppService {
  constructor(private readonly userService: UsersService) {}

  async activateEmail(token: string): Promise<boolean> {
    return this.userService.activateEmail(token);
  }
}
