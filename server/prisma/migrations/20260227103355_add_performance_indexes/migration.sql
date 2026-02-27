-- CreateIndex
CREATE INDEX "Attempt_status_createdAt_idx" ON "Attempt"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Question_hash_idx" ON "Question"("hash");

-- CreateIndex
CREATE INDEX "Test_isActive_isLive_idx" ON "Test"("isActive", "isLive");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
