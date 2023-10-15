import { Injectable } from '@nestjs/common';

@Injectable()
export class TempStorage {
  storage = new Map<string, string>();

  set(key: string, value: string, time?: number) {
    this.storage.set(key, value);

    if (time) {
      setTimeout(() => {
        this.storage.delete(key);
      }, time);
    }
  }

  get(key: string) {
    return this.storage.get(key);
  }

  del(key: string) {
    this.storage.delete(key);
  }
}
