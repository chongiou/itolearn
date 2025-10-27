import type { Holiday } from "../types"

export const holidays: Holiday[] = [
  {
    name: "元旦",
    start: "2025-01-01",
    end: "2025-01-01",
    days: 1,
    workdays: []
  },
  {
    name: "春节",
    start: "2025-01-28",
    end: "2025-02-04",
    days: 8,
    workdays: ["2025-01-26", "2025-02-08"]
  },
  {
    name: "清明节",
    start: "2025-04-04",
    end: "2025-04-06",
    days: 3,
    workdays: []
  },
  {
    name: "劳动节",
    start: "2025-05-01",
    end: "2025-05-05",
    days: 5,
    workdays: ["2025-04-27"]
  },
  {
    name: "端午节",
    start: "2025-05-31",
    end: "2025-06-02",
    days: 3,
    workdays: []
  },
  {
    name: "国庆节、中秋节",
    start: "2025-10-01",
    end: "2025-10-08",
    days: 8,
    workdays: ["2025-09-28", "2025-10-11"]
  }
]
