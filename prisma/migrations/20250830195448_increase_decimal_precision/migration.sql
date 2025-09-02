-- AlterTable
ALTER TABLE "public"."budgets" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "spent_amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "public"."expenses" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);
