import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { templates } from "./data/templates";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { track } from "./lib/analytics";

function Header({ user }) {
  return <header className="nav">
    <Link className="brand" to="/">♡ LoveNest</Link>
    <nav><a href="/#templates">Templates</a>{user ? <><Link to="/projects">My Projects</Link><button className="textBtn" onClick={() => supabase.auth.signOut()}>Sign out</button></> : <Link to="/login">Login</Link>}</nav>
  </header>;
}

function Home() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => templates.filter(t =>
    (category === "All" || t.category === category) &&
    t.title.toLowerCase().includes(search.toLowerCase())
  ), [category, search]);
  return <><section className="hero">
    <div><span className="eyebrow">MADE WITH LOVE ♡</span><h1>Create Something<br/><em>Beautifully Yours.</em></h1>
      <p>Turn your feelings into beautiful little websites. Choose a template, customize your story, and share it with a QR code.</p>
      <a className="btn" href="#templates">Explore 30 Templates →</a>
      <div className="stats"><span><b>30</b> Templates</span><span><b>100%</b> Free to start</span><span><b>♡</b> Made for love</span></div>
    </div><div className="heroCard"><span>🌷</span><small>TO MY FAVORITE PERSON</small><h2>You make<br/>my world<br/>beautiful.</h2><p>With love, always ♡</p></div>
  </section>
  <section className="section" id="templates"><div className="center"><span className="eyebrow">FIND YOUR STYLE</span><h2>Explore Our <em>Templates</em></h2><p>Pick a starting point. Make it yours.</p></div>
    <input className="search" placeholder="Search templates..." value={search} onChange={e=>setSearch(e.target.value)}/>
    <div className="chips">{["All","Cute Love","Anniversary","Birthday","Apology","Proposal","Long Distance"].map(c=><button className={category===c?"chip active":"chip"} onClick={()=>setCategory(c)} key={c}>{c}</button>)}</div>
    <div className="grid">{filtered.map(t=><article className="template" key={t.id}><div className="thumb" style={{background:t.config.background}}><span>{t.emoji}</span><b>{t.title}</b></div><div className="templateFoot"><div><b>{t.title}</b><small>{t.category}</small></div><Link className="smallBtn" to={`/edit/${t.id}`}>Customize →</Link></div></article>)}</div>
  </section><section className="about"><span className="eyebrow">YOUR STORY, YOUR WAY</span><h2>Love is personal.<br/><em>Your website should be too.</em></h2><p>Choose. Customize. Create. Share.</p></section></>;
}

function Auth({ onAuth }) {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [mode,setMode]=useState("login"); const [msg,setMsg]=useState("");
  async function submit(e){e.preventDefault();setMsg(""); if(!supabase){setMsg("Connect Supabase first using .env.local.");return;}
    const result = mode==="login" ? await supabase.auth.signInWithPassword({email,password}) : await supabase.auth.signUp({email,password});
    if(result.error) setMsg(result.error.message); else setMsg(mode==="login"?"Signed in.":"Account created. Check your email if confirmation is enabled.");
    onAuth?.();
  }
  return <div className="narrow card"><h2>{mode==="login"?"Welcome back":"Create your account"} ♡</h2><form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Password<input type="password" minLength="8" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="btn">{mode==="login"?"Login":"Create account"}</button></form><button className="textBtn" onClick={()=>setMode(mode==="login"?"signup":"login")}>{mode==="login"?"Need an account? Sign up":"Already registered? Login"}</button>{msg&&<p className="notice">{msg}</p>}</div>;
}

