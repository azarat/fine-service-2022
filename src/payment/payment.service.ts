import axios from 'axios'
// import Payment from '@day-drive/gerc-payment-sdk/lib/cjs'
import * as userSdk from '@day-drive/user-sdk/lib/cjs'
// import {
//   IGooglePayResponse,
//   IGooglePayResponse3DS,
// } from '@day-drive/gerc-payment-sdk/lib/cjs/types'

import HttpError from '../errors/http-error'
import config from '../config/config'
import fineService from '../fine/fine.service'
import {
  ApplePayDTO,
  ApplePayResponse3dsDTO,
  ApplePayResponseDTO,
} from './dto/apple-pay.dto'
import { GercNotificationDTO } from './dto/gerc-notification.dto'
import { GooglePayDTO } from './dto/google-pay.dto'
import { InitResponseDTO } from './dto/init-response.dto'
import paymentRepository from './payment.repository'
import { PaymentSerivceEnum, PaymentStatusEnum } from './payment.enums'
import { FeeResponseDTO } from './dto/fee-response.dto'
import {
  decryptCiphertext,
  extractMerchantID,
  generateSharedSecret,
  generateSymmetricKey,
} from '../utils/crypto.utils'
import { IInit } from './interfaces/init.interface'
import { IApplePaymentDecryptedData } from './interfaces/apple-decrypted-data.interface'
import { ISearchParams } from './interfaces/search-params.interface'
import { IUserInfo } from './interfaces/user-info.interface'
import { IFine } from '../fine/interfaces/fine.interface'

// import axios from 'axios'
import md5 from 'md5'
import * as crypto from 'crypto'
import { sha256 } from 'js-sha256'

export interface IFinePaymentData {
  fio: string
  doc_id: string
  address?: string
  state_no?: string
  series_decree?: string
  number_decree?: string
  date_decree?: string
  bank_take: string
  checking_acc: string
  okpo: string
  purpose_payment: string
  id_user_rekv?: number
  summ_rekv?: number
}

export interface IGercCallbackDto {
  data: IGercCallbackData
  sign: string
}

export interface IGercCallbackData {
  oper_id: number
  transaction_id: string | number
  order_id: string
  status: string
  rrn: string // transaction bank id
  total: number
  receipt_no: string | number
  description?: string
  auth_code?: string | number
}

export interface IGercPaymentData {
  data?: {
    oper_id: number
    url: string
  }
  error?: string
  sign?: string
  token?: string
}

export interface IGercPaymentDataResponse {
  data?: {
    oper_id: number
    url: string
  },
  sign?: string
  error?: string
}

export interface IGercSecurityResponse {
  access_token: string
}

export interface IPaymentData {
  site_id: number
  order_id: string
  amount: number
  payment_type: number
  payment_data: string
  backref: string
  notify: string
  lang: 'ru' | 'ua'
  description: string
  user_id: string
  phone_no: string
}

export interface IGooglePayResponse {
  data: {
    receipt_no?: string
    transaction_id?: number
  }
  error?: string 
  sign: string
}

export interface IGooglePayResponse3DS {
  data: {
    status?: string
    html?: string
  }
  error?: string 
  sign: string
}

export interface IFeeReturnData {
  fee?: number
  total?: number
  oper_id?: number
  error?: string
}

export interface IFeeAxiosResoponse {
  data: {
    fee: number
    total: number
  }
}

export interface IApplePayValidationResponse {
  apple_validation_data: string
  order_key: string
  code: number
  message: string
}

export interface IApplePaymentData {
  apple_pay_payment_data: {
    network: string
    decrypted_data: {
      applicationPrimaryAccountNumber: string
      applicationExpirationDate: string
      currencyCode: string
      transactionAmount: number
      deviceManufacturerIdentifier: string
      paymentDataType: string
      paymentData: {
        onlinePaymentCryptogram: string
      }
    }
  }
}

export interface IApplePayReturnData {
  order_id: string
  receipt_no: string
  transaction_id: number
  total: number
  rrn: string
  auth_code: string
  status: string
  error?: string
}

