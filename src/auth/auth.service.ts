/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { LoginUserInput } from './dto/login-user.input';
import { RpcException } from '@nestjs/microservices';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import * as crypto from 'crypto';
import { AuthData } from './interfaces/authData.interface';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as jwkToPem from 'jwk-to-pem';
import * as jwt from 'jsonwebtoken';
import * as url from 'url';

@Injectable()
export class AuthService {
  private cognitoIdp: CognitoIdentityServiceProvider;
  private clientId: string;
  private clientSecret: string;
  private userPoolId: string;
  private pems: object = {};
  private cognitoTokenEndpoint: string;
  constructor(private httpService: HttpService) {
    this.cognitoIdp = new CognitoIdentityServiceProvider({
      region: 'us-east-1',
    });
    this.clientId = process.env.COGNITO_CLIENT_ID;
    this.clientSecret = process.env.COGNITO_CLIENT_SECRET;
    this.userPoolId = process.env.COGNITO_USER_POOL_ID;
    this.cognitoTokenEndpoint = `${process.env.COGNITO_AUTH_DOMAIN}/oauth2/token`;
    this.setupJwkToPerm();
  }

  async loginUser(loginUserInput: LoginUserInput): Promise<AuthData> {
    try {
      console.log('login received', loginUserInput);
      const login = await this.cognitoIdp
        .initiateAuth({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: this.clientId,
          AuthParameters: {
            USERNAME: loginUserInput.email,
            PASSWORD: loginUserInput.password,
            SECRET_HASH: this.generateSecretHash(loginUserInput.email),
          },
        })
        .promise();
      return login.AuthenticationResult;
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async VerifyToken(token: string) {
    try {
      const decodedToken = jwt.decode(token, { complete: true });
      const pem = this.pems[decodedToken.header.kid];
      if (!pem) {
        throw new RpcException('Invalid token');
      }
      const response = jwt.verify(token, pem, { algorithms: ['RS256'] });
      return response;
    } catch (error) {
      console.log('error', error);
      throw new RpcException('Invalid token');
    }
  }

  async exchangeGrantCodeForToken(code: string) {
    try {
      const params = new url.URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: this.clientId,
        redirect_uri: process.env.COGNITO_REDIRECT_URI,
      });
      const authPayload = `${this.clientId}:${this.clientSecret}`;
      const response$ = this.httpService.post(
        this.cognitoTokenEndpoint,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(authPayload).toString(
              'base64',
            )}`,
          },
        },
      );
      const response = await lastValueFrom(response$);
      if (response.status !== 200) {
        throw new RpcException('Token exchange failed');
      }

      return response.data;
    } catch (error) {
      throw new RpcException('Token exchange failed');
    }
  }

  private generateSecretHash(username: string): string {
    return crypto
      .createHmac('sha256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }

  private async setupJwkToPerm() {
    const url = `https://cognito-idp.us-east-1.amazonaws.com/${this.userPoolId}/.well-known/jwks.json`;
    try {
      const response = await lastValueFrom(this.httpService.get(url));
      if (response.status !== 200) {
        console.log('error fetching jwks');
        return;
      }
      const jwks = response.data.keys;
      jwks.forEach((jwk) => {
        this.pems[jwk.kid] = jwkToPem(jwk);
      });
    } catch (error) {
      console.log('error fetching jwks', error);
    }
  }
}
