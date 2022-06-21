import { Injectable } from '@nestjs/common';
import {
  UploadResponse,
  ImageUploadRequest,
  PaginatedImages,
} from './interfaces/imageUploadRequest.interface';
import { S3 } from 'aws-sdk';
import { ImageDirectory } from './enums/imageDirectories.enum';
import { extname } from 'path';

const s3 = new S3({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.aws_access_key_id,
    secretAccessKey: process.env.aws_secret_access_key,
  },
});

@Injectable()
export class ImagesService {
  private CDN_URL: string;
  private MEDIA_BUCKET_NAME: string;
  constructor() {
    this.CDN_URL = process.env.CDN_URL;
    this.MEDIA_BUCKET_NAME = process.env.MEDIA_BUCKET_NAME;
  }

  startUpload(payload: ImageUploadRequest): UploadResponse {
    if (!payload.postId && !payload.userId) {
      throw new Error('You must specify either a userId or a postId');
    }
    let key: string;
    //get the file extension
    const extension = extname(payload.filename);
    //change the file name to a proper format
    const formattedFileName = payload.filename
      .substring(0, payload.filename.indexOf('.'))
      .replace(/[^a-z0-9]+/g, '');
    if (payload.directory === ImageDirectory.USERS) {
      key = `${payload.directory}/${
        payload.userId
      }/${payload.contentType.replace(
        '/',
        '-',
      )}/${formattedFileName}${extension}`;
    } else if (payload.directory === ImageDirectory.POSTS) {
      key = `${payload.directory}/${payload.userId}/${
        payload.postId
      }/${payload.contentType.replace(
        '/',
        '-',
      )}/${formattedFileName}${extension}`;
    } else {
      throw new Error('No valid directory specified');
    }

    const formData = s3.createPresignedPost({
      Bucket: this.MEDIA_BUCKET_NAME,
      Expires: 180,
      Conditions:
        payload.directory == ImageDirectory.USERS
          ? [['content-length-range', 0, 5000000]]
          : [['content-length-range', 0, 10000000]], //LIMIT FILE SIZE
      Fields: {
        key,
        'Content-Type': payload.contentType,
      },
    });
    return {
      formData,
    };
  }

  async findPostImages(
    userId: string,
    postId: string,
    lastImageKey?: string,
  ): Promise<PaginatedImages> {
    const imagesPath = `${ImageDirectory.POSTS}/${userId}/${postId}`;
    const limit = 20;
    let keepFetching = true;
    let nextContinuationToken = null;

    let params: S3.ListObjectsV2Request = {
      Bucket: this.MEDIA_BUCKET_NAME,
      Prefix: imagesPath,
      MaxKeys: limit,
      StartAfter: lastImageKey,
      ContinuationToken: nextContinuationToken || undefined,
    };

    let results = [];
    while (keepFetching) {
      const objects = await s3.listObjectsV2(params).promise();
      const returnedKeys = objects.Contents.map((obj) => obj.Key);
      results = [...results, ...returnedKeys];
      if (objects.IsTruncated) {
        nextContinuationToken = objects.NextContinuationToken;
      } else {
        keepFetching = false;
        nextContinuationToken = null;
        break;
      }
    }

    const imageUrls = results.map((key) => ({ url: this.getCDNUrl(key) }));
    const resData: PaginatedImages = {
      images: imageUrls,
      size: imageUrls.length,
    };

    return resData;
  }

  private getCDNUrl(key: string) {
    return `${this.CDN_URL}/${key}`;
  }
}
