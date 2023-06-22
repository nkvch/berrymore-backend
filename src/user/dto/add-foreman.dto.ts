import { IsNotEmpty, Length, IsOptional } from 'class-validator';
import { EmptyStringToUndefined } from 'src/common/decorators/empty-string-to-undefined.decorator';

export class AddForemanDto {
  @IsNotEmpty({ message: 'Имя не должно быть пустым' })
  firstName: string;
  @IsNotEmpty({ message: 'Фамилия не должна быть пустой' })
  lastName: string;
  @IsOptional()
  @EmptyStringToUndefined()
  email: string;
  @IsOptional()
  @EmptyStringToUndefined()
  phone: string;
  @IsNotEmpty({ message: 'Имя пользователя не должно быть пустым' })
  username: string;
  @IsNotEmpty({ message: 'Пароль не должен быть пустым' })
  @Length(8, 20, { message: 'Пароль должен быть от 8 до 20 символов' })
  password: string;
}
