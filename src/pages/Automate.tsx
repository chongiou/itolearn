import Tabs, { Tab } from '@/components/Tabs'
import Toggle from '@/components/Toggle'
import {
  lastTabIdx,
  setLastTabIdx,
  automateEnabled,
  toggleAutomate,
  logs,
  loadAutomateEnabled
} from '@/store/automate'
import style from './Automate.module.css'
import { createEffect, createSignal, For, onMount } from 'solid-js'
import ScrollableContainer from '@/components/ScrollableContainer'

export default function Automate() {
  const [automateIsEnabled, setAutomateIsEnabled] = createSignal(automateEnabled())
  let logContainer!: HTMLDivElement

  createEffect(() => {
    logs()
    queueMicrotask(() => {
      logContainer.scrollTop = logContainer.scrollHeight
    })
  })

  onMount(async () => {
    const enabled = await loadAutomateEnabled()
    setAutomateIsEnabled(enabled)
  })

  const handleToggle = async (enabled: boolean) => {
    await toggleAutomate(enabled)
  }

  return (
    <>
      <h1>自动化</h1>
      <div class={style.header}>
        <p>总开关</p>
        <Toggle
          checked={automateIsEnabled()}
          onChange={handleToggle}
        />
      </div>
      <Tabs default={lastTabIdx()} onActive={(_title, index) => setLastTabIdx(index)}>
        <Tab title="控制台">
          <p>控制台</p>
        </Tab>
        <Tab title="日志">
          <code style={{ margin: '10px 0' }}>
            <ScrollableContainer ref={logContainer}>
              <For each={logs()}>
                {(log) => {
                  return <p innerHTML={log}></p>
                }}
              </For>
            </ScrollableContainer>
          </code>
        </Tab>
      </Tabs>
    </>
  )
}
