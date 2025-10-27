export interface api {
  '/getDiscussionContent': GetDiscussionContent
  // cspell: disable-next-line
  '/webios/addComment': webios_addComment
}

//getDiscussionContent
export interface GetDiscussionContent {
  flag: boolean
  page: number
  list: List[]
}

export interface List {
  DiscussionContent: DiscussionContent
  OperImgID: string
  OperName: string
  Score: number
  SubDiscussionContent: SubDiscussionContent[]
  Appreciation: Appreciation[]
}

export interface Appreciation {
  DiscussionContent: null | string
  OperImgID: string
  OperName: string
  OperID: string
}

interface SubDiscussionContent {
  DiscussionContent: DiscussionContent
  OperImgID: string
  OperName: string
  OperID: null
}

interface DiscussionContent {
  DC_ID: string
  Operator_ID: string
  C_ID: string
  CCS_ID: null
  DC_Type: number
  DC_Content: string
  DC_Date: string
  DC_IP: null
}

// cspell: disable-next-line
export interface webios_addComment {
  success: boolean
  msg: string
  // cspell: disable-next-line
  dcid: string
  studentModel: StudentModel
  dc: Dc
}

interface Dc {
  DC_ID: string
  Operator_ID: string
  C_ID: string
  CCS_ID: null
  DC_Type: number
  DC_Content: string
  DC_Date: string
  DC_IP: null
}

interface StudentModel {
  Operator_ID: null
  S_Name: string
  Operator_PhotoAddress: string
  Operator_Sex: null
}
