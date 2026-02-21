-- AddForeignKey
ALTER TABLE "property_attributes" ADD CONSTRAINT "property_attributes_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
