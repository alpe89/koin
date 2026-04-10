import { EventEmitter } from 'node:events'
import type { KoinEvent } from './domain-events.ts'

type EventType = KoinEvent['type']
type EventPayload<T extends EventType> = Extract<KoinEvent, { type: T }>['payload']

export type DomainEvent<T extends EventType> = {
  type: T
  payload: EventPayload<T>
  occurredAt: Date
}

class EventBus extends EventEmitter {
  publish<T extends EventType>(type: T, payload: EventPayload<T>): void {
    this.emit(type, { type, payload, occurredAt: new Date() } satisfies DomainEvent<T>)
  }

  subscribe<T extends EventType>(
    type: T,
    handler: (event: DomainEvent<T>) => Promise<void>,
  ): void {
    this.on(type, handler)
  }
}

export const eventBus = new EventBus()
eventBus.setMaxListeners(20)
