import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { TryCatch } from 'src/common/decorators/try-catch.decorator';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly s3: S3;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
    });
  }

  @TryCatch('Проблема с загрузкой файла')
  async saveToS3(file: Express.Multer.File): Promise<string> {
    const bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
    const key = `${uuidv4()}-${file.originalname}`;

    await this.s3
      .upload({
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
      })
      .promise();

    return key;
  }

  @TryCatch('Проблема с загрузкой файла')
  async saveServableImageToS3(file: Express.Multer.File): Promise<[fileId: string, filePublicUrl: string]> {
    const bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
    const key = `${uuidv4()}-${file.originalname}`;

    await this.s3
      .upload({
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
        ACL: 'public-read',
      })
      .promise();

    return [key, `https://${bucketName}.s3.amazonaws.com/${key}`];
  }

  @TryCatch('Проблема с удалением файла')
  async deleteFromS3(key: string): Promise<void> {
    const bucketName = this.configService.get('AWS_S3_BUCKET_NAME');

    await this.s3
      .deleteObject({
        Bucket: bucketName,
        Key: key,
      })
      .promise();
  }

  @TryCatch('Проблема с получением файла')
  async getFromS3(key: string): Promise<Buffer> {
    const bucketName = this.configService.get('AWS_S3_BUCKET_NAME');

    const { Body } = await this.s3
      .getObject({
        Bucket: bucketName,
        Key: key,
      })
      .promise();

    return Body as Buffer;
  }

  async updateInS3(key: string, file: Express.Multer.File): Promise<string> {
    await this.deleteFromS3(key);

    return this.saveToS3(file);
  }
}
