-- Madhura Tex demo textile inventory. Existing products are preserved.

INSERT INTO public.categories (name_en, name_ta, is_active, sort_order)
VALUES ('Textiles', 'துணிகள்', TRUE, 10)
ON CONFLICT (name_en) DO UPDATE SET
  is_active = TRUE,
  updated_at = NOW();

WITH demo_products(
  product_name, sku, price, purchase_price, mrp, stock_quantity,
  low_stock_alert, sort_order, description
) AS (
  VALUES
    ('Premium Cotton Fabric', 'MT-COT-001', 120, 78, 150, 150, 10, 1001, 'Soft premium cotton fabric for everyday tailoring.'),
    ('Printed Cotton Fabric', 'MT-COT-002', 145, 94, 180, 95, 10, 1002, 'Colorful printed cotton fabric for dresses and kurtas.'),
    ('Pure Linen Fabric', 'MT-LIN-001', 280, 185, 340, 60, 8, 1003, 'Breathable pure linen fabric with a natural finish.'),
    ('Rayon Printed Fabric', 'MT-RAY-001', 175, 112, 220, 80, 10, 1004, 'Fluid rayon printed fabric for comfortable apparel.'),
    ('Polyester Fabric', 'MT-POL-001', 110, 68, 140, 200, 15, 1005, 'Durable polyester fabric for uniforms and daily wear.'),
    ('Silk Blend Fabric', 'MT-SIL-001', 450, 295, 560, 45, 8, 1006, 'Elegant silk blend fabric for festive and occasion wear.'),
    ('Georgette Fabric', 'MT-GEO-001', 220, 142, 275, 70, 8, 1007, 'Lightweight georgette fabric with a graceful drape.'),
    ('Chiffon Fabric', 'MT-CHF-001', 190, 122, 240, 0, 10, 1008, 'Sheer chiffon fabric for dupattas and occasion wear.'),
    ('Denim Fabric', 'MT-DEN-001', 250, 165, 310, 100, 10, 1009, 'Medium-weight denim fabric for jackets and bottoms.'),
    ('Velvet Fabric', 'MT-VEL-001', 380, 250, 475, 5, 10, 1010, 'Rich velvet fabric for premium festive garments.'),
    ('Cotton Lycra Fabric', 'MT-LYC-001', 210, 136, 260, 75, 8, 1011, 'Stretch cotton lycra fabric for fitted clothing.'),
    ('Embroidered Fabric', 'MT-EMB-001', 550, 360, 680, 3, 10, 1012, 'Decorative embroidered fabric for bridal and party wear.')
), resolved AS (
  SELECT
    c.id AS category_id,
    c.name_en AS category_name,
    demo_products.*
  FROM demo_products
  CROSS JOIN public.categories c
  WHERE LOWER(c.name_en) = LOWER('Textiles')
)
INSERT INTO public.products (
  name, name_ta, tamil_name, category, category_id, price, purchase_price, mrp,
  gst_percent, unit_type, unit_label, unit, base_quantity, stock_quantity,
  opening_stock, stock, stock_unit, low_stock_alert, allow_decimal_quantity,
  predefined_options, description, is_active, sort_order, sku, barcode, brand,
  supplier, rating, has_variants
)
SELECT
  resolved.product_name,
  '',
  '',
  resolved.category_name,
  resolved.category_id,
  resolved.price,
  resolved.purchase_price,
  resolved.mrp,
  5,
  'unit',
  'meter',
  'meter',
  1,
  resolved.stock_quantity,
  resolved.stock_quantity,
  FLOOR(resolved.stock_quantity)::INTEGER,
  'meter',
  resolved.low_stock_alert,
  TRUE,
  '[]'::JSONB,
  resolved.description,
  TRUE,
  resolved.sort_order,
  resolved.sku,
  resolved.sku,
  'Madhura Tex',
  'Madhura Tex Textiles',
  5,
  FALSE
FROM resolved
WHERE NOT EXISTS (
  SELECT 1
  FROM public.products p
  WHERE p.category_id = resolved.category_id
    AND LOWER(BTRIM(p.name)) = LOWER(BTRIM(resolved.product_name))
);
