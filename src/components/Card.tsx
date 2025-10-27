import { Match, Show, Switch, type JSX } from 'solid-js'

import styles from './Card.module.css'
import ArrowRight from '@/assets/arrow-right.svg'

import Button from './Button'
import Toggle from './Toggle'

interface Props {
  icon?: JSX.Element | string | Function
  title?: string
  desc?: string
  type?: '按钮' | '展开' | '下拉' | '开关'
  buttonText?: string
  disable?: boolean
  children?: JSX.Element
  onClick?: (e: Event) => void
}


export default function Card(props: Props) {
  return (
    <div
      class={`${styles.card} ${props.onClick ? styles.scale : ''}`}
      onClick={(e) => {
        props.onClick?.(e)
      }}>
      <div class={styles.left}>
        <div class={styles.icon}>
          <Show when={typeof props.icon !== 'string'} fallback={
            <img src={props.icon as string} alt="icon" width="100%" />
          }>
            {props.icon as any}
          </Show>
        </div>
        <div class={styles.info}>
          <p>{props.title ?? '无标题'}</p>
          <p>{props.desc}</p>
        </div>
      </div>
      <div class={styles.right}>
        <Switch>
          <Match when={props.type === '按钮'}>
            <Button disabled={props.disable} style={{ 'min-width': '126px' }}>
              {props.buttonText ?? '按钮'}
            </Button>
          </Match>
          <Match when={props.type === '开关'}>
            <Toggle disabled={props.disable} />
          </Match>
        </Switch>
        <Show when={props.onClick}>
          <ArrowRight width={'14px'} />
        </Show>
      </div>
    </div>
  )
}
