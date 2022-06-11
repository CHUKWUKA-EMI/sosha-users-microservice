/* eslint-disable prettier/prettier */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import * as fs from 'fs';

interface ErrorResponseBody {
  statusCode: number;
  error: string;
  timestamp: string;
}

@Catch()
export class AllHttpExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let httpStatus: HttpStatus;
    let errorMessage: string;
    let stackTrace: string;

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const errorResponse = exception.getResponse();
      errorMessage =
        (errorResponse as ErrorResponseBody).error || exception.message;
      stackTrace = exception.stack;
    } else {
      stackTrace = exception.toString();
      httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      errorMessage = 'Ooops! Something broke from our end. Please retry';
    }

    const responseBody: ErrorResponseBody = {
      statusCode: httpStatus,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
    //log error
    this.logError(responseBody, request, stackTrace);
    //save error
    this.saveErrorLog(responseBody, request, stackTrace);

    //send response
    return response.status(httpStatus).json(responseBody);
  }

  private saveErrorLog(error: ErrorResponseBody, req: Request, trace: any) {
    const errorLog = `
    ======================= \n\n
    method: ${req.method}\n
    status:${error.statusCode}\n
    error: ${error.error}\n
    timestamp:${new Date().toISOString()}\n
    trace: ${trace}\n\n
    =======================`;

    fs.appendFile('error.log', errorLog, (err) => {
      if (err) {
        console.log('error', err);
      }
    });
  }

  private logError(error: ErrorResponseBody, req: Request, trace: any) {
    console.log('error', error);
    const errorLog = `method: ${req.method} status:${error.statusCode} error: ${error.error} timestamp:${error.timestamp} trace: ${trace}`;
    console.log(errorLog);
  }
}
