-- CreateEnum
CREATE TYPE "TeacherStatus" AS ENUM ('FREE', 'BUSY');

-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

-- CreateEnum
CREATE TYPE "ScheduleEntryType" AS ENUM ('LECTURE', 'OFFICE_HOUR');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TEACHER';

-- CreateTable
CREATE TABLE "teacher_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "department" TEXT,
    "office_location" TEXT,
    "contact_email" TEXT,
    "status" "TeacherStatus" NOT NULL DEFAULT 'FREE',
    "status_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_schedule_entries" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "type" "ScheduleEntryType" NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,

    CONSTRAINT "teacher_schedule_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_user_id_key" ON "teacher_profiles"("user_id");

-- CreateIndex
CREATE INDEX "teacher_profiles_status_idx" ON "teacher_profiles"("status");

-- CreateIndex
CREATE INDEX "teacher_schedule_entries_profile_id_weekday_idx" ON "teacher_schedule_entries"("profile_id", "weekday");

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_schedule_entries" ADD CONSTRAINT "teacher_schedule_entries_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
