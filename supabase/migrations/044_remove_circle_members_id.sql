-- Description: Remove redundant primary key id from circle_members table and establish composite primary key (circle_id, user_id)

-- 1. Drop primary key constraint on `id`
ALTER TABLE circle_members DROP CONSTRAINT IF EXISTS circle_members_pkey;

-- 2. Drop unique constraint on `(circle_id, user_id)` if it exists
ALTER TABLE circle_members DROP CONSTRAINT IF EXISTS unique_circle_member;

-- 3. Drop the `id` column
ALTER TABLE circle_members DROP COLUMN IF EXISTS id;

-- 4. Establish composite primary key on `(circle_id, user_id)`
ALTER TABLE circle_members ADD PRIMARY KEY (circle_id, user_id);
