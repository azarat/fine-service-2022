import { ISearchParams } from './interfaces/search-params.interface'
import { PaymentSerivceEnum, PaymentStatusEnum } from './payment.enums'
import { PaymentDocument, Payment } from './schemas/payment.schema'

class paymentRepository {
  public async createPayment(
    user: string,
    docId: string,
    paymentService: PaymentSerivceEnum,
  ): Promise<PaymentDocument> {
    return Payment.create({
      user,
      docId,
      paymentService,
      status: PaymentStatusEnum.INIT,
    })
  }

  public async updatePayment(
    recordId: string,
    operId: number,
    payLink?: string,
  ): Promise<PaymentDocument> {
    await Payment.findByIdAndUpdate(recordId, { operId, payLink })
    return this.getPaymentById(recordId)
  }

  public async setErrorPayment(
    { orderId, operId }: ISearchParams,
    errorMessage: string,
  ): Promise<PaymentDocument> {
    const { _id } = await Payment.findOneAndUpdate(
      { $or: [{ orderId }, { operId }] },
      { errorMessage, status: PaymentStatusEnum.ERROR },
    )
    return this.getPaymentById(_id)
  }

  public async getPaymentById(id: string): Promise<PaymentDocument> {
    return Payment.findById(id)
  }

  public async getPaymentByOperId(operId: number): Promise<PaymentDocument> {
    return Payment.findOne({ operId })
  }

  public async getPaymentByDocId(docId: string): Promise<PaymentDocument> {
    return Payment.findOne({ docId })
  }

  public async changePaymentStatusEnum(
    oper_id: number,
    status: PaymentStatusEnum,
  ): Promise<PaymentDocument> {
    await Payment.findOneAndUpdate(
      { operId: oper_id },
      {
        status,
      },
    )
    return Payment.findOne({
      operId: oper_id,
    })
  }
}

export default new paymentRepository()
