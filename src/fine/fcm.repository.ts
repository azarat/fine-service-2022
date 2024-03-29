import axios from 'axios'

import config from '../config/config'
// import { IAccessTokenData } from './interfaces/access-token.interface' // DEPRECATED
import { IFine, IFinesResponse } from './interfaces/fine.interface'
import { IUserResponseData } from './interfaces/user.interfaces'
import { IFcmResponseData } from './interfaces/fcm.interfaces'
import HttpError from '../errors/http-error'

class Fcm {
    public async sendPushesToDevices(
        devicesTokens: string[],
        title: string,
        msg: string
    ): Promise<boolean> {
        // console.log("devicesTokens", devicesTokens);
        
        const response = await axios.post<IFcmResponseData>(
          'https://fcm.googleapis.com/fcm/send',
          {
            "registration_ids": devicesTokens,
            "notification": {
                "title": title,
                "body": msg
            },
            "data": {
              "type": "NEW_FINE"
            },
            "apns": {
              "headers": {
                "apns-priority": "10"
              },
              "payload": {
                "aps": {
                  "alert": {
                    "title": "my title",
                    "body": "my body"
                  }
                }
              }
            },
            "priority": "high",
          },
          {
            headers: {
              "Authorization": `key=${config.fcmToken}`,
              'Content-Type': 'application/json',
            },
          },
        )

        console.log(response.data);
    
        return true
    }
}

export default new Fcm()
