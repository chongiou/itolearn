import { getStudentCourseCreditsOverview } from "@/api/adapters/user"
import { For, Match, Switch } from "solid-js"
import { createResource } from "solid-js"
import Loading from "@/components/Loading"
import Card from "@/components/Card"
import CardGroup from "@/components/CardGroup"
import ScrollableContainer from "@/components/ScrollableContainer"

export default function Dashboard() {
  const [courseCredits] = createResource(async () => {
    return getStudentCourseCreditsOverview()
  })

  return (
    <>
      <h1>仪表盘</h1>
      <Switch>
        <Match when={courseCredits.loading}>
          <Loading />
          <p>加载中</p>
        </Match>
        <Match when={courseCredits.error}>
          <div>
            <code>{JSON.stringify(courseCredits.error, null, 2)}</code>
          </div>
        </Match>
        <Match when={courseCredits()}>
          <ScrollableContainer>
            <CardGroup title="概览">
              <Card
                title={`课程数量: ${courseCredits()?.courseCount}`}
                desc={`学期积分: ${courseCredits()?.creditTotal}`}
              />
            </CardGroup>
            <CardGroup title="学科积分">

              <For each={courseCredits()?.courses!}>
                {(it) => {
                  return (
                    <Card
                      title={it.name}
                      desc={`积分: ${it.credit}`}
                    />
                  )
                }}
              </For>
            </CardGroup>
          </ScrollableContainer>
        </Match>
      </Switch>
    </>
  )
}

