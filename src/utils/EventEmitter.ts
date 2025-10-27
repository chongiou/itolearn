type Listener = (...args: any[]) => void

export class EventEmitter {
  private events = new Map<string | symbol, Set<Listener>>()

  on(event: string | symbol, listener: Listener): this {
    if (!this.events.has(event)) this.events.set(event, new Set())
    this.events.get(event)!.add(listener)
    return this
  }

  once(event: string | symbol, listener: Listener): this {
    const wrapper: Listener = (...args) => {
      this.off(event, wrapper)
      listener(...args)
    }
    return this.on(event, wrapper)
  }

  off(event: string | symbol, listener: Listener): this {
    this.events.get(event)?.delete(listener)
    return this
  }

  emit(event: string | symbol, ...args: any[]): boolean {
    const listeners = this.events.get(event)
    if (!listeners || listeners.size === 0) return false
    for (const fn of [...listeners]) fn(...args)
    return true
  }

  removeAllListeners(event?: string | symbol): this {
    if (event) this.events.delete(event)
    else this.events.clear()
    return this
  }

  listeners(event: string | symbol): Listener[] {
    return Array.from(this.events.get(event) ?? [])
  }

  listenerCount(event: string | symbol): number {
    return this.events.get(event)?.size ?? 0
  }
}

export default EventEmitter
