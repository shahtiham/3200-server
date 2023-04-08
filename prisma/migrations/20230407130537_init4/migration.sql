-- CreateEnum
CREATE TYPE "ntype" AS ENUM ('ATOQ', 'USRTOMOD', 'MODTOUSR', 'BOUNTYRECVED', 'ANSACCEPTED', 'NWTAGREQSTED', 'NWTAGADDED', 'QEDTSUGSTED', 'QEDTSUGACCEPTED', 'DELQ', 'DELA');

-- CreateTable
CREATE TABLE "notifications" (
    "n_id" SERIAL NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nBy_u_id" INTEGER NOT NULL,
    "nseen" BOOLEAN NOT NULL DEFAULT false,
    "nByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "nByMod" BOOLEAN NOT NULL DEFAULT false,
    "ntype" "ntype" NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("n_id")
);

-- CreateTable
CREATE TABLE "natoq" (
    "id" SERIAL NOT NULL,
    "a_id" INTEGER NOT NULL,
    "q_id" INTEGER NOT NULL,
    "notificationsN_id" INTEGER NOT NULL,
    "bountyval" INTEGER NOT NULL DEFAULT 0,
    "isaccepted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "natoq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_n_for" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "natoq_notificationsN_id_key" ON "natoq"("notificationsN_id");

-- CreateIndex
CREATE UNIQUE INDEX "_n_for_AB_unique" ON "_n_for"("A", "B");

-- CreateIndex
CREATE INDEX "_n_for_B_index" ON "_n_for"("B");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_nBy_u_id_fkey" FOREIGN KEY ("nBy_u_id") REFERENCES "credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "natoq" ADD CONSTRAINT "natoq_notificationsN_id_fkey" FOREIGN KEY ("notificationsN_id") REFERENCES "notifications"("n_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_n_for" ADD CONSTRAINT "_n_for_A_fkey" FOREIGN KEY ("A") REFERENCES "credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_n_for" ADD CONSTRAINT "_n_for_B_fkey" FOREIGN KEY ("B") REFERENCES "notifications"("n_id") ON DELETE CASCADE ON UPDATE CASCADE;