export interface IApplePayResponse {
  data?: {
    order_id: string
    receipt_no: string
    transaction_id: number
    total: number
    rrn: number
    auth_code: string
    status: string
  }
  sign?: string
  error?: string
}

class Payment {
  private static TOKEN_URL = 'https://fc.gerc.ua:8443/security/token.php'
  private static PAY_URL = 'https://fc.gerc.ua:8443/payframe/index.php'
  private static ALGORITHM = 'sha256'
  private static SIGNATURE_FORMAT = 'base64'
  private static PAYMENT_TYPE = 225

  public static handleCallback(
    gercCallbackDto: IGercCallbackDto,
    publicKey: string,
  ): IGercCallbackData {
    if (!Payment.verifySignature(gercCallbackDto, publicKey))
      throw Error('Unverified signature')
    return gercCallbackDto.data
  }

  public static async googlePay(
    site_id: number,
    oper_id: number,
    token: string,
    privateKey: string,
    google_data: string,
    google_error: string,
  ): Promise<IGooglePayResponse | IGooglePayResponse3DS> {
    const requestData = {
      site_id,
      oper_id,
      google_data,
      google_error,
    }

    const { data } = await axios.post<
    IGooglePayResponse | IGooglePayResponse3DS
    >(
      Payment.PAY_URL,
      {
        data: requestData,
        sign: Payment.getSignature(
          JSON.stringify(requestData),
          decodeURI(privateKey),
        ),
      },
      { params: { googlepay: 'pay', token } },
    )
    return data
  }

  public static async validateApplePay(
    apple_validation_url: string,
    oper_id: number,
    privateKey: string,
  ): Promise<IApplePayValidationResponse> {
    const requestData = { apple_validation_url, oper_id }
    const { data } = await axios.post<IApplePayValidationResponse>(
      Payment.PAY_URL,
      {
        data: requestData,
        sign: Payment.getSignature(
          JSON.stringify(requestData),
          decodeURI(privateKey),
        ),
      },
      { params: { applepay: 'validate' } },
    )
    return data
  }

  public static async applePay(
    site_id: number,
    oper_id: number,
    token: string,
    privateKey: string,
    apple_pay_payment_data: IApplePaymentData,
  ): Promise<IApplePayResponse> {
    const requestData = {
      ...apple_pay_payment_data,
      oper_id,
      site_id
    }
    const { data } = await axios.post<IApplePayResponse>(
      Payment.PAY_URL,
      {
        data: requestData,
        sign: Payment.getSignature(
          JSON.stringify(requestData),
          decodeURI(privateKey),
        ),
      },
      { params: { applepay: 'pay', token } },
    )
    return data
  }

  public static async getToken(
    clientId: string,
    clientSecret: string,
    site_id: number,
  ): Promise<string> {
    const dateS: string = new Date().toLocaleString("en-US", {timeZone: 'Europe/Kiev'})
    const date: Date = new Date(dateS)
    const dateString = `${
      date.getFullYear() && date.getFullYear() % 100
    }${Payment.padNumberToString(
      date.getMonth() + 1,
    )}${Payment.padNumberToString(date.getDate())}${Payment.padNumberToString(
      date.getHours(),
    )}${Payment.padNumberToString(
      date.getMinutes(),
    )}${Payment.padNumberToString(date.getSeconds())}`
    const authHeader: string = sha256(
      md5(`${clientId}:${clientSecret}`) + dateString,
    )

    console.log(dateString, "dateString");
    console.log(Payment.padNumberToString(
      date.getHours(),
    ), "getHours");
    console.log(Payment.padNumberToString(
      date.getMinutes(),
    ), "getMinutes");

    console.log(date.getTimezoneOffset(), "getTimezoneOffset");
    
    console.log("------------------");
    console.log(Payment.TOKEN_URL, "Payment.TOKEN_URL");
    console.log(dateString, "dateString");
    console.log(authHeader, "authHeader");
    console.log(site_id, "site_id");
    

    const {
      data: { access_token },
    } = await axios.post<IGercSecurityResponse>(Payment.TOKEN_URL, null, {
      headers: {
        Request_Time: dateString,
        Authorization: authHeader,
      },
      params: {
        site_id,
      },
    })
    return access_token
  }

