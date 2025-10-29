import { itolearnClient } from "@/api/adapters"

export async function getCheckinStatus(interactiveClassroomId: string) {
  // interface GetIccList {
  //   code: number
  //   msg: string
  //   ver: string
  //   data: {
  //     CurCheckin: null | {
  //       CheckId: string
  //       IC_ID: string
  //       StartTime: string
  //       StopTime: string
  //       Status: number
  //       Type: number
  //       Index: number
  //     }
  //     NextCheckin: null
  //     CheckinList: Array<GetIccList['data']['CurCheckin']>
  //   }
  // }

  interface ApiResponse {
    code: number
    msg: string
    ver: string
    data: Datum[]
  }

  interface Datum {
    Operator_ID: string
    Operator_Code: string
    Operator_Name: string
    Operator_PhotoAddress: string
    IsCheckin: number
    ICS_Date: string
    ICS_Status: number
    CheckId: string
    IC_ID: string
    StartTime: string
    StopTime: string
    Status: number
    Type: number
    Index: number
  }

  // 这个接口也许更稳定一些? 还需要更多测试
  // const resp = await itolearnClient.post<GetIccList>('Checkin/GetIccList', { 'IC_ID': interactiveClassroomId })
  // const info = resp.data.data?.CurCheckin
  // return {
  //   checkId: info?.CheckId ?? null,
  //   canCheckin: !!info,
  //   isCheckin: !!info?.Status
  // }

  const resp = await itolearnClient.post<ApiResponse>('/Checkin/GetCheckinDetailsByStu', {
    IC_ID: interactiveClassroomId
  })
  return {
    checkId: resp.data.data[0]?.CheckId ?? null,
    canCheckin: !!resp.data.data.length,
    isCheckin: !!resp.data.data[0]?.IsCheckin
  }
}

/**TODO: 如果课程已关闭, 后端会500 */
export async function getCheckinCode(checkId: string) {
  interface RefreshCheckInCode {
    code: number
    msg: string
    ver: string
    data: {
      IC_ID: string
      CheckId: string
      CheckInType: number
      CheckinIndex: number
      Code: string
      // cspell: disable-next-line
      ChceckinCodeRefreshTime: number
    }
  }

  const checkCode = await itolearnClient.post<RefreshCheckInCode>('/Checkin/RefreshCheckInCode', { CheckId: checkId, Refresh: false })
    .then(resp => {
      return resp.data.data.Code
    })

  return checkCode // 不能转为数字, 因为有时签到码是 0 开头的
}

export async function submitCheckin(interactiveClassroomId: string, checkinCode: string) {
  interface CheckIn {
    code: number
    msg: string
    ver: string
    data: Data
  }

  interface Data {
    IC_ID: string
    Lessons_ID: string
    CheckInType: number
    CheckId: string
    Schedule_Id: string[]
    ToIC: boolean
  }
  const resp = await itolearnClient.post<CheckIn>('/Checkin/CheckIn',
    new URLSearchParams({
      IC_ID: interactiveClassroomId,
      CheckInType: '1',
      Code: checkinCode.toString()
    })
  )
  const msg = resp.data?.msg
  return {
    success: msg === 'Success' || msg === '该轮已签到！',
    message: msg
  }
}

export async function getCourseInfoFromScheduleId(scheduleId: string) {
  interface ApiResponse {
    code: number
    msg: null
    ver: string
    data: Data | null
    total: number
  }
  interface Data {
    Schedule_ID: string
    Lessons_ID: string
    ICID: string
  }

  const resp = await itolearnClient.post<ApiResponse>('/api/service', {
    "scheduleID": scheduleId
  }, {
    params: {
      // cspell: disable-next-line
      passembly: "spockp.Services.IAppService",
      // cspell: disable-next-line
      pmethod: "getScheduleStatus",
    }
  })

  if (resp.data.data == null) {
    return {
      lessonId: null,
      interactiveClassroomId: null,
    }
  }

  return {
    lessonId: resp.data.data.Lessons_ID, // -> 不是笔误, 遵循 url 的命名方式
    interactiveClassroomId: resp.data.data.ICID
  }
}
