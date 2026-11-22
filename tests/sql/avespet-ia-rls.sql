\set ON_ERROR_STOP on
-- Exclusivamente em PostgreSQL descartável, criado para este teste.
-- A guarda falha antes de qualquer DDL se não for o banco de teste.
DO $$ BEGIN
 IF current_database() <> 'avespet_ia_rls_test' OR to_regclass('public.aves') IS NOT NULL OR to_regnamespace('auth') IS NOT NULL THEN
   RAISE EXCEPTION 'Banco não descartável: abortado';
 END IF;
END $$;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE anon NOLOGIN;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
GRANT USAGE ON SCHEMA auth TO authenticated, anon;
CREATE TABLE public.aves(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES auth.users(id));
ALTER TABLE public.aves ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.aves TO authenticated;
CREATE POLICY aves_own ON public.aves FOR SELECT TO authenticated USING(user_id=auth.uid());
INSERT INTO auth.users VALUES ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
INSERT INTO public.aves VALUES ('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000022','00000000-0000-4000-8000-000000000002');
\ir ../../docs/sql/avespet-ia-perfis-proposta.sql
\ir ../../docs/sql/avespet-ia-diario-proposta.sql
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
INSERT INTO public.avespet_ia_preferencias(user_id,ave_ativa_id) VALUES ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011');
INSERT INTO public.avespet_ia_perfis_ave(user_id,ave_id,fase) VALUES ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','papa');
INSERT INTO public.avespet_ia_diario(user_id,ave_id,data_registro,peso_gramas) VALUES ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011',current_date,100);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.avespet_ia_perfis_ave)<>1 OR (SELECT count(*) FROM public.avespet_ia_diario)<>1 OR (SELECT count(*) FROM public.avespet_ia_preferencias)<>1 THEN RAISE EXCEPTION 'Leitura própria falhou'; END IF;
 UPDATE public.avespet_ia_perfis_ave SET fase='transicao';
 IF NOT FOUND THEN RAISE EXCEPTION 'Update próprio falhou'; END IF;
 BEGIN
  INSERT INTO public.avespet_ia_perfis_ave(user_id,ave_id) VALUES ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000022');
  RAISE EXCEPTION 'Aceitou ave alheia';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  UPDATE public.avespet_ia_preferencias SET ave_ativa_id='00000000-0000-4000-8000-000000000022';
  RAISE EXCEPTION 'Aceitou preferência alheia';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.avespet_ia_diario(user_id,ave_id,data_registro,peso_gramas) VALUES ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000022',current_date,100);
  RAISE EXCEPTION 'Aceitou diário alheio';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.avespet_ia_preferencias) OR EXISTS(SELECT 1 FROM public.avespet_ia_perfis_ave) OR EXISTS(SELECT 1 FROM public.avespet_ia_diario) THEN RAISE EXCEPTION 'Vazamento entre contas'; END IF;
 UPDATE public.avespet_ia_perfis_ave SET fase='incerta';
 IF FOUND THEN RAISE EXCEPTION 'Update cruzado permitido'; END IF;
 DELETE FROM public.avespet_ia_diario;
 IF FOUND THEN RAISE EXCEPTION 'Delete cruzado permitido'; END IF;
 BEGIN
  INSERT INTO public.avespet_ia_perfis_ave(user_id,ave_id) VALUES ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000022');
  RAISE EXCEPTION 'Aceitou user_id alheio';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET ROLE anon;
DO $$ BEGIN
 BEGIN
  PERFORM 1 FROM public.avespet_ia_perfis_ave;
  RAISE EXCEPTION 'Anon acessou perfil';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM 1 FROM public.avespet_ia_diario;
  RAISE EXCEPTION 'Anon acessou diário';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM 1 FROM public.avespet_ia_preferencias;
  RAISE EXCEPTION 'Anon acessou preferências';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT 'RLS: testes concluídos' AS resultado;
