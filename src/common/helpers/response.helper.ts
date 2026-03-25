import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';

export class ResponseHelper {
  /**
   * Helper method to handle API success response
   * @param res
   * @param body
   * @param statusCode
   */
  static success(
    res: Response,
    body: { message: string; data?: any },
    statusCode: HttpStatus = HttpStatus.OK,
  ) {
    return res.status(statusCode).json({
      status: true,
      message: body.message,
      result: body?.data,
    });
  }
}
