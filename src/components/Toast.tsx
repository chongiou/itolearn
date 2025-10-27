import { createSignal, For } from "solid-js"
import styles from "./Toast.module.css"

type ToastItem = {
  id: number
  message: string
  type?: "success" | "error" | "info"
  duration?: number
}

export const [toastList, setToastList] = createSignal<ToastItem[]>([])

let toastId = 0

// TODO: 实现串行或堆叠
export function showToast(message: string, type: "success" | "error" | "info" = "info", duration = 2000) {
  const id = ++toastId
  setToastList(list => [...list, { id, message, type, duration }])
  window.setTimeout(() => {
    setToastList(list => list.filter(t => t.id !== id))
  }, duration)
}

export default function Toast() {
  return (
    <For each={toastList()}>
      {t => (
        <div
          class={`${styles.toast} ${styles[t.type || "info"]} ${styles.animate}`}
          style={`animation-duration:${t.duration || 2000}ms`}
        >
          {t.message}
        </div>
      )}
    </For>
  )
}
