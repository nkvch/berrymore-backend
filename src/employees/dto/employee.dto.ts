import { IsArray, IsNotEmpty, IsNumberString, IsOptional, IsPhoneNumber, IsString } from "class-validator";
import { IdsList } from "src/common/decorators/ids-list.decorator";
import { NumberFromString } from "src/common/decorators/number-from-string.decorator";

export class EmployeeDto {
  @IsNotEmpty({ message: 'Имя не должно быть пустым' })
  firstName: string;
  @IsNotEmpty({ message: 'Фамилия не должна быть пустой' })
  lastName: string;
  @NumberFromString({ message: 'Неправильно указан бригадир' })
  @IsNotEmpty({ message: 'Не указан бригадир' })
  foremanId: number;
  @IsString({ message: 'Неправильно указан адрес' })
  address: string;
  @IsPhoneNumber('BY', { message: 'Неправильно указан номер телефона' })
  phone: string;
  @IsString({ message: 'Неправильно указан контракт' })
  contract: string;
  @IsOptional()
  @IdsList({ message: 'Неправильно указаны флаги' })
  flags: number[];
  @IsOptional()
  additionalInfo: string;
}
