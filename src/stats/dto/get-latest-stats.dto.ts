import { IsOptional } from 'class-validator';
import { DateFromString } from 'src/common/decorators/date-from-string.decorator';
import { NumberFromString } from 'src/common/decorators/number-from-string.decorator';

export class GetLatestStatsDto {
  @IsOptional()
  @NumberFromString({ message: 'Неправильно указан продукт' })
  productId: number;
  @IsOptional()
  @NumberFromString({ message: 'Неправильно указан бригадир' })
  foremanId: number;
  @IsOptional()
  @NumberFromString({ message: 'Неправильно указан сборщик' })
  employeeId: number;
  @DateFromString({ message: 'Неправильно указана дата начала' })
  fromDateTime: Date;
  @DateFromString({ message: 'Неправильно указана дата окончания' })
  toDateTime: Date;
}
