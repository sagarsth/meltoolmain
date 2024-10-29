-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ON_TRACK', 'AT_RISK', 'DELAYED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "AgeGroup" AS ENUM ('GROUP_18_29', 'GROUP_30_44', 'GROUP_45_54', 'GROUP_55_64', 'GROUP_65_PLUS');

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicObjective" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "kpi" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "actualValue" DOUBLE PRECISION NOT NULL,
    "progressPercentage" DOUBLE PRECISION NOT NULL,
    "status" "Status" NOT NULL,
    "teamId" INTEGER,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategicObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectObjective" TEXT NOT NULL,
    "strategicObjectiveId" INTEGER NOT NULL,
    "projectOutcome" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "projectKpi" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "actualValue" DOUBLE PRECISION NOT NULL,
    "progressPercentage" DOUBLE PRECISION NOT NULL,
    "status" "Status" NOT NULL,
    "teamId" INTEGER,
    "timeline" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workshop" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "numParticipants" INTEGER NOT NULL,
    "disaggregatedSex" "Gender" NOT NULL,
    "disability" BOOLEAN NOT NULL,
    "ageGroup" "AgeGroup" NOT NULL,
    "preEvaluation" TEXT NOT NULL,
    "postEvaluation" TEXT NOT NULL,
    "localPartner" TEXT NOT NULL,
    "localPartnerResponsibility" TEXT NOT NULL,
    "successOfPartnership" TEXT NOT NULL,
    "challenges" TEXT NOT NULL,
    "strengths" TEXT NOT NULL,
    "outcomes" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,

    CONSTRAINT "Workshop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Livelihood" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "participantName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "disaggregatedSex" "Gender" NOT NULL,
    "disability" BOOLEAN NOT NULL,
    "ageGroup" "AgeGroup" NOT NULL,
    "grantAmountReceived" DOUBLE PRECISION NOT NULL,
    "grantPurpose" TEXT NOT NULL,
    "progress1" TEXT NOT NULL,
    "progress2" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "subsequentGrantAmount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Livelihood_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- AddForeignKey
ALTER TABLE "StrategicObjective" ADD CONSTRAINT "StrategicObjective_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_strategicObjectiveId_fkey" FOREIGN KEY ("strategicObjectiveId") REFERENCES "StrategicObjective"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workshop" ADD CONSTRAINT "Workshop_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Livelihood" ADD CONSTRAINT "Livelihood_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
