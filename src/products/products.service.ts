import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { products } from '@prisma/client';
import { UserData } from 'src/auth/interfaces/UserData';
import { PaginateOptions, PrismaService } from 'src/prisma/prisma.service';
import { S3Service } from 'src/s3/s3.service';
import { ProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  async create(
    addProductDto: ProductDto,
    user: UserData,
    photo: Express.Multer.File,
  ): Promise<products> {
    let photoPath: string | null = null;

    if (photo) {
      photoPath = await this.s3.saveToS3(photo);
    }

    try {
      return this.prisma.createPrivately(
        'products',
        {
          data: {
            ...addProductDto,
            photoPath,
          } as any,
        },
        user,
      );
    } catch (err) {
      if (photoPath) {
        await this.s3.deleteFromS3(photoPath);
      }
      console.error(err);
      throw new HttpException(
        'Ошибка при создании продукта',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProducts(pgnOpts: PaginateOptions, user: UserData) {
    return this.prisma.paginatePrivately('products', pgnOpts, {}, user);
  }

  async getProduct(productId: products['id'], user: UserData) {
    return this.prisma.findUniquePrivately(
      'products',
      {
        where: {
          id: productId,
        },
      },
      user,
    );
  }

  async updateProduct(
    id: products['id'],
    updateProductDto: ProductDto,
    user: UserData,
    photo: Express.Multer.File,
  ) {
    const existingProduct = await this.prisma.findUniquePrivately(
      'products',
      {
        where: { id },
      },
      user,
    );

    let photoPath: string | null = null;

    if (existingProduct.photoPath && photo) {
      photoPath = await this.s3.updateInS3(existingProduct.photoPath, photo);
    } else if (!existingProduct.photoPath && photo) {
      photoPath = await this.s3.saveToS3(photo);
    } else if (existingProduct.photoPath && !photo) {
      await this.s3.deleteFromS3(existingProduct.photoPath);
    }

    try {
      return this.prisma.updatePrivately(
        'products',
        {
          where: {
            id,
          },
          data: {
            ...updateProductDto,
            photoPath,
          } as any,
        },
        user,
      );
    } catch (err) {
      if (photoPath) {
        await this.s3.deleteFromS3(photoPath);
      }
      console.error(err);
      throw new HttpException(
        'Ошибка при обновлении продукта',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteProduct(id: products['id'], user: UserData) {
    const existingProduct = await this.prisma.findUniquePrivately(
      'products',
      {
        where: { id },
      },
      user,
    );

    if (existingProduct.photoPath) {
      await this.s3.deleteFromS3(existingProduct.photoPath);
    }

    return this.prisma.deletePrivately(
      'products',
      {
        where: {
          id,
        },
      },
      user,
    );
  }
}
