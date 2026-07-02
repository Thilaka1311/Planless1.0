-- Migration: 030_rename_circle_role_enum_values
-- Description: Rename enum values of circle_role to lower-case canonical roles

ALTER TYPE circle_role RENAME VALUE 'CREATOR' TO 'host';
ALTER TYPE circle_role RENAME VALUE 'ADMIN' TO 'co_host';
ALTER TYPE circle_role RENAME VALUE 'MEMBER' TO 'member';
