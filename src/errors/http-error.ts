import { ILocalizatedError } from './interfaces'

class HttpError {
  static FINE_SUM_ERROR = {
    en: 'Invalid cars number or decree number or series',
    ru: 'Неверный номер машины или номер или серия постановления',
    uk: 'Невірний номер машини або номер чи серія постанови',
  }
  static FINE_NOT_FOUND = {
    en: 'Fine was not found',
    ru: 'Штраф не найден',
    uk: 'Штраф не знайдено',
  }

  static USERS_NOT_FOUND = {
    en: 'Users was not found',
    ru: 'Пользователей не найдено',
    uk: 'Користувачів не знайдено',
  }

  constructor(
    public message: ILocalizatedError | string,
    public code: number,
  ) {}
}

export default HttpError
