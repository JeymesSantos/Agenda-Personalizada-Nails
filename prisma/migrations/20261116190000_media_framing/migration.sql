ALTER TABLE "Service" ADD COLUMN "photoFocus" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "BackgroundMedia" ADD COLUMN "desktopFocusX" INTEGER,
ADD COLUMN "desktopFocusY" INTEGER;
ALTER TABLE "BackgroundPageSetting" ADD COLUMN "inheritMedia" BOOLEAN NOT NULL DEFAULT true;
CREATE TABLE "AppointmentNotice" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppointmentNotice_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AppointmentNotice_appointmentId_createdAt_idx" ON "AppointmentNotice"("appointmentId", "createdAt");
ALTER TABLE "AppointmentNotice" ADD CONSTRAINT "AppointmentNotice_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
