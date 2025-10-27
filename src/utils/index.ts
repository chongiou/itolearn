export async function sleepWithAbort(ms: number, signal: AbortSignal) {
  return new Promise<void>(resolve => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

// ANSI TO CSS 颜色映射表
const ansiToCss: Record<string, string> = {
  '30': 'color: black;',
  '31': 'color: red;',
  '32': 'color: green;',
  '33': 'color: yellow;',
  '34': 'color: blue;',
  '35': 'color: magenta;',
  '36': 'color: cyan;',
  '37': 'color: white;',
  '90': 'color: gray;',
  '97': 'color: white;',
  '40': 'background: black;',
  '41': 'background: red;',
  '42': 'background: green;',
  '43': 'background: yellow;',
  '44': 'background: blue;',
  '45': 'background: magenta;',
  '46': 'background: cyan;',
  '47': 'background: white;',
  '100': 'background: #555;',
  '101': 'background: #f55;',
  '102': 'background: #5f5;',
  '103': 'background: #ff5;',
  '104': 'background: #55f;',
  '105': 'background: #f5f;',
  '106': 'background: #5ff;',
}

// 把 ANSI 转成 HTML
export function ansiToHtml(text: string): string {
  let html = ''
  const regex = /\x1b\[(\d+)m/g
  let lastIndex = 0
  let match
  let openSpan = false
  let currentStyle = ''

  while ((match = regex.exec(text))) {
    const [_full, code] = match
    const css = ansiToCss[code]
    // 拼接前面的普通文本
    html += escapeHtml(text.slice(lastIndex, match.index))
    lastIndex = regex.lastIndex

    if (code === '0') {
      // 重置
      if (openSpan) html += '</span>'
      openSpan = false
      currentStyle = ''
    } else if (css) {
      // 开启新颜色
      if (openSpan) html += '</span>'
      html += `<span style="${css}">`
      openSpan = true
      currentStyle = css
    }
  }

  // 剩余部分
  html += escapeHtml(text.slice(lastIndex))
  if (openSpan) html += '</span>'

  return html
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function parseDotNetDate(rawDateString: string): Date | null {
  const match = rawDateString.match(/\/Date\((-?\d+)\)\//)

  if (match && match[1]) {
    const timestamp = parseInt(match[1], 10)
    if (timestamp === -2209017600000) {
      // 该时间戳是 1900-01-01 的时间, 在 Microsoft .NET 中被作为日期的起始基准点之一, 通常用来表示默认日期或者未定义日期
    }
    return new Date(timestamp)
  }
  return null
}

/**计算某个时间对于现在过去了几天 */
export function daysPassed(timestamp: number) {
  const now = Date.now()
  const diff = now - timestamp
  if (diff <= 0) return 0
  return Math.floor(diff / (1000 * 60 * 60 * 24)) // 转换为天数并向下取整
}

export function cache<T>(fn: (...args: any[]) => T | Promise<T>, ttl: number) {
  const cacheMap = new Map<string, { value: T, expiry: number }>()

  return async (...args: any[]): Promise<T> => {
    const key = JSON.stringify(args)

    const cachedItem = cacheMap.get(key)
    if (cachedItem) {
      const now = Date.now()
      if (now < cachedItem.expiry) {
        return cachedItem.value
      } else {
        cacheMap.delete(key)
      }
    }

    const result = await fn(...args)

    cacheMap.set(key, {
      value: result,
      expiry: Date.now() + ttl
    })

    return result
  }
}

export function startLoader<T>(text = '加载中...', cb: (stop: Function) => T) {
  const glyphs = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  let idx = 0

  const timer = setInterval(() => {
    process.stdout.write(`\r${glyphs[idx = ++idx % glyphs.length]} ${text}`)
  }, 80)

  const stop = (endText: string) => {
    clearInterval(timer)
    process.stdout.write('\r\x1b[K')
    process.stdout.write(`\r✓ ${endText}\n`)
  }

  return cb(stop)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + '...'
}