function Editor({ user }) {
  const { templateId } = useParams(); const nav=useNavigate();
  const template=templates.find(t=>t.id===templateId)||templates[0];
  const [form,setForm]=useState({...template.config}); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  const update=(k,v)=>setForm(old=>({...old,[k]:v}));
  async function saveAndPublish(e){e.preventDefault(); if(!user){nav("/login");return;} if(!supabase)return setMessage("Connect Supabase first.");
    setBusy(true);setMessage("");
    try {
      const {data:project,error}=await supabase.from("projects").insert({user_id:user.id,title:form.title,content_json:{...form,templateId}}).select().single();
      if(error)throw error;
      const slug=crypto.randomUUID().replaceAll("-","");
      const {error:pubError}=await supabase.from("published_sites").insert({project_id:project.id,slug,is_published:true});
      if(pubError)throw pubError;
      nav(`/generated/${slug}`);
    } catch(err){setMessage(err.message||"Could not publish project.");}
    finally{setBusy(false);}
  }
  return <section className="section editorWrap"><div className="center"><span className="eyebrow">MAKE IT YOURS</span><h2>Customize your <em>love story</em></h2></div><div className="editorGrid"><form className="card editorForm" onSubmit={saveAndPublish}>
    <label>Website title<input value={form.title} onChange={e=>update("title",e.target.value)}/></label>
    <label>Your name<input value={form.fromName} onChange={e=>update("fromName",e.target.value)}/></label>
    <label>Special person's name<input value={form.toName} onChange={e=>update("toName",e.target.value)}/></label>
    <label>Your message<textarea rows="5" value={form.message} onChange={e=>update("message",e.target.value)}/></label>
    <label>Background color<input type="color" value={form.background} onChange={e=>update("background",e.target.value)}/></label>
    <label>Button text<input value={form.buttonText} onChange={e=>update("buttonText",e.target.value)}/></label>
    <button className="btn" disabled={busy}>{busy?"Publishing...":"Generate Website & QR →"}</button>{message&&<p className="notice">{message}</p>}
    {!user&&<p className="muted">Login is required to save and publish your project.</p>}
  </form><div className="preview" style={{background:form.background}}><span>♡ LOVE NOTE ♡</span><h2>{form.title}</h2><p>To {form.toName},</p><p>{form.message}</p><button>{form.buttonText}</button><small>With love, {form.fromName}</small></div></div></section>;
}

function Generated(){const {slug}=useParams();const url=`${window.location.origin}/p/${slug}`;const qrUrl=`${url}?source=qr`;return <section className="narrow card center"><span className="eyebrow">PUBLISHED SUCCESSFULLY</span><h2>Your website is ready! ♡</h2><div className="qr"><QRCodeCanvas value={qrUrl} size={220} includeMargin/></div><p className="muted">Scan to open your published website.</p><input readOnly value={url}/><a className="btn" href={url}>Open Website →</a><button className="outlineBtn" onClick={()=>{const a=document.createElement("a");a.download="LoveNest-QR.png";a.href=document.querySelector(".qr canvas").toDataURL("image/png");a.click();}}>Download QR PNG</button><button className="textBtn" onClick={()=>navigator.clipboard.writeText(url)}>Copy link</button></section>}

function PublicSite(){const {slug}=useParams();const [site,setSite]=useState(null);const [err,setErr]=useState("");const [search]=useSearchParams();
  useEffect(()=>{let alive=true;(async()=>{if(!supabase){setErr("Site service is not connected.");return;}
    const {data,error}=await supabase.from("published_sites").select("id,project_id").eq("slug",slug).eq("is_published",true).maybeSingle();
    if(error||!data){setErr("This website could not be found.");return;}
    const {data:p,error:pe}=await supabase.from("projects").select("content_json").eq("id",data.project_id).single();
    if(pe||!p){setErr("This website is unavailable.");return;}
    if(alive){setSite(p.content_json);track(slug,search.get("source")==="qr"?"qr_entry":"page_view");}
  })();return()=>{alive=false;};},[slug]);
  if(err)return <div className="narrow card center"><h2>{err}</h2><Link to="/">LoveNest Home</Link></div>;
  if(!site)return <div className="center section">Loading love story...</div>;
  return <div className="publicPage" style={{background:site.background}}><div className="publicCard"><span>♡ A LITTLE LOVE NOTE ♡</span><h1>{site.title}</h1><h3>To {site.toName},</h3><p>{site.message}</p><button onClick={()=>track(slug,"button_click","main-love-button")}>{site.buttonText}</button><small>With love, {site.fromName}</small></div></div>;
}

function Projects({user}){const [items,setItems]=useState([]);const [err,setErr]=useState("");
 useEffect(()=>{(async()=>{if(!user||!supabase)return;const {data,error}=await supabase.from("projects").select("id,title,updated_at,published_sites(id,slug,is_published)").order("updated_at",{ascending:false});if(error)setErr(error.message);else setItems(data||[]);})();},[user]);
 if(!user)return <Navigate to="/login"/>;return <section className="section"><div className="center"><span className="eyebrow">YOUR CREATIONS</span><h2>My <em>Projects</em></h2></div>{err&&<p className="notice">{err}</p>}<div className="grid">{items.map(p=><article className="card" key={p.id}><h3>{p.title}</h3><small>{p.published_sites?.[0]?.is_published?"Published":"Draft"}</small>{p.published_sites?.[0]&&<><Link className="smallBtn" to={`/generated/${p.published_sites[0].slug}`}>QR & Share</Link><Link className="smallBtn" to={`/analytics/${p.published_sites[0].id}`}>Analytics</Link></>}</article>)}</div></section>;
}

