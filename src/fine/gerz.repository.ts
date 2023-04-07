import axios from 'axios'

import config from '../config/config'
import { IAccessTokenData } from './interfaces/access-token.interface'
import { IFine, IFinesResponse } from './interfaces/fine.interface'
import HttpError from '../errors/http-error'
import { IUserResponseData } from './interfaces/user.interfaces'

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
    const {
      data: { data_result },
    } = await axios.post<IFinesResponse>(
      config.gercUrl,
      {
        method: 'SearchFines',
        token: 'gerc_token',
        data: { 
          series, 
          nDoc, 
          licensePlate: licensePlate.replaceAll(' ', '')
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!data_result.length) throw new HttpError(HttpError.FINE_NOT_FOUND, 404)

    console.log(data_result[0], "data_result[0]");
    
    return data_result[0]
  }

  public async getAllFines(
    startDateTime: string,
    endDateTime: string,
  ): Promise<IFine[]> {
    const token = await this.getToken()
    const {
      data: { data_result },
    } = await axios.post<IFinesResponse>(
      config.gercUrl,
      {
        method: 'GetFines',
        token: 'gerc_token',
        data: { startDateTime, endDateTime },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    )

    // if (!data_result.length) throw new HttpError(HttpError.FINE_NOT_FOUND, 404)
    return data_result
  }

  public async getByMethod(type: string, body): Promise<any> {
    const method = {
      DRIVER_LICENSE: 'SearchFinesForLicense',
      INN: 'SearchFinesByTaxpayerRregNumber',
      TECHNICAL_PASSPORT: 'SearchFinesByCarRegCert',
    }[type]

    const transformedBody = {
      DRIVER_LICENSE: this.transformDriverLicense,
      INN: this.transformInn,
      TECHNICAL_PASSPORT: this.transformTechnicalPassport,
    }[type](body)

    const token = await this.getToken()
    const {
      data: { data_result },
    } = await axios.post<IFinesResponse>(
      config.gercUrl,
      {
        method,
        token: 'gerc_token',
        data: transformedBody,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    )
    return data_result
  }

  private transformDriverLicense(driverLicense) {
    const { series, number, date: dateIssue } = driverLicense
    return {
      series,
      number,
      dateIssue: dateIssue,
    }
  }

  private transformInn(inn) {
    const { number, carNumber } = inn
    return {
      rnokpp: number,
      licensePlate: carNumber,
    }
  }

  private transformTechnicalPassport(technicalPassport) {
    const { series, number, carNumber } = technicalPassport
    return {
      series,
      number,
      licensePlate: carNumber,
    }
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
            `${config.apiHost}${
              config.apiHost == 'http://localhost' ? ':8080' : ''
            }/${
              config.apiEnv
            }/ProfileService/documents/getUserByDriverLicense?driverLicense=${encodedDriverLicense}`,
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

      return []
    } catch (error) {
      return []
    }
  }

  public async getAllUsersByTechnicalPassport(
    technicalPassports,
  ): Promise<any> {
    try {
      const users = await Promise.all(
        technicalPassports.map(async (technicalPassport) => {
          if (technicalPassport == '') {
            return
          }
          const encodedTechnicalPassport = encodeURI(technicalPassport)
          const response = await axios.get<any>(
            `${config.apiHost}${
              config.apiHost == 'http://localhost' ? ':8080' : ''
            }/${
              config.apiEnv
            }/ProfileService/documents/getUserByTechnicalPassport?technicalPassport=${encodedTechnicalPassport}`,
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

      return []
    } catch (error) {
      return []
    }
  }

  public async getDevicesTokens(users): Promise<any> {
    const devicesTokens = await Promise.all<Array<string[]>>(
      users.map(async (user) => {
        try {
          const response = await axios.get<IUserResponseData>(
            `${config.apiHost}${
              config.apiHost == 'http://172.20.10.2' ? ':9080' : ''
            }/${config.apiEnv}/ProfileService/user/${user}`,
            {
              headers: {
                secret: config.userSdkSecret,
                'Content-Type': 'application/json',
              },
            },
          )

          return response.data.deviceToken
        } catch (error) {
          return []
        }
      }),
    )

    const filteredDevicesTokens = devicesTokens.filter((devicesToken) => {
      return devicesToken.length > 0
    })

    // Flatten array of Promise.all
    return filteredDevicesTokens.flat(1)
  }
}

export default new Gerz()