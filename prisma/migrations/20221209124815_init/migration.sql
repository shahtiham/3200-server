-- CreateEnum
CREATE TYPE "role" AS ENUM ('ADMIN', 'USER', 'MODERATOR');

-- CreateTable
CREATE TABLE "credentials" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(32) NOT NULL,
    "email" VARCHAR(64) NOT NULL,
    "pass" VARCHAR(128) NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "role" NOT NULL DEFAULT 'USER',
    "rep" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "blocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Code" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "Code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag" (
    "tag_id" SERIAL NOT NULL,
    "tag" VARCHAR(32) NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("tag_id")
);

-- CreateTable
CREATE TABLE "reqtag" (
    "reqtag_id" SERIAL NOT NULL,
    "reqtag" VARCHAR(32) NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "credentialsId" INTEGER NOT NULL,

    CONSTRAINT "reqtag_pkey" PRIMARY KEY ("reqtag_id")
);

-- CreateTable
CREATE TABLE "questions" (
    "q_id" SERIAL NOT NULL,
    "title" VARCHAR(1024) NOT NULL,
    "question" VARCHAR(15000) NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "upvotedBy" INTEGER[],
    "downvotedBy" INTEGER[],
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "isbountyrunning" BOOLEAN NOT NULL DEFAULT false,
    "isprotected" BOOLEAN NOT NULL DEFAULT false,
    "reqrep" INTEGER NOT NULL DEFAULT 0,
    "bountyvalue" INTEGER NOT NULL DEFAULT 0,
    "bountycreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bountyawarded" INTEGER NOT NULL DEFAULT 0,
    "u_id" INTEGER NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("q_id")
);

-- CreateTable
CREATE TABLE "suggestededit" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(1024) NOT NULL,
    "question" VARCHAR(15000) NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "u_id" INTEGER NOT NULL,
    "q_id" INTEGER,

    CONSTRAINT "suggestededit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quscomments" (
    "id" SERIAL NOT NULL,
    "comment" VARCHAR(15000) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "upvotedBy" INTEGER[],
    "votes" INTEGER NOT NULL DEFAULT 0,
    "questionsQ_id" INTEGER NOT NULL,
    "credentialsId" INTEGER NOT NULL,

    CONSTRAINT "quscomments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "a_id" SERIAL NOT NULL,
    "answer" VARCHAR(15000) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isaccepted" BOOLEAN NOT NULL DEFAULT false,
    "upvotedBy" INTEGER[],
    "downvotedBy" INTEGER[],
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "bountyreceived" INTEGER NOT NULL DEFAULT 0,
    "q_id" INTEGER NOT NULL,
    "u_id" INTEGER NOT NULL,
    "accq_id" INTEGER,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("a_id")
);

-- CreateTable
CREATE TABLE "anscomments" (
    "id" SERIAL NOT NULL,
    "comment" VARCHAR(15000) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "upvotedBy" INTEGER[],
    "votes" INTEGER NOT NULL DEFAULT 0,
    "answersA_id" INTEGER NOT NULL,
    "credentialsId" INTEGER NOT NULL,

    CONSTRAINT "anscomments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_questionsTotag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_suggestededitTotag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "credentials_email_key" ON "credentials"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Code_user_id_key" ON "Code"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tag_tag_key" ON "tag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "reqtag_reqtag_key" ON "reqtag"("reqtag");

-- CreateIndex
CREATE UNIQUE INDEX "answers_accq_id_key" ON "answers"("accq_id");

-- CreateIndex
CREATE UNIQUE INDEX "_questionsTotag_AB_unique" ON "_questionsTotag"("A", "B");

-- CreateIndex
CREATE INDEX "_questionsTotag_B_index" ON "_questionsTotag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_suggestededitTotag_AB_unique" ON "_suggestededitTotag"("A", "B");

-- CreateIndex
CREATE INDEX "_suggestededitTotag_B_index" ON "_suggestededitTotag"("B");

-- AddForeignKey
ALTER TABLE "Code" ADD CONSTRAINT "Code_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reqtag" ADD CONSTRAINT "reqtag_credentialsId_fkey" FOREIGN KEY ("credentialsId") REFERENCES "credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_u_id_fkey" FOREIGN KEY ("u_id") REFERENCES "credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestededit" ADD CONSTRAINT "suggestededit_q_id_fkey" FOREIGN KEY ("q_id") REFERENCES "questions"("q_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quscomments" ADD CONSTRAINT "quscomments_questionsQ_id_fkey" FOREIGN KEY ("questionsQ_id") REFERENCES "questions"("q_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quscomments" ADD CONSTRAINT "quscomments_credentialsId_fkey" FOREIGN KEY ("credentialsId") REFERENCES "credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_q_id_fkey" FOREIGN KEY ("q_id") REFERENCES "questions"("q_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_u_id_fkey" FOREIGN KEY ("u_id") REFERENCES "credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_accq_id_fkey" FOREIGN KEY ("accq_id") REFERENCES "questions"("q_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anscomments" ADD CONSTRAINT "anscomments_answersA_id_fkey" FOREIGN KEY ("answersA_id") REFERENCES "answers"("a_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anscomments" ADD CONSTRAINT "anscomments_credentialsId_fkey" FOREIGN KEY ("credentialsId") REFERENCES "credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_questionsTotag" ADD CONSTRAINT "_questionsTotag_A_fkey" FOREIGN KEY ("A") REFERENCES "questions"("q_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_questionsTotag" ADD CONSTRAINT "_questionsTotag_B_fkey" FOREIGN KEY ("B") REFERENCES "tag"("tag_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_suggestededitTotag" ADD CONSTRAINT "_suggestededitTotag_A_fkey" FOREIGN KEY ("A") REFERENCES "suggestededit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_suggestededitTotag" ADD CONSTRAINT "_suggestededitTotag_B_fkey" FOREIGN KEY ("B") REFERENCES "tag"("tag_id") ON DELETE CASCADE ON UPDATE CASCADE;
