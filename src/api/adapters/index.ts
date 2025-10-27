import { itolearnClient } from "@/api/adapters"
import { cache } from "@/utils"
import { daysPassed, parseDotNetDate } from "@/utils"

export async function getFileServerToken() {
  const resp = await itolearnClient('File/GetFileServerPara')
  return resp.data?.token
}

export const getFileServerTokenWithCache = cache<string>(getFileServerToken, 1000 * 60 * 10)

export async function getCurrentSemesterInfo() {
  interface SemesterList {
    Semester: Array<
      SemesterList['curr'] & {
        EndDate: string,
        SC_Name: null,
        SC_Logo: null,
        // cspell: disable-next-line
        isChacked: number,
      }>,
    curr: {
      ID: string,
      SC_ID: string,
      Start: string,
      End: string,
      Status: string,
      Name: string,
      Code: null,
      Weeks: string
    }
  }

  const resp = await itolearnClient.post<SemesterList>('/Schedule/getSemesterList')
  const cur = resp.data.curr
  const result = {
    id: cur.ID,
    start: parseDotNetDate(cur.Start)!,
    end: parseDotNetDate(cur.End)!,
    name: cur.Name,
  }
  return {
    ...result,
    week: Math.trunc(daysPassed(result.start.getTime()) / 7) + 1
  }
}

export async function getScheduleRaw(semesterId: string, week: number) {
  const resp = await itolearnClient.post<string>('/WeiXin/partialSchedule', {
    semester: semesterId,
    weekStr: week.toString()
  })
  const html = resp.data
  return html
}

export * from './homework'
export * from './course'
export * from './user'
export { itolearnClient } from './_core/request'

