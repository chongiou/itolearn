import { getSchedule } from "../services"

console.time()
const res = await getSchedule()
console.timeEnd()
console.dir(res, { depth: null })
