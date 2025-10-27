import { itolearnClient } from '@/api/adapters'
import type {
  RawGetLoginQrcodeStatusResponse,
  RawGetStudentCourseCreditsResponse,
  RawGetStudentInfoResponse,
  RawSubmitLoginResponse,
} from '@/api/types/_raw/user'
import type { CourseCreditsOverview } from '@/api/types/models/user'

export async function submitLogin(username: string, password: string) {
  const resp = await itolearnClient.post<RawSubmitLoginResponse>(
    '/Account/LoginProcess',
    {
      code: username,
      pwd: password,
    },
    {
      withCredentials: false,
    },
  )

  return {
    success: resp.data.success,
    cookie: resp.headers['set-cookie'],
  }
}

export async function createLoginQrcodeKey() {
  const resp = await itolearnClient.post<{ qrCode: { Key: string } }>('/Account/CreateQrCode', null, {
    withCredentials: false,
  })
  return resp.data.qrCode.Key
}

export async function getLoginQrcodeStatus(qrcodeKey: string) {
  const resp = await itolearnClient.post<RawGetLoginQrcodeStatusResponse>(
    '/Account/QrLogin',
    {
      qrcode: qrcodeKey,
    },
    {
      withCredentials: false,
    },
  )

  return {
    scanned: resp.data.success,
    cookie: resp.headers['set-cookie'],
  }
}

export async function getStudentInfo() {
  const res = await itolearnClient.post<RawGetStudentInfoResponse>('/Student/getStudentInfo')
  return {
    success: true as const,
    name: res.data.oper.Name,
    gender: res.data.oper.Sex,
    studentId: res.data.oper.Code,
    phone: res.data.student.S_Mobile,
    avatarId: res.data.info.OperImgID,
  }
}

export async function getStudentAvatarRaw(avatarId: string) {
  const resp = await itolearnClient.get('/File/Get', {
    params: {
      id: avatarId,
    },
  })
  return resp.data as Blob
}

export async function getStudentCourseCreditsOverview(
  page: number = 1,
  pageSize: number = 10,
): Promise<CourseCreditsOverview> {
  const resp = await itolearnClient.get<RawGetStudentCourseCreditsResponse>(
    '/Weixin/GetStudentCourseCredits',
    {
      params: {
        pageNo: page,
        pageSize,
      },
    },
  )

  const success = !!resp.data.code
  const data = resp.data.data

  if (!success) {
    return {
      success,
      message: resp.data.msg || 'Unknown error',
    }
  }

  return {
    success,
    message: resp.data.msg || 'ok',
    courseCount: data.CourseNumber,
    creditTotal: data.CreditTotal,
    courses: data.Data.map((it) => {
      return {
        id: it.C_ID,
        code: it.C_Code,
        name: it.C_Name,
        credit: it.CourseCreditVal,
      }
    }),
    studentAvatarId: data.S_Img,
    studentName: data.S_Name,
  }
}
