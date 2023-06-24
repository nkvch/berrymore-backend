import { IsNumber, IsOptional } from "class-validator"
import { DateFromString } from "src/common/decorators/date-from-string.decorator"

export class GetShiftsDto {
  @IsOptional()
  @DateFromString({ message: 'Неправильно указано время начала' })
  from: Date
  @IsOptional()
  @DateFromString({ message: 'Неправильно указано время окончания' })
  to: Date
  @IsOptional()
  @IsNumber({}, { message: 'Неправильно указан идентификатор сотрудника' })
  employeeId: number
}
