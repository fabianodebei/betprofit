// Admin Delete User Edge Function
// Verifies admin privileges and deletes a user and their data

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const requestSchema = z.object({
  user_id: z.string().uuid(),
});

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...corsHeaders } });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Auth client (for getting current user from JWT)
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !authData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Service client to perform privileged operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify admin role
    const { data: roleRow, error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleErr || !roleRow) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate request body
    const body = await req.json().catch(() => ({}));
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      console.error("Validation failed:", parsed.error.flatten());
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const targetUserId = parsed.data.user_id;

    // Log the admin action BEFORE deletion
    try {
      await supabaseAdmin.from("admin_audit_log").insert({
        admin_user_id: authData.user.id,
        action: "DELETE_USER",
        target_user_id: targetUserId,
        details: { 
          timestamp: new Date().toISOString(),
          ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
        },
      });
    } catch (auditErr) {
      console.error("Failed to log audit:", auditErr);
      // Continue with deletion even if audit logging fails
    }

    // Best-effort cleanup of user data in public tables
    const tables = [
      "user_telegram_config",
      "accounts",
      "bets",
      "bet_legs",
      "transactions",
      "wallets",
      "reminders",
      "tags",
      "books",
      "intestatari",
      "user_roles",
      "admin_audit_log", // Clean up audit logs for this user too
    ];

    await Promise.all(
      tables.map(async (table) => {
        try {
          await supabaseAdmin.from(table).delete().eq("user_id", targetUserId);
        } catch (_) {
          // ignore missing tables
        }
      })
    );

    // Delete auth user
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (delErr) {
      console.error("Failed to delete user:", delErr.message);
      return new Response(JSON.stringify({ error: "Failed to delete user" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("Internal error:", String(e));
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});