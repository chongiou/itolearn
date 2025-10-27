import { readTextFile, writeTextFile, exists, BaseDirectory } from '@tauri-apps/plugin-fs';

interface JsonDbOptions {
  filename: string;
  dir?: BaseDirectory;
}

export class JsonDb<T extends Record<string, any>> {
  private filename: string;
  private dir: BaseDirectory;
  private cache: T | null = null;
  private lock: Promise<void> = Promise.resolve();

  constructor(options: JsonDbOptions) {
    this.filename = options.filename;
    this.dir = options.dir || BaseDirectory.AppData;
  }

  // 加锁执行（队列化）
  private async withLock<R>(fn: () => Promise<R>): Promise<R> {
    const prevLock = this.lock;
    let releaseLock: () => void;

    this.lock = new Promise(resolve => {
      releaseLock = resolve;
    });

    try {
      await prevLock;
      return await fn();
    } finally {
      // 释放下一位
      releaseLock!();
    }
  }

  // 初始化数据库文件
  async init(defaultData: T = {} as T): Promise<void> {
    const fileExists = await exists(this.filename, { baseDir: this.dir });
    if (!fileExists) {
      // write 会加锁
      await this.write(defaultData);
    } else {
      await this.read();
    }
  }

  // 读取整个数据（加锁，返回并设置 cache）
  async read(): Promise<T> {
    return this.withLock(async () => {
      try {
        const content = await readTextFile(this.filename, { baseDir: this.dir });
        this.cache = JSON.parse(content) as T;
        return this.cache!;
      } catch (error) {
        throw new Error(`读取数据失败: ${error}`);
      }
    });
  }

  // 写入整个数据（加锁）
  async write(data: T): Promise<void> {
    return this.withLock(async () => {
      try {
        await writeTextFile(this.filename, JSON.stringify(data, null, 2), { baseDir: this.dir });
        // 这里直接替换 cache 引用为写入的对象（注意：外部拿到的对象应为深拷贝）
        this.cache = data;
      } catch (error) {
        throw new Error(`写入数据失败: ${error}`);
      }
    });
  }

  // -------- 安全注意：所有对共享 cache 的读写都应当在锁内完成 --------
  // 获取指定路径的值（强一致，返回深拷贝）
  async get<K = any>(path: string): Promise<K | undefined> {
    return this.withLock(async () => {
      // 优先使用内存 cache，若没有则直接读文件
      let data: T;
      if (this.cache) {
        data = this.cache;
      } else {
        const content = await readTextFile(this.filename, { baseDir: this.dir });
        data = JSON.parse(content) as T;
        this.cache = data;
      }
      const val = this.getByPath(data, path);
      return val === undefined ? undefined : JSON.parse(JSON.stringify(val)) as K;
    });
  }

  // 设置指定路径的值（整个 RMW 在锁内原子完成）
  async set(path: string, value: any): Promise<void> {
    await this.withLock(async () => {
      // load snapshot (from cache 或 直接从文件)
      let data: T;
      if (this.cache) {
        data = this.cache;
      } else {
        const content = await readTextFile(this.filename, { baseDir: this.dir });
        data = JSON.parse(content) as T;
      }

      this.setByPath(data, path, value);

      // 直接在锁内写盘并更新 cache（避免重入 write() 导致的锁队列复杂性）
      await writeTextFile(this.filename, JSON.stringify(data, null, 2), { baseDir: this.dir });
      this.cache = data;
    });
  }

  // 删除指定路径的值（锁内完成）
  async delete(path: string): Promise<void> {
    await this.withLock(async () => {
      let data: T;
      if (this.cache) {
        data = this.cache;
      } else {
        const content = await readTextFile(this.filename, { baseDir: this.dir });
        data = JSON.parse(content) as T;
      }

      this.deleteByPath(data, path);

      await writeTextFile(this.filename, JSON.stringify(data, null, 2), { baseDir: this.dir });
      this.cache = data;
    });
  }

