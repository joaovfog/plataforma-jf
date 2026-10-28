-- ============================================================
-- Plataforma JF — Seed de desenvolvimento
-- Cria: JF Imóveis, Construtora Horizonte (fictícia), parceria
-- ativa e o Residencial Maré Alta com torre, unidades e tabela.
-- Usuários: crie via Supabase Auth e insira em profiles (ver README).
-- ============================================================

insert into organizations (id, type, name, cnpj, city) values
  ('a0000000-0000-4000-8000-000000000001', 'imobiliaria', 'JF Imóveis', '00.000.000/0001-01', 'Itapema'),
  ('a0000000-0000-4000-8000-000000000002', 'construtora', 'Construtora Horizonte', '00.000.000/0001-02', 'Itapema');

insert into partnerships (construtora_id, imobiliaria_id, status, commission_pct) values
  ('a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'ativa', 4.00);

insert into developments
  (id, construtora_id, name, slug, status, description, neighborhood, city,
   delivery_date, amenities, published_at)
values
  ('b0000000-0000-4000-8000-000000000001',
   'a0000000-0000-4000-8000-000000000002',
   'Residencial Maré Alta', 'mare-alta', 'em_obras',
   'Frente mar em Meia Praia: 3 e 4 suítes com vista permanente para o Atlântico.',
   'Meia Praia', 'Itapema', '2027-12-01',
   '["Beach club","Piscina infinita","Spa & sauna","Academia panorâmica","Coworking","Rooftop"]',
   now());

insert into towers (id, development_id, name, floors, units_per_floor) values
  ('c0000000-0000-4000-8000-000000000001',
   'b0000000-0000-4000-8000-000000000001', 'Torre Única', 32, 2);

insert into units
  (id, development_id, tower_id, unit_number, floor, column_ref, typology,
   bedrooms, suites, parking_spots, private_area, status)
values
  ('d0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','1201',12,'01','3 suítes',3,3,2,143.00,'disponivel'),
  ('d0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','1202',12,'02','4 suítes',4,4,3,178.00,'reservada'),
  ('d0000000-0000-4000-8000-000000000003','b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','1301',13,'01','3 suítes',3,3,2,143.00,'disponivel'),
  ('d0000000-0000-4000-8000-000000000004','b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','1302',13,'02','4 suítes',4,4,3,178.00,'vendida'),
  ('d0000000-0000-4000-8000-000000000005','b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','1401',14,'01','3 suítes',3,3,2,143.00,'disponivel'),
  ('d0000000-0000-4000-8000-000000000006','b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','1402',14,'02','4 suítes',4,4,3,178.00,'bloqueada');

insert into price_tables
  (id, development_id, version, status, valid_from, general_terms, published_at)
values
  ('e0000000-0000-4000-8000-000000000001',
   'b0000000-0000-4000-8000-000000000001', 1, 'publicada', current_date,
   '{"entrada_pct": 20, "reforcos": "semestrais", "correcao": "CUB/SC"}', now());

insert into price_table_items (price_table_id, unit_id, price) values
  ('e0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000001',1890000.00),
  ('e0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000002',2450000.00),
  ('e0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000003',1920000.00),
  ('e0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000004',2480000.00),
  ('e0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000005',1950000.00),
  ('e0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000006',2510000.00);

update developments set min_price_cache = 1890000.00
  where id = 'b0000000-0000-4000-8000-000000000001';

insert into materials (development_id, type, title, external_url, is_public) values
  ('b0000000-0000-4000-8000-000000000001','tour_virtual','Tour virtual 360°','https://example.com/tour-mare-alta', true);
