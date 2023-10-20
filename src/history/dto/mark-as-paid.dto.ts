import { IsInt, IsOptional } from 'class-validator';
import { DateFromString } from 'src/common/decorators/date-from-string.decorator';

export class MarkAsPaidDto {
  @IsInt({ message: 'Неправильно указан сотрудник' })
  employeeId: number;
  @IsOptional()
  @IsInt({ message: 'Неправильно указан продукт' })
  productId: number;
  @IsOptional()
  @DateFromString({ message: 'Неправильно указана дата начала периода' })
  fromDateTime?: Date;
  @IsOptional()
  @DateFromString({ message: 'Неправильно указана дата конца периода' })
  toDateTime?: Date;
}
