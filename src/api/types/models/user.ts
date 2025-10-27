export type CourseCreditsOverview = {
  success: false
  message: string
  courseCount?: undefined
  creditTotal?: undefined
  courses?: undefined
  studentAvatarId?: undefined
  studentName?: undefined
} | {
  success: true
  message: string
  courseCount: number
  creditTotal: number
  courses: {
    id: string
    code: string
    name: string
    credit: number
  }[]
  studentAvatarId: string
  studentName: string
}
