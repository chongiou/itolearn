import { getSchedule } from "@/api/services"

console.time('总用时')
const weeklySchedule = await getSchedule()
console.timeEnd('总用时')

console.dir(weeklySchedule, { depth: null })
