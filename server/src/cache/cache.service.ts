import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379') || 6379,
      password: process.env.REDIS_PASSWORD,
      db: 0, // Use default DB
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 300,
  ): Promise<T> {
    try {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      const result = await fn();
      await this.set(key, result, ttl);
      return result;
    } catch (error) {
      console.error(`Cache getOrSet error for key ${key}:`, error);
      return fn(); // Fallback to direct execution
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.error(`Cache invalidate error for pattern ${pattern}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async flush(): Promise<void> {
    try {
      await this.client.flushall();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }

  // Cache key generators
  static KEYS = {
    DASHBOARD_METRICS: 'dashboard:metrics',
    LEADERBOARD: (testId: string) => `leaderboard:${testId}`,
    TEST_LIST: (filters: string) => `tests:list:${filters}`,
    QUESTION_COUNT: (filters: string) => `questions:count:${filters}`,
    USER_STATS: (userId: string) => `user:stats:${userId}`,
  };

  onModuleDestroy() {
    this.client.disconnect();
  }
}
