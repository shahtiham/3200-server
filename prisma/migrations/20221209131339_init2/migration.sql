-- AddForeignKey
ALTER TABLE "suggestededit" ADD CONSTRAINT "suggestededit_u_id_fkey" FOREIGN KEY ("u_id") REFERENCES "credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
