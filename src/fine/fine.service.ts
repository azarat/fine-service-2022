import * as userSdk from '@day-drive/user-sdk/lib/cjs'

import Fcm from './fcm.repository'
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

    const technicalPassports = fines.map(
      (fine) => fine.SRegCert + fine.NRegCert,
    )

    let usersByDriverLicense = []
    let usersByTechPass = []
    try {
      usersByDriverLicense = await Gerz.getAllUsersByLicense(driverLicenses)
    } catch (error) {
      usersByDriverLicense = []
    }

    try {
      usersByTechPass = await Gerz.getAllUsersByTechnicalPassport(
        technicalPassports,
      )
    } catch (error) {
      usersByTechPass = []
    }

    const allUsersId = [
      ...usersByDriverLicense.map((user) => user.user),
      ...usersByTechPass.map((user) => user.user),
    ]

    const filteredUsersId = [...new Set(allUsersId)]

    // if (config.apiEnv == 'v1/Dev' || config.apiEnv == 'v1/Stage') {
    //   users = [
    //     {
    //       user: '62f3995f8283787f4b4a1231', // tishchenko.andrii@gmail.com
    //     },
    //   ]
    // }

    const devicesTokens = await Gerz.getDevicesTokens(filteredUsersId)

    // Fcm.sendPushesToDevices(
    //   devicesTokens,
    //   'Повідомленя від DayDrive.Штрафи',
    //   'Зафіксовано новий штраф. Увійдіть у свій обліковий запис і оновіть сторінку.',
    // )

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
