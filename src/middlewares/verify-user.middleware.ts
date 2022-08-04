import * as userSdk from '@day-drive/user-sdk/lib/cjs'

import HttpError from '../errors/http-error'
import config from '../config/config'

export const VerifyUserMiddleware = async (req): Promise<void> => {
  const { token } = req.headers
  if (!token) throw new HttpError(HttpError.FINE_SUM_ERROR, 401)
  try {
    await userSdk.verifyUser(config.userSdkUrl, config.userSdkSecret, token)
  } catch (error) {
    throw new HttpError('Invalid token', 401)
  }
}
