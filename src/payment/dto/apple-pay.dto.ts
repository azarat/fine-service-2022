export class ApplePayDTO {
  operId: number
  applePayPaymentData: {
    paymentMethod: {
      type: string
      network: string
      displayName: string
    }
    paymentData: {
      version: string
      data: string
      header: {
        ephemeralPublicKey: string
        publicKeyHash: string
        transactionId: string
      }
    }
  }
}
export class ApplePayResponseDTO {
  order_id: string
  receipt_no: string
  transaction_id: number
  total: number
  rrn: number
  auth_code: string
  status: string
}

export class ApplePayResponse3dsDTO {
  link: string
  status: string
}
