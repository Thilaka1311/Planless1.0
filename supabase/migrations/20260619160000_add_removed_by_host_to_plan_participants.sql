-- Migration to add removed_by_host column to plan_participants table
ALTER TABLE plan_participants ADD COLUMN removed_by_host BOOLEAN DEFAULT false;
