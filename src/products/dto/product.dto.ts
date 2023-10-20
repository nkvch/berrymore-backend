import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';
import { StringFromNumber } from 'src/common/decorators/string-from-number.decorator';

export class ProductDto {
  @IsNotEmpty({ message: 'Название не должно быть пустым' })
  productName: string;
  @IsNotEmpty({ message: 'Цена не должна быть пустой' })
  @IsString({ message: 'Неправильно указана цена' })
  productPrice: string;
  @IsNotEmpty({ message: 'Единица измерения не должна быть пустой' })
  @IsString({ message: 'Неправильно указана единица измерения' })
  productUnit: string;
}
