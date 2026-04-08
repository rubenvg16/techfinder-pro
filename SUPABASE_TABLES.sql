-- TechFinder Pro - SQL idempotente
-- Este SQL puede ejecutarse múltiples veces sin errores

-- Tabla saved_products (solo si no existe)
CREATE TABLE IF NOT EXISTS saved_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  url TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices (solo si no existen)
CREATE INDEX IF NOT EXISTS idx_saved_products_user_id ON saved_products(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_products_external_id ON saved_products(external_id);
CREATE INDEX IF NOT EXISTS idx_saved_products_source ON saved_products(source);

-- Habilitar RLS (si no está habilitado)
ALTER TABLE saved_products ENABLE ROW LEVEL SECURITY;

-- DROP políticas existentes si existen (para actualizar)
DROP POLICY IF EXISTS "Users can view their own saved products" ON saved_products;
DROP POLICY IF EXISTS "Users can insert their own saved products" ON saved_products;
DROP POLICY IF EXISTS "Users can update their own saved products" ON saved_products;
DROP POLICY IF EXISTS "Users can delete their own saved products" ON saved_products;

-- Políticas actualizadas
CREATE POLICY "Users can view their own saved products" 
  ON saved_products FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved products" 
  ON saved_products FOR INSERT 
  WITH CHECK (user_id IS NOT NULL);

CREATE POLICY "Users can update their own saved products" 
  ON saved_products FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved products" 
  ON saved_products FOR DELETE 
  USING (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own saved products' AND tablename = 'saved_products'
  ) THEN
    CREATE POLICY "Users can update their own saved products" 
      ON saved_products FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own saved products' AND tablename = 'saved_products'
  ) THEN
    CREATE POLICY "Users can delete their own saved products" 
      ON saved_products FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Tabla price_history (solo si no existe)
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES saved_products(id) ON DELETE CASCADE,
  price NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own price history' AND tablename = 'price_history'
  ) THEN
    CREATE POLICY "Users can view their own price history" 
      ON price_history FOR SELECT 
      USING (
        product_id IN (SELECT id FROM saved_products WHERE user_id = auth.uid())
      );
  END IF;
END
$$;