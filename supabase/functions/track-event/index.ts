import { createClient } from "npm:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "";

const cors = {
  "Access-Control-Allow-Origin": allowedOrigin || "null",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const db = createClient(url, serviceKey);

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok",{headers:cors});
  if (req.method !== "POST") return Response.json({error:"Method not allowed"},{status:405,headers:cors});
  const origin = req.headers.get("origin") || "";
  if (!allowedOrigin || origin !== allowedOrigin) return Response.json({error:"Origin not allowed"},{status:403,headers:cors});

  try {
    const body = await req.json();
    const {slug,eventType,buttonId,sessionToken}=body;
    if (typeof slug!=="string" || !/^[a-f0-9-]{20,80}$/i.test(slug)) throw new Error("Invalid slug");
    if (!["page_view","qr_entry","button_click"].includes(eventType)) throw new Error("Invalid event");
    if (typeof sessionToken!=="string" || !/^[a-f0-9]{32,64}$/i.test(sessionToken)) throw new Error("Invalid session");
    if (eventType==="button_click" && (typeof buttonId!=="string" || !/^[a-zA-Z0-9_-]{1,60}$/.test(buttonId))) throw new Error("Invalid button");

    const {data:site,error:siteErr}=await db.from("published_sites").select("id").eq("slug",slug).eq("is_published",true).maybeSingle();
    if(siteErr || !site) throw new Error("Site not found");

    const sessionHash=await sha256(sessionToken);
    const day=new Date().toISOString().slice(0,10);
    const {error:sessionErr}=await db.from("analytics_sessions").upsert(
      {site_id:site.id,session_hash:sessionHash,session_date:day},
      {onConflict:"site_id,session_hash,session_date",ignoreDuplicates:true}
    );
    if(sessionErr) throw sessionErr;

    const {error:eventErr}=await db.from("analytics_events").insert({
      site_id:site.id,event_type:eventType,button_id:eventType==="button_click"?buttonId:null
    });
    if(eventErr) throw eventErr;

    return Response.json({ok:true},{headers:cors});
  } catch {
    return Response.json({error:"Event rejected"},{status:400,headers:cors});
  }
});
    
