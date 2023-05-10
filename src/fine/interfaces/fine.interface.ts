export interface IFine {
  docid: string | null
  department: string | null
  fab: string | null
  kupap: string | null
  region: string | null
  district: string | null
  city: string | null
  street: string | null
  roadkm: string | null
  send: string | null
  consider: string | null
  decision: string | null
  ddecision: string | null
  penalty: string | null
  sumpenalty: string | null
  paidpenalty: string | null
  licenseplate: string | null
  brand: string | null
  pdd: string | null
  status: string | null
  mark: string | null
  drecord: string | null
  dsignpost: string | null
  dperpetration: string | null
  dsend: string | null
  dpaid: string | null
  dcanceled: string | null
  nprotocol: string | null
  sprotocol: string | null
  sdriverlic: string | null
  ndriverlic: string | null
  nregcert: string | null
  sregcert: string | null
  paidinfo: string | null
  typefine: string | null
  datedelivery: string | null
  sumfine: string | null
}

export interface IFinesResponse {
  data_result: IFine[]
}
