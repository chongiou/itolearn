import style from './UserCard.module.css'
import accountIcon from '@/assets/menu/account.ico'
import { createResource, Show } from 'solid-js'
import { getStudentAvatar } from '@/api/services/user'

export default function UserCard() {
  const [avatarDataURL] = createResource(async () => {
    const { src } = await getStudentAvatar()
    return src
  })

  return (
    <div class={style.container}>
      <div class={style.avatar}>
        <Show when={avatarDataURL()} fallback={<img class={style.noAvatar} src={accountIcon} />}>
          <img src={avatarDataURL()} />
        </Show>
      </div>
      <div class={style.info}>
        <p>连理</p>
      </div>
    </div>
  )
}
