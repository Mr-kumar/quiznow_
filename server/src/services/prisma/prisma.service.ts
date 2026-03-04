import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // 🛡️ CONNECTION POOL: Prevent connection exhaustion
      log: ['error', 'warn'], // Only log errors/warnings in production
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    // 🚀 TEST CONNECTION on startup
    try {
      await this.$connect();
      console.log('✅ PrismaService: Database connection established');
    } catch (error) {
      console.error('❌ PrismaService: Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('✅ PrismaService: Database connection closed');
  }
}
