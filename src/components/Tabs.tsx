import { createSignal, For, JSX, children } from 'solid-js'
import style from './Tabs.module.css'
import Button from './Button'

export function Tab(props: { title: string; children: JSX.Element }) {
  return <div style={{display: 'flex', "min-height": 0}} data-title={props.title}>{props.children}</div>
}

interface TabsProps {
  children: JSX.Element
  onActive?: (title: string, index: number) => void
  default: number
}

export default function Tabs(props: TabsProps) {
  const resolved = children(() => props.children)
  const tabs = (() => {
    const kids = resolved()
    const arr = Array.isArray(kids) ? kids : [kids]
    return arr.map((el: any) => ({
      title: el.getAttribute?.('data-title') ?? '',
      el,
    }))
  })()

  const [active, setActive] = createSignal(props.default ?? 0)

  return (
    <div class={style.tabsContainer}>
      <div class={style.tablist}>
        <For each={tabs}>
          {(tab, i) => (
            <Button
              class={style.tabItem}
              classList={{ [style.active]: active() === i() }}
              onClick={() => {
                setActive(i())
                props.onActive?.(tab.title, i())
              }}
            >
              {tab.title}
            </Button>
          )}
        </For>
      </div>

      {tabs[active()]?.el}
    </div>
  )
}
