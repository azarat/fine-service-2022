import axios from 'axios'
import Payment from '@day-drive/gerc-payment-sdk/lib/cjs'
import * as userSdk from '@day-drive/user-sdk/lib/cjs'
import {
  IGooglePayResponse,
  IGooglePayResponse3DS,
} from '@day-drive/gerc-payment-sdk/lib/cjs/types'

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

    const {
      data: { oper_id: operId, url },
      error,
    } = await PaymentSdk.createPayment()
    if (error) await this.handleGercError({ operId }, error)

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
    await axios.post(
      config.pushNotificationsUri,
      {
        tokens: deviceToken,
        notification: {
          title: 'Статус штрафа изменен',
          body: notificationData[status.toLowerCase()],
        },
        data: {
          id: _id,
          type: notificationType[status.toLowerCase()],
        },
      },
      {
        headers: {
          token: config.pushLambdaSecret,
        },
      },
    )
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
      const { sumpenalty } = await fineService.getFinesByDocument(
        decreeSeries,
        decreeNumber,
        carsNumber,
      )
      return +sumpenalty
    } catch (error) {
      throw new HttpError(HttpError.FINE_SUM_ERROR, 400)
    }
  }
}

export default new PaymentService()