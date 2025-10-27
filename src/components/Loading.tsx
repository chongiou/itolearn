import style from './Loading.module.css'
import LoadIcon from '@/assets/loader-line.svg'
import LoadIconDark from '@/assets/loader-line-dark.svg'
import { createSignal, Show } from 'solid-js'

function detectColorMode() {
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
  return isDarkMode ? 'dark' : 'light'
}
interface Props {
  width?: string
}
export function Loading(props: Props) {
  const [mode, setMode] = createSignal(detectColorMode())
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const newMode = e.matches ? 'dark' : 'light'
    setMode(newMode)
  })

  return (
    <div class={style.container}>
      <div class={style.icon} style={props.width ? { '--width': props.width } : {}}>
        <Show when={mode() === 'light'} fallback={<LoadIconDark />}>
          <LoadIcon />
        </Show>
      </div>
    </div>
  )
}

export default Loading
