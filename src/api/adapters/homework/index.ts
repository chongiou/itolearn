import { itolearnClient } from "@/api/adapters"
import { HomeworkType, Homework } from "@/api/types/models"
import { RawGetHomeworkResponse } from "@/api/types/_raw"

function mapHomeworkTypeToChinese(type: HomeworkType) {
  switch (type) {
    case HomeworkType.PreClassWork:
      return "课前"
    case HomeworkType.InClassWork:
      return "课中"
    case HomeworkType.AfterClassWork:
      return "课后"
  }
}

export async function getHomework(
  type: HomeworkType,
  interactiveClassroomId: string,
  scheduleId: string,
  lessonId: string
): Promise<Homework[]> {
  const resp = await itolearnClient.post<RawGetHomeworkResponse>(
    "Weixin/partialItemClassJson",
    {
      // cspell: disable-next-line
      applayType: type,
      ic_id: interactiveClassroomId,
      schduleid: scheduleId,
      lessionid: lessonId,
    }
  )
  const homework = resp.data.items.map(it => (
    {
      homeworkId: it.ID,
      of: mapHomeworkTypeToChinese(type),
      type: it.typeName as Homework["type"],
      section: it.Section?.Goal as Homework["section"],
      description: it.name,
      submitted: !!it.StuSubmitStatus,
      // cspell: disable-next-line
      courseElementId: it.courseElmentId,
    } satisfies Homework
  ))
  return homework
}

export * from './inquiry'
export * from './quiz'
export * from './simpleQA'
export * from './studyMaterial'


