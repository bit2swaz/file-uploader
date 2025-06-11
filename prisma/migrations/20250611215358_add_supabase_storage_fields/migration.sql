/*
  Warnings:

  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "storagePath" TEXT,
ADD COLUMN     "url" TEXT,
ALTER COLUMN "path" DROP NOT NULL;

-- DropTable
DROP TABLE "Session";
