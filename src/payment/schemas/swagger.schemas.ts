export const InitSchema = {
  tags: ['Payment'],
  body: {
    type: 'object',
    properties: {
      carsNumber: {
        type: 'string',
        example: 'АА0481СЕ',
      },
      decreeSeries: {
        type: 'string',
        example: 'КАО',
      },
      decreeNumber: {
        type: 'string',
        example: '242523',
      },
      lang: {
        type: 'string',
        example: 'ru || ua',
      },
      paymentData: {
        type: 'object',
        properties: {
          fio: {
            type: 'string',
          },
          doc_id: {
            type: 'string',
          },
          bank_take: {
            type: 'string',
          },
          checking_acc: {
            type: 'string',
          },
          okpo: {
            type: 'string',
          },
          purpose_payment: {
            type: 'string',
          },
        },
      },
      description: {
        type: 'string',
        example: 'fine',
      },
    },
  },
  headers: {
    token: {
      type: 'string',
    },
    'accept-language': {
      type: 'string',
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        orderId: { type: 'string' },
        payLink: { type: 'string' },
      },
    },
    400: {
      description: 'Wron body params',
      type: 'null',
    },
    401: {
      description: 'Invalid token',
      type: 'null',
    },
    403: {
      description: 'Provide token',
      type: 'null',
    },
    409: {
      description: 'Payment with this doc_id already exists',
      type: 'null',
    },
  },
}

export const FeeSchema = {
  tags: ['Payment'],
  body: {
    type: 'object',
    properties: {
      carsNumber: {
        type: 'string',
        example: 'АА0481СЕ',
      },
      decreeSeries: {
        type: 'string',
        example: 'КАО',
      },
      decreeNumber: {
        type: 'string',
        example: '242523',
      },
      lang: {
        type: 'string',
        example: 'ru || ua',
      },
      paymentData: {
        type: 'object',
        properties: {
          fio: {
            type: 'string',
          },
          doc_id: {
            type: 'string',
          },
          bank_take: {
            type: 'string',
          },
          checking_acc: {
            type: 'string',
          },
          okpo: {
            type: 'string',
          },
          purpose_payment: {
            type: 'string',
          },
        },
      },
      description: {
        type: 'string',
        example: 'fine',
      },
    },
  },
  headers: {
    token: {
      type: 'string',
    },
    'accept-language': {
      type: 'string',
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        orderId: { type: 'string' },
        fee: { type: 'string' },
        total: { type: 'string' },
        operId: { type: 'number' },
      },
    },
    400: {
      description: 'Wrong body params',
      type: 'null',
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

export const GooglePaySchema = {
  tags: ['Payment'],
  body: {
    type: 'object',
    properties: {
      operId: {
        type: 'number',
      },
      googleData: {
        type: 'string',
      },
      googleError: {
        type: 'string',
      },
    },
  },
  headers: {
    token: {
      type: 'string',
    },
  },
}

export const ApplePaySchema = {
  tags: ['Payment'],
  body: {
    type: 'object',
    properties: {
      operId: {
        type: 'number',
      },
      applePayPaymentData: {
        type: 'object',
        properties: {
          paymentMethod: {
            type: 'object',
            properties: {
              type: { type: 'number' },
              network: { type: 'string' },
              displayName: { type: 'string' },
            },
          },
          paymentData: {
            type: 'object',
            properties: {
              version: { type: 'string' },
              data: { type: 'string' },
              header: {
                type: 'object',
                properties: {
                  ephemeralPublicKey: { type: 'string' },
                  publicKeyHash: { type: 'string' },
                  transactionId: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
  headers: {
    token: {
      type: 'string',
    },
  },
}
