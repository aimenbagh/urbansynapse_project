-- Initialisation de la base UrbanSynapse AI (PostgreSQL + PostGIS)
-- À exécuter une seule fois, connecté en superutilisateur (postgres).

-- 1. Créer le rôle applicatif
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'urbansynapse') THEN
      CREATE ROLE urbansynapse LOGIN PASSWORD 'urbansynapse';
   END IF;
END
$$;

-- 2. Créer la base (commande à lancer hors transaction — voir guide)
-- CREATE DATABASE urbansynapse OWNER urbansynapse;

-- 3. Une fois connecté à la base "urbansynapse", activer PostGIS :
-- CREATE EXTENSION IF NOT EXISTS postgis;
