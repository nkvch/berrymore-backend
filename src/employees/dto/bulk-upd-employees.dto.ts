import { IsArray } from 'class-validator';

export class BulkUpdateEmployeesDto {
  @IsArray({ message: 'Неправильно указаны ID' })
  ids: number[];
  @IsArray({ message: 'Неправильно указаны флаги' })
  setFlags: number[];
  @IsArray({ message: 'Неправильно указаны флаги' })
  removeFlags: number[];
}
