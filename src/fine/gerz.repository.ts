import axios from 'axios'

import config from '../config/config'
import { IAccessTokenData } from './interfaces/access-token.interface'
import { IFine, IFinesResponse } from './interfaces/fine.interface'
import HttpError from '../errors/http-error'

class Gerz {
  private async getToken(): Promise<string> {
    const token = Buffer.from(
      `${config.clientId}:${config.clientSecret}`,
    ).toString('base64')

    const {
      data: { access_token },
    } = await axios.get<IAccessTokenData>(config.gercAuthUrl, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Authorization: `Basic ${token}`,
      },
      data: 'grant_type=client_credentials',
    })
    return access_token
  }

  public async getByDocument(
    series: string,
    nDoc: string,
    licensePlate: string,
  ): Promise<IFine> {
    const token = await this.getToken()
    const response = await axios.post<IFinesResponse>(
      config.gercUrl,
      {
        method: 'SearchFines',
        token: 'gerc_token',
        data: { series, nDoc, licensePlate },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.data.data.length)
      throw new HttpError(HttpError.FINE_NOT_FOUND, 404)
    return response.data[0]
  }

  public async getByMethod(type: string, body): Promise<any> {
    const method = {
      DRIVER_LICENSE: 'SearchFinesForLicense',
      INN: 'SearchFinesByTaxpayerRregNumber',
      TECHNICAL_PASSPORT: 'SearchFinesByCarRegCert',
      DOCUMENT: 'SearchFinesForDocument',
    }[type]

    const transformedBody = {
      DRIVER_LICENSE: this.transformDriverLicense,
      INN: this.transformInn,
      TECHNICAL_PASSPORT: this.transformTechnicalPassport,
      DOCUMENT: this.transformDriverDocument,
    }[type](body)

    console.log(type, body)

    const fines = {
      DRIVER_LICENSE: this.getFinesByDriverLicense,
      INN: this.getFinesByInn,
      TECHNICAL_PASSPORT: this.getFinesByTechnicalPassport,
      DOCUMENT: this.getFinesByDriverDocument,
    }[type](body)

    return fines
  }

  private async getFinesByDriverLicense({ series, number, date }) {
    const infotechToken =
      'TDOEoBSnfMB-kTgcLLi7Xe_u7qvbHQpu0BWgEqX2rhg3d1Kp3Rt8ZRKsKNOyD-jEjfMwoPXiA6jcT2nqh-pNJxXhF0L5DYFMD5ASp47opSLP0OPfEhinP25loDi0AkVKW7hcCcawyxKuQ4YEyydLCS5QsMHJv7Dt9d3QEsY1wBrFXlrhN_bh2ERqLSeXUMr8LorzWNB-JjqKIen756QN9oeQCAAHdf2aqcCZJal377JLvE0feehURTtU3-u1ZQSONuJeSgT1TAXZUMQpxd615RLZhPbVfAd2YXNee3cp9SSeIQXFgPeUpah3LVoi5y7bNf0mMIXpyWFTtNR88V9K7VFai8m0Qx09rCaoWW0jP5Dg_OB-fclg5Tg4cXOsSkF7_l3qUOC0MAtDhn3UDF3uV42BiNUJ0khJ0fjGHQ0k54d8QihA2N0PQAuhmHY3dofhujmIPGuMkDY5-XCoEJWv1I3JtjG7PRWa1KTGsVxAbg1Wq3Y8XGDvJF0xxg-X1dHF'
    const response = await axios.post<IFinesResponse>(
      'https://services.infotech.gov.ua/v3/Test/SearchFinesForLicense',
      {
        series,
        number,
        date,
      },
      {
        headers: {
          Authorization: `Bearer ${infotechToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.data.data.length)
      throw new HttpError(HttpError.FINE_NOT_FOUND, 404)
    return response.data
  }

  private getFinesByDriverDocument(body) {
    return ''
  }

  private getFinesByInn(body) {
    return ''
  }

  private async getFinesByTechnicalPassport({ series, number, licensePlate }) {
    const infotechToken =
      'TDOEoBSnfMB-kTgcLLi7Xe_u7qvbHQpu0BWgEqX2rhg3d1Kp3Rt8ZRKsKNOyD-jEjfMwoPXiA6jcT2nqh-pNJxXhF0L5DYFMD5ASp47opSLP0OPfEhinP25loDi0AkVKW7hcCcawyxKuQ4YEyydLCS5QsMHJv7Dt9d3QEsY1wBrFXlrhN_bh2ERqLSeXUMr8LorzWNB-JjqKIen756QN9oeQCAAHdf2aqcCZJal377JLvE0feehURTtU3-u1ZQSONuJeSgT1TAXZUMQpxd615RLZhPbVfAd2YXNee3cp9SSeIQXFgPeUpah3LVoi5y7bNf0mMIXpyWFTtNR88V9K7VFai8m0Qx09rCaoWW0jP5Dg_OB-fclg5Tg4cXOsSkF7_l3qUOC0MAtDhn3UDF3uV42BiNUJ0khJ0fjGHQ0k54d8QihA2N0PQAuhmHY3dofhujmIPGuMkDY5-XCoEJWv1I3JtjG7PRWa1KTGsVxAbg1Wq3Y8XGDvJF0xxg-X1dHF'
    const response = await axios.post<IFinesResponse>(
      'https://services.infotech.gov.ua/v3/Test/SearchFinesByCarRegCert',
      {
        series,
        number,
        licensePlate,
      },
      {
        headers: {
          Authorization: `Bearer ${infotechToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.data.data.length)
      throw new HttpError(HttpError.FINE_NOT_FOUND, 404)
    return response.data
  }

  // public replaceMethod(data): any {
  //   data = data.replace(' ', '')
  //   data = data.replace(';', '')
  //   data = data.replace(',', '')
  //   data = data.replace('-', '')
  //   return data.toUpperCase()
  // }

  private async transformDriverLicense({ series, number, date }) {
    series = series.replaceAll(' ', '').toUpperCase()
    series = series.replaceAll(';', '')
    series = series.replaceAll(',', '')
    number = number.replaceAll(' ', '')
    number = number.replaceAll(';', '')
    number = number.replaceAll(',', '')
    date = date.replaceAll(' ', '')
    date = date.replaceAll(';', '')
    date = date.replaceAll(',', '')
    return {
      series,
      number,
      date,
    }
  }

  private transformInn({ number, carNumber }) {
    carNumber = carNumber.replaceAll(' ', '').toUpperCase()
    carNumber = carNumber.replaceAll(';', '')
    carNumber = carNumber.replaceAll(',', '')
    number = number.replaceAll(' ', '')
    number = number.replaceAll(';', '')
    number = number.replaceAll(',', '')
    return {
      number,
      carNumber,
    }
  }

  private transformTechnicalPassport({ series, number, carNumber }) {
    carNumber = carNumber.replaceAll(' ', '').toUpperCase()
    carNumber = carNumber.replaceAll(';', '')
    carNumber = carNumber.replaceAll(',', '')
    number = number.replaceAll(' ', '')
    number = number.replaceAll(';', '')
    number = number.replaceAll(',', '')
    series = series.replaceAll(' ', '').toUpperCase()
    series = series.replaceAll(';', '')
    series = series.replaceAll(',', '')
    return {
      series,
      number,
      carNumber,
    }
  }

  private transformDriverDocument({ series, number, carNumber }) {
    carNumber = carNumber.replaceAll(' ', '').toUpperCase()
    carNumber = carNumber.replaceAll(';', '')
    carNumber = carNumber.replaceAll(',', '')
    number = number.replaceAll(' ', '')
    number = number.replaceAll(';', '')
    number = number.replaceAll(',', '')
    series = series.replaceAll(' ', '').toUpperCase()
    series = series.replaceAll(';', '')
    series = series.replaceAll(',', '')
    return {
      series,
      number,
      carNumber,
    }
  }
}

export default new Gerz()
