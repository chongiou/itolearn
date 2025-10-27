// lib
import { createEffect, createSignal, For } from "solid-js"
import { useLocation, useNavigate } from "@solidjs/router"

// style
import style from './Navigation.module.css'

// component
import UserCard from "./UserCard"
import { routes } from "@/config/routes"

export const [isSidebarOpen, setIsSidebarOpen] = createSignal(false)
export const [isMobile, setIsMobile] = createSignal(false)

export default function Navigation() {
  const nav = useNavigate()
  const loc = useLocation()

  const checkMobile = () => {
    setIsMobile(window.innerWidth <= 1000)
    if (window.innerWidth > 1000) {
      setIsSidebarOpen(false)
    }
  }

  createEffect(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  })

  const handleNavClick = (path: string) => {
    nav(path)
    if (isMobile()) {
      setIsSidebarOpen(false)
    }
  }

  const isLoginMode = () => loc.pathname.startsWith('/account/login')

  return (
    <aside
      class={style.sidebar}
      classList={{
        [style.open]: isSidebarOpen() && !isLoginMode(),
        [style.hide]: isLoginMode()
      }}
    >
      <UserCard />
      <nav class={style.nav}>
        <For each={routes.filter(route => route.info?.label)}>
          {it => (
            <button
              class={loc.pathname.startsWith(it.path) ? style.selected : void 0}
              onClick={() => handleNavClick(it.path)}
            >
              <img src={it.info?.icon} style={it.info?.icon ? void 0 : { opacity: 0 }} />
              <span>{it.info?.label}</span>
            </button>
          )}
        </For>
      </nav >
    </aside >
  )
}
