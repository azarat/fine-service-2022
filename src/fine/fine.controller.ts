import { FastifyInstance } from 'fastify'

import fineService from './fine.service'
import {
  ByDocumentSchema,
  ScanSchema,
  ByTokenSchema,
} from './schemas/swagger.schemas'
import { VerifyUserMiddleware } from '../middlewares/verify-user.middleware'
import { ByDocumentDTO } from './dto/by-document.dto'
import { Query } from '../types'

const fineController = (server: FastifyInstance, _, done): void => {
  server.get<Query<ByDocumentDTO>>(
    '/by-document',
    {
      schema: ByDocumentSchema,
      preValidation: VerifyUserMiddleware,
    },
    async (req) => {
      const { decreeSeries, decreeNumber, carsNumber } = req.query

      return fineService.getFinesByDocument(
        decreeSeries,
        decreeNumber,
        carsNumber,
      )
    },
  )

  server.get<Query<ByDocumentDTO>>(
    '/scan',
    {
      schema: ScanSchema,
      // preValidation: VerifyUserMiddleware,
    },
    async (req) => {
      return fineService.getAllFines()
    },
  )

  server.get(
    '/by-token',
    {
      schema: ByTokenSchema,
      preValidation: VerifyUserMiddleware,
    },
    async (req) => {
      const { token } = req.headers
      return fineService.getFinesByToken(token as string)
    },
  )
  done()
}

export default fineController
