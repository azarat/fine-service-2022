import { Document, Schema, model } from 'mongoose'

export interface PaymentDocument extends Document {
  id: number
  operId: number
  docId: string
  status: string
  paymentService: string
  user: string
  payLink: string
}

export const PaymentSchema = new Schema(
  {
    operId: {
      type: Number,
      required: false,
    },
    docId: {
      type: String,
      required: true,
    },
    user: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    paymentService: {
      type: String,
      required: true,
    },
    notifyAt: {
      type: Date,
      required: false,
    },
    errorMessage: {
      type: String,
      required: false,
    },
    payLink: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
)

export const Payment = model<PaymentDocument>('Payment', PaymentSchema)
