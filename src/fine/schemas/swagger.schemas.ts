import { fineResponseDTO } from '../dto/fine-response.dto'

export const ByDocumentSchema = {
  tags: ['Fine'],
  querystring: {
    type: 'object',
    required: ['decreeSeries', 'decreeNumber', 'carsNumber'],
    properties: {
      decreeSeries: { type: 'string' },
      decreeNumber: { type: 'string' },
      carsNumber: { type: 'string' },
    },
  },
  headers: {
    token: {
      type: 'string',
    },
    'accept-language': { type: 'string' },
  },
  response: {
    401: {
      description: 'Invalid token',
      type: 'null',
    },
    403: {
      description: 'Provide token',
      type: 'null',
    },
  },
}

export const ScanSchema = {
  tags: ['Fine'],
  querystring: {
    type: 'object',
    required: [],
    // properties: {
    // },
  },
  headers: {
    token: {
      type: 'string',
    },
    'accept-language': { type: 'string' },
  },
  response: {
    401: {
      description: 'Invalid token',
      type: 'null',
    },
    403: {
      description: 'Provide token',
      type: 'null',
    },
  },
}

export const ByTokenSchema = {
  tags: ['Fine'],
  headers: {
    token: {
      type: 'string',
    },
  },
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: fineResponseDTO,
      },
    },
    401: {
      description: 'Invalid token',
      type: 'null',
    },
    403: {
      description: 'Provide token',
      type: 'null',
    },
  },
}