  // 更新指定路径的值（合并对象，锁内完成）
  async update(path: string, value: Partial<any>): Promise<void> {
    await this.withLock(async () => {
      let data: T;
      if (this.cache) {
        data = this.cache;
      } else {
        const content = await readTextFile(this.filename, { baseDir: this.dir });
        data = JSON.parse(content) as T;
      }

      const current = this.getByPath(data, path);
      if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
        this.setByPath(data, path, { ...current, ...value });
      } else {
        this.setByPath(data, path, value);
      }

      await writeTextFile(this.filename, JSON.stringify(data, null, 2), { baseDir: this.dir });
      this.cache = data;
    });
  }

  // 向数组添加元素（锁内完成）
  async push(path: string, ...items: any[]): Promise<void> {
    await this.withLock(async () => {
      let data: T;
      if (this.cache) {
        data = this.cache;
      } else {
        const content = await readTextFile(this.filename, { baseDir: this.dir });
        data = JSON.parse(content) as T;
      }

      const arr = this.getByPath(data, path);
      if (!Array.isArray(arr)) {
        throw new Error(`路径 ${path} 不是数组`);
      }
      arr.push(...items);

      await writeTextFile(this.filename, JSON.stringify(data, null, 2), { baseDir: this.dir });
      this.cache = data;
    });
  }

  // 过滤数组（锁内完成）
  async filter(path: string, predicate: (item: any, index: number) => boolean): Promise<void> {
    await this.withLock(async () => {
      let data: T;
      if (this.cache) {
        data = this.cache;
      } else {
        const content = await readTextFile(this.filename, { baseDir: this.dir });
        data = JSON.parse(content) as T;
      }

      const arr = this.getByPath(data, path);
      if (!Array.isArray(arr)) {
        throw new Error(`路径 ${path} 不是数组`);
      }
      const filtered = arr.filter(predicate);
      this.setByPath(data, path, filtered);

      await writeTextFile(this.filename, JSON.stringify(data, null, 2), { baseDir: this.dir });
      this.cache = data;
    });
  }

  // 查找数组元素（强一致读，返回深拷贝）
  async find<K = any>(path: string, predicate: (item: any) => boolean): Promise<K | undefined> {
    return this.withLock(async () => {
      let data: T;
      if (this.cache) {
        data = this.cache;
      } else {
        const content = await readTextFile(this.filename, { baseDir: this.dir });
        data = JSON.parse(content) as T;
      }

      const arr = this.getByPath(data, path);
      if (!Array.isArray(arr)) {
        throw new Error(`路径 ${path} 不是数组`);
      }
      const found = arr.find(predicate);
      return found === undefined ? undefined : JSON.parse(JSON.stringify(found)) as K;
    });
  }

  // 获取所有数据（强一致，返回深拷贝）
  async getAll(): Promise<T> {
    return this.withLock(async () => {
      if (this.cache) {
        // 返回深拷贝，避免外部改动内部 cache
        return JSON.parse(JSON.stringify(this.cache)) as T;
      } else {
        const content = await readTextFile(this.filename, { baseDir: this.dir });
        const parsed = JSON.parse(content) as T;
        this.cache = parsed;
        return JSON.parse(JSON.stringify(parsed)) as T;
      }
    });
  }

  // 清空缓存（不会影响磁盘）
  clearCache(): void {
    this.cache = null;
  }

  // ----------------- 辅助工具方法 -----------------
  // 通过路径获取值（支持 "a.b.c"）
  private getByPath(obj: any, path: string): any {
    if (!path) return obj;
    const keys = path.split('.');
    let result = obj;
    for (const k of keys) {
      if (result == null) return undefined;
      result = result[k];
    }
    return result;
  }

  // 通过路径设置值（会创建中间对象）
  private setByPath(obj: any, path: string, value: any): void {
    if (!path) throw new Error('path 不能为空');
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (cur[k] == null || typeof cur[k] !== 'object') {
        cur[k] = {};
      }
      cur = cur[k];
    }
    cur[keys[keys.length - 1]] = value;
  }

  // 删除路径（支持深层删除）
  private deleteByPath(obj: any, path: string): void {
    if (!path) throw new Error('path 不能为空');
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (cur[k] == null) return;
      cur = cur[k];
    }
    delete cur[keys[keys.length - 1]];
  }
}
