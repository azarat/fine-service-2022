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
          licensePlate,
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

  public async getAllFines(): Promise<any[]> {
    const token = process.env.INFOTECH_TOKEN
    const date = new Date(Date.now())
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    const response = await axios.get<IFine[]>(
      'https://services.infotech.gov.ua/v3/Test/GetFines',
      {
        params: {
          startDateTime: `${day}.${month}.${year} 00:00:00`,
          endDateTime: `${day + 1}.${month}.${year} 00:00:00`,
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

  public async getAllUsersByLicense(driverLicenses): Promise<any> {
    try {
      const users = await Promise.all(
        driverLicenses.map(async (driverLicense) => {
          if (driverLicense == '') {
            return
          }
          const encodedDriverLicense = encodeURI(driverLicense)
          const response = await axios.get<any>(
            `${config.apiHost}:8080/v1/Dev/ProfileService/documents/getUserByDriverLicense?driverLicense=${encodedDriverLicense}`,
          )
          if (response.data !== '') {
            return response.data
          }
        }),
      )

      const filteredUsers = users.filter((user) => {
        return user !== undefined
      })
      if (filteredUsers.length > 0) {
        return filteredUsers
      }

      throw new HttpError(HttpError.USERS_NOT_FOUND, 404)
    } catch (error) {
      console.log(error)
      return error
    }
  }

  public async getDevicesTokens(users): Promise<any> {
    const devicesTokens = await Promise.all(
      users.map(async (user) => {
        try {
          const response = await axios.get<any>(
            `${config.apiHost}:8080/v1/Dev/ProfileService/user/${user.user}`,
            {
              headers: {
                secret: config.userSdkSecret,
                'Content-Type': 'application/json',
              },
            },
          )
          return response.data.deviceToken
        } catch (error) {
          console.log(error)
          return []
        }
      }),
    )
    const filteredDevicesTokens = devicesTokens.filter((devicesToken) => {
      return devicesToken.length > 0
    })
    return filteredDevicesTokens
  }

  public async getByMethod(type: string, body): Promise<any> {
    const transformedBody = {
      DRIVER_LICENSE: this.transformDriverLicense,
      INN: this.transformInn,
      TECHNICAL_PASSPORT: this.transformTechnicalPassport,
      // DOCUMENT: this.transformDriverDocument,
    }[type](body)

    console.log(type, body)

    const fines = {
      DRIVER_LICENSE: this.getFinesByDriverLicense,
      INN: this.getFinesByInn,
      TECHNICAL_PASSPORT: this.getFinesByTechnicalPassport,
      // DOCUMENT: this.getFinesByDocument,
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

  // private async getFinesByDocument({
  //   series,
  //   number,
  //   licensePlate,
  // }): Promise<IFine[]> {
  //   const token = process.env.INFOTECH_TOKEN
  //   const response = await axios.get<IFine[]>(
  //     'https://services.infotech.gov.ua/v3/Test/SearchFinesForDocument',
  //     {
  //       params: {
  //         series,
  //         number,
  //         licensePlate,
  //       },
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //     },
  //   )

  //   if (!response.data.length)
  //     throw new HttpError(HttpError.FINE_NOT_FOUND, 404)
  //   return response.data
  // }

  private async getFinesByInn({ rnokpp, licensePlate }): Promise<IFine[]> {
    const token = process.env.INFOTECH_TOKEN
    const response = await axios.get<IFine[]>(
      'https://services.infotech.gov.ua/v3/Test/SearchFinesByTaxpayerRregNumber',
      {
        params: {
          rnokpp,
          licensePlate,
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
