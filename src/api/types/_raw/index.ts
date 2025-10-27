/**
 * 注意: 这里是未经处理的原始响应, 来自 ASP 时代的后端 API 数据结构, 包含大量命名不统一不规范/错别字等混乱内容
 */

// getTestQuestionList 的响应
export interface RawGetQuizQuestionsResponse {
  list: List[]
  test: Test
  danxuan: number
  duoxuan: number
  panduan: number
  tiankong: number
  cailiao: number
  wenda: number
}

interface Test {
  CH_ID: string
  ResourcePack_ID: null
  Assign_ID: string
  TaskInfo_ID: string
  Operator_ID: string
  T_T_Operator_ID: string
  T_S_Operator_ID: string
  CH_Answer: null
  CH_DateTime: string
  CH_Status: number
  CH_Start: string
  CH_End: string
  CH_Score: number
  CH_Remark: null
  CH_Type: number
  CH_Source: string
  CH_SubmitDate: string
  CH_CheckDate: string
  CH_ModifyCount: number
}

interface List {
  TaskContent_Score: number
  TaskContent_ID: string
  TaskInfo_ID: string
  TaskContent_Content: null
  score: number
  Remark: null
  solution: null
  accuratele: null
  subLenth: number
  AnswerList: AnswerList[]
  QPerContent: QPerContent[]
  fileslist: any[]
  netUrllist: any[]
  rightLen: number
  errorLen: number
  QBKnowledges: QBKnowledge[]
  QB_ID: string
  CC_ID: string
  C_ID: string
  Points_ID: null
  Operator_ID: string
  QB_Code: string
  QB_ContentType: number
  QB_Content: string
  QB_Type: number
  QB_Difficulty: string
  QB_UseType: number
  QB_IsEnable: number
  QB_RefeshDate: string
  QB_Remark: string
  QB_Min: number
  QB_Max: number
  QB_Time: number
  QB_Key: null
  QB_File: null
}

interface QBKnowledge {
  KnowledgeID: string
  KnowledgeName: string
  CC_ID: string
  C_ID: string
  CreateTime: string
  OperationTime: string
  sort: number
  type: number
}

interface QPerContent {
  studentLen: number
  percentage: null
  list: any[]
  QB_Type: number
  ID: string
  QB_ID: string
  Type: number
  Index: number
  Content: string
  Mode: number
  Name: null
}

interface AnswerList {
  TaskContent_ID: string
  Url: null
  T_S_Operator_ID: null
  CH_ID: null
  Status: number
  Score: number
  Remark: null
  Name: null
  HomeWorkAnswer_ID: string
  Value: string
  Index: number
}

export interface RawGetSimpleQACommentListResponse {
  data: Data
  code: number
  msg: null
  ver: string
  total: number
}

interface Data {
  Name: string
  ActiveName: null
  LessonsID: string
  acts: string
  cID: string
  icaID: string
  list: List[]
}

interface List {
  partake: Partake
  OperName: string
  OperImg: string
  Count: number
  takeState: number
  meselfSelect: number
  taskScCount: number
  canSelect: number
}

interface Partake {
  AP_ID: string
  AP_Result: string
  ICA_ID: string
  IC_ID: string
  Operator_ID: string
  AP_Score: number
  AP_Status: number
  IsNegative: number
}

export interface RawGetHomeworkResponse {
  LessonsID: string
  ICID: string
  // cspell: disable-next-line
  SchdelueID: string
  Sign: string
  // cspell: disable-next-line
  ApplayType: null
  items: {
    PutDate: string
    ID: string
    name: string
    typeId: string
    // 作业类型, 例如: '测验','点将'
    typeName: string
    states: string
    stateName: string
    StuSubmitStatus: number
    remark: string
    isGroup: number
    // cspell: disable-next-line
    courseElmentId: string
    taskInfoID: null | string
    isNew: boolean
    ICA_State: string
    Section: {
      ID: string
      Lessons_ID: string
      Index: number
      Times: number
      Type: number
      Status: number
      Goal: string
      Way: string
      Content: string
      IsEdit: number
      DesignDescription: null
    }
  }[]
  // cspell: disable-next-line
  inCalssActivities: {
    SectionSubmitStatus: number
    activities: RawGetHomeworkResponse['items']
    ID: string
    Lessons_ID: string
    Index: number
    Times: number
    Type: number
    Status: number
    Goal: string
    Way: string
    Content: string
    IsEdit: number
    DesignDescription: null
  }[]
}

export interface RawGetChapterIdResponse {
  title: string
  content: string
  starDate: string
  endData: string
  submitTime: string
  CH_State: number
  ICA_State: number
  CH_Score: number
  // cspell: disable-next-line
  courseElmentID: string
  CH_ID: string
  TaskInfo_ID: string
  studentId: string
  checkedDate: string
  Teaching: string
  // cspell: disable-next-line
  ApplayType: number
  IC_State: number
  Type: number
  TaskScore: number
}
