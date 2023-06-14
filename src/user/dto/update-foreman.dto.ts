import { IsNotEmpty, Length, IsOptional } from 'class-validator';

export class UpdateForemanDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Имя не должно быть пустым' })
  firstName: string;
  @IsOptional()
  @IsNotEmpty({ message: 'Фамилия не должна быть пустой' })
  lastName: string;
  @IsOptional()
  email: string;
  @IsOptional()
  phone: string;
}
