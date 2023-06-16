import { IsOptional, IsString } from 'class-validator';
import { IdsList } from 'src/common/decorators/ids-list.decorator';
import { NumberFromString } from 'src/common/decorators/number-from-string.decorator';

export class GetEmployeesDto {
  @IsOptional()
  @NumberFromString({ message: 'Неправильно указано ID' })
  id: number;
  @IsOptional()
  @IsString({ message: 'Неправильный запрос' })
  search: string;
  @IsOptional()
  @IdsList({ message: 'Неправильно указаны флаги' })
  flagsPresent: number[];
  @IsOptional()
  @IdsList({ message: 'Неправильно указаны флаги' })
  flagsAbsent: number[];
  @IsOptional()
  @NumberFromString({ message: 'Неправильно указан бригадир' })
  foremanId: number;
  @IsOptional()
  @IsString({ message: 'Неправильно указано имя' })
  firstName: string;
  @IsOptional()
  @IsString({ message: 'Неправильно указана фамилия' })
  lastName: string;
}
