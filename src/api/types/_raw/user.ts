type DateString = `/Date(${number})/`

export interface RawSubmitLoginResponse {
  toUrl: string
  success: boolean
  userType: number
  token: string
}

export type RawGetLoginQrcodeStatusResponse = {
  success: false,
  msg: string
} | {
  success: true
  status: boolean
  toUrl: string
  toke: string
  Name: string
  imgUrl: string
}

export interface RawGetStudentInfoResponse {
  info: {
    OperID: string,
    OperName: string,
    ClassName: null,
    OperImgID: string,
    introduction: null,
    CurrDate: DateString
  },
  oper: {
    ID: string,
    // 姓名
    Name: string,
    PY: null,
    // 学号
    Code: string,
    eMail: null,
    Tele: null,
    Password: "",
    Addres: null,
    Status: true,
    // 性别
    Sex: string,
    Type: number,
    PhotoAddress: string,
    Sign: null,
    LoginDate: DateString,
    ClientID: null,
    Device: null,
    weixinID: string,
    pwdStatus: number,
    loginMode: number
  },
  student: {
    Operator_ID: string,
    Class_ID: string,
    P_ID: string,
    SC_ID: null,
    // 学号
    S_Code: string,
    S_IDNO: null,
    S_Name: string,
    S_NName: string,
    S_SelfIintroduction: null,
    S_Sex: string,
    S_Birthday: DateString,
    S_Email: null,
    S_Mobile: null,
    S_Status: number
  }
}

export interface RawGetStudentCourseCreditsResponse {
  code: number
  msg: string
  ver: string
  data: Data
}

interface Data {
  S_Name: string
  S_Img: string
  CreditTotal: number
  CourseNumber: number
  Data: Datum[]
}

interface Datum {
  C_ID: string
  C_Name: string
  C_Code: string
  C_Img: null
  CourseCreditVal: number
}
