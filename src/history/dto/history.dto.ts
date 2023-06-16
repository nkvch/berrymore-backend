import { IsNumber } from "class-validator";
import { DateFromString } from "src/common/decorators/date-from-string.decorator";
import { StringFromNumber } from "src/common/decorators/string-from-number.decorator";

export class HistoryDto {
  @IsNumber({}, { message: 'Неправильно указан сборщик' })
  employeeId: number;
  @IsNumber({}, { message: 'Неправильно указан продукт' })
  productId: number;
  @DateFromString({ message: 'Неправильно указана дата' })
  dateTime: Date;
  @StringFromNumber({ message: 'Неправильно указано количество' })
  amount: string;
}
