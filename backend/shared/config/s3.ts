import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'amazon-relife-assets';

export interface UploadResult {
  key: string;
  url: string;
}

// Upload a file buffer to S3
export const uploadToS3 = async (
  buffer: Buffer,
  mimeType: string,
  folder: string = 'uploads'
): Promise<UploadResult> => {
  const extension = mimeType.split('/')[1] || 'bin';
  const key = `${folder}/${uuidv4()}.${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
  return { key, url };
};

// Generate a pre-signed URL for temporary access
export const getPresignedUrl = async (
  key: string,
  expiresInSeconds: number = 3600
): Promise<string> => {
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
};

// Delete a file from S3
export const deleteFromS3 = async (key: string): Promise<void> => {
  await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
};

export { s3Client };
