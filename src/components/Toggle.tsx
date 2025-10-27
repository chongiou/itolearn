import { createSignal, Show } from 'solid-js'
import styles from './Toggle.module.css'

export interface ToggleProps {
  checked?: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
  label?: string
}

export default function Toggle(props: ToggleProps) {
  const [isChecked, setIsChecked] = createSignal(props.checked ?? false)

  const handleToggle = (e: Event) => {
    e.stopPropagation()
    if (props.disabled) return
    const newValue = !isChecked()
    setIsChecked(newValue)
    props.onChange?.(newValue)
  }

  return (
    <div class={styles.wrapper}>
      <Show when={props.label} fallback={
        <Show when={isChecked()} fallback={
          <label class={styles.label}>关</label>
        }>
          <label class={styles.label}>开</label>
        </Show>
      }>
        <label class={styles.label}>{props.label}</label>
      </Show>

      <button
        class={styles.toggle}
        classList={{
          [styles.checked]: isChecked(),
          [styles.disabled]: props.disabled
        }}
        onClick={handleToggle}
        disabled={props.disabled}
        role="switch"
        aria-checked={isChecked()}
      >
        <span
          classList={{
            [styles.checked]: isChecked(),
          }}
          class={styles.thumb}
        />
      </button>
    </div>
  )
}
