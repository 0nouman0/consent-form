/**
 * Access-control regression tests against a real Supabase project.
 *
 * These encode the security findings from the review so they cannot silently return:
 *   - consent_history was readable by anyone with the public key
 *   - a doctor could edit their own role / credits
 *   - credit functions were callable by end users
 *
 * Configuration (CI secrets or .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY          anonymous checks
 *   TEST_DOCTOR_EMAIL / TEST_DOCTOR_PASSWORD   a NON-admin account           doctor checks
 *   TEST_ADMIN_EMAIL  / TEST_ADMIN_PASSWORD    an admin account              admin checks
 * Use dedicated test accounts, ideally on a staging project. Every probe is read-only except one write attempt
 * on the test doctor's OWN credits/role, which must be refused (and is undone if it is not).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { cfg, SKIP_NO_ADMIN, SKIP_NO_DOCTOR, SKIP_NO_SUPABASE } from "../support/env";
import { LOCKED_FUNCTIONS, PRIVATE_TABLES, TELEMETRY_PROBE, TELEMETRY_TABLES, call, isRefusal, login, rowsReturned } from "../support/supabase";

/* ───────────── anonymous (no login at all) ───────────── */

for (const table of PRIVATE_TABLES) {
  test(`anonymous cannot read ${table}`, { skip: SKIP_NO_SUPABASE }, async () => {
    const r = await call("GET", `/rest/v1/${table}?select=*&limit=5`);
    assert.equal(rowsReturned(r), 0, `LEAK: anonymous read ${rowsReturned(r)} row(s) from ${table}`);
    assert.ok(r.status === 200 || isRefusal(r), `unexpected status ${r.status} for ${table}`);
  });
}

for (const table of TELEMETRY_TABLES) {
  test(`anonymous cannot read ${table}`, { skip: SKIP_NO_SUPABASE }, async () => {
    const r = await call("GET", `/rest/v1/${table}?select=*&limit=5`);
    assert.equal(rowsReturned(r), 0, `LEAK: anonymous read rows from ${table}`);
    assert.ok(r.status === 200 || r.status === 404 || isRefusal(r), `unexpected status ${r.status}`);
  });
  test(`anonymous cannot write to ${table}`, { skip: SKIP_NO_SUPABASE }, async () => {
    const r = await call("POST", `/rest/v1/${table}`, { body: TELEMETRY_PROBE[table] });
    // 404 = migration not applied yet. A 400 would mean the probe body is invalid, which proves nothing.
    assert.ok(isRefusal(r) || r.status === 404, `anonymous insert into ${table} was not refused (${r.status} ${r.body?.code}: ${r.body?.message})`);
  });
}

for (const fn of LOCKED_FUNCTIONS) {
  test(`anonymous cannot execute ${fn.name}()`, { skip: SKIP_NO_SUPABASE }, async () => {
    const r = await call("POST", `/rest/v1/rpc/${fn.name}`, { body: fn.args });
    if (fn.mayBeAbsent && r.body?.code === "PGRST202") return; // function not installed yet: nothing exposed
    assert.equal(
      r.body?.code,
      "42501",
      `${fn.name} is not locked down (status ${r.status}, code ${r.body?.code}: ${r.body?.message}). ` +
        (r.body?.code === "PGRST202" ? "The probe signature no longer matches the function." : "EXECUTE must be revoked from anon.")
    );
  });
}

test("the removed password-reset function stays removed", { skip: SKIP_NO_SUPABASE }, async () => {
  const r = await call("POST", "/rest/v1/rpc/reset_password_direct", {
    body: { p_email: "nobody@example.invalid", p_new_password: "Testing12345", p_verification_code: null },
  });
  assert.equal(r.body?.code, "PGRST202", "reset_password_direct exists again: an unauthenticated account-takeover route");
});

/* ───────────── signed-in doctor (non-admin) ───────────── */

test("a doctor sees only their own rows everywhere", { skip: SKIP_NO_DOCTOR }, async () => {
  const me = await login(cfg.doctor.email, cfg.doctor.password);
  const profile = await call("GET", "/rest/v1/profiles?select=id,role", { token: me.token });
  assert.equal(profile.status, 200);
  assert.equal(profile.body.length, 1, "doctor can see other users' profiles");
  assert.equal(profile.body[0].id, me.id);
  assert.notEqual(profile.body[0].role, "admin", "TEST_DOCTOR_* must be a non-admin account for these checks to mean anything");

  for (const table of ["transactions", "credit_history", "generation_audit", "consent_history"]) {
    const r = await call("GET", `/rest/v1/${table}?select=user_id&limit=1000`, { token: me.token });
    assert.equal(r.status, 200, `${table}: status ${r.status}`);
    const foreign = (r.body as Array<{ user_id: string }>).filter((row) => row.user_id !== me.id);
    assert.equal(foreign.length, 0, `LEAK: doctor can read ${foreign.length} row(s) of ${table} that belong to someone else`);
  }
});

