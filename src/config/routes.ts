import type { RouteDefinition } from '@solidjs/router'
import { lazy } from 'solid-js'

// import accountIcon from '@/assets/menu/account.ico'
// import dashboardIcon from '@/assets/menu/dashboard.ico'
import scheduleIcon from '@/assets/menu/schedule.ico'
import settingIcon from '@/assets/menu/setting.ico'
// import todoIcon from '@/assets/menu/todo.ico'
import automateIcon from '@/assets/menu/automate.ico'
import terminalIcon from '@/assets/menu/terminal.ico'

import Schedule from '@/pages/Schedule/Schedule'
import Automate from '@/pages/Automate'
import Dashboard from '@/pages/Dashboard'

export const routes: (RouteDefinition & { info?: { icon?: string; label?: string } })[] = [
  {
    path: '*404',
    component: lazy(() => import('@/pages/NotFound')),
  },
  {
    path: '/home',
    component: Dashboard,
    info: {
      icon: terminalIcon,
      label: '仪表盘',
    },
  },
  {
    path: '/schedule',
    component: Schedule,
    info: {
      icon: scheduleIcon,
      label: '课程表',
    },
  },
  {
    path: '/schedule/course',
    component: lazy(() => import('@/pages/Schedule/Course/Course')),
  },
  {
    path: '/schedule/course/homework',
    component: lazy(() => import('@/pages/Schedule/Course/Homework/Homework')),
  },
  {
    path: '/auto',
    component: Automate,
    info: {
      icon: automateIcon,
      label: '自动化',
    },
  },
  {
    path: '/setting',
    component: lazy(() => import('@/pages/Setting')),
    info: {
      icon: settingIcon,
      label: '设置',
    },
  },
  {
    path: '/account/login',
    component: lazy(() => import('@/pages/Account/Login')),
  },
]