  private static verifySignature(
    { data, sign }: IGercCallbackDto,
    publicKey: string,
  ): boolean {
    const verify = crypto.createVerify(Payment.ALGORITHM)
    verify.update(JSON.stringify(data))
    const key = decodeURI(publicKey)
    return verify.verify(
      key,
      sign,
      Payment.SIGNATURE_FORMAT as crypto.BinaryToTextEncoding,
    )
  }

  private static getSignature(data: string, key: string): string {
    const sign = crypto.createSign(Payment.ALGORITHM)
    sign.update(data)

    const signature: string = sign.sign(
      key,
      Payment.SIGNATURE_FORMAT as crypto.BinaryToTextEncoding,
    )
    return signature
  }
  private static padNumberToString(number: number): string {
    return `${number}`.padStart(2, '0')
  }

  constructor(
    private readonly orderId: string,
    private readonly amount: number,
    private readonly backref: string,
    private readonly notify: string,
    private readonly paymentData: IFinePaymentData,
    private readonly lang: 'ru' | 'ua',
    private readonly description: string,
    private readonly userId: string,
    private readonly phoneNumber: string,
    private readonly privateKey: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly siteId: number,
  ) {}

  public async createPayment(): Promise<IGercPaymentData> {
    const key = decodeURI(this.privateKey)
    const paymentData = this.getPaymentData()
    const sign = Payment.getSignature(JSON.stringify(paymentData), key)
    const token = await Payment.getToken(
      this.clientId,
      this.clientSecret,
      this.siteId,
    )

    console.log(Payment.PAY_URL, "Payment.PAY_URL");
    console.log(paymentData, "paymentData");
    console.log(sign, "sign");
    console.log(token, "token");
    

    const { data } = await axios.post<IGercPaymentDataResponse>(
      Payment.PAY_URL,
      {
        data: paymentData,
        sign,
      },
      {
        params: {
          common: 'get_id',
          token,
        },
      },
    )
    if (data.error) {
      return data
    }
    return { ...data, token }
  }

  public async getGooglePayFee(site_id: number): Promise<IFeeReturnData> {
    const {
      data, token, error
    } = await this.createPayment()
    if (error)
      return {error} 

    const requestData = {
      site_id,
      oper_id: data!.oper_id,
    }

    const {
      data: { data: {fee, total} },
    } = await axios.post<IFeeAxiosResoponse>(
      Payment.PAY_URL,
      {
        data: requestData,
        sign: Payment.getSignature(
          JSON.stringify(requestData),
          decodeURI(this.privateKey),
        ),
      },
      { params: { googlepay: 'get_fee', token } },
    )
    return {
      fee,
      total,
      oper_id: data!.oper_id,
    }
  }

  public async getApplePayFee(site_id: number): Promise<IFeeReturnData> {
    const {
      data, token, error
    } = await this.createPayment()
    if (error)
      return {error} 

    const requestData = {
      site_id,
      oper_id: data!.oper_id,
    }

    const {
      data: { data: {fee, total} },
    } = await axios.post<IFeeAxiosResoponse>(
      Payment.PAY_URL,
      {
        data: requestData,
        sign: Payment.getSignature(
          JSON.stringify(requestData),
          decodeURI(this.privateKey),
        ),
      },
      { params: { applepay: 'get_fee', token, protocol_version: 'NATIVE' } },
    )
    return {
      ...{
        fee: +fee,
        total: +total,
      },
      oper_id: data!.oper_id,
    }
  }

  private getPaymentData(): IPaymentData {
    return {
      site_id: this.siteId,
      order_id: this.orderId,
      amount: this.amount,
      payment_type: Payment.PAYMENT_TYPE,
      payment_data: JSON.stringify(this.paymentData),
      backref: this.backref,
      notify: this.notify,
      lang: this.lang || 'ru',
      description: this.description,
      user_id: this.userId,
      phone_no: this.phoneNumber,
    }
  }
}

