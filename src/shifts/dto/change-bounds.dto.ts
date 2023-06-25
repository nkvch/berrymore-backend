import { DateFromString } from "src/common/decorators/date-from-string.decorator"

export class ChangeBoundsDto {
  @DateFromString({ message: 'Неправильно указано время начала' })
  newstartDate: Date
  @DateFromString({ message: 'Неправильно указано время окончания' })
  newendDate: Date
}
