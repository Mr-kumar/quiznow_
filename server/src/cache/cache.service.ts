import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

// L-3 fix: Use NestJS Logger instead of console.error
// L-2 fix: Use key prefix for scoped cache operations
const KEY_PREFIX = 'quiznow:';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379') || 6379,
      password: process.env.REDIS_PASSWORD,
      db: 0, // Use default DB
    });
  }

  private prefixKey(key: string): string {
    return `${KEY_PREFIX}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(this.prefixKey(key));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      await this.client.setex(this.prefixKey(key), ttl, JSON.stringify(value));
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
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
      this.logger.error(`Cache getOrSet error for key ${key}:`, error);
      return fn(); // Fallback to direct execution
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(this.prefixKey(pattern));
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Cache invalidate error for pattern ${pattern}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(this.prefixKey(key));
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  // L-2 fix: Use SCAN + DEL with prefix instead of FLUSHALL
  async flush(): Promise<void> {
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          `${KEY_PREFIX}*`,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== '0');
      this.logger.log('Cache flushed (prefix-scoped)');
    } catch (error) {
      this.logger.error('Cache flush error:', error);
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
