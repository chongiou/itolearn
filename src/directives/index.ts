import type { Accessor, Signal } from "solid-js"
import { createRenderEffect, onCleanup } from "solid-js"

declare module "solid-js" {
  namespace JSX {
    interface DirectiveFunctions {
      model: typeof model
      autofocus: typeof autofocus
      clickOutside: typeof clickOutside
      longpress: typeof longpress
      copyToClipboard: typeof copyToClipboard
      animateIn: typeof animateIn
      debounce: typeof debounce
    }
  }
}

/**双向数据绑定 */
export function model(element: HTMLInputElement, value: Accessor<Signal<string>>) {
  const [field, setField] = value()
  createRenderEffect(() => (element.value = field()))
  element.addEventListener("input", (e) =>
    setField((e.target as HTMLInputElement).value)
  )
}

/**自动聚焦元素 */
export function autofocus(element: HTMLElement) {
  queueMicrotask(() => element.focus())
}

/**点击元素外部 */
export function clickOutside(element: HTMLElement, accessor: Accessor<() => void>) {
  const handler = (e: MouseEvent) => {
    if (!element.contains(e.target as Node)) {
      accessor()()
    }
  }

  setTimeout(() => document.addEventListener("click", handler))
  onCleanup(() => document.removeEventListener("click", handler))
}

/**长按事件 */
export function longpress(element: HTMLElement, accessor: Accessor<{
  duration?: number,
  onLongPress: () => void
}>) {
  const config = accessor()
  let timer: any //?

  element.addEventListener('mousedown', () => {
    timer = setTimeout(config.onLongPress, config.duration || 500)
  })

  element.addEventListener('mouseup', () => clearTimeout(timer))
  element.addEventListener('mouseleave', () => clearTimeout(timer))

  onCleanup(() => clearTimeout(timer))
}

/**复制到剪贴板 */
export function copyToClipboard(element: HTMLElement, accessor: Accessor<() => string>) {
  element.addEventListener('click', async () => {
    const text = accessor()()
    await navigator.clipboard.writeText(text)
    // TODO:可以加个提示
  })
}

/**使用动画进入视口 */
export function animateIn(element: HTMLElement, accessor: Accessor<string>) {
  const animationClass = accessor()

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      element.classList.add(animationClass)
      observer.disconnect()
    }
  })

  observer.observe(element)
  onCleanup(() => observer.disconnect())
}

/** `input` 防抖 */
export function debounce(element: HTMLInputElement, accessor: Accessor<{
  delay: number,
  callback: (value: string) => void
}>) {
  const config = accessor()
  let timer: any //?

  element.addEventListener('input', (e) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      config.callback((e.target as HTMLInputElement).value)
    }, config.delay)
  })

  onCleanup(() => clearTimeout(timer))
}
