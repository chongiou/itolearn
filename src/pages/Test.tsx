import Card from "@/components/Card"
import CardGroup from "@/components/CardGroup"
import ScrollableContainer from "@/components/ScrollableContainer"
import { useLocation, useNavigate } from "@solidjs/router"

import Icon from '@/assets/menu/todo.ico'
import { createSignal } from "solid-js"
import Toggle from "@/components/Toggle"
import Select from "@/components/Select"

export default function Dashboard() {
  const [value, setValue] = createSignal('always')

  const options = [
    { value: 'never', label: '从不' },
    { value: 'always', label: '始终' },
    { value: 'no-keyboard', label: '未连接键盘时' }
  ]

  return (
    <div>
      <div>
        显示触摸键盘
      </div>
      
      <Select
        options={options}
        value={value()}
        onChange={setValue}
      />
    </div>
  )
}

