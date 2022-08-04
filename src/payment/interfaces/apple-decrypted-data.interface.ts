export interface IApplePaymentDecryptedData {
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
