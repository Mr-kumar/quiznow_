import { z } from 'zod';

/**
 * 🔐 SETTINGS REGISTRY
 * This schema defines all valid admin settings and their types.
 * Any write to AdminSettings must pass validation against this schema.
 */
export const SETTINGS_SCHEMA = {
  'system.siteName': z.string().default('QuizNow'),
  'system.siteDescription': z.string().default('Professional Exam Preparation Platform'),
  'system.siteUrl': z.string().url().default('https://quiznow.com'),
  'system.allowRegistration': z.boolean().default(true),
  'system.requireEmailVerification': z.boolean().default(false),
  'system.maintenanceMode': z.boolean().default(false),
  'system.defaultLanguage': z.enum(['en', 'hi']).default('en'),
  'system.timezone': z.string().default('UTC'),

  'exam.defaultTestDuration': z.number().int().positive().default(60),
  'exam.defaultPassingMarks': z.number().min(0).max(100).default(40),
  'exam.defaultNegativeMarking': z.number().min(0).max(1).default(0.33),
  'exam.allowNegativeMarking': z.boolean().default(true),
  'exam.showResultsImmediately': z.boolean().default(true),
  'exam.allowRetest': z.boolean().default(true),
  'exam.retestWaitingPeriod': z.number().min(0).default(24),
  'exam.maxQuestionsPerTest': z.number().int().positive().default(200),
  'exam.autoSubmitOnTimeout': z.boolean().default(true),

  'payment.enablePayments': z.boolean().default(false),
  'payment.currency': z.string().length(3).default('INR'),
  'payment.testPrice': z.number().min(0).default(99),
  'payment.subscriptionEnabled': z.boolean().default(false),
  'payment.monthlySubscriptionPrice': z.number().min(0).default(299),
  'payment.yearlySubscriptionPrice': z.number().min(0).default(2990),
  'payment.freeTestsPerMonth': z.number().int().min(0).default(5),

  'email.smtpHost': z.string().default(''),
  'email.smtpPort': z.string().default('587'),
  'email.smtpUser': z.string().default(''),
  'email.smtpPassword': z.string().default(''),
  'email.fromEmail': z.string().email().default('noreply@quiznow.com'),
  'email.fromName': z.string().default('QuizNow Team'),
  'email.enableEmailNotifications': z.boolean().default(true),

  'security.passwordMinLength': z.string().default('8'),
  'security.requireStrongPassword': z.boolean().default(true),
  'security.sessionTimeout': z.string().default('24'),
  'security.maxLoginAttempts': z.string().default('5'),
  'security.enableTwoFactor': z.boolean().default(false),
  'security.enableCaptcha': z.boolean().default(false),
  'security.blockSuspiciousIPs': z.boolean().default(true),

  'notifications.emailNotifications': z.boolean().default(true),
  'notifications.pushNotifications': z.boolean().default(true),
  'notifications.smsNotifications': z.boolean().default(false),
  'notifications.newTestAlerts': z.boolean().default(true),
  'notifications.userRegistrationAlerts': z.boolean().default(true),
  'notifications.paymentAlerts': z.boolean().default(true),
  'notifications.systemErrorAlerts': z.boolean().default(true),
  'notifications.dailyDigest': z.boolean().default(false),

  'content.enableQuestionBank': z.boolean().default(true),
  'content.allowUserGeneratedContent': z.boolean().default(false),
  'content.contentModeration': z.boolean().default(true),
  'content.autoTranslateQuestions': z.boolean().default(false),

  'analytics.enableAnalytics': z.boolean().default(true),
  'analytics.trackUserBehavior': z.boolean().default(true),
  'analytics.trackTestPerformance': z.boolean().default(true),
  'analytics.anonymizeData': z.boolean().default(true),
  'analytics.dataRetentionPeriod': z.number().int().positive().default(365),
} as const;

export type SettingKey = keyof typeof SETTINGS_SCHEMA;

/**
 * Validates a setting value against its schema.
 * Throws ZodError if validation fails.
 */
export function validateSetting<K extends SettingKey>(key: K, value: any) {
  const schema = SETTINGS_SCHEMA[key];
  if (!schema) {
    throw new Error(`Unknown setting key: ${key}`);
  }
  return schema.parse(value);
}

/**
 * Type helper for setting values based on their key.
 */
export type SettingValue<K extends SettingKey> = z.infer<(typeof SETTINGS_SCHEMA)[K]>;
