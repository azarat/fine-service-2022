import * as userSdk from '@day-drive/user-sdk/lib/cjs'

import Gerz from './gerz.repository'
import config from '../config/config'
import { IFine } from './interfaces/fine.interface'

class FineService {
  public getFinesByDocument(
    series: string,
    nDoc: string,
    licensePlate: string,
  ): Promise<IFine> {
    return Gerz.getByDocument(series, nDoc, licensePlate)
  }

  public async getAllFines(): Promise<any> {
    const fines = await Gerz.getAllFines()
    const driverLicenses = fines.map(
      (fine) => fine.SDriverLic + fine.NDriverLic,
    )

    let users = []
    try {
      users = await Gerz.getAllUsersByLicense(driverLicenses)
    } catch (error) {
      return []
    }

    const devicesTokens = await Gerz.getDevicesTokens(users)

    // Send Push requests

    return devicesTokens
  }

  public async getFinesByToken(token: string): Promise<IFine[]> {
    const documents = await userSdk.getUserDocuments(
      config.userSdkUrl,
      config.userSdkSecret,
      token,
    )

    if (!documents.length) return []

    const fines: IFine[] = (
      await Promise.all(
        documents.map(async ({ type, ...body }) =>
          Gerz.getByMethod(type, body),
        ),
      )
    ).reduce((acc, item) => {
      item.forEach((element) => acc.push(element))
      return acc
    })
    return fines.filter(
      (item, index, self) =>
        self.findIndex((v) => v.docid === item.docid) === index,
    )
  }
}

export default new FineService()
