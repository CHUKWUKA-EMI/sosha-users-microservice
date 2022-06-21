import { Controller, Get, Post, Body, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ImageDirectory } from './enums/imageDirectories.enum';
import { ImagesService } from './images.service';
import { ImageUploadRequest } from './interfaces/imageUploadRequest.interface';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  create(@Body() payload: ImageUploadRequest, @Res() res: Response) {
    if (!payload.contentType || !payload.directory || !payload.filename) {
      const missingParams = ['contentType', 'directory', 'filename'].filter(
        (param) =>
          payload[param] === undefined || payload[param].trim().length === 0,
      );
      return res.status(400).json({
        message: 'Missing required parameters:' + missingParams.join(','),
      });
    }
    if (!payload.postId && !payload.userId) {
      return res
        .status(400)
        .json({ message: 'You must specify either a userId or a postId' });
    }

    if (!(payload.directory in ImageDirectory)) {
      return res.status(400).json({ message: 'Invalid directory name' });
    }
    try {
      const resData = this.imagesService.startUpload(payload);
      return res.status(200).json(resData);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: error.message });
    }
  }

  @Get('/user/posts?')
  async findPostImages(
    @Res() res: Response,
    @Query('userId') userId: string,
    @Query('postId') postId: string,
    @Query('lastImageKey') lastImageKey?: string,
  ) {
    try {
      const data = await this.imagesService.findPostImages(
        userId,
        postId,
        lastImageKey,
      );
      return res.status(200).json(data);
    } catch (error) {
      console.log('error', error);
      return res.status(500).json({ message: error.message });
    }
  }
}
