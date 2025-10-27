import style from './CardGroup.module.css'

interface Props {
  title: string
  [x: string]: any
}

export default function CardGroup(props: Props) {

  return (
    <>
      <p class={style.title}>{props.title}</p>
      <div class={style.container}>
        {props.children}
      </div>
    </>
  )
}