test("a doctor cannot read or write telemetry or admin logs", { skip: SKIP_NO_DOCTOR }, async () => {
  const me = await login(cfg.doctor.email, cfg.doctor.password);
  for (const table of [...TELEMETRY_TABLES, "luffy_admin_logs"]) {
    const r = await call("GET", `/rest/v1/${table}?select=*&limit=5`, { token: me.token });
    assert.equal(rowsReturned(r), 0, `LEAK: doctor read rows from ${table}`);
  }
  for (const table of TELEMETRY_TABLES) {
    const w = await call("POST", `/rest/v1/${table}`, { token: me.token, body: TELEMETRY_PROBE[table] });
    assert.ok(isRefusal(w) || w.status === 404, `doctor insert into ${table} was not refused (${w.status} ${w.body?.code}: ${w.body?.message})`);
    // and cannot tamper with or erase what is already there (filter matches no row, so even a regression is harmless)
    const u = await call("PATCH", `/rest/v1/${table}?id=eq.-1`, { token: me.token, body: TELEMETRY_PROBE[table] });
    assert.ok(isRefusal(u) || u.status === 404, `doctor UPDATE of ${table} was not refused (${u.status})`);
    const d = await call("DELETE", `/rest/v1/${table}?id=eq.-1`, { token: me.token });
    assert.ok(isRefusal(d) || d.status === 404, `doctor DELETE from ${table} was not refused (${d.status})`);
  }
});

for (const fn of LOCKED_FUNCTIONS) {
  test(`a signed-in doctor cannot execute ${fn.name}()`, { skip: SKIP_NO_DOCTOR }, async () => {
    const me = await login(cfg.doctor.email, cfg.doctor.password);
    const r = await call("POST", `/rest/v1/rpc/${fn.name}`, { token: me.token, body: fn.args });
    if (fn.mayBeAbsent && r.body?.code === "PGRST202") return;
    assert.equal(r.body?.code, "42501", `${fn.name} is callable by signed-in users (status ${r.status}, code ${r.body?.code}: ${r.body?.message})`);
  });
}

test("a doctor cannot raise their own credits or role", { skip: SKIP_NO_DOCTOR }, async () => {
  const me = await login(cfg.doctor.email, cfg.doctor.password);
  const before = (await call("GET", `/rest/v1/profiles?select=credits,role&id=eq.${me.id}`, { token: me.token })).body[0];
  try {
    const credits = await call("PATCH", `/rest/v1/profiles?id=eq.${me.id}`, { token: me.token, body: { credits: Number(before.credits) + 1 }, prefer: "return=representation" });
    assert.ok(isRefusal(credits), `PRIVILEGE ESCALATION: doctor changed their own credits (status ${credits.status})`);

    const role = await call("PATCH", `/rest/v1/profiles?id=eq.${me.id}`, { token: me.token, body: { role: "admin" }, prefer: "return=representation" });
    assert.ok(isRefusal(role), `PRIVILEGE ESCALATION: doctor changed their own role (status ${role.status})`);

    const after = (await call("GET", `/rest/v1/profiles?select=credits,role&id=eq.${me.id}`, { token: me.token })).body[0];
    assert.deepEqual(after, before, "profile privileged columns changed");
  } finally {
    // Undo, in case protection ever regresses and a write got through: leave the test account as we found it.
    await call("PATCH", `/rest/v1/profiles?id=eq.${me.id}`, { token: me.token, body: { credits: before.credits, role: before.role } });
  }
});

test("a doctor can still edit their normal profile fields (the fix must not break the app)", { skip: SKIP_NO_DOCTOR }, async () => {
  const me = await login(cfg.doctor.email, cfg.doctor.password);
  const cur = (await call("GET", `/rest/v1/profiles?select=doctor_name&id=eq.${me.id}`, { token: me.token })).body[0];
  const r = await call("PATCH", `/rest/v1/profiles?id=eq.${me.id}`, { token: me.token, body: { doctor_name: cur.doctor_name }, prefer: "return=representation" });
  assert.equal(r.status, 200, `normal profile update was refused (${r.status}: ${JSON.stringify(r.body)})`);
});

/* ───────────── signed-in admin ───────────── */

test("an admin account really is an admin and can read the admin-only tables", { skip: SKIP_NO_ADMIN }, async () => {
  const admin = await login(cfg.admin.email, cfg.admin.password);
  const me = await call("GET", `/rest/v1/profiles?select=role&id=eq.${admin.id}`, { token: admin.token });
  assert.equal(me.body[0]?.role, "admin", "TEST_ADMIN_* must be an admin account");
  const profiles = await call("GET", "/rest/v1/profiles?select=id", { token: admin.token });
  assert.equal(profiles.status, 200);
  assert.ok(profiles.body.length >= 1);
  for (const table of TELEMETRY_TABLES) {
    const r = await call("GET", `/rest/v1/${table}?select=id&limit=1`, { token: admin.token });
    assert.ok(r.status === 200 || r.status === 404, `admin cannot read ${table} (${r.status}); 404 = migration not applied yet`);
  }
});
