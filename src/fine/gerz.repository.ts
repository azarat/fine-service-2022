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
    const token = process.env.INFOTECH_TOKEN
    const response = await axios.get<IFine[]>(
      'https://services.infotech.gov.ua/v3/Test/SearchFines',
      {
        params: {
          series,
          nDoc,
          licensePlate: licensePlate.replaceAll(' ', ''),
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.data.length)
      throw new HttpError(HttpError.FINE_NOT_FOUND, 404)
    return response.data[0]
  }

  public async getByMethod(type: string, body): Promise<any> {
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
      DOCUMENT: this.getFinesByDocument,
    }[type](transformedBody)

    return fines
  }

  private async getFinesByDriverLicense({ series, number, date }) {
    const token = process.env.INFOTECH_TOKEN
    const response = await axios.post<IFinesResponse>(
      'https://services.infotech.gov.ua/v3/Test/SearchFinesForLicense',
      {
        series,
        number,
        date,
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
    return response.data
  }

  private async getFinesByDocument({
    series,
    number,
    licensePlate,
  }): Promise<IFine[]> {
    const token = process.env.INFOTECH_TOKEN
    const response = await axios.get<IFine[]>(
      'https://services.infotech.gov.ua/v3/Test/SearchFinesForDocument',
      {
        params: {
          series,
          number,
          licensePlate: licensePlate.replaceAll(' ', ''),
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.data.length)
      throw new HttpError(HttpError.FINE_NOT_FOUND, 404)
    return response.data
  }

  private async getFinesByInn({ rnokpp, licensePlate }): Promise<IFine[]> {
    const token = process.env.INFOTECH_TOKEN
    const response = await axios.get<IFine[]>(
      'https://services.infotech.gov.ua/v3/Test/SearchFinesByTaxpayerRregNumber',
      {
        params: {
          rnokpp,
          licensePlate: licensePlate.replaceAll(' ', ''),
        },
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.data.length)
      throw new HttpError(HttpError.FINE_NOT_FOUND, 404)
    return response.data
  }

  private async getFinesByTechnicalPassport({ series, number, licensePlate }) {
    const token = process.env.INFOTECH_TOKEN
    const response = await axios.post<IFinesResponse>(
      'https://services.infotech.gov.ua/v3/Test/SearchFinesByCarRegCert',
      {
        series,
        number,
        licensePlate,
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
    return response.data
  }

  private async transformDriverLicense({ series, number, date }) {
    series = series.replaceAll(/[ ,;]/g, '').toUpperCase()
    number = number.replaceAll(/[ ,;]/g, '')
    date = date.replaceAll(/[ ,;]/g, '')
    return {
      series,
      number,
      date,
    }
  }

  private transformInn({ number, carNumber }) {
    carNumber = carNumber.replaceAll(/[ ,;]/g, '').toUpperCase()
    number = number.replaceAll(/[ ,;]/g, '')
    return {
      number,
      carNumber,
    }
  }

  private transformTechnicalPassport({ series, number, carNumber }) {
    carNumber = carNumber.replaceAll(/[ ,;]/g, '').toUpperCase()
    number = number.replaceAll(/[ ,;]/g, '')
    series = series.replaceAll(/[ ,;]/g, '').toUpperCase()
    return {
      series,
      number,
      carNumber,
    }
  }

  private transformDriverDocument({ series, number, carNumber }) {
    carNumber = carNumber.replaceAll(/[ ,;]/g, '').toUpperCase()
    number = number.replaceAll(/[ ,;]/g, '')
    series = series.replaceAll(/[ ,;]/g, '').toUpperCase()
    return {
      series,
      number,
      carNumber,
    }
  }
}

export default new Gerz()
