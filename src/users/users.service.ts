/* eslint-disable prettier/prettier */
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as jwt from 'jsonwebtoken';
// import Email from 'utils/email';
import { Users } from './entities/users.paginted';
import {
  PasswordChange,
  PasswordResetPayload,
  RetrieveUserPayload,
} from './interfaces/user.interfaces';
import { validate } from 'class-validator';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import * as crypto from 'crypto';

const logger = new Logger('UsersService');

@Injectable()
export class UsersService {
  private cognitoIdp: CognitoIdentityServiceProvider;
  private clientId: string;
  private clientSecret: string;

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    this.cognitoIdp = new CognitoIdentityServiceProvider({
      region: 'us-east-1',
    });
    this.clientId = process.env.COGNITO_CLIENT_ID;
    this.clientSecret = process.env.COGNITO_CLIENT_SECRET;
  }

  async create(createUserInput: CreateUserDto): Promise<User> {
    try {
      const createCognitoUser = await this.cognitoIdp
        .signUp({
          ClientId: this.clientId,
          SecretHash: this.generateSecretHash(createUserInput.email),
          Username: createUserInput.email,
          Password: createUserInput.password,
          UserAttributes: [
            {
              Name: 'email',
              Value: createUserInput.email,
            },
            {
              Name: 'custom:firstName',
              Value: createUserInput.firstName,
            },
            {
              Name: 'custom:lastName',
              Value: createUserInput.lastName,
            },
            {
              Name: 'custom:userName',
              Value: `@${createUserInput.username}`,
            },
          ],
        })
        .promise();

      if (createCognitoUser.$response.error) {
        throw new RpcException(createCognitoUser.$response.error.message);
      }

      const user = this.userRepository.create(createUserInput);
      const errors = await validate(user);
      if (errors.length > 0) {
        throw new RpcException(errors);
      }
      await this.userRepository.save(user);
      // const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      //   expiresIn: '24h',
      // });
      // const url = `${process.env.API_GATEWAY_URL}/auth/verify_email/${token}`;
      // const emailClass = new Email();
      // const message = emailClass.constructWelcomeEmail(user.firstName, url);
      // emailClass.sendEmail(user.email, 'Email Confirmation', message);
      return user;
    } catch (error) {
      logger.log('server error', error);
      throw new RpcException(error);
    }
  }

  async saveUserDetails(payload: any) {
    try {
      const userExists = await this.userRepository.findOne({
        where: { email: payload.email },
      });
      if (!userExists) {
        const user = this.userRepository.create(payload);
        const savedUser = await this.userRepository.save(user);
        return savedUser;
      }
    } catch (error) {
      logger.log('server error', error);
      throw new RpcException(error);
    }
  }

  async findAll(page = 1, limit = 10): Promise<Users> {
    try {
      const queryBuilder = this.userRepository.createQueryBuilder('users');

      const offset = (page - 1) * limit;

      const users = await queryBuilder.take(limit).skip(offset).getMany();

      // format response data
      const totalCount = await queryBuilder.getCount();
      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrevious = page > 1;

      const resData: Users = {
        data: users.length > 0 ? users : [],
        currentPage: page,
        hasNext,
        hasPrevious,
        size: limit,
        totalPages,
      };
      return resData;
    } catch (error) {
      logger.log('server error', error);
      throw new RpcException(error);
    }
  }

  async findOne(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
      });
      if (!user) {
        throw new RpcException('User not found');
      }
      return user;
    } catch (error) {
      logger.log('server error', error);
      throw new RpcException(error);
    }
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) {
      throw new RpcException('User not found');
    }

    return user;
  }

  async findByUserName(userName: string): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { userName },
      });
      if (!user) {
        throw new RpcException('User not found');
      }
      return user;
    } catch (error) {
      logger.log('server error', error);
      throw new RpcException(error);
    }
  }

  async findByIds(ids: string[]): Promise<User[]> {
    try {
      const users = await this.userRepository.findByIds(ids);
      return users;
    } catch (error) {
      logger.log('server error', error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ooops! Something broke from our end. Please retry',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async activateEmail(token: string): Promise<boolean> {
    try {
      const { id } = <any>jwt.verify(token, process.env.JWT_SECRET);

      if (!id) {
        throw new RpcException('Invalid token');
      }
      const user = await this.userRepository.findOne(id);
      if (!user) {
        throw new RpcException(
          'User details are no longer available. Try and register again',
        );
      }
      // await this.userRepository.update(user.id, { isVerified: true });
      return true;
    } catch (error) {
      if (error) {
        logger.log('server error', error);
        throw new RpcException(error);
      }
    }
  }

  async logout(userId: string, refreshToken: string): Promise<string> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new RpcException('User not found');
      }
      await this.cognitoIdp
        .revokeToken({
          ClientId: this.clientId,
          ClientSecret: this.clientSecret,
          Token: refreshToken,
        })
        .promise();
      this.userRepository.update({ id: userId }, { isLoggedIn: false });
      return 'User logged out';
    } catch (error) {
      logger.log('server error', error);
      throw new RpcException(error);
    }
  }

  async retrieveUser({
    email,
    phone,
    username,
  }: RetrieveUserPayload): Promise<User> {
    try {
      let user: User;
      if (email) {
        user = await this.userRepository.findOne({ where: { email } });
      } else if (phone) {
        user = await this.userRepository.findOne({ where: { phone } });
      } else if (username) {
        user = await this.userRepository.findOne({ where: { username } });
      } else {
        throw new RpcException('Invalid request');
      }

      return user;
    } catch (error) {
      logger.log('server error', error);
      throw new RpcException(error);
    }
  }

  async requestPasswordReset(email: string): Promise<string> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        throw new RpcException('User not found');
      }
      return 'Password reset email sent';
    } catch (error) {
      logger.log('server error', error);
      throw new RpcException(error);
    }
  }

  async resetPassword({ email }: PasswordResetPayload): Promise<string> {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        throw new RpcException('User not found');
      }
      await this.cognitoIdp
        .forgotPassword({ ClientId: this.clientId, Username: email })
        .promise();
      return 'Password reset successful';
    } catch (error) {
      logger.log('server error', error);
      throw new RpcException(error);
    }
  }

  async changePassword(
    payload: PasswordChange,
  ): Promise<CognitoIdentityServiceProvider.ChangePasswordResponse> {
    try {
      return await this.cognitoIdp
        .changePassword({
          AccessToken: payload.accessToken,
          PreviousPassword: payload.previousPassword,
          ProposedPassword: payload.proposedPassword,
        })
        .promise();
    } catch (error) {
      logger.log('server error', error);
      throw new RpcException(error);
    }
  }

  async update(updateUserInput: UpdateUserDto): Promise<User> {
    try {
      const { id, ...data } = updateUserInput;
      const queryBuilder = this.userRepository.createQueryBuilder();

      const updatedUser = await queryBuilder
        .update(User, {
          ...data,
        })
        .where('id = :id', { id })
        .returning('*')
        .execute();

      return updatedUser.raw[0];
    } catch (error) {
      logger.log('server error', error);
      throw new RpcException(error);
    }
  }

  async remove(id: string): Promise<User> {
    try {
      const deletedUser = await this.userRepository
        .createQueryBuilder()
        .delete()
        .from(User)
        .where('id = :id', { id })
        .returning('*')
        .execute();
      return deletedUser.raw[0];
    } catch (error) {
      logger.log('server error', error);
      throw new RpcException(error);
    }
  }

  private generateSecretHash(username: string): string {
    return crypto
      .createHmac('sha256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }
}