export { Payment }

class PaymentService {
  private static FINE_PAYED_SUCCEEDED = 'FINE_PAYED_SUCCEEDED'
  private static FINE_PAYED_ERROR = 'FINE_PAYED_ERROR'

  public async cardPay(
    token: string,
    {
      carsNumber,
      decreeNumber,
      decreeSeries,
      lang,
      description,
      paymentData,
    }: IInit,
  ): Promise<InitResponseDTO> {
    const { userId, phone } = await this.getUserInfo(token)

    const sumpenalty = await this.getFineSum(
      carsNumber,
      decreeNumber,
      decreeSeries,
    )

    const { doc_id } = paymentData
    const { _id } = await paymentRepository.createPayment(
      userId,
      doc_id,
      PaymentSerivceEnum.CARD,
    )
    const PaymentSdk = new Payment(
      _id,
      sumpenalty * 100,
      config.backref,
      config.notify,
      paymentData,
      lang as 'ru' | 'ua',
      description,
      userId,
      phone,
      config.privateKey,
      config.paymentClientId,
      config.paymentClientSecret,
      config.siteId,
    )

    console.log("testme 1");
    

    const res = await PaymentSdk.createPayment()

    console.log(res, "createPayment");
    

    const {
      data: { oper_id: operId, url },
      error,
    } = res

    // const {
    //   data: { oper_id: operId, url },
    //   error,
    // } = await PaymentSdk.createPayment()

    console.log("testme 2");

    // if (error) await this.handleGercError({ operId }, error)

    await paymentRepository.updatePayment(_id, operId, url)
    return {
      orderId: _id,
      payLink: url,
    }
  }

  public async initAndGetFee(
    token: string,
    {
      carsNumber,
      decreeNumber,
      decreeSeries,
      lang,
      description,
      paymentData,
    }: IInit,
    type: PaymentSerivceEnum,
  ): Promise<FeeResponseDTO> {
    const { userId, phone } = await this.getUserInfo(token)

    const sumpenalty = await this.getFineSum(
      carsNumber,
      decreeNumber,
      decreeSeries,
    )
    const { doc_id } = paymentData
    const { _id } = await paymentRepository.createPayment(userId, doc_id, type)
    const PaymentSdk = new Payment(
      _id,
      sumpenalty * 100,
      config.backref,
      config.notify,
      paymentData,
      lang as 'ru' | 'ua',
      description,
      userId,
      phone,
      config.privateKey,
      config.paymentClientId,
      config.paymentClientSecret,
      config.siteId,
    )

    const { fee, total, oper_id, error } =
      type === PaymentSerivceEnum.GOOGLE_PAY
        ? await PaymentSdk.getGooglePayFee(config.siteId)
        : await PaymentSdk.getApplePayFee(config.siteId)

    if (error) await this.handleGercError({ orderId: _id.toString() }, error)

    await paymentRepository.updatePayment(_id, oper_id)
    return {
      orderId: _id,
      fee,
      total,
      operId: oper_id,
    }
  }

  public async googlePay({
    operId,
    googleData,
    googleError,
  }: GooglePayDTO): Promise<IGooglePayResponse | IGooglePayResponse3DS> {
    const token = await Payment.getToken(
      config.paymentClientId,
      config.paymentClientSecret,
      config.siteId,
    )

    const data = await Payment.googlePay(
      config.siteId,
      operId,
      token,
      config.privateKey,
      googleData,
      googleError || '',
    )
    const { error } = data
    if (error) await this.handleGercError({ operId }, error)
    return data
  }

