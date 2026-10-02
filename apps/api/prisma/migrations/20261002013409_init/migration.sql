-- CreateTable
CREATE TABLE "GameTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultCapacity" INTEGER NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "minPlayers" INTEGER NOT NULL,
    "defaultDurationMinutes" INTEGER NOT NULL,

    CONSTRAINT "GameTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameFormat" (
    "templateId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "minPlayers" INTEGER,
    "capacityStep" INTEGER,

    CONSTRAINT "GameFormat_pkey" PRIMARY KEY ("templateId","id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "formatId" TEXT NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "minPlayers" INTEGER NOT NULL,
    "registeredCount" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_startsAt_idx" ON "Event"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_eventId_nameKey_key" ON "Registration"("eventId", "nameKey");

-- AddForeignKey
ALTER TABLE "GameFormat" ADD CONSTRAINT "GameFormat_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "GameTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_templateId_formatId_fkey" FOREIGN KEY ("templateId", "formatId") REFERENCES "GameFormat"("templateId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CHECK constraints (hand-written: Prisma doesn't model them). Integrity lives here, not in the UI.
ALTER TABLE "GameTemplate"
  ADD CONSTRAINT "GameTemplate_minPlayers_check" CHECK ("minPlayers" >= 1),
  ADD CONSTRAINT "GameTemplate_maxCapacity_check" CHECK ("maxCapacity" <= 30),
  ADD CONSTRAINT "GameTemplate_defaultCapacity_check" CHECK ("defaultCapacity" BETWEEN "minPlayers" AND "maxCapacity"),
  ADD CONSTRAINT "GameTemplate_defaultDurationMinutes_check" CHECK ("defaultDurationMinutes" > 0);

ALTER TABLE "GameFormat"
  ADD CONSTRAINT "GameFormat_durationMinutes_check" CHECK ("durationMinutes" > 0),
  ADD CONSTRAINT "GameFormat_minPlayers_check" CHECK ("minPlayers" >= 1),
  ADD CONSTRAINT "GameFormat_capacityStep_check" CHECK ("capacityStep" > 0);

ALTER TABLE "Event"
  ADD CONSTRAINT "Event_capacity_check" CHECK ("capacity" BETWEEN 1 AND 30),
  ADD CONSTRAINT "Event_registeredCount_check" CHECK ("registeredCount" BETWEEN 0 AND "capacity"),
  ADD CONSTRAINT "Event_durationMinutes_check" CHECK ("durationMinutes" > 0),
  ADD CONSTRAINT "Event_minPlayers_check" CHECK ("minPlayers" >= 1);
