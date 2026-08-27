export interface StoredFile {
  key: string;
  url: string;
  size: number;
  mimetype: string;
  originalName: string;
}

export interface StorageDriver {
  upload(file: Express.Multer.File): Promise<StoredFile>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}
