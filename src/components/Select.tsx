// Win11Select.tsx
import { createSignal, onMount, onCleanup, Show, For } from 'solid-js'
import styles from './Select.module.css'

export interface SelectOption {
  value: string
  label: string
}

export interface Win11SelectProps {
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export default function Select(props: Win11SelectProps) {
  const [isOpen, setIsOpen] = createSignal(false)
  const [selectedValue, setSelectedValue] = createSignal(props.value ?? props.options[0]?.value ?? '')
  const [hoveredIndex, setHoveredIndex] = createSignal<number | null>(null)
  
  let selectRef: HTMLButtonElement | undefined
  let dropdownRef: HTMLDivElement | undefined

  const selectedIndex = () => {
    return props.options.findIndex(opt => opt.value === selectedValue())
  }

  const selectedLabel = () => {
    return props.options.find(opt => opt.value === selectedValue())?.label ?? props.placeholder ?? ''
  }

  const updateDropdownPosition = () => {
    if (!dropdownRef || !selectRef) return
    
    requestAnimationFrame(() => {
      if (!dropdownRef || !selectRef) return
      
      const selectRect = selectRef.getBoundingClientRect()
      const itemHeight = 48
      const offset = selectedIndex() * itemHeight
      
      dropdownRef.style.top = `${selectRect.top - offset}px`
      dropdownRef.style.left = `${selectRect.left}px`
      dropdownRef.style.width = `${selectRect.width}px`
    })
  }

  const handleToggle = () => {
    if (props.disabled) return
    const willOpen = !isOpen()
    setIsOpen(willOpen)
    
    if (willOpen) {
      requestAnimationFrame(updateDropdownPosition)
    }
  }

  const handleSelect = (value: string) => {
    setSelectedValue(value)
    setIsOpen(false)
    props.onChange?.(value)
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (
      selectRef && !selectRef.contains(e.target as Node) &&
      dropdownRef && !dropdownRef.contains(e.target as Node)
    ) {
      setIsOpen(false)
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onCleanup(() => {
    document.removeEventListener('click', handleClickOutside)
  })

  return (
    <div class={styles.container}>
      <button
        ref={selectRef}
        class={styles.select}
        classList={{
          [styles.open]: isOpen(),
          [styles.disabled]: props.disabled
        }}
        onClick={handleToggle}
        disabled={props.disabled}
      >
        <span class={styles.selectText}>{selectedLabel()}</span>
        <svg
          class={styles.chevron}
          classList={{ [styles.chevronOpen]: isOpen() }}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M2 4L6 8L10 4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <Show when={isOpen()}>
        <div class={styles.overlay} onClick={() => setIsOpen(false)} />
        
        <div ref={el => {
          dropdownRef = el
          updateDropdownPosition()
        }} class={styles.dropdown}>
          <For each={props.options}>
            {(option, index) => (
              <div
                class={styles.option}
                classList={{
                  [styles.optionSelected]: option.value === selectedValue(),
                  [styles.optionHovered]: hoveredIndex() === index()
                }}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setHoveredIndex(index())}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <Show when={option.value === selectedValue()}>
                  <div class={styles.indicator} />
                </Show>
                <span class={styles.optionText}>{option.label}</span>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
