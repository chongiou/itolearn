// ANSI 颜色代码
export enum Color {
  Reset = '\x1b[0m',
  Red = '\x1b[31m',
  Green = '\x1b[32m',
  Yellow = '\x1b[33m',
  Blue = '\x1b[34m',
  Magenta = '\x1b[35m',
  Cyan = '\x1b[36m',
  White = '\x1b[37m',
  Gray = '\x1b[90m',
  BrightRed = '\x1b[91m',
  BrightGreen = '\x1b[92m',
  BrightYellow = '\x1b[93m',
  BrightBlue = '\x1b[94m',
  BrightMagenta = '\x1b[95m',
  BrightCyan = '\x1b[96m',
}

export enum BgColor {
  BgRed = '\x1b[41m',
  BgGreen = '\x1b[42m',
  BgYellow = '\x1b[43m',
  BgBlue = '\x1b[44m',
  BgMagenta = '\x1b[45m',
  BgCyan = '\x1b[46m',
  BgWhite = '\x1b[47m',
  BgBrightRed = '\x1b[101m',
  BgBrightGreen = '\x1b[102m',
  BgBrightYellow = '\x1b[103m',
  BgBrightBlue = '\x1b[104m',
  BgBrightMagenta = '\x1b[105m',
  BgBrightCyan = '\x1b[106m',
}

export enum LogLevel {
  INFO = 'I',
  LOG = 'L',
  SUCCESS = 'S',
  WARNING = 'W',
  ERROR = 'E',
  DEBUG = 'D',
}

export interface LoggerConfig {
  timeFormat?: 'time' | 'datetime' | 'iso'
  enableColors?: boolean
  enableTimePrefix?: boolean
  enableLevelPrefix?: boolean
  moduleName?: string
  moduleNameColor?: Color
  moduleNameBgColor?: BgColor
  enableModuleNameBgColor?: boolean
  logOutputEventListeners?: null | ((message: string[]) => void)
}

export class Logger {
  private config: Required<LoggerConfig>
  private ModuleCount: number = 0

  constructor(config: LoggerConfig = {}) {
    this.config = {
      enableTimePrefix: config.enableTimePrefix ?? true,
      timeFormat: config.timeFormat ?? 'datetime',
      enableColors: config.enableColors ?? true,
      enableLevelPrefix: config.enableLevelPrefix ?? true,
      moduleName: config.moduleName ?? '',
      moduleNameColor: config.moduleNameColor ?? Color.White,
      moduleNameBgColor: config.moduleNameBgColor ?? BgColor.BgMagenta,
      enableModuleNameBgColor: config.enableModuleNameBgColor ?? false,
      logOutputEventListeners: config.logOutputEventListeners ?? null,
    }
  }

  private getModuleBgColor(): BgColor {
    const bgColors = [
      BgColor.BgBrightBlue,
      BgColor.BgBrightCyan,
      BgColor.BgBrightMagenta,
      BgColor.BgMagenta,
      BgColor.BgCyan,
      BgColor.BgBlue,
    ]
    return bgColors[this.ModuleCount += 1]
  }

  private emitLogOutputEventListeners(message: string[]) {
    if (this.config.logOutputEventListeners) {
      this.config.logOutputEventListeners(message)
    }
  }

  private getTime(): string {
    const now = new Date()

    switch (this.config.timeFormat) {
      case 'time':
        return now.toLocaleTimeString('zh-CN', { hour12: false })
      case 'datetime':
        return now.toLocaleString('zh-CN', { hour12: false })
      case 'iso':
        return now.toISOString()
      default:
        return now.toLocaleString('zh-CN', { hour12: false })
    }
  }

  private colorize(text: string, ...colors: (Color | BgColor)[]): string {
    if (!this.config.enableColors) {
      return text
    }
    return colors.join('') + text + Color.Reset
  }

  private formatMessage(level: LogLevel, color: Color, msgs: any[], options: {
    enableTimePrefix?: boolean
    enableLevelPrefix?: boolean
  } = {}): string[] {
    const {
      enableTimePrefix = this.config.enableTimePrefix,
      enableLevelPrefix = this.config.enableLevelPrefix
    } = options
    const parts: string[] = []

    if (enableTimePrefix) {
      const timestamp = this.colorize(
        `[${this.getTime()}]`,
        Color.Gray
      )
      parts.push(timestamp)
    }

    if (enableLevelPrefix) {
      const prefix = this.colorize(`[${level}]`, color)
      parts.push(prefix)
    }

    if (this.config.moduleName) {
      let moduleName: string
      if (this.config.enableModuleNameBgColor && this.config.enableColors) {
        moduleName = this.colorize(`(${this.config.moduleName})`, this.config.moduleNameBgColor, Color.White)
      }
      else {
        moduleName = this.colorize(`(${this.config.moduleName})`, this.config.moduleNameColor)
      }
      parts.push(moduleName)
    }


    const message = msgs
      .map(arg => {
        if (typeof arg === 'object') {
          return JSON.stringify(arg, null, 2)
        }
        return String(arg)
      })
      .join(' ')

    parts.push(this.config.enableColors ? this.colorize(message, color) : message)

    return parts
  }

  createChild(name: string, config: LoggerConfig = {}): Logger {
    const { moduleNameBgColor = this.getModuleBgColor() } = config

    return new Logger({
      ...this.config,
      moduleName: name,
      moduleNameBgColor,
      ...config,
    })
  }

  onLoggerOutput(eventListener: (message: string[]) => void) {
    this.config.logOutputEventListeners = eventListener
  }

  info(...args: any[]): void {
    const messages = this.formatMessage(LogLevel.INFO, Color.Blue, args)
    this.output(messages)
  }

  success(...args: any[]): void {
    const messages = this.formatMessage(LogLevel.SUCCESS, Color.Green, args)
    this.output(messages)
  }

  warning(...args: any[]): void {
    const messages = this.formatMessage(LogLevel.WARNING, Color.Yellow, args)
    this.output(messages)
  }

  error(...args: any[]): void {
    const messages = this.formatMessage(LogLevel.ERROR, Color.Red, args)
    this.output(messages)
  }

  debug(...args: any[]): void {
    const messages = this.formatMessage(LogLevel.DEBUG, Color.Cyan, args)
    this.output(messages)
  }

  log(...args: any[]): void {
    const messages = this.formatMessage(LogLevel.LOG, Color.White, args)
    this.output(messages)
  }

  private output(parts: string[]): void {
    this.emitLogOutputEventListeners(parts)
    console.log(parts.join(' '))
  }
}

export const logger = new Logger()
