import { createSignal } from "solid-js"
import { Store } from '@tauri-apps/plugin-store'
import { ansiToHtml } from "@/utils"
import { ItolearnAutomate } from "@/auto/index"

let automateInstance: ItolearnAutomate | null = null

export const [lastTabIdx, setLastTabIdx] = createSignal<number>(0)

export const [automateEnabled, setAutomateEnabled] = createSignal(false)

export const [logs, setLogs] = createSignal<string[]>([])

export function outputAutomateModuleLog(message: string) {
  setLogs(prev => [...prev, message])
}

export async function initAutomateModule() {
  if (automateInstance) {
    console.log('自动化模块已初始化，跳过重复初始化')
    return automateInstance
  }

  try {
    automateInstance = new ItolearnAutomate()

    automateInstance.setEventListenerForLogOutput(messages => {
      setLogs((prev) => {
        const logForHtmlString = messages.map(ansiToHtml).join(' ')
        const newLogs = [...prev, logForHtmlString]
        if (newLogs.length > 999) {
          newLogs.shift()
        }
        return newLogs
      })
    })

    outputAutomateModuleLog('✓ 自动化模块初始化完成')
    return automateInstance
  } catch (error) {
    outputAutomateModuleLog(`✗ 自动化模块初始化失败: ${error}`)
    throw error
  }
}

export async function startAutomate() {
  if (!automateInstance) {
    await initAutomateModule()
  }

  if (automateInstance) {
    automateInstance.start()
    outputAutomateModuleLog('▶ 自动化已启动')
  }
}

export async function stopAutomate() {
  if (automateInstance && typeof automateInstance.stop === 'function') {
    await automateInstance.stop()
    outputAutomateModuleLog('■ 自动化已停止')
  }
}

export async function toggleAutomate(enabled: boolean) {
  if (automateEnabled() === enabled) {
    return
  }
  setAutomateEnabled(enabled)

  try {
    const store = await Store.load('settings.json')
    await store.set('automate_enabled', enabled)
    await store.save()
  } catch (error) {
    console.error('保存设置失败:', error)
  }

  if (enabled) {
    await startAutomate()
  } else {
    await stopAutomate()
  }
}

export async function loadAutomateEnabled() {
  try {
    const store = await Store.load('settings.json')
    const enabled = await store.get<boolean>('automate_enabled')
    setAutomateEnabled(enabled ?? false)
    return enabled ?? false
  } catch (error) {
    console.error('加载设置失败:', error)
    return false
  }
}
