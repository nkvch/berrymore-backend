import { IsArray } from "class-validator"
import { DateFromString } from "src/common/decorators/date-from-string.decorator"

export class AddShiftDto {
  @IsArray({ message: 'Неправильно указаны сотрудники' })
  employeeIds: number[]
  @DateFromString({ message: 'Неправильно указано время начала' })
  startTime: Date
  @DateFromString({ message: 'Неправильно указано время окончания' })
  endTime: Date
}
