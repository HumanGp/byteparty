import { EventEmitter } from "node:events";

export class EventBus {
  private static instance: EventBus | null = null;
  private emitter: EventEmitter;

  private constructor() {
    this.emitter = new EventEmitter();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on(event: string, listener: (...args: any[]) => void): void {
    this.emitter.on(event, listener);
  }

  public once(event: string, listener: (...args: any[]) => void): void {
    this.emitter.once(event, listener);
  }

  public off(event: string, listener: (...args: any[]) => void): void {
    this.emitter.off(event, listener);
  }

  public emit(event: string, ...args: any[]): boolean {
    return this.emitter.emit(event, ...args);
  }
}

