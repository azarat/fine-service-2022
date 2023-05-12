import { FastifyInstance } from 'fastify'

import { VerifyUserMiddleware } from '../middlewares/verify-user.middleware'
import {
  InitSchema,
  ApplePaySchema,
  GooglePaySchema,
  FeeSchema,
} from './schemas/swagger.schemas'
import PaymentService from './payment.service'
import { GooglePayDTO } from './dto/google-pay.dto'
import { ApplePayDTO } from './dto/apple-pay.dto'
import { GercNotificationDTO } from './dto/gerc-notification.dto'
import { GercThanksDTO } from './dto/gerc-thanks.dto'
import { PaymentSerivceEnum } from './payment.enums'
import { IInit } from './interfaces/init.interface'
import { Body, Query } from '../types'

const paymentController = (server: FastifyInstance, _, done): void => {
  server.post<Body<IInit>>(
    '/card',
    {
      schema: InitSchema,
      preValidation: VerifyUserMiddleware,
    },
    (req) => {
      const { token } = req.headers
      return PaymentService.cardPay(token as string, req.body)
    },
  )

  server.post<Body<IInit>>(
    '/google-fee',
    {
      schema: FeeSchema,
      preValidation: VerifyUserMiddleware,
    },
    (req) => {
      const { token } = req.headers
      return PaymentService.initAndGetFee(
        token as string,
        req.body,
        PaymentSerivceEnum.GOOGLE_PAY,
      )
    },
  )

  server.post<Body<GooglePayDTO>>(
    '/google-pay',
    {
      schema: GooglePaySchema,
      preValidation: VerifyUserMiddleware,
    },
    (req) => {
      return PaymentService.googlePay(req.body)
    },
  )

  server.post<Body<IInit>>(
    '/apple-fee',
    {
      schema: FeeSchema,
      preValidation: VerifyUserMiddleware,
    },
    (req) => {
      const { token } = req.headers
      return PaymentService.initAndGetFee(
        token as string,
        req.body,
        PaymentSerivceEnum.APPLE_PAY,
      )
    },
  )

  server.post<Body<ApplePayDTO>>(
    '/apple-pay',
    {
      schema: ApplePaySchema,
      preValidation: VerifyUserMiddleware,
    },
    (req) => {
      return PaymentService.аpplePay(req.body)
    },
  )

  server.post<Body<GercNotificationDTO>>(
    '/notify',
    { schema: { hide: true } },
    async (req) => {
      console.log("-----------------------------------------------------------------");
      console.log("-----------------------------------------------------------------");
      console.log("-----------------------------------------------------------------");
      console.log("-----------------------------------------------------------------");
      console.log(req.headers);
      console.log("-----------------------------------------------------------------");
      console.log("-----------------------------------------------------------------");
      console.log("-----------------------------------------------------------------");
      console.log("-----------------------------------------------------------------");
      
      return PaymentService.gercNotify(req.body)
    },
  )

  server.get<Query<GercThanksDTO>>(
    '/thanks',
    { schema: { hide: true } },
    async (req) => {
      return PaymentService.gercRedirect(req.query.orderId)
    },
  )

  done()
}

export default paymentController
