interface IPaymentData {
  fio: string
  doc_id: string
  bank_take: string
  checking_acc: string
  okpo: string
  purpose_payment: string
}

export interface IInit {
  carsNumber: string
  decreeSeries: string
  decreeNumber: string
  lang: string
  description: string
  type: string
  paymentData: IPaymentData
}
