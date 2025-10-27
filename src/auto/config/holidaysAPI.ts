import { parseHTML } from 'linkedom'
import type { Holiday } from '../types'

/**
 * 搜索国务院公报
 * @param query 
 * @returns `第一个搜索结果的文档地址(url)`
 */
export async function searchFile(query: string): Promise<string> {
  const q = encodeURI(query)

  const resp = await fetch(`https://sousuo.www.gov.cn/search-gov/data?t=zhengcelibrary&q=${q}&timetype=timeqb&mintime=&maxtime=&sort=score&sortType=1&searchfield=title&pcodeJiguan=&childtype=&subchildtype=&tsbq=&pubtimeyear=&puborg=&pcodeYear=&pcodeNum=&filetype=&p=1&n=5&inpro=&bmfl=&dup=&orpro=&type=gwyzcwjk`, {
    "headers": {
      "accept": "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      "sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "Referer": `https://sousuo.www.gov.cn/zcwjk/policyDocumentLibrary?q=${q}&t=zhengcelibrary&orpro=`
    },
    "body": null,
    "method": "GET"
  })

  const responseBody = await resp.json()

  // 公文第一个搜索结果
  const res = responseBody.searchVO.catMap.gongwen.listVO[0]

  // 公文地址
  return res.url
}

/**
 * 获取国务院公报内容
 * @param url 
 * @returns `html` 内容
 */
export async function getDocumentContent(url: string): Promise<string> {
  const resp = await fetch(url, {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      "cache-control": "max-age=0",
      "sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
    },
    "body": null,
    "method": "GET"
  })
  return resp.text()
}

/**
 * 从节假日通知文档里提取数据并结构化
 * @param html 
 * @returns 
 */
export function parseHolidaysFromHTML(html: string): Holiday[] {
  const padZero = (n: number | string): string => n.toString().padStart(2, '0')
  const { document } = parseHTML(html)

  // 包含节假日信息的核心内容区域
  const contentDiv = document.querySelector('#UCAP-CONTENT .trs_editor_view')

  if (!contentDiv) {
    throw new Error('找不到主要内容容器。')
  }

  const contentText = contentDiv.textContent || ''

  const yearMatch = contentText.match(/(\d{4})年/)
  if (!yearMatch) {
    throw new Error('无法从文档内容中确定年份。')
  }
  const year = yearMatch[1]

  // 找到所有描述节假日的段落 这些段落通常以大写数字为开头
  const holidayParagraphs = Array.from(contentDiv.querySelectorAll('p')).filter(p =>
    p.textContent?.trim().match(/^[一二三四五六七八九十]、/)
  )

  const holidays: Holiday[] = []

  // 处理每个节假日段落
  for (const p of holidayParagraphs) {
    const text = p.textContent?.trim() || ''
    if (!text) continue

    try {
      // 匹配顿号和冒号之间的节日名称
      const nameMatch = text.match(/[、](.+?)：/)
      const name = nameMatch ? nameMatch[1].trim() : '未知节日'

      // 匹配总放假天数
      const daysMatch = text.match(/(?:放假|共)\s*(\d+)\s*天/)
      const days = daysMatch ? parseInt(daysMatch[1], 10) : 0

      // 匹配放假日期范围
      // 这个正则表达式可以处理 "X月X日至Y月Y日" 和 "X月X日至Y日" 以及 "X月X日" 的情况
      const dateRangeMatch = text.match(/(\d{1,2})月(\d{1,2})日(?:.*?至(?:(\d{1,2})月)?(\d{1,2})日)?/)
      if (!dateRangeMatch) continue

      const startMonth = padZero(dateRangeMatch[1])
      const startDay = padZero(dateRangeMatch[2])

      // 如果没有指定结束月份, 则与开始月份相同
      const endMonth = dateRangeMatch[3] ? padZero(dateRangeMatch[3]) : startMonth
      // 如果没有指定结束日期, 则为单日假期
      const endDay = dateRangeMatch[4] ? padZero(dateRangeMatch[4]) : startDay

      const start = `${year}-${startMonth}-${startDay}`
      const end = `${year}-${endMonth}-${endDay}`

      // 提取补班日期
      const workdays: string[] = []
      if (text.includes('放假调休')) {
        const workdaysMatch = text.match(/((?:(?:\d{1,2}月\d{1,2}日)(?:（[^）]+）)?(?:、)?\s*)+)上班/)
        if (workdaysMatch) {
          // 从匹配到的字符串中再次提取所有日期
          const workdayStrings = workdaysMatch[1].match(/\d{1,2}月\d{1,2}日/g) || []
          const result = workdayStrings.map(dateStr => {
            const [month, day] = dateStr.replace('日', '').split('月')
            return `${year}-${padZero(month)}-${padZero(day)}`
          })
          workdays.push(...result)
        }
      }

      holidays.push({
        name,
        start,
        end,
        days,
        workdays,
      })

    } catch (error) {
      console.error(`解析段落失败: "${text}"`, error)
    }
  }

  return holidays
}

/**
 * 在调用前应先查询是否已有数据, 避免滥用接口
 * @param year 
 * @returns 
 */
export async function getChineseHolidays(year: number = new Date().getFullYear()) {
  const url = await searchFile(`国务院办公厅关于${year}年部分节假日安排的通知`)
  const content = await getDocumentContent(url)
  return parseHolidaysFromHTML(content)
}
