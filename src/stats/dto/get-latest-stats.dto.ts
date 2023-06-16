import { IsOptional } from "class-validator";
import { NumberFromString } from "src/common/decorators/number-from-string.decorator";

export class GetLatestStatsDto {
  @IsOptional()
  @NumberFromString({ message: 'Неправильно указан продукт' })
  productId: number;
  @IsOptional()
  @NumberFromString({ message: 'Неправильно указан бригадир' })
  foremanId: number;
}
