import './styles/clear.css'
import './styles/global.css'

import Layout from './layout/Layout'
import Toast from './components/Toast'
import { onMount } from 'solid-js'
import { setupGlobalNavigate } from '@/store/navigation'
import { useNavigate, RouteSectionProps } from '@solidjs/router'

import { authService } from '@/api/services/AuthService'
import { loginStateManager } from '@/api/services/LoginStateManager'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { loadAutomateEnabled, startAutomate } from './store/automate'
import { modal } from './components/Modal'
import { setBackgroundTask } from './layout/Titlebar'
import { message as messageBox } from '@tauri-apps/plugin-dialog'
const appWindow = getCurrentWindow()

if (import.meta.env.PROD) {
  // 禁用右键菜单
  document.addEventListener('contextmenu', async (event) => {
    event.preventDefault()
  })

  // 禁用 f12 和 Ctrl+Shift+I | 禁用开发者工具快捷键
  window.addEventListener('keydown', async (event) => {
    if (event.key === 'F12' || (event.ctrlKey && event.shiftKey && event.key.toUpperCase() === 'I')) {
      event.preventDefault()
    }
  })
}

async function handleError(title = '意外错误，请联系开发者解决此问题。', error: Error) {
  console.error('未捕获错误:', error)
  const message = error.message + '\n\n' + error.stack

  // modal.alert('Error', message)
  await messageBox(message, { title, kind: 'error' })
  await appWindow.show()
}

window.addEventListener('error', async (event) => {
  // 捕获同步/异步错误
  await handleError(undefined, event.error)
})

window.addEventListener('unhandledrejection', async (event) => {
  // 捕获 Promise 未处理的错误
  console.error('未处理的 Promise 错误:', event.reason)
  const reason = event.reason
  const message = reason instanceof Error ? reason.message + '\n\n' + reason.stack : String(reason)

  await handleError(undefined, new Error(message))
})

export default function App(props: RouteSectionProps) {
  const nav = useNavigate()
  setupGlobalNavigate(nav)

  loginStateManager.onLoginRequired(async () => {
    await loginStateManager.handleLogin()
  })

  onMount(async () => {
    await appWindow.show()

    const enabled = await loadAutomateEnabled()

    if (enabled) {
      await startAutomate()
    }
  })

  onMount(async () => {
    setBackgroundTask(async () => {
      if (await authService.hasValidCookie()) {
        if (import.meta.env.DEV) {
          console.log('已忽略登录状态校验通过自动路由, 不然热重载又跳到其他页面了 (仅开发模式) ')
        } else {
          nav('/home')
        }
      } else {
        await loginStateManager.handleLogin()
      }
    }, '检查登录状态')
  })

  return (
    <>
      <Toast />
      <Layout outlet={props.children} />
    </>
  )
}
