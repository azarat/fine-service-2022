export interface IGercNotificationData {
  oper_id: number
  transaction_id: string | number
  order_id: string
  status: string
  rrn: string
  total: number
  receipt_no: string | number
  description?: string
  auth_code?: string | number
}
