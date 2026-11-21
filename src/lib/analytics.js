function sessionToken() {
  const key = "lovenest_anon_session";
  let value = sessionStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID().replaceAll("-", "");
    sessionStorage.setItem(key, value);
  }
  return value;
}

export async function track(slug, eventType, buttonId = null) {
  try {
    if (!slug) return;
    const { supabase } = await import("./supabase");
    if (!supabase) return;
    await supabase.functions.invoke("track-event", {
      body: { slug, eventType, buttonId, sessionToken: sessionToken() }
    });
  } catch {
    // Analytics must never prevent a published page from working.
  }
}
  
