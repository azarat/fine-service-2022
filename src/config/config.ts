import { SecretsManager } from 'aws-sdk'
import * as dotenv from 'dotenv'

dotenv.config()

class Config {
  private static readonly secrets = new SecretsManager({
    region: process.env.AWS_REGION,
  })

  private static readonly getSecret = async (
    secretName: string,
  ): Promise<string> => {
    const { SecretString } = await Config.secrets
      .getSecretValue({
        SecretId: process.env.SECRET_ID,
      })
      .promise()

    const secrets = JSON.parse(SecretString)
    return secrets[secretName]
  }

  readonly port: string | number
  readonly notify: string
  readonly backref: string
  apiEnv: string
  apiHost: string
  fcmToken: string
  clientId: string
  clientSecret: string
  gercUrl: string
  gercAuthUrl: string
  userSdkUrl: string
  userSdkSecret: string
  mongoUri: string
  paymentClientId: string
  paymentClientSecret: string
  siteId: number
  privateKey: string
  publicKey: string
  applepayMerchant: string
  applepayPrivate: string
  pushNotificationsUri: string
  pushLambdaSecret: string

  constructor() {
    this.port = process.env.PORT || 8000
    this.apiEnv = process.env.API_ENV || 'v1'
    this.apiHost = process.env.API_HOST
    this.fcmToken = process.env.FCM_TOKEN
    this.notify = `${this.apiHost}${this.apiHost == "http://localhost" ? (":" + this.port) : ""}/${this.apiEnv}/FineService/payment/notify`
    this.backref = `${this.apiHost}${this.apiHost == "http://localhost" ? (":" + this.port) : ""}/${this.apiEnv}/FineService/payment/thanks`
  }

  async init(): Promise<void> {
    this.clientId = await Config.getSecret('CLIENT_ID')
    this.clientSecret = await Config.getSecret('CLIENT_SECRET')
    this.gercUrl = await Config.getSecret('GERC_FINES_URL')
    this.gercAuthUrl = await Config.getSecret('GERC_AUTH_URL')
    this.userSdkUrl = await Config.getSecret('USER_SDK_URL')
    this.userSdkSecret = await Config.getSecret('USER_SDK_SECRET')
    this.mongoUri = await Config.getSecret('MONGO_URI')
    this.paymentClientId = await Config.getSecret('PAYMENT_CLIENT_ID')
    this.paymentClientSecret = await Config.getSecret('PAYMENT_CLIENT_SECRET')
    this.siteId = +(await Config.getSecret('SITE_ID'))
    this.privateKey = await Config.getSecret('PRIVATE_KEY')
    this.publicKey = await Config.getSecret('PUBLIC_KEY')
    this.applepayMerchant = await Config.getSecret('APPLEPAY_MERCHANT')
    this.applepayPrivate = await Config.getSecret('APPLEPAY_PRIVATE')
    this.pushNotificationsUri = await Config.getSecret('PUSH_NOTIFICATIONS_URI')
    this.pushLambdaSecret = await Config.getSecret('PUSH_LAMBDA_SECRET')
  }
}

export default new Config()
