import type { ComponentProps, JSX } from 'solid-js'
import style from './Button.module.css'
import { splitProps } from 'solid-js'

type ButtonStyleVars = {
  '--light-bg-hover'?: string
  '--light-bg-active'?: string
  '--light-bg'?: string
  '--dark-bg-hover'?: string
  '--dark-bg-active'?: string
  '--dark-bg'?: string
}

type Props = Omit<ComponentProps<'button'>, 'style'> & {
  style?: JSX.CSSProperties & ButtonStyleVars
}

export default function Button(props: Props) {
  const [local, others] = splitProps(props, ['class', 'style', 'children'])

  const mergedClass = () => `${style.button} ${local.class || ''}`.trim()

  return (
    <button class={mergedClass()} style={local.style} {...others}>
      {local.children}
    </button>
  )
}
