import { ImageDirectory } from '../enums/imageDirectories.enum';

export interface ImageUploadRequest {
  directory: ImageDirectory;
  filename: string;
  contentType: string;
  postId?: string;
  userId?: string;
}

export interface UploadResponse {
  formData: any;
}

export interface Image {
  url: string;
}

export interface PaginatedImages {
  images: Image[];
  size: number;
}
