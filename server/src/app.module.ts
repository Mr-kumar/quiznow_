import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/iam/auth/auth.module';
import { UsersModule } from './modules/iam/users/users.module';
import { PrismaService } from './services/prisma/prisma.service';
import { CategoriesModule } from './modules/catalog/categories/categories.module';
import { ExamsModule } from './modules/assessment/exams/exams.module';
import { TestSeriesModule } from './modules/assessment/test-series/test-series.module';
import { TestsModule } from './modules/assessment/tests/tests.module';
import { SectionsModule } from './modules/assessment/sections/sections.module';
import { QuestionsModule } from './modules/assessment/questions/questions.module';
import { AttemptsModule } from './modules/assessment/attempts/attempts.module';
import { LeaderboardModule } from './modules/analytics/leaderboard/leaderboard.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    CategoriesModule,
    ExamsModule,
    TestSeriesModule,
    TestsModule,
    SectionsModule,
    QuestionsModule,
    AttemptsModule,
    LeaderboardModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
