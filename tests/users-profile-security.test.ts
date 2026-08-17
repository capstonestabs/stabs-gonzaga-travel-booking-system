import { readFileSync } from "node:fs";
import path from "node:path";

const migrationPath = path.resolve(
  process.cwd(),
  "supabase/migrations/202607230001_fix_users_profile_update_privileges.sql"
);
const schemaPath = path.resolve(process.cwd(), "supabase/current_schema.sql");

function normalizeSql(sql: string) {
  return sql.replace(/--.*$/gm, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function readNormalizedSql(filePath: string) {
  return normalizeSql(readFileSync(filePath, "utf8"));
}

function expectSecureUsersProfileUpdates(sql: string) {
  expect(sql).toContain(
    "revoke insert, update, delete, truncate, references, trigger on table public.users from authenticated"
  );
  expect(sql).toContain(
    "grant update (full_name, phone, avatar_url, avatar_path) on table public.users to authenticated"
  );
  expect(sql).not.toMatch(/grant update \([^)]*\brole\b[^)]*\) on table public\.users to authenticated/);
  expect(sql).not.toContain("grant update on table public.users to authenticated");

  expect(sql).toMatch(
    /create policy "users can update own profile" on public\.users for update to authenticated using \(auth\.uid\(\) = id\) with check \(auth\.uid\(\) = id\)/
  );

  expect(sql).toContain("new.role is distinct from old.role");
  expect(sql).toContain("new.email is distinct from old.email");
  expect(sql).toContain("new.archived_at is distinct from old.archived_at");
  expect(sql).toContain("using errcode = '42501'");
}

describe("public.users profile update security", () => {
  it("prevents a tourist from granting themselves an administrative role", () => {
    const migration = readNormalizedSql(migrationPath);

    expectSecureUsersProfileUpdates(migration);
  });

  it("continues to permit legitimate self-service profile fields", () => {
    const migration = readNormalizedSql(migrationPath);
    const grantedColumns =
      migration.match(
        /grant update \(([^)]*)\) on table public\.users to authenticated/
      )?.[1];

    expect(grantedColumns?.split(",").map((column) => column.trim())).toEqual([
      "full_name",
      "phone",
      "avatar_url",
      "avatar_path"
    ]);
  });

  it("keeps the consolidated schema aligned with the forward migration", () => {
    expectSecureUsersProfileUpdates(readNormalizedSql(schemaPath));
  });
});
