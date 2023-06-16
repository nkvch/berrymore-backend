import { IsNotEmpty, IsNumberString } from "class-validator";

export class ProductDto {
  @IsNotEmpty({ message: 'Название не должно быть пустым' })
  productName: string;
  @IsNotEmpty({ message: 'Цена не должна быть пустой' })
  @IsNumberString({}, { message: 'Неправильно указана цена' })
  productPrice: string;
}
