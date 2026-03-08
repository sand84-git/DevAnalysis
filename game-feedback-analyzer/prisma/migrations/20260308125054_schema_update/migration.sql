/*
  Warnings:

  - You are about to drop the column `description` on the `Build` table. All the data in the column will be lost.
  - You are about to drop the column `testerCount` on the `Build` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `BuildAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `BuildAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `statusJson` on the `BuildAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `columnMapping` on the `FeedbackFile` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `FeedbackFile` table. All the data in the column will be lost.
  - You are about to drop the column `originalName` on the `FeedbackFile` table. All the data in the column will be lost.
  - You are about to drop the column `storagePath` on the `FeedbackFile` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `FeedbackResponse` table. All the data in the column will be lost.
  - You are about to drop the column `rawText` on the `FeedbackResponse` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `sourceBuildId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `sourceType` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `action` on the `TaskHistory` table. All the data in the column will be lost.
  - You are about to drop the column `fromStatus` on the `TaskHistory` table. All the data in the column will be lost.
  - You are about to drop the column `toStatus` on the `TaskHistory` table. All the data in the column will be lost.
  - Added the required column `date` to the `Build` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Build` table without a default value. This is not possible if the table is not empty.
  - Added the required column `analysisLevel` to the `BuildAnalysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileSize` to the `FeedbackFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileType` to the `FeedbackFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filename` to the `FeedbackFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rawData` to the `FeedbackFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `text` to the `FeedbackResponse` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buildId` to the `TaskHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `TaskHistory` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Build" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "date" DATETIME NOT NULL,
    "notes" TEXT,
    "changes" TEXT,
    "testType" TEXT,
    "testTarget" TEXT,
    "testCount" INTEGER,
    "playTime" TEXT,
    "caution" TEXT,
    "biasProfile" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Build_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Build" ("createdAt", "id", "projectId", "testType", "version") SELECT "createdAt", "id", "projectId", "testType", "version" FROM "Build";
DROP TABLE "Build";
ALTER TABLE "new_Build" RENAME TO "Build";
CREATE TABLE "new_BuildAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisLevel" TEXT NOT NULL,
    "qualitativeJson" TEXT,
    "quantitativeJson" TEXT,
    "biasJson" TEXT,
    "costJson" TEXT,
    "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buildId" TEXT NOT NULL,
    CONSTRAINT "BuildAnalysis_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BuildAnalysis" ("biasJson", "buildId", "costJson", "id", "qualitativeJson", "quantitativeJson") SELECT "biasJson", "buildId", "costJson", "id", "qualitativeJson", "quantitativeJson" FROM "BuildAnalysis";
DROP TABLE "BuildAnalysis";
ALTER TABLE "new_BuildAnalysis" RENAME TO "BuildAnalysis";
CREATE UNIQUE INDEX "BuildAnalysis_buildId_key" ON "BuildAnalysis"("buildId");
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "group" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Category_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("id", "name", "projectId") SELECT "id", "name", "projectId" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE TABLE "new_FeedbackFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "rawData" BLOB NOT NULL,
    "parsedColumns" TEXT,
    "rowCount" INTEGER,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buildId" TEXT NOT NULL,
    CONSTRAINT "FeedbackFile_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FeedbackFile" ("buildId", "id", "rowCount", "uploadedAt") SELECT "buildId", "id", "rowCount", "uploadedAt" FROM "FeedbackFile";
DROP TABLE "FeedbackFile";
ALTER TABLE "new_FeedbackFile" RENAME TO "FeedbackFile";
CREATE TABLE "new_FeedbackResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "respondentId" TEXT,
    "text" TEXT NOT NULL,
    "categories" TEXT,
    "sentiment" TEXT,
    "language" TEXT,
    "confidence" REAL,
    "summary" TEXT,
    "isKeyQuote" BOOLEAN NOT NULL DEFAULT false,
    "analysisJson" TEXT,
    "buildId" TEXT NOT NULL,
    "fileId" TEXT,
    CONSTRAINT "FeedbackResponse_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FeedbackResponse" ("analysisJson", "buildId", "fileId", "id", "respondentId", "sentiment") SELECT "analysisJson", "buildId", "fileId", "id", "respondentId", "sentiment" FROM "FeedbackResponse";
DROP TABLE "FeedbackResponse";
ALTER TABLE "new_FeedbackResponse" RENAME TO "FeedbackResponse";
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "directionDoc" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Project" ("createdAt", "description", "directionDoc", "id", "name", "updatedAt") SELECT "createdAt", "description", "directionDoc", "id", "name", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "section" TEXT,
    "currentStatus" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'P1',
    "discoveredBuildId" TEXT,
    "targetBuildId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("createdAt", "description", "id", "priority", "projectId", "title", "updatedAt") SELECT "createdAt", "description", "id", "priority", "projectId", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE TABLE "new_TaskHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "evidence" TEXT,
    "taskId" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskHistory_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TaskHistory" ("createdAt", "id", "note", "taskId") SELECT "createdAt", "id", "note", "taskId" FROM "TaskHistory";
DROP TABLE "TaskHistory";
ALTER TABLE "new_TaskHistory" RENAME TO "TaskHistory";
CREATE UNIQUE INDEX "TaskHistory_taskId_buildId_key" ON "TaskHistory"("taskId", "buildId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
