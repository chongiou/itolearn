import style from './Input.module.css'
import type { ComponentProps, JSX } from 'solid-js'
import { splitProps } from 'solid-js'

type InputOptions = {
  'data-variant'?: "onFocusTransparentFont"
}

type InputStyleVars = {

}

type InputProps = Omit<ComponentProps<'input'>, 'style'> & {
  style?: JSX.CSSProperties & InputStyleVars
} & InputOptions

export default function Input(props: InputProps) {
  const [local, others] = splitProps(props, ['class', 'placeholder'])

  const mergedClass = () => `${style.input} ${local.class || ''}`.trim()
  return (
    <div class={style.inputContainer}>
      <input
        type="text"
        class={mergedClass()}
        placeholder={local.placeholder}
        {...others}
      />
    </div>
  )
}
