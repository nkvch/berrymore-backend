import { IsNotEmpty, IsHexColor } from 'class-validator';

export class FlagDto {
  @IsNotEmpty({ message: 'Название не должно быть пустым' })
  name: string;
  @IsHexColor({ message: 'Цвет должен быть в формате HEX' })
  color: string;
}
