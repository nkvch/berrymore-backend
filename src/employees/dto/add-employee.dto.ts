import { IsArray, IsNotEmpty, IsNumberString, IsOptional, IsPhoneNumber, IsString } from "class-validator";
import { IdsList } from "src/common/decorators/ids-list.decorator";

export class AddEmployeeDto {
  @IsNotEmpty({ message: 'Имя не должно быть пустым' })
  firstName: string;
  @IsNotEmpty({ message: 'Фамилия не должна быть пустой' })
  lastName: string;
  @IsNumberString({}, { message: 'Неправильно указан бригадир' })
  @IsNotEmpty({ message: 'Не указан бригадир' })
  foremanId: number;
  @IsString({ message: 'Неправильно указан адрес' })
  address: string;
  @IsPhoneNumber('BY', { message: 'Неправильно указан номер телефона' })
  phone: string;
  @IsString({ message: 'Неправильно указан контракт' })
  contract: string;
  @IsArray({ message: 'Неправильно указаны флаги' })
  @IdsList()
  flags: number[];
  @IsOptional()
  additionalInfo: string;
}
