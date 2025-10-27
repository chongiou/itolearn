import style from './Titlebar.module.css'
import { createSignal, onMount, onCleanup, Show } from 'solid-js'
import { useLocation, useNavigate } from '@solidjs/router'

import appIcon from '@/assets/favicon.ico'
import MinimizeIcon from '@fluentui/svg-icons/icons/subtract_16_regular.svg'
import MaximizeIcon from '@fluentui/svg-icons/icons/maximize_16_regular.svg'
import RestoreIcon from '@fluentui/svg-icons/icons/arrow_minimize_16_regular.svg'
import CloseIcon from '@fluentui/svg-icons/icons/dismiss_16_regular.svg'
import ArrowIcon from '@fluentui/svg-icons/icons/arrow_left_16_regular.svg'
// import MenuIcon from "@fluentui/svg-icons/icons/navigation_16_regular.svg"

import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'

import Button from '@/components/Button'
import Loading from '@/components/Loading'

const appWindow = getCurrentWindow()

class SnapLayoutControl {
  public hoverTimer: number | undefined
  constructor(
    public snapLayoutMode: 'hover' | 'rightclick' | 'disabled' = 'hover',
    public hoverDelay: number = 500,
  ) {}

  triggerSnapLayouts() {
    if (this.snapLayoutMode === 'disabled') return
    invoke('trigger_snap_layouts').catch((err) => {
      console.error('触发 snap layouts 失败:', err)
    })
  }

  handleMaximizeContextMenu(e: MouseEvent) {
    if (this.snapLayoutMode !== 'rightclick') return
    e.preventDefault()
    this.triggerSnapLayouts()
  }

  handleMaximizeMouseEnter() {
    if (this.snapLayoutMode !== 'hover') return
    if (this.hoverTimer) clearTimeout(this.hoverTimer)
    this.hoverTimer = window.setTimeout(this.triggerSnapLayouts, this.hoverDelay)
  }

  handleMaximizeMouseLeave() {
    if (this.snapLayoutMode !== 'hover') return
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer)
      this.hoverTimer = undefined
    }
  }
}

type Callback<R> = () => R | Promise<R>
export const [backgroundTaskList, setBackgroundTaskList] = createSignal<{ id: number; title?: string }[]>([])
export async function setBackgroundTask<R>(callback: Callback<R>, title?: string): Promise<R> {
  const id = Date.now()
  setBackgroundTaskList((prev) => [...prev, { id, title }])
  const res = await callback()
  setBackgroundTaskList((prev) => prev.filter((t) => t.id !== id))
  return res
}

export default function Titlebar() {
  const [isFocused, setIsFocused] = createSignal(false)
  const [isMaximized, setIsMaximized] = createSignal(false)

  const nav = useNavigate()
  const loc = useLocation()

  appWindow.onFocusChanged(async () => setIsFocused(await appWindow.isFocused()))
  appWindow.onResized(async () => setIsMaximized(await appWindow.isMaximized()))

  const handleMinimize = () => appWindow.minimize()
  const handleMaximize = () => appWindow.toggleMaximize()
  const handleClose = () => appWindow.close()

  const snapLayoutControl = new SnapLayoutControl('rightclick')

  onMount(async () => {
    const focused = await appWindow.isFocused()
    setIsFocused(focused)
  })

  onCleanup(() => {
    if (snapLayoutControl.hoverTimer) clearTimeout(snapLayoutControl.hoverTimer)
  })

  const isLoginMode = () => loc.pathname.startsWith('/account/login')

  return (
    <div data-tauri-drag-region class={style.titlebar}>
      <div class={style.title}>
        <div
          class={style.buttonGroup}
          classList={{
            [style.hide]: isLoginMode(),
          }}
        >
          <Button onClick={() => nav(-1)}>
            <ArrowIcon />
          </Button>
        </div>
        <div class={style.appIconContainer}>
          <img class={style.icon} src={appIcon} />
        </div>
        <div class={style.appname}>
          <Show when={backgroundTaskList().length > 0} fallback={<p>工院云课堂</p>}>
            <p>{backgroundTaskList()[0].title ?? '工院云课堂'}</p>
            <Loading />
          </Show>
        </div>
      </div>
      <div class={style.controls} classList={{ [style.windowInactive]: !isFocused() }}>
        <div class={style.button} onClick={handleMinimize}>
          <MinimizeIcon />
        </div>
        <div
          class={style.button}
          onClick={handleMaximize}
          onContextMenu={(e) => snapLayoutControl.handleMaximizeContextMenu(e)}
          onMouseEnter={() => snapLayoutControl.handleMaximizeMouseEnter()}
          onMouseLeave={() => snapLayoutControl.handleMaximizeMouseLeave()}
        >
          <Show when={isMaximized()} fallback={<MaximizeIcon />}>
            <RestoreIcon />
          </Show>
        </div>
        <div class={style.button} onClick={handleClose}>
          <CloseIcon />
        </div>
      </div>
    </div>
  )
}
