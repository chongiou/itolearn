import style from './Load.module.css'

import { createSignal, onMount, Switch, Match } from "solid-js"
import Loading from "./Loading"

interface Props {
  children?: any
  action?: (stop: () => void) => Promise<void> | void
  tip?: string,
}

export default function Load(props: Props) {
  const { children, action, tip } = props
  const [isLoading, setIsLoading] = createSignal(true)
  const [error, setError] = createSignal<string>()

  const stop = () => setIsLoading(false)

  const runAction = () => {
    setIsLoading(true)
    setError(undefined)
    if (!action) {
      return
    }
    try {
      const result = action(stop)
      if (result instanceof Promise) {
        result.catch((err) => setError(err.message))
      }
    } catch (err) {
      setError((err as Error).message)
    }
  }
  onMount(runAction)

  return (
    <Switch>
      <Match when={error()}>
        <div class={style.container}>
          <p>{error()}</p>
        </div>
      </Match>

      <Match when={isLoading()}>
        <div class={style.container}>
          <Loading />
          <p>{tip ?? '正在加载'}</p>
        </div>
      </Match>

      <Match when={!isLoading() && !error()}>
        {children}
      </Match>
    </Switch>
  )
}

