/* eslint-disable prettier/prettier */
import {
  Catch,
  RpcExceptionFilter,
  ArgumentsHost,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import * as fs from 'fs';

interface ErrorResponseBody {
  error: string;
  timestamp: string;
}

const logger = new Logger('ExceptionFilter');

@Catch()
export class AllRPCExceptionsFilter
  implements RpcExceptionFilter<RpcException>
{
  catch(exception: unknown, host: ArgumentsHost): Observable<any> {
    logger.log(
      'Exception context',
      JSON.stringify(host.switchToRpc().getContext()),
    );
    let errorMessage: string;
    let stackTrace: string;

    if (exception instanceof RpcException) {
      const errorResponse = exception.getError();
      errorMessage =
        (errorResponse as ErrorResponseBody).error || exception.message;
      stackTrace = exception.stack;
    } else {
      stackTrace = exception.toString();
      errorMessage = 'Ooops! Something broke from our end. Please retry';
    }

    const responseBody: ErrorResponseBody = {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
    //log error
    this.logError(responseBody, stackTrace);
    //save error
    this.saveErrorLog(responseBody, stackTrace);

    
    return throwError(() => {
      return responseBody;
    });
  }

  private saveErrorLog(error: ErrorResponseBody, trace: any) {
    const errorLog = `
    ======================= \n\n
    error: ${error.error}\n
    timestamp:${new Date().toISOString()}\n
    trace: ${trace}\n\n
    =======================`;

    fs.appendFile('error.log', errorLog, (err) => {
      if (err) {
        logger.log('error', err);
      }
    });
  }

  private logError(error: ErrorResponseBody, trace: any) {
    const errorLog = `error: ${error.error} timestamp:${error.timestamp} trace: ${trace}`;
    logger.log(errorLog);
  }
}
