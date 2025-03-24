/*
  Warnings:

  - A unique constraint covering the columns `[userId,lunchMoneyId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Transaction_userId_lunchMoneyId_key" ON "Transaction"("userId", "lunchMoneyId");
