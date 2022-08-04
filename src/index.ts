import fastify from 'fastify'
import swagger from 'fastify-swagger'
import mongoose from 'mongoose'

import HttpError from './errors/http-error'
import config from './config/config'
import fineController from './fine/fine.controller'
import paymentController from './payment/payment.controller'
import { LanguagesEnum } from './errors/languages.enum'

const app = fastify({ logger: true })

app.get('/health', async () => 'Hello World')
app.register(swagger, {
  exposeRoute: true,
  routePrefix: '/docs',
  swagger: {
    host: config.apiHost,
    info: {
      title: 'Fine service API',
      version: 'v1',
    },
  },
})
app.register(fineController, { prefix: '/fines' })
app.register(paymentController, { prefix: '/payment' })
app.setErrorHandler((err, req, res) => {
  app.log.error(err)
  const message = err.message
  if (err instanceof HttpError) {
    const language = req.headers['accept-language']
    const errorLanguage = Object.keys(LanguagesEnum).includes(language)
      ? language
      : LanguagesEnum.uk
    const errorMessage =
      typeof message === 'string' ? message : message[errorLanguage]
    res.status(err.code).send(errorMessage)
  } else {
    res.status(500).send(message)
  }
})

const start = async (): Promise<void> => {
  try {
    await config.init()
    await mongoose.connect(config.mongoUri)
    await app.listen(config.port, '0.0.0.0')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}
start()
