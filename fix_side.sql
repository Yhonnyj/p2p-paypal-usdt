DO $$
BEGIN
  -- 1) Asegura que exista el enum con los valores correctos
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderSide') THEN
    CREATE TYPE "OrderSide" AS ENUM ('BUY', 'SELL');
  END IF;

  -- 2) Intenta agregar labels si ya existe el enum (ignora duplicados)
  BEGIN
    ALTER TYPE "OrderSide" ADD VALUE 'BUY';
  EXCEPTION WHEN duplicate_object THEN
  END;

  BEGIN
    ALTER TYPE "OrderSide" ADD VALUE 'SELL';
  EXCEPTION WHEN duplicate_object THEN
  END;

  -- 3) Convierte la columna a enum preservando valores v?lidos; lo dem?s queda NULL
  EXECUTE '
    ALTER TABLE "public"."Order"
    ALTER COLUMN "side" TYPE "OrderSide"
    USING CASE
      WHEN "side"::text IN (''BUY'',''SELL'') THEN "side"::"OrderSide"
      ELSE NULL
    END
  ';

  -- 4) Asegura que la columna sea NULLABLE (como en tu schema OrderSide?)
  EXECUTE 'ALTER TABLE "public"."Order" ALTER COLUMN "side" DROP NOT NULL';
END $$;
