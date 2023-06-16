import { IsOptional } from "class-validator";
import { BooleanFromString } from "src/common/decorators/boolean-from-string.decorator";
import { DateFromString } from "src/common/decorators/date-from-string.decorator";
import { NumberFromString } from "src/common/decorators/number-from-string.decorator";

export class CalcEmployeeDto {
  @IsOptional()
  @NumberFromString({ message: 'Неправильно указан продукт' })
  productId: number;
  @IsOptional()
  @DateFromString({ message: 'Неправильно указана дата начала' })
  fromDateTime: Date;
  @IsOptional()
  @DateFromString({ message: 'Неправильно указана дата окончания' })
  toDateTime: Date;
  @IsOptional()
  @BooleanFromString({ message: 'Неправильно указано значение флага' })
  calcAll: boolean;
}
