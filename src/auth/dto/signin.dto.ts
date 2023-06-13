import { IsNotEmpty } from 'class-validator';

export class SigninDto {
  @IsNotEmpty({ message: 'Имя пользователя не должно быть пустым' })
  username: string;
  @IsNotEmpty({ message: 'Пароль не должен быть пустым' })
  password: string;
}
