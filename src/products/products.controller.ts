import { Body, Controller, Delete, Get, Post, Put, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { JwtGuard, RestrictRolesGuard } from "src/auth/guards";
import { UserData } from "src/auth/interfaces/UserData";
import { ProductDto } from "./dto/product.dto";
import { ProductsService } from "./products.service";
import { PaginationParams } from "src/common/decorators/pagination-query-params.decorator";
import { PaginateOptions } from "src/prisma/prisma.service";
import { IdParam } from "src/common/decorators/id-param.decorator";

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @UseGuards(JwtGuard, new RestrictRolesGuard('foreman'))
  @UseInterceptors(FileInterceptor('photo'))
  addProduct(@Body() addProductDto: ProductDto, @GetUser() user: UserData, @UploadedFile() photo: Express.Multer.File) {
    return this.productsService.create(addProductDto, user, photo);
  }

  @Get()
  @UseGuards(JwtGuard)
  async getProducts(@PaginationParams() pgnOpts: PaginateOptions, @GetUser() user: UserData) {
    return this.productsService.getProducts(pgnOpts, user);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  async getProduct(@IdParam() id: number, @GetUser() user: UserData) {
    return this.productsService.getProduct(id, user);
  }

  @Put(':id')
  @UseGuards(JwtGuard, new RestrictRolesGuard('foreman'))
  @UseInterceptors(FileInterceptor('photo'))
  async updateProduct(@IdParam() id: number, @Body() updateProductDto: ProductDto, @GetUser() user: UserData, @UploadedFile() photo: Express.Multer.File) {
    return this.productsService.updateProduct(id, updateProductDto, user, photo);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, new RestrictRolesGuard('foreman'))
  async deleteProduct(@IdParam() id: number, @GetUser() user: UserData) {
    return this.productsService.deleteProduct(id, user);
  }
}
