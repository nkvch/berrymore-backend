import { DateFromString } from "src/common/decorators/date-from-string.decorator"

export class ChangeBoundsDto {
  @DateFromString({ message: 'Неправильно указано время начала' })
  newStartTime: Date
  @DateFromString({ message: 'Неправильно указано время окончания' })
  newEndTime: Date
}
