/*
  Warnings:

  - Added the required column `fileName` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileType` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileUrl` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "fileType" TEXT NOT NULL,
ADD COLUMN     "fileUrl" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;
