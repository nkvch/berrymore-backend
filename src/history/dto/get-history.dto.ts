import { IsIn, IsNumber, IsOptional } from "class-validator";
import { DateFromString } from "src/common/decorators/date-from-string.decorator";

export class GetHistoryDto {
  @IsOptional()
  @DateFromString({ message: 'Неправильно указана дата' })
  fromDateTime: Date;
  @IsOptional()
  @DateFromString({ message: 'Неправильно указана дата' })
  toDateTime: Date;
  @IsOptional()
  @IsNumber({}, { message: 'Неправильно указан бригадир' })
  foremanId: number;
  @IsOptional()
  @IsNumber({}, { message: 'Неправильно указан продукт' })
  productId: number;
  @IsOptional()
  @IsNumber({}, { message: 'Неправильно указан сборщик' })
  employeeId: number;
  @IsIn(['asc', 'desc'], { message: 'Неправильно указана сортировка' })
  sort: 'asc' | 'desc';
}