  public async аpplePay({
    operId,
    applePayPaymentData,
  }: ApplePayDTO): Promise<ApplePayResponseDTO | ApplePayResponse3dsDTO> {
    const token = await Payment.getToken(
      config.paymentClientId,
      config.paymentClientSecret,
      config.siteId,
    )

    const { paymentMethod, paymentData } = applePayPaymentData
    const { network } = paymentMethod
    const {
      header: { ephemeralPublicKey },
    } = paymentData
    const merchantId = extractMerchantID(decodeURI(config.applepayMerchant))
    const sharedSecret = generateSharedSecret(
      config.applepayPrivate,
      ephemeralPublicKey,
    )
    const simetricKey = generateSymmetricKey(
      merchantId.toString(),
      sharedSecret,
    )

    const idk = JSON.parse(
      decryptCiphertext(
        simetricKey,
        applePayPaymentData.paymentData.data,
      ).match(/^[\x00-\x7F]+}[\x00-\x7F]*?(})/g)[0],
    ) as IApplePaymentDecryptedData

    const requestData = {
      apple_pay_payment_data: {
        network,
        decrypted_data: {
          ...idk,
          paymentData: {
            onlinePaymentCryptogram: idk.paymentData.onlinePaymentCryptogram,
          },
        },
      },
    }

    const { error, data } = await Payment.applePay(
      config.siteId,
      operId,
      token,
      config.privateKey,
      requestData,
    )

    if (error) await this.handleGercError({ operId }, error)
    return data
  }

  public async gercNotify(body: GercNotificationDTO): Promise<void> {
    Payment.handleCallback(body, config.publicKey)
    const { oper_id, status, description } = body.data

    await paymentRepository.changePaymentStatusEnum(
      oper_id,
      status.toUpperCase() as PaymentStatusEnum,
    )
    const { user, _id, docId } = await paymentRepository.getPaymentByOperId(
      +oper_id,
    )
    const { deviceToken } = await userSdk.getUserById(
      config.userSdkUrl,
      config.userSdkSecret,
      user,
    )
    const notificationData = {
      success: `Вы успешно оплатили штраф ${docId}`,
      error: `Штрафы: ${description}`,
    }
    const notificationType = {
      success: PaymentService.FINE_PAYED_SUCCEEDED,
      error: PaymentService.FINE_PAYED_ERROR,
    }
    
    console.log("title: 'Статус штрафа изменен'");
    console.log("body: " + notificationData[status.toLowerCase()] + " . " + status.toLowerCase());
    
    // await axios.post(
    //   config.pushNotificationsUri,
    //   {
    //     tokens: deviceToken,
    //     notification: {
    //       title: 'Статус штрафа изменен',
    //       body: notificationData[status.toLowerCase()],
    //     },
    //     data: {
    //       id: _id,
    //       type: notificationType[status.toLowerCase()],
    //     },
    //   },
    //   {
    //     headers: {
    //       token: config.pushLambdaSecret,
    //     },
    //   },
    // )
  }

  public async gercRedirect(orderId: string): Promise<void> {
    const { status, operId } = await paymentRepository.getPaymentById(orderId)
    const { SUCCESS, ERROR, PENDING } = PaymentStatusEnum
    if (![SUCCESS, ERROR].includes(status as PaymentStatusEnum))
      await paymentRepository.changePaymentStatusEnum(operId, PENDING)
  }

  private async getUserInfo(token: string): Promise<IUserInfo> {
    const { id: userId, phone } = await userSdk.verifyUser(
      config.userSdkUrl,
      config.userSdkSecret,
      token,
    )
    return {
      userId,
      phone,
    }
  }

  private async handleGercError(
    searchParams: ISearchParams,
    error: string,
  ): Promise<void> {
    await paymentRepository.setErrorPayment(searchParams, error)
    throw new HttpError(error, 400)
  }

  private async getFineSum(
    carsNumber: string,
    decreeNumber: string,
    decreeSeries: string,
  ): Promise<number> {
    try {
      const fineData = await fineService.getFinesByDocument(
        decreeSeries,
        decreeNumber,
        carsNumber,
      )

      const { sumpenalty } = fineData

      return +sumpenalty
    } catch (error) {
      throw new HttpError(HttpError.FINE_SUM_ERROR, 400)
    }
  }
}

export default new PaymentService()