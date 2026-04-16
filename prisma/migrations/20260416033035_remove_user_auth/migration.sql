/*
  Warnings:

  - You are about to drop the column `userId` on the `user_books` table. All the data in the column will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[bookId]` on the table `user_books` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "user_books" DROP CONSTRAINT "user_books_userId_fkey";

-- DropIndex
DROP INDEX "user_books_userId_bookId_key";

-- DropIndex
DROP INDEX "user_books_userId_idx";

-- AlterTable
ALTER TABLE "user_books" DROP COLUMN "userId";

-- DropTable
DROP TABLE "users";

-- CreateIndex
CREATE UNIQUE INDEX "user_books_bookId_key" ON "user_books"("bookId");
