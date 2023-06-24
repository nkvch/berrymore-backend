import { IsArray, IsOptional } from "class-validator"
import { DateFromString } from "src/common/decorators/date-from-string.decorator"

export class CutOutPeriod {
  @IsOptional()
  @IsArray({ message: 'Неправильно указаны сотрудники' })
  employeeIds: number[]
  @DateFromString({ message: 'Неправильно указано время начала' })
  startDate: Date
  @DateFromString({ message: 'Неправильно указано время окончания' })
  endDate: Date
}
