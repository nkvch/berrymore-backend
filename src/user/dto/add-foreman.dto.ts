import { IsNotEmpty, Length, IsOptional } from 'class-validator';

export class AddForemanDto {
  @IsNotEmpty({ message: 'Имя не должно быть пустым' })
  firstName: string;
  @IsNotEmpty({ message: 'Фамилия не должна быть пустой' })
  lastName: string;
  @IsOptional()
  email: string;
  @IsOptional()
  phone: string;
  @IsNotEmpty({ message: 'Имя пользователя не должно быть пустым' })
  username: string;
  @IsNotEmpty({ message: 'Пароль не должен быть пустым' })
  @Length(8, 20, { message: 'Пароль должен быть от 8 до 20 символов' })
  password: string;
}