function Analytics({user}){const {siteId}=useParams();const [data,setData]=useState({page:0,qr:0,clicks:0,sessions:0});const [err,setErr]=useState("");
 useEffect(()=>{(async()=>{if(!user||!supabase)return;
 const queries=["page_view","qr_entry","button_click"].map(type=>supabase.from("analytics_events").select("id",{count:"exact",head:true}).eq("site_id",siteId).eq("event_type",type));
 const [p,q,c,s]=await Promise.all([...queries,supabase.from("analytics_sessions").select("id",{count:"exact",head:true}).eq("site_id",siteId)]);
 if(p.error||q.error||c.error||s.error){setErr("Analytics unavailable.");return;}setData({page:p.count||0,qr:q.count||0,clicks:c.count||0,sessions:s.count||0});
 })();},[user,siteId]);
 return <section className="section narrow"><h2>Project Analytics ♡</h2>{err&&<p>{err}</p>}<div className="statsGrid">{[["Page Views",data.page],["QR Entries",data.qr],["Button Clicks",data.clicks],["Anonymous Sessions",data.sessions]].map(x=><div className="card" key={x[0]}><b>{x[1]}</b><small>{x[0]}</small></div>)}</div><p className="muted">Anonymous estimates only. No visitor identity is collected.</p></section>;
}

function Admin({user}){const [role,setRole]=useState(null);const [stats,setStats]=useState({users:"—",templates:templates.length,sites:"—"});
 useEffect(()=>{(async()=>{if(!user||!supabase)return;const {data}=await supabase.from("user_roles").select("role").eq("user_id",user.id).maybeSingle();setRole(data?.role||"user");})();},[user]);
 if(!user)return <Navigate to="/login"/>;if(role===null)return <p className="center section">Checking admin permission...</p>;if(role!=="super_admin"&&role!=="admin"&&role!=="moderator")return <section className="narrow card center"><h2>Access denied</h2><p>Admin permission is required.</p></section>;
 return <section className="section"><div className="center"><span className="eyebrow">PLATFORM CONTROL</span><h2>LoveNest <em>Admin</em></h2><p>Signed in as {role}</p></div><div className="statsGrid"><div className="card"><b>{stats.users}</b><small>Users — configure server-side count</small></div><div className="card"><b>{stats.templates}</b><small>Starter Templates</small></div><div className="card"><b>{stats.sites}</b><small>Published Sites — configure count</small></div></div><div className="card"><h3>Admin tools</h3><p>Template moderation, user management and platform-wide reports require additional protected server functions before enabling destructive actions.</p><p className="muted">Never grant yourself admin access from the browser. Use the one-time SQL setup instructions.</p></div></section>;
}

export default function App(){const [user,setUser]=useState(null);const [loading,setLoading]=useState(true);
 useEffect(()=>{if(!supabase){setLoading(false);return;}supabase.auth.getSession().then(({data})=>{setUser(data.session?.user||null);setLoading(false);});const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setUser(s?.user||null));return()=>subscription.unsubscribe();},[]);
 if(loading)return <div className="center section">Loading LoveNest...</div>;
 return <><Header user={user}/>{!isSupabaseConfigured&&<div className="setupNotice">Setup needed: connect your Supabase project in <code>.env.local</code>. The template gallery works without it.</div>}<Routes>
 <Route path="/" element={<Home/>}/><Route path="/login" element={<Auth onAuth={()=>{}}/>}/>
 <Route path="/edit/:templateId" element={<Editor user={user}/>}/>
 <Route path="/generated/:slug" element={<Generated/>}/>
 <Route path="/p/:slug" element={<PublicSite/>}/>
 <Route path="/projects" element={<Projects user={user}/>}/>
 <Route path="/analytics/:siteId" element={<Analytics user={user}/>}/>
 <Route path="/admin/*" element={<Admin user={user}/>}/>
 <Route path="*" element={<div className="section center"><h2>Page not found</h2><Link to="/">Go Home</Link></div>}/>
 </Routes><footer><Link className="brand" to="/">♡ LoveNest</Link><small>Made with love, for love. © 2026</small><Link to="/admin">Admin</Link></footer></>;
}
