export const getEnvFilePath = (): string[] => {
  const envFile =
    process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';
  return [envFile];
};

export const envConfig = () => {
  return {
    // App
    port: parseInt(process.env.PORT ?? '', 10) || 3000,
    nodeEnv: process.env.NODE_ENV ?? 'development',
    apiPrefix: process.env.API_PREFIX ?? 'v1',
    // Swagger
    swaggerPath: process.env.SWAGGER_PATH ?? 'docs',
    // Redis
    redisUrl: process.env.REDIS_URL || undefined,
    // Cors
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
    // Cache
    cacheTtl: parseInt(process.env.CACHE_TTL ?? '', 10) || 60000,
    // Cookie
    cookieSecret: process.env.COOKIE_SECRET ?? '',
    // Http
    httpTimeout: parseInt(process.env.HTTP_TIMEOUT ?? '', 10) || 5000,
    httpMaxRedirects: parseInt(process.env.HTTP_MAX_REDIRECTS ?? '', 10) || 5,
    // Throttle
    throttleTtl: parseInt(process.env.THROTTLE_TTL ?? '', 10) || 60000,
    throttleLimit: parseInt(process.env.THROTTLE_LIMIT ?? '', 10) || 100,
    // Storage
    storageDriver: process.env.STORAGE_DRIVER ?? 'local',
    storageMaxFileSize:
      parseInt(process.env.STORAGE_MAX_FILE_SIZE ?? '', 10) || 5 * 1024 * 1024,
    // Storage - local
    storageLocalDir: process.env.STORAGE_LOCAL_DIR ?? 'storage',
    storageLocalPrefix: process.env.STORAGE_LOCAL_PREFIX ?? '/storage',
    storageLocalBaseUrl:
      process.env.STORAGE_LOCAL_BASE_URL ?? 'http://localhost:3000/storage',
    // Storage - s3
    storageS3Bucket: process.env.STORAGE_S3_BUCKET ?? '',
    storageS3Region: process.env.STORAGE_S3_REGION ?? '',
    storageS3AccessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID ?? '',
    storageS3SecretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY ?? '',
    storageS3Endpoint: process.env.STORAGE_S3_ENDPOINT || undefined,
    storageS3ForcePathStyle: process.env.STORAGE_S3_FORCE_PATH_STYLE === 'true',
    storageS3PublicUrl: process.env.STORAGE_S3_PUBLIC_URL || undefined,
    // DB
  };
};
