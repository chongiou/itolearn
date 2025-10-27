import Card from "@/components/Card"
import CardGroup from "@/components/CardGroup"

import UserIcon from '@/assets/menu/account.ico'
import ScrollableContainer from "@/components/ScrollableContainer"

export default function Setting() {
  return (
    <>
      <h1>设置</h1>
      <ScrollableContainer>
        <CardGroup title="账户设置">
          <Card
            title="登出账户"
            desc="登出功能无法使用"
            type="按钮"
            disable
            buttonText="登出"
            icon={UserIcon}
          >
          </Card>
        </CardGroup>
        <CardGroup title="应用设置">
          <Card
            title="使用原生标题栏"
            desc="使用原生标题栏而非自绘标题栏"
            type="开关"
            disable
          />
        </CardGroup>
      </ScrollableContainer>
    </>
  )
}
