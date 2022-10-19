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
    const {
      data: { data_result },
    } = await axios.post<IFinesResponse>(
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

    if (!data_result.length) throw new HttpError(HttpError.FINE_NOT_FOUND, 404)
    return data_result[0]
  }

  public async getByMethod(type: string, body): Promise<any> {
    const method = {
      DRIVER_LICENSE: 'SearchFinesForLicense',
      INN: 'SearchFinesByTaxpayerRregNumber',
      TECHNICAL_PASSPORT: 'SearchFinesByCarRegCert',
      DOCUMENT: 'SearchFinesForDocument',
    }[type]

    // const transformedBody = {
    //   DRIVER_LICENSE: this.transformDriverLicense,
    //   INN: this.transformInn,
    //   TECHNICAL_PASSPORT: this.transformTechnicalPassport,
    // }[type](body)

    console.log(type, body);

    const fines = {
      DRIVER_LICENSE: this.getFinesByDriverLicense,
      INN: this.getFinesByInn,
      TECHNICAL_PASSPORT: this.getFinesByTechnicalPassport,
      DOCUMENT: this.getFinesByDriverDocument,
    }[type](body)

    return fines
  }

  private getFinesByDriverLicense(body) {
    return ''
  }

  private getFinesByDriverDocument(body) {

    return ''
  }

  private getFinesByInn(body) {
    return ''
  }

  private getFinesByTechnicalPassport(body) {
    return ''
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
}

export default new Gerz()
