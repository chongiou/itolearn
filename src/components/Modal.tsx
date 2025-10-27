import { createSignal, Show } from "solid-js"
import { render } from "solid-js/web"
import styles from "@/components/Modal.module.css"
import Button from "./Button"

export interface ModalProps {
  title: string
  content: string
  open?: boolean
  onPrimary?: () => any
  onSecondary?: () => any
  onClose?: () => void
}

// 组件式 Modal
export function Modal(props: ModalProps) {
  return (
    <Show when={props.open}>
      <div class={styles.overlay} onClick={props.onClose} />
      <div class={styles.modalWrapper}>
        <div class={styles.modalContent}>
          <div class={styles.header}>
            <h2 class={styles.title}>{props.title}</h2>
            <p>{props.content}</p>
          </div>
          <div class={styles.footer}>
            <Button data-variant='primary' onClick={props.onPrimary}>确定</Button>
            <Button class={styles.buttonSecondary} onClick={props.onSecondary}>取消</Button>
          </div>
        </div>
      </div>
    </Show>
  )
}

// 编程式 Modal API
interface ModalConfig {
  title: string
  content: string
  onPrimary?: () => any
  onSecondary?: () => any
}

export const modal = {
  show(config: ModalConfig) {
    return new Promise((resolve) => {
      const container = document.createElement('div')
      document.body.appendChild(container)

      const [open, setOpen] = createSignal(true)

      const cleanup = () => {
        setOpen(false)
        setTimeout(() => {
          container.remove()
        }, 300)
      }

      const handlePrimary = () => {
        const result = config.onPrimary?.()
        cleanup()
        resolve(true)
        return result
      }

      const handleSecondary = () => {
        const result = config.onSecondary?.()
        cleanup()
        resolve(false)
        return result
      }

      render(() => (
        <Modal
          open={open()}
          title={config.title}
          content={config.content}
          onPrimary={handlePrimary}
          onSecondary={handleSecondary}
          onClose={handleSecondary}
        />
      ), container)
    })
  },
  confirm(title: string, content: string) {
    return modal.show({ title, content })
  },
  alert(title: string, content: string = '') {
    return new Promise((resolve) => {
      modal.show({
        title,
        content,
        onPrimary: () => resolve(true)
      })
    })
  }
}
