import { splitProps, type ComponentProps, type JSX } from 'solid-js'
import style from './ScrollableContainer.module.css'

type Options = {

}

type StyleVars = {

}

type Props = Omit<ComponentProps<'div'>, 'style'> & {
  style?: JSX.CSSProperties & StyleVars
} & Options

export function ScrollableContainer(props: Props) {
  const [local, others] = splitProps(props, ['class', 'style', 'children'])

  const mergedClass = () => `${style.scrollableContainer} ${local.class || ''}`.trim()
  
  return (
    <div class={mergedClass()} {...others}>
      {props.children}
    </div>
  )
}

export default ScrollableContainer
