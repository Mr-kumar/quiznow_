import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './services/prisma/prisma.module';
import { AuthModule } from './modules/iam/auth/auth.module';
import { UsersModule } from './modules/iam/users/users.module';
import { CategoriesModule } from './modules/catalog/categories/categories.module';
import { ExamsModule } from './modules/assessment/exams/exams.module';
import { TestSeriesModule } from './modules/assessment/test-series/test-series.module';
import { TestsModule } from './modules/assessment/tests/tests.module';
import { SectionsModule } from './modules/assessment/sections/sections.module';
import { QuestionsModule } from './modules/assessment/questions/questions.module';
import { TopicsModule } from './modules/assessment/topics/topics.module';
import { SubjectsModule } from './modules/assessment/subjects/subjects.module';
import { AttemptsModule } from './modules/assessment/attempts/attempts.module';
import { LeaderboardModule } from './modules/analytics/leaderboard/leaderboard.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PlansModule } from './modules/catalog/plans/plans.module';
import { SubscriptionsModule } from './modules/catalog/subscriptions/subscriptions.module';
import { SettingsModule } from './modules/admin/settings/settings.module';
import { AuditLogsModule } from './modules/admin/audit-logs/audit-logs.module';
import { CacheModule } from './cache/cache.module';
import { SchedulerService } from './common/services/scheduler.service';
import { SchedulerModule } from './common/services/scheduler.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Enable scheduling
    PrismaModule,
    SchedulerModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ExamsModule,
    TestSeriesModule,
    TestsModule,
    SectionsModule,
    QuestionsModule,
    TopicsModule,
    SubjectsModule,
    AttemptsModule,
    LeaderboardModule,
    AnalyticsModule,
    PlansModule,
    SubscriptionsModule,
    SettingsModule,
    AuditLogsModule,
    CacheModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
