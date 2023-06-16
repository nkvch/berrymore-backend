import { IsInt, IsOptional } from "class-validator";
import { DateFromString } from "src/common/decorators/date-from-string.decorator";

export class MarkAsPaidDto {
  @IsInt({ message: 'Неправильно указан сотрудник' })
  employeeId: number;
  @IsOptional()
  @IsInt({ message: 'Неправильно указана продукт' })
  productId: number;
  @IsOptional()
  @DateFromString({ message: 'Неправильно указана дата' })
  fromDataTime: Date;
  @DateFromString({ message: 'Неправильно указана дата' })
  toDataTime: Date;
}
