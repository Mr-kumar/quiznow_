"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  Settings,
  Database,
  Users,
  Shield,
  Bell,
  Globe,
  Palette,
} from "lucide-react";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    siteName: "QuizNow",
    siteDescription: "Professional Exam Preparation Platform",
    siteUrl: "https://quiznow.com",
    logoUrl: "",
    faviconUrl: "",
    allowRegistration: true,
    requireEmailVerification: false,
    maintenanceMode: false,
    defaultLanguage: "en",
    timezone: "UTC",
  });

  // Exam Settings
  const [examSettings, setExamSettings] = useState({
    defaultTestDuration: 60,
    defaultPassingMarks: 40,
    defaultNegativeMarking: 0.33,
    allowNegativeMarking: true,
    showResultsImmediately: true,
    allowRetest: true,
    retestWaitingPeriod: 24,
    maxQuestionsPerTest: 200,
    autoSubmitOnTimeout: true,
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    enablePayments: false,
    currency: "INR",
    testPrice: 99,
    subscriptionEnabled: false,
    monthlySubscriptionPrice: 299,
    yearlySubscriptionPrice: 2990,
    freeTestsPerMonth: 5,
    paymentGateway: "razorpay",
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    fromEmail: "noreply@quiznow.com",
    fromName: "QuizNow Team",
    enableEmailNotifications: true,
    emailVerificationRequired: false,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: "8",
    requireStrongPassword: true,
    sessionTimeout: "24",
    maxLoginAttempts: "5",
    enableTwoFactor: false,
    enableCaptcha: false,
    ipWhitelist: "",
    blockSuspiciousIPs: true,
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    newTestAlerts: true,
    userRegistrationAlerts: true,
    paymentAlerts: true,
    systemErrorAlerts: true,
    dailyDigest: false,
  });

  // Content Settings
  const [contentSettings, setContentSettings] = useState({
    enableQuestionBank: true,
    allowUserGeneratedContent: false,
    contentModeration: true,
    autoTranslateQuestions: false,
    supportedLanguages: ["en", "hi", "gu", "ta", "bn", "mr", "te", "kn"],
  });

  // Analytics Settings
  const [analyticsSettings, setAnalyticsSettings] = useState({
    enableAnalytics: true,
    trackUserBehavior: true,
    trackTestPerformance: true,
    anonymizeData: true,
    dataRetentionPeriod: 365,
  });

  const handleSaveSettings = async (section: string, settings: any) => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call the backend API
      console.log(`Saving ${section} settings:`, settings);

      toast({
        title: "Settings Saved",
        description: `${section} settings have been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your QuizNow platform settings and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="exam" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Exams
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
        </TabsList>

        {/* System Settings */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Configure your platform's basic settings and appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={systemSettings.siteName}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        siteName: e.target.value,
                      }))
                    }
                    placeholder="QuizNow"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Input
                    id="siteDescription"
                    value={systemSettings.siteDescription}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        siteDescription: e.target.value,
                      }))
                    }
                    placeholder="Professional Exam Preparation Platform"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow User Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable new user registration on the platform
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.allowRegistration}
                    onCheckedChange={(checked) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        allowRegistration: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Users must verify their email before accessing the
                      platform
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.requireEmailVerification}
                    onCheckedChange={(checked) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        requireEmailVerification: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Put the platform in maintenance mode
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={(checked) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        maintenanceMode: checked,
                      }))
                    }
                  />
                </div>
              </div>

              <Button
                onClick={() => handleSaveSettings("System", systemSettings)}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save System Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exam Settings */}
        <TabsContent value="exam">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Exam Configuration
              </CardTitle>
              <CardDescription>
                Configure exam rules, timing, and scoring parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultTestDuration">
                    Default Test Duration (minutes)
                  </Label>
                  <Input
                    id="defaultTestDuration"
                    type="number"
                    value={examSettings.defaultTestDuration}
                    onChange={(e) =>
                      setExamSettings((prev) => ({
                        ...prev,
                        defaultTestDuration: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultPassingMarks">
                    Default Passing Marks (%)
                  </Label>
                  <Input
                    id="defaultPassingMarks"
                    type="number"
                    value={examSettings.defaultPassingMarks}
                    onChange={(e) =>
                      setExamSettings((prev) => ({
                        ...prev,
                        defaultPassingMarks: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultNegativeMarking">
                    Default Negative Marking
                  </Label>
                  <Input
                    id="defaultNegativeMarking"
                    type="number"
                    step="0.01"
                    value={examSettings.defaultNegativeMarking}
                    onChange={(e) =>
                      setExamSettings((prev) => ({
                        ...prev,
                        defaultNegativeMarking: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxQuestionsPerTest">
                    Max Questions Per Test
                  </Label>
                  <Input
                    id="maxQuestionsPerTest"
                    type="number"
                    value={examSettings.maxQuestionsPerTest}
                    onChange={(e) =>
                      setExamSettings((prev) => ({
                        ...prev,
                        maxQuestionsPerTest: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Negative Marking</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable negative marks for wrong answers
                    </p>
                  </div>
                  <Switch
                    checked={examSettings.allowNegativeMarking}
                    onCheckedChange={(checked) =>
                      setExamSettings((prev) => ({
                        ...prev,
                        allowNegativeMarking: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Results Immediately</Label>
                    <p className="text-sm text-muted-foreground">
                      Display results as soon as test is submitted
                    </p>
                  </div>
                  <Switch
                    checked={examSettings.showResultsImmediately}
                    onCheckedChange={(checked) =>
                      setExamSettings((prev) => ({
                        ...prev,
                        showResultsImmediately: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Retest</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to retake the same test
                    </p>
                  </div>
                  <Switch
                    checked={examSettings.allowRetest}
                    onCheckedChange={(checked) =>
                      setExamSettings((prev) => ({
                        ...prev,
                        allowRetest: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Submit on Timeout</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically submit test when time expires
                    </p>
                  </div>
                  <Switch
                    checked={examSettings.autoSubmitOnTimeout}
                    onCheckedChange={(checked) =>
                      setExamSettings((prev) => ({
                        ...prev,
                        autoSubmitOnTimeout: checked,
                      }))
                    }
                  />
                </div>
              </div>

              <Button
                onClick={() => handleSaveSettings("Exam", examSettings)}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Exam Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Payment Configuration
              </CardTitle>
              <CardDescription>
                Configure payment gateway and subscription plans
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={paymentSettings.currency}
                    onChange={(e) =>
                      setPaymentSettings((prev) => ({
                        ...prev,
                        currency: e.target.value,
                      }))
                    }
                    placeholder="INR"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testPrice">Test Price</Label>
                  <Input
                    id="testPrice"
                    type="number"
                    value={paymentSettings.testPrice}
                    onChange={(e) =>
                      setPaymentSettings((prev) => ({
                        ...prev,
                        testPrice: Number(e.target.value),
                      }))
                    }
                    placeholder="99"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlySubscriptionPrice">
                    Monthly Subscription
                  </Label>
                  <Input
                    id="monthlySubscriptionPrice"
                    type="number"
                    value={paymentSettings.monthlySubscriptionPrice}
                    onChange={(e) =>
                      setPaymentSettings((prev) => ({
                        ...prev,
                        monthlySubscriptionPrice: Number(e.target.value),
                      }))
                    }
                    placeholder="299"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearlySubscriptionPrice">
                    Yearly Subscription
                  </Label>
                  <Input
                    id="yearlySubscriptionPrice"
                    type="number"
                    value={paymentSettings.yearlySubscriptionPrice}
                    onChange={(e) =>
                      setPaymentSettings((prev) => ({
                        ...prev,
                        yearlySubscriptionPrice: Number(e.target.value),
                      }))
                    }
                    placeholder="2990"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Payments</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable payment system for premium tests
                    </p>
                  </div>
                  <Switch
                    checked={paymentSettings.enablePayments}
                    onCheckedChange={(checked) =>
                      setPaymentSettings((prev) => ({
                        ...prev,
                        enablePayments: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Subscriptions</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to subscribe for unlimited access
                    </p>
                  </div>
                  <Switch
                    checked={paymentSettings.subscriptionEnabled}
                    onCheckedChange={(checked) =>
                      setPaymentSettings((prev) => ({
                        ...prev,
                        subscriptionEnabled: checked,
                      }))
                    }
                  />
                </div>
              </div>

              <Button
                onClick={() => handleSaveSettings("Payment", paymentSettings)}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Payment Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Configuration
              </CardTitle>
              <CardDescription>
                Configure security policies and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">
                    Minimum Password Length
                  </Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        passwordMinLength: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">
                    Session Timeout (hours)
                  </Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        sessionTimeout: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Strong Password</Label>
                    <p className="text-sm text-muted-foreground">
                      Enforce strong password requirements
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.requireStrongPassword}
                    onCheckedChange={(checked) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        requireStrongPassword: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to enable 2FA for additional security
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.enableTwoFactor}
                    onCheckedChange={(checked) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        enableTwoFactor: checked,
                      }))
                    }
                  />
                </div>
              </div>

              <Button
                onClick={() => handleSaveSettings("Security", securitySettings)}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Security Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Configure email settings for notifications and user
                communications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={emailSettings.smtpHost}
                    onChange={(e) =>
                      setEmailSettings((prev) => ({
                        ...prev,
                        smtpHost: e.target.value,
                      }))
                    }
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={emailSettings.smtpPort}
                    onChange={(e) =>
                      setEmailSettings((prev) => ({
                        ...prev,
                        smtpPort: e.target.value,
                      }))
                    }
                    placeholder="587"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    value={emailSettings.smtpUser}
                    onChange={(e) =>
                      setEmailSettings((prev) => ({
                        ...prev,
                        smtpUser: e.target.value,
                      }))
                    }
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) =>
                      setEmailSettings((prev) => ({
                        ...prev,
                        smtpPassword: e.target.value,
                      }))
                    }
                    placeholder="Your app password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    value={emailSettings.fromEmail}
                    onChange={(e) =>
                      setEmailSettings((prev) => ({
                        ...prev,
                        fromEmail: e.target.value,
                      }))
                    }
                    placeholder="noreply@quiznow.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={emailSettings.fromName}
                    onChange={(e) =>
                      setEmailSettings((prev) => ({
                        ...prev,
                        fromName: e.target.value,
                      }))
                    }
                    placeholder="QuizNow Team"
                  />
                </div>
              </div>

              <Button
                onClick={() => handleSaveSettings("Email", emailSettings)}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Email Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure system notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email notifications to users
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        emailNotifications: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable browser push notifications
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        pushNotifications: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Test Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify users when new tests are available
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.newTestAlerts}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        newTestAlerts: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>User Registration Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert admins when new users register
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.userRegistrationAlerts}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        userRegistrationAlerts: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Error Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify admins of system errors
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.systemErrorAlerts}
                    onCheckedChange={(checked) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        systemErrorAlerts: checked,
                      }))
                    }
                  />
                </div>
              </div>

              <Button
                onClick={() =>
                  handleSaveSettings("Notifications", notificationSettings)
                }
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Notification Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Settings */}
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Management
              </CardTitle>
              <CardDescription>
                Database operations and maintenance tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Database Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Users:</span>
                      <Badge variant="secondary">4</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Tests:</span>
                      <Badge variant="secondary">0</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Questions:</span>
                      <Badge variant="secondary">0</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Attempts:</span>
                      <Badge variant="secondary">2</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Maintenance Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full">
                      Clear Cache
                    </Button>
                    <Button variant="outline" className="w-full">
                      Optimize Database
                    </Button>
                    <Button variant="outline" className="w-full">
                      Backup Database
                    </Button>
                    <Button variant="destructive" className="w-full">
                      Reset Demo Data
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
