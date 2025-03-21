-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "classificationJobId" TEXT,
ADD COLUMN     "isTrainingData" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lunchMoneyCategory" TEXT,
ADD COLUMN     "lunchMoneyId" TEXT,
ADD COLUMN     "predictedCategory" TEXT,
ADD COLUMN     "similarityScore" DOUBLE PRECISION,
ADD COLUMN     "trainingJobId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "classifyApiKey" TEXT,
ADD COLUMN     "lunchMoneyApiKey" TEXT;

-- CreateTable
CREATE TABLE "TrainingJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "predictionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "TrainingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassificationJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "predictionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "ClassificationJob_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_trainingJobId_fkey" FOREIGN KEY ("trainingJobId") REFERENCES "TrainingJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_classificationJobId_fkey" FOREIGN KEY ("classificationJobId") REFERENCES "ClassificationJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingJob" ADD CONSTRAINT "TrainingJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassificationJob" ADD CONSTRAINT "ClassificationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
