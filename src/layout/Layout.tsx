import { JSX } from 'solid-js'
import style from './Layout.module.css'

import Navigation from './Navigation'
import Titlebar from './Titlebar'

export default function Layout(props: { outlet: JSX.Element }) {

  return (
    <>
      <div class={style.container}>
        <Titlebar />
        <Navigation />
        <main class={style.main}>{props.outlet}</main>
      </div>
    </>
  )
}
