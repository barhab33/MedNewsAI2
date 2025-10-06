/**
 * Prints SQL you can paste in Supabase SQL Editor to (re)apply RLS/policies safely.
 * This script does NOT run DDL directly (by design).
 */

const SQL = `
-- Enable RLS
alter table medical_news enable row level security;

-- Allow anon read-only (adjust to your needs)
drop policy if exists "anon read medical_news" on medical_news;
create policy "anon read medical_news"
on medical_news for select
to anon
using (true);
`;

console.log("\n-- Paste the following into Supabase SQL editor:\n");
console.log(SQL.trim());
console.log("\n-- NOTE: Service role bypasses RLS in your server/CI scripts.\n");
