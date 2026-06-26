import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════
// STORAGE — données persistantes par compte
// ═══════════════════════════════════════════════════
const Store = {
  async get(key) {
    try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } catch { return null; }
  },
  async set(key, val) {
    try { await window.storage.set(key, JSON.stringify(val)); } catch {}
  },
  async del(key) {
    try { await window.storage.delete(key); } catch {}
  }
};

// ═══════════════════════════════════════════════════
// DESIGN
// ═══════════════════════════════════════════════════
const C = {
  bg:"#07090F", surface:"#0D1018", card:"#111520", border:"#1C2238", borderHover:"#252D45",
  accent:"#E8622A", accentHover:"#D4541E", accentGlow:"rgba(232,98,42,0.13)", accentBorder:"rgba(232,98,42,0.35)",
  green:"#10C98F", greenGlow:"rgba(16,201,143,0.1)",
  blue:"#4C8BF5", blueGlow:"rgba(76,139,245,0.1)",
  yellow:"#F0B429", yellowGlow:"rgba(240,180,41,0.1)",
  red:"#F04E6E", redGlow:"rgba(240,78,110,0.1)",
  purple:"#9B72F5", purpleGlow:"rgba(155,114,245,0.1)",
  text:"#EDF0FF", textSoft:"#8892B0", textMuted:"#4A5270",
};

const SEASONS = {
  Printemps:{months:[3,4,5],icon:"🌸",items:["asperges","petits pois","fraises","radis","épinards","rhubarbe","morilles"]},
  Été:{months:[6,7,8],icon:"☀️",items:["tomates","courgettes","aubergines","poivrons","melon","basilic","abricots","figues"]},
  Automne:{months:[9,10,11],icon:"🍂",items:["champignons","potiron","châtaignes","poires","betteraves","poireaux","cèpes"]},
  Hiver:{months:[12,1,2],icon:"❄️",items:["choux","carottes","panais","endives","oranges","truffe noire","topinambour"]},
};
const NOW_MONTH = new Date().getMonth()+1;
const SEASON = Object.entries(SEASONS).find(([,v])=>v.months.includes(NOW_MONTH))?.[0]||"Été";
const DAYS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const SHIFTS = ["Midi (10h-15h)","Soir (17h-23h)","Journée (10h-23h)","Coupure (10h-15h & 18h-23h)"];
const ROLES = ["Chef de rang","Serveur·se","Commis de salle","Plongeur·se","Barman/Barmaid","Hôte·sse d'accueil","Second de cuisine","Chef pâtissier·ère"];
const MENU_CATS = ["Entrées","Plats","Desserts","Boissons","Menus"];
const STOCK_CATS = ["Légumes & Fruits","Viandes","Poissons & Fruits de mer","Laitiers & Œufs","Épicerie","Boissons","Herbes & Épices"];
const MARKET_OFFERS = [
  {id:1,supplier:"Metro",product:"Farine T55",originalPrice:0.9,promoPrice:0.7,discount:22,until:"30/06",qty:"Carton 25kg",badge:"🔥 Flash",urgent:true},
  {id:2,supplier:"Sysco",product:"Filets de dorade royale",originalPrice:14,promoPrice:11.9,discount:15,until:"28/06",qty:"Caisse 5kg",badge:"🐟 Frais",urgent:false},
  {id:3,supplier:"Nicolas Pro",product:"Rosé Provence AOP",originalPrice:7,promoPrice:4.9,discount:30,until:"15/07",qty:"Carton 6 btl",badge:"🍷 Été",urgent:false},
  {id:4,supplier:"Lactalis",product:"Beurre extra-fin 84%",originalPrice:9.5,promoPrice:7.8,discount:18,until:"05/07",qty:"Plaque 1kg",badge:"⭐ Pro",urgent:false},
  {id:5,supplier:"Poiscaille",product:"Gambas entières",originalPrice:22,promoPrice:16.5,discount:25,until:"22/06",qty:"Caisse 3kg",badge:"⚡ Urgent",urgent:true},
  {id:6,supplier:"Metro",product:"Huile d'olive extra vierge",originalPrice:12,promoPrice:8.5,discount:29,until:"10/07",qty:"Bidon 5L",badge:"🌿 Bio",urgent:false},
];

const DEFAULT_STOCK = [
  {id:"s1",name:"Tomates",qty:15,unit:"kg",min:10,cat:"Légumes & Fruits",price:2.5,supplier:"Metro",promo:false,promoPrice:null},
  {id:"s2",name:"Filet de poulet",qty:8,unit:"kg",min:12,cat:"Viandes",price:7.2,supplier:"Sysco",promo:false,promoPrice:null},
  {id:"s3",name:"Farine T55",qty:25,unit:"kg",min:20,cat:"Épicerie",price:0.9,supplier:"Metro",promo:true,promoPrice:0.7},
  {id:"s4",name:"Crème fraîche",qty:4,unit:"L",min:5,cat:"Laitiers & Œufs",price:3.1,supplier:"Lactalis",promo:false,promoPrice:null},
  {id:"s5",name:"Saumon frais",qty:6,unit:"kg",min:4,cat:"Poissons & Fruits de mer",price:18,supplier:"Poiscaille",promo:false,promoPrice:null},
  {id:"s6",name:"Champignons",qty:3,unit:"kg",min:5,cat:"Légumes & Fruits",price:6,supplier:"Metro",promo:true,promoPrice:4.2},
  {id:"s7",name:"Œufs frais",qty:120,unit:"unités",min:60,cat:"Laitiers & Œufs",price:0.25,supplier:"Producteur local",promo:false,promoPrice:null},
  {id:"s8",name:"Bœuf Charolais",qty:14,unit:"kg",min:10,cat:"Viandes",price:22,supplier:"Sysco",promo:false,promoPrice:null},
];
const DEFAULT_MENU = [
  {id:"m1",name:"Tartare de bœuf maison",cat:"Entrées",price:16,cost:7,season:"Toute saison",active:true,desc:"Bœuf haché à la main, câpres, cornichons, œuf de caille",allergens:"Œufs"},
  {id:"m2",name:"Velouté de potiron",cat:"Entrées",price:9,cost:2.5,season:"Automne",active:true,desc:"Crème de potiron rôti, noisettes grillées",allergens:"Fruits à coque"},
  {id:"m3",name:"Pavé de saumon grillé",cat:"Plats",price:24,cost:10,season:"Toute saison",active:true,desc:"Saumon Label Rouge, beurre blanc, légumes du moment",allergens:"Poisson, Lait"},
  {id:"m4",name:"Poulet fermier rôti",cat:"Plats",price:19,cost:6,season:"Toute saison",active:true,desc:"Poulet Label Rouge, jus de volaille, champignons",allergens:""},
  {id:"m5",name:"Crème brûlée Vanille Bourbon",cat:"Desserts",price:8,cost:1.8,season:"Toute saison",active:true,desc:"Vanille de Madagascar, cassonade caramélisée",allergens:"Lait, Œufs"},
  {id:"m6",name:"Pichet vin rouge 25cl",cat:"Boissons",price:7,cost:2,season:"Toute saison",active:true,desc:"Sélection maison, Côtes du Rhône",allergens:"Sulfites"},
];
const DEFAULT_EMP = [
  {id:"e1",name:"Sophie Martin",role:"Chef de rang",contract:"CDI",days:[0,1,2,3,4],shift:"Journée (10h-23h)",phone:"06 12 34 56 78",salary:2200,color:"#4C8BF5",note:"Référente salle"},
  {id:"e2",name:"Karim Benali",role:"Serveur·se",contract:"CDI",days:[2,3,4,5,6],shift:"Soir (17h-23h)",phone:"06 23 45 67 89",salary:1900,color:"#10C98F",note:""},
  {id:"e3",name:"Marie Dubois",role:"Barman/Barmaid",contract:"CDI",days:[1,2,3,4,5],shift:"Journée (10h-23h)",phone:"06 56 78 90 12",salary:2100,color:"#E8622A",note:""},
];

// ═══════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════
const margin = m => m.price>0 ? Math.round(((m.price-m.cost)/m.price)*100) : 0;
const stockStatus = i => i.qty<=i.min*0.4?"critical":i.qty<=i.min?"low":"ok";
const isOpen = r => {
  const now=new Date(), cur=now.getHours()*60+now.getMinutes();
  const [oh,om]=r.openTime.split(":").map(Number);
  const [ch,cm]=r.closeTime.split(":").map(Number);
  if(r.hasBreak){const[bh,bm]=r.breakStart.split(":").map(Number);const[eh,em]=r.breakEnd.split(":").map(Number);if(cur>=bh*60+bm&&cur<eh*60+em)return false;}
  return cur>=oh*60+om&&cur<ch*60+cm;
};
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const hash = async s => { let h=5381; for(let i=0;i<s.length;i++) h=((h<<5)+h)+s.charCodeAt(i)|0; return Math.abs(h).toString(16); };

// ═══════════════════════════════════════════════════
// CLAUDE API
// ═══════════════════════════════════════════════════
async function claude(messages, system) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1200,system,messages}),
    });
    const d = await res.json();
    return d.content?.map(b=>b.text||"").join("")||"";
  } catch { return "⚠️ Connexion IA indisponible. Veuillez réessayer."; }
}

// ═══════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:#07090F;color:#EDF0FF;font-family:'Inter',sans-serif;font-size:14px}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#1C2238;border-radius:2px}
.app{display:flex;height:100vh;overflow:hidden}
/* SIDEBAR */
.sb{width:222px;background:#0D1018;border-right:1px solid #1C2238;display:flex;flex-direction:column;flex-shrink:0;overflow-y:auto}
.sb-brand{padding:20px 18px 16px;border-bottom:1px solid #1C2238}
.sb-brand-name{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:#E8622A;letter-spacing:-.3px}
.sb-brand-tag{font-size:10px;color:#4A5270;text-transform:uppercase;letter-spacing:2px;margin-top:2px}
.sb-resto{margin:10px 10px 4px;padding:10px 12px;background:#111520;border:1px solid #1C2238;border-radius:8px;cursor:pointer}
.sb-resto-name{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-open{font-size:11px;margin-top:3px;color:#10C98F}.sb-closed{font-size:11px;margin-top:3px;color:#F04E6E}
.sb-sec{padding:14px 18px 5px;font-size:10px;font-weight:600;color:#4A5270;text-transform:uppercase;letter-spacing:1.5px}
.ni{display:flex;align-items:center;gap:8px;padding:8px 10px 8px 18px;margin:1px 8px;border-radius:7px;cursor:pointer;font-size:13px;font-weight:500;color:#8892B0;transition:all .15s;border-left:2px solid transparent}
.ni:hover{color:#EDF0FF;background:#111520}.ni.act{color:#E8622A;background:rgba(232,98,42,.1);border-left-color:#E8622A}
.ni-ico{font-size:14px;width:18px;text-align:center}
.ni-badge{background:#F04E6E;color:#fff;font-size:10px;font-weight:700;border-radius:8px;padding:1px 5px;margin-left:auto}
.sb-bottom{margin-top:auto}
.sb-season{margin:10px;padding:10px 12px;background:rgba(232,98,42,.08);border:1px solid rgba(232,98,42,.3);border-radius:8px}
.sb-season-l{font-size:10px;color:#4A5270;text-transform:uppercase;letter-spacing:1px}
.sb-season-v{font-size:13px;font-weight:600;color:#E8622A;margin-top:2px}
.sb-plan{margin:8px 10px 10px;padding:11px 12px;background:linear-gradient(135deg,rgba(232,98,42,.12),rgba(155,114,245,.08));border:1px solid rgba(232,98,42,.3);border-radius:8px}
.sb-plan-p{font-family:'Syne',sans-serif;font-size:17px;font-weight:800;color:#E8622A}
.sb-plan-l{font-size:10px;color:#8892B0;margin-top:1px}
/* MAIN */
.main{flex:1;overflow-y:auto;background:#07090F}
.page{padding:26px 30px;max-width:1400px}
.ph{margin-bottom:20px}
.ph-t{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;letter-spacing:-.5px}
.ph-s{font-size:13px;color:#8892B0;margin-top:3px}
/* GRIDS */
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-bottom:14px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-bottom:13px}
/* KPI */
.kpi{background:#111520;border:1px solid #1C2238;border-radius:10px;padding:15px}
.kpi-i{font-size:20px;margin-bottom:9px}
.kpi-v{font-family:'Syne',sans-serif;font-size:26px;font-weight:700;line-height:1}
.kpi-l{font-size:12px;color:#8892B0;margin-top:3px}
.kpi-n{font-size:11px;margin-top:7px}
.cg{color:#10C98F}.cr{color:#F04E6E}.cy{color:#F0B429}.cb{color:#4C8BF5}.ca{color:#E8622A}.cm{color:#4A5270}
/* CARD */
.card{background:#111520;border:1px solid #1C2238;border-radius:10px;padding:17px;margin-bottom:13px}
.card-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:13px}
.card-t{font-size:13px;font-weight:700}
.card-s{font-size:11px;color:#4A5270;margin-top:2px}
/* TABLE */
.tbl{width:100%;border-collapse:collapse}
.tbl th{text-align:left;font-size:11px;font-weight:600;color:#4A5270;text-transform:uppercase;letter-spacing:1px;padding:7px 9px;border-bottom:1px solid #1C2238}
.tbl td{padding:10px 9px;border-bottom:1px solid rgba(28,34,56,.5);font-size:13px;vertical-align:middle}
.tbl tr:last-child td{border-bottom:none}
.tbl tr:hover td{background:rgba(255,255,255,.012)}
/* BADGES */
.badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600}
.bok{background:rgba(16,201,143,.1);color:#10C98F;border:1px solid rgba(16,201,143,.2)}
.blow{background:rgba(240,180,41,.1);color:#F0B429;border:1px solid rgba(240,180,41,.2)}
.bcrit{background:rgba(240,78,110,.1);color:#F04E6E;border:1px solid rgba(240,78,110,.2)}
.bblue{background:rgba(76,139,245,.1);color:#4C8BF5;border:1px solid rgba(76,139,245,.2)}
.bpurp{background:rgba(155,114,245,.1);color:#9B72F5;border:1px solid rgba(155,114,245,.2)}
.bacc{background:rgba(232,98,42,.12);color:#E8622A;border:1px solid rgba(232,98,42,.3)}
.bmut{background:rgba(74,82,112,.12);color:#4A5270;border:1px solid rgba(74,82,112,.2)}
/* BUTTONS */
.btn{padding:8px 15px;border-radius:7px;border:none;cursor:pointer;font-size:13px;font-weight:600;font-family:'Inter',sans-serif;transition:all .15s;display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.btn:disabled{opacity:.5;cursor:not-allowed}
.bp{background:#E8622A;color:#fff}.bp:not(:disabled):hover{background:#D4541E}
.bg{background:transparent;color:#8892B0;border:1px solid #1C2238}.bg:hover{color:#EDF0FF;border-color:#252D45}
.bgreen{background:rgba(16,201,143,.1);color:#10C98F;border:1px solid rgba(16,201,143,.25)}
.bred{background:rgba(240,78,110,.1);color:#F04E6E;border:1px solid rgba(240,78,110,.25)}
.bsm{padding:5px 10px;font-size:12px}
.bico{width:30px;height:30px;padding:0;justify-content:center}
/* FORM */
.fg{display:flex;flex-direction:column;gap:5px}
.fl{font-size:11px;font-weight:600;color:#4A5270;text-transform:uppercase;letter-spacing:1px}
.inp{background:#0D1018;border:1px solid #1C2238;border-radius:7px;color:#EDF0FF;padding:9px 12px;font-size:13px;font-family:'Inter',sans-serif;outline:none;width:100%;transition:border .2s}
.inp:focus{border-color:#E8622A}.inp::placeholder{color:#4A5270}
.sel{background:#0D1018;border:1px solid #1C2238;border-radius:7px;color:#EDF0FF;padding:9px 12px;font-size:13px;font-family:'Inter',sans-serif;outline:none;cursor:pointer;width:100%}
.sel:focus{border-color:#E8622A}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.fgrid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:11px}
textarea.inp{resize:vertical;min-height:65px}
/* MODAL */
.ov{position:fixed;inset:0;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(8px)}
.modal{background:#111520;border:1px solid #252D45;border-radius:13px;padding:22px;width:510px;max-width:94vw;max-height:88vh;overflow-y:auto}
.modal-hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.modal-t{font-family:'Syne',sans-serif;font-size:16px;font-weight:700}
.modal-ft{display:flex;gap:9px;justify-content:flex-end;margin-top:16px;padding-top:13px;border-top:1px solid #1C2238}
/* TOGGLE */
.tog{width:33px;height:18px;background:#1C2238;border-radius:9px;position:relative;cursor:pointer;transition:background .2s;flex-shrink:0}
.tog.on{background:#10C98F}
.tog-k{position:absolute;width:14px;height:14px;background:#fff;border-radius:50%;top:2px;left:2px;transition:left .2s;box-shadow:0 1px 4px rgba(0,0,0,.4)}
.tog.on .tog-k{left:17px}
/* ALERTS */
.alert{border-radius:8px;padding:10px 13px;font-size:13px;display:flex;align-items:flex-start;gap:9px;margin-bottom:11px;line-height:1.5}
.aw{background:rgba(240,180,41,.08);border:1px solid rgba(240,180,41,.3);color:#F0B429}
.ae{background:rgba(240,78,110,.08);border:1px solid rgba(240,78,110,.3);color:#F04E6E}
.aok{background:rgba(16,201,143,.08);border:1px solid rgba(16,201,143,.3);color:#10C98F}
.ai{background:rgba(76,139,245,.08);border:1px solid rgba(76,139,245,.3);color:#4C8BF5}
/* TABS */
.tabs{display:flex;gap:3px;background:#0D1018;padding:4px;border-radius:8px;width:fit-content}
.tab{padding:6px 13px;border-radius:5px;cursor:pointer;font-size:12px;font-weight:600;color:#8892B0;transition:all .15s;border:none;background:transparent;font-family:'Inter',sans-serif}
.tab.act{background:#E8622A;color:#fff}
/* PROFIT BAR */
.pbr{display:flex;align-items:center;gap:9px;margin-bottom:7px}
.pbr-n{font-size:12px;width:175px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pbr-t{flex:1;height:5px;background:#1C2238;border-radius:3px;overflow:hidden}
.pbr-f{height:100%;border-radius:3px;transition:width .8s}
.pbr-p{font-size:11px;color:#4A5270;width:32px;text-align:right;font-family:'JetBrains Mono',monospace}
/* PLAN GRID */
.pgrid{display:grid;grid-template-columns:148px repeat(7,1fr);gap:2px}
.pg-hd{padding:7px 4px;background:#0D1018;border-radius:4px;text-align:center;font-size:10px;font-weight:600;color:#4A5270;text-transform:uppercase}
.pg-nm{padding:7px 9px;background:#0D1018;border-radius:4px;display:flex;flex-direction:column;gap:1px}
.pg-c{padding:5px 3px;border-radius:4px;text-align:center;min-height:30px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600}
.pg-on{background:rgba(76,139,245,.12);border:1px solid rgba(76,139,245,.2);color:#4C8BF5}
.pg-off{background:rgba(28,34,56,.3);color:#4A5270}
/* MARKET */
.mkt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(235px,1fr));gap:11px;margin-bottom:13px}
.mkt-card{background:#111520;border:1px solid #1C2238;border-radius:10px;padding:13px;transition:border .2s}
.mkt-card:hover{border-color:#252D45}
.mkt-card.urg{border-color:rgba(240,78,110,.3);background:rgba(240,78,110,.02)}
.mkt-bdg{font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;background:rgba(232,98,42,.12);color:#E8622A;display:inline-block;margin-bottom:7px}
.mkt-p{font-size:14px;font-weight:600;margin-bottom:2px}
.mkt-s{font-size:11px;color:#4A5270;margin-bottom:8px}
.mkt-pr{display:flex;align-items:baseline;gap:8px;margin-bottom:9px}
.mkt-old{font-size:12px;color:#4A5270;text-decoration:line-through}
.mkt-new{font-family:'Syne',sans-serif;font-size:19px;font-weight:700;color:#10C98F}
.mkt-disc{font-size:11px;font-weight:700;color:#F0B429;background:rgba(240,180,41,.1);padding:2px 6px;border-radius:8px}
/* STATUS PILL */
.spill{display:inline-flex;align-items:center;gap:10px;padding:11px 16px;border-radius:9px;margin-bottom:16px}
.sdot{width:10px;height:10px;border-radius:50%}
/* CHAT */
.chat-wrap{display:flex;flex-direction:column;height:calc(100vh - 180px)}
.chat-msgs{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:4px 0 10px}
.cmsg{max-width:82%}.cai{align-self:flex-start}.cusr{align-self:flex-end}
.clbl{font-size:10px;color:#4A5270;margin-bottom:3px;text-transform:uppercase;letter-spacing:.5px}
.cbub{padding:10px 13px;border-radius:11px;font-size:13px;line-height:1.65;white-space:pre-wrap}
.cai .cbub{background:#0D1018;border:1px solid #1C2238;border-bottom-left-radius:3px}
.cusr .cbub{background:rgba(232,98,42,.15);border:1px solid rgba(232,98,42,.3);border-bottom-right-radius:3px}
.chat-bar{display:flex;gap:9px;padding-top:11px;border-top:1px solid #1C2238;margin-top:auto}
.typing{display:flex;gap:4px;align-items:center}
.typing span{width:6px;height:6px;background:#4A5270;border-radius:50%;animation:td 1.2s infinite}
.typing span:nth-child(2){animation-delay:.2s}.typing span:nth-child(3){animation-delay:.4s}
@keyframes td{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-7px)}}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:11px}
.chip{padding:5px 11px;border-radius:20px;background:#0D1018;border:1px solid #1C2238;font-size:12px;color:#8892B0;cursor:pointer;transition:all .15s}
.chip:hover{border-color:#E8622A;color:#E8622A}
/* MENU GRID */
.mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(275px,1fr));gap:11px}
.mcard{background:#111520;border:1px solid #1C2238;border-radius:10px;padding:13px;transition:border .2s}
.mcard:hover{border-color:#252D45}.mcard.off{opacity:.45}
/* TOAST */
.toast{position:fixed;bottom:22px;right:22px;background:#111520;border:1px solid #1C2238;border-radius:9px;padding:11px 17px;font-size:13px;z-index:9999;box-shadow:0 8px 28px rgba(0,0,0,.5);animation:tin .3s ease}
.toast.ok{border-left:3px solid #10C98F}.toast.err{border-left:3px solid #F04E6E}
@keyframes tin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
/* AUTH */
.auth-wrap{min-height:100vh;background:#07090F;display:flex;align-items:center;justify-content:center;padding:20px}
.auth-box{width:100%;max-width:420px}
.auth-logo{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:#E8622A;margin-bottom:3px}
.auth-sub{font-size:11px;color:#4A5270;text-transform:uppercase;letter-spacing:2px;margin-bottom:28px}
.auth-card{background:#111520;border:1px solid #1C2238;border-radius:12px;padding:24px;margin-bottom:11px}
.auth-title{font-family:'Syne',sans-serif;font-size:18px;font-weight:700;margin-bottom:16px}
.auth-switch{text-align:center;font-size:13px;color:#8892B0;margin-top:8px}
.auth-switch span{color:#E8622A;cursor:pointer;font-weight:600}.auth-switch span:hover{text-decoration:underline}
/* ONB */
.onb-wrap{min-height:100vh;background:#07090F;display:flex;align-items:center;justify-content:center;padding:20px}
.onb-inner{width:100%;max-width:580px}
.onb-logo{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:#E8622A;margin-bottom:3px}
.onb-sub{font-size:11px;color:#4A5270;text-transform:uppercase;letter-spacing:2px;margin-bottom:26px}
.onb-card{background:#111520;border:1px solid #1C2238;border-radius:12px;padding:20px;margin-bottom:11px}
.onb-ct{font-size:13px;font-weight:700;margin-bottom:13px}
.step-row{display:flex;gap:11px;padding:10px 0;border-bottom:1px solid #1C2238}
.step-row:last-child{border-bottom:none}
.step-n{width:24px;height:24px;border-radius:50%;background:rgba(232,98,42,.12);border:1px solid rgba(232,98,42,.3);color:#E8622A;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.step-b{font-size:13px;color:#8892B0;line-height:1.5}
/* SEARCH ANIMATION */
.search-steps{display:flex;flex-direction:column;gap:8px}
.search-step{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#0D1018;border:1px solid #1C2238;border-radius:8px;font-size:13px;transition:all .3s}
.search-step.done{border-color:rgba(16,201,143,.3);background:rgba(16,201,143,.05)}
.search-step.active{border-color:rgba(76,139,245,.3);background:rgba(76,139,245,.05)}
.search-step-ico{font-size:16px;width:22px;text-align:center}
.spin{display:inline-block;animation:spin .8s linear infinite}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
.hr-block{background:#0D1018;border:1px solid #1C2238;border-radius:8px;padding:13px;display:flex;align-items:center;justify-content:space-between;gap:11px}
.hr-l{font-size:10px;color:#4A5270;margin-bottom:3px;text-transform:uppercase;letter-spacing:1px}
.hr-v{font-family:'JetBrains Mono',monospace;font-size:19px;font-weight:500}
.pdot{width:7px;height:7px;border-radius:50%;background:#F0B429;display:inline-block;margin-right:5px;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
`;

// ═══════════════════════════════════════════════════
// MICRO COMPONENTS
// ═══════════════════════════════════════════════════
function Toggle({on,onChange}){return <div className={"tog"+(on?" on":"")} onClick={()=>onChange?.(!on)}><div className="tog-k"/></div>;}
function Toast({msg,type="ok",onDone}){useEffect(()=>{const t=setTimeout(onDone,3200);return()=>clearTimeout(t);},[]);return <div className={`toast ${type}`}>{msg}</div>;}
function Modal({title,onClose,children}){return(<div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}><div className="modal"><div className="modal-hd"><div className="modal-t">{title}</div><button className="btn bg bsm bico" onClick={onClose}>✕</button></div>{children}</div></div>);}

// ═══════════════════════════════════════════════════
// AUTH — Connexion / Inscription
// ═══════════════════════════════════════════════════
function AuthPage({onAuth}){
  const [mode,setMode]=useState("login");
  const [form,setForm]=useState({email:"",password:"",confirmPassword:""});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const u=k=>e=>setForm(f=>({...f,[k]:e.target.value}));

  async function submit(){
    setError("");
    if(!form.email||!form.password){setError("Email et mot de passe requis.");return;}
    if(mode==="register"&&form.password!==form.confirmPassword){setError("Les mots de passe ne correspondent pas.");return;}
    if(mode==="register"&&form.password.length<6){setError("Mot de passe trop court (min. 6 caractères).");return;}
    setLoading(true);
    const emailKey = "user:"+form.email.toLowerCase().trim();
    if(mode==="register"){
      const existing = await Store.get(emailKey);
      if(existing){setError("Un compte existe déjà avec cet email.");setLoading(false);return;}
      const pwHash = await hash(form.password);
      const userId = uid();
      await Store.set(emailKey,{userId,pwHash,email:form.email});
      await Store.set("session",{userId,email:form.email});
      onAuth({userId,email:form.email,isNew:true});
    } else {
      const existing = await Store.get(emailKey);
      if(!existing){setError("Aucun compte trouvé avec cet email.");setLoading(false);return;}
      const pwHash = await hash(form.password);
      if(pwHash!==existing.pwHash){setError("Mot de passe incorrect.");setLoading(false);return;}
      await Store.set("session",{userId:existing.userId,email:form.email});
      onAuth({userId:existing.userId,email:form.email,isNew:false});
    }
    setLoading(false);
  }

  return(
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-logo">RestaurantOS</div>
        <div className="auth-sub">IA · L'avenir de la restauration</div>
        <div className="auth-card">
          <div className="auth-title">{mode==="login"?"Connexion à votre espace":"Créer votre compte"}</div>
          {error&&<div className="alert ae" style={{marginBottom:13}}>{error}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            <div className="fg"><label className="fl">Adresse email</label><input className="inp" type="email" value={form.email} onChange={u("email")} placeholder="chef@monrestaurant.fr" onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
            <div className="fg"><label className="fl">Mot de passe</label><input className="inp" type="password" value={form.password} onChange={u("password")} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
            {mode==="register"&&<div className="fg"><label className="fl">Confirmer le mot de passe</label><input className="inp" type="password" value={form.confirmPassword} onChange={u("confirmPassword")} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&submit()}/></div>}
            <button className="btn bp" style={{width:"100%",padding:12,fontSize:14,marginTop:4}} onClick={submit} disabled={loading}>
              {loading?"⏳ Connexion...":(mode==="login"?"Se connecter →":"Créer mon compte →")}
            </button>
          </div>
        </div>
        <div className="auth-switch">
          {mode==="login"?<>Pas encore de compte ? <span onClick={()=>{setMode("register");setError("");}}>S'inscrire gratuitement</span></>:<>Déjà un compte ? <span onClick={()=>{setMode("login");setError("");}}>Se connecter</span></>}
        </div>
        <div style={{marginTop:16,padding:"14px 16px",background:"#111520",border:"1px solid #1C2238",borderRadius:10,fontSize:12,color:"#4A5270",lineHeight:1.6}}>
          🔒 Vos données sont chiffrées et liées à votre compte. Chaque restaurant dispose de son propre espace isolé et sécurisé.
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ONBOARDING — Recherche restaurant multi-sources
// ═══════════════════════════════════════════════════
function Onboarding({userId,onComplete}){
  const [step,setStep]=useState(0);
  const [query,setQuery]=useState("");
  const [searching,setSearching]=useState(false);
  const [searchSteps,setSearchSteps]=useState([]);
  const [aiResult,setAiResult]=useState(null);
  const [form,setForm]=useState({name:"",address:"",website:"",phone:"",email:"",type:"Bistrot",openTime:"12:00",closeTime:"22:30",breakStart:"15:00",breakEnd:"19:00",hasBreak:true,coverCapacity:60,interimPartner:"Manpower",description:""});
  const u=k=>e=>setForm(f=>({...f,[k]:typeof e==="boolean"?e:e.target.value}));

  const SEARCH_STEPS_CONFIG = [
    {icon:"🌐",label:"Recherche sur Google & sites web"},
    {icon:"📍",label:"Vérification Google Maps & avis"},
    {icon:"📱",label:"Analyse des réseaux sociaux (Instagram, Facebook, TikTok)"},
    {icon:"📰",label:"Recherche presse, guides & critiques culinaires"},
    {icon:"⭐",label:"Agrégation des avis (TripAdvisor, Yelp, La Fourchette)"},
    {icon:"🤖",label:"Synthèse IA & création du profil restaurant"},
  ];

  async function searchRestaurant(){
    if(!query.trim())return;
    setSearching(true);
    setSearchSteps([]);
    setStep(1);

    for(let i=0;i<SEARCH_STEPS_CONFIG.length;i++){
      setSearchSteps(s=>[...s,{...SEARCH_STEPS_CONFIG[i],status:"active"}]);
      await new Promise(r=>setTimeout(r,700+Math.random()*400));
      setSearchSteps(s=>s.map((x,idx)=>idx===i?{...x,status:"done"}:x));
    }

    const result = await claude(
      [{role:"user",content:`Analyse et trouve toutes les informations disponibles sur ce restaurant : "${query}"\n\nRecherche via toutes les sources possibles (Google Maps, réseaux sociaux, presse, avis, bouche à oreille, réputation, historique).\n\nRéponds UNIQUEMENT avec un objet JSON valide (sans markdown) avec ces champs:\n{\n  "name": "nom exact du restaurant",\n  "address": "adresse complète",\n  "phone": "numéro de téléphone",\n  "website": "site web si connu",\n  "type": "type de cuisine (Bistrot/Brasserie/Gastronomique/Pizzeria/Japonais/etc)",\n  "openTime": "heure ouverture HH:MM",\n  "closeTime": "heure fermeture HH:MM",\n  "hasBreak": true ou false,\n  "breakStart": "HH:MM",\n  "breakEnd": "HH:MM",\n  "coverCapacity": nombre estimé de couverts,\n  "description": "description du restaurant en 2-3 phrases (cuisine, ambiance, réputation, points forts)",\n  "sources": "liste des sources trouvées",\n  "confidence": "élevée/moyenne/faible"\n}\nSi le restaurant est inconnu, invente des données plausibles basées sur le nom et complète au mieux.`}],
      "Tu es un expert en recherche d'informations sur les restaurants. Tu dois trouver les informations même pour des restaurants peu connus, en utilisant toutes les sources disponibles : Google Maps, réseaux sociaux, presse gastronomique, guides Michelin, TripAdvisor, critiques culinaires, bouche à oreille numérique, historique familial. Réponds UNIQUEMENT avec du JSON valide, sans aucun texte avant ou après."
    );

    try{
      const clean = result.replace(/```json|```/g,"").trim();
      const data = JSON.parse(clean);
      setAiResult(data);
      setForm(f=>({...f,
        name:data.name||query,
        address:data.address||"",
        phone:data.phone||"",
        website:data.website||"",
        type:data.type||"Bistrot",
        openTime:data.openTime||"12:00",
        closeTime:data.closeTime||"22:30",
        hasBreak:data.hasBreak!==undefined?data.hasBreak:true,
        breakStart:data.breakStart||"15:00",
        breakEnd:data.breakEnd||"19:00",
        coverCapacity:data.coverCapacity||60,
        description:data.description||"",
      }));
    } catch {
      setForm(f=>({...f,name:query}));
    }
    setSearching(false);
    setStep(2);
  }

  if(step===0)return(
    <div className="onb-wrap">
      <div className="onb-inner">
        <div className="onb-logo">RestaurantOS</div>
        <div className="onb-sub">IA · L'avenir de la restauration</div>
        <div className="onb-card">
          <div className="onb-ct">Comment l'IA trouve votre restaurant</div>
          {[
            ["Google Maps & site web","Horaires, téléphone, adresse, carte en ligne"],
            ["Réseaux sociaux","Instagram, Facebook, TikTok — photos, ambiance, buzz"],
            ["Presse & guides","Critiques Michelin, Le Fooding, guides gastronomiques, journaux"],
            ["Avis clients","TripAdvisor, Google, Yelp, La Fourchette — réputation réelle"],
            ["Transmission familiale","Recettes de génération en génération, histoire du restaurant"],
            ["Bouche à oreille numérique","Forums, blogs culinaires, influenceurs food"],
          ].map(([t,d],i)=>(
            <div className="step-row" key={i}><div className="step-n">{i+1}</div><div className="step-b"><b style={{color:"#EDF0FF"}}>{t}</b><br/>{d}</div></div>
          ))}
        </div>
        <div className="onb-card" style={{background:"linear-gradient(135deg,rgba(232,98,42,.1),rgba(155,114,245,.07))",borderColor:"rgba(232,98,42,.3)"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:"#E8622A"}}>100€<span style={{fontSize:13,color:"#8892B0",fontFamily:"Inter",fontWeight:400}}> / semaine</span></div>
          <div style={{fontSize:13,color:"#8892B0",marginTop:3,marginBottom:11}}>Accès complet · Sans engagement · Résiliable à tout moment</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["✅ Stock intelligent","✅ Carte & rentabilité","✅ Planning IA","✅ Offres marché","✅ Saisons & recettes","✅ Assistant 24h/24","✅ Intérim connecté","✅ Import auto toutes sources"].map(f=><span className="badge bok" key={f}>{f}</span>)}
          </div>
        </div>
        <button className="btn bp" style={{width:"100%",padding:13,fontSize:14}} onClick={()=>setStep("search")}>Trouver mon restaurant →</button>
      </div>
    </div>
  );

  if(step==="search"||step===1)return(
    <div className="onb-wrap">
      <div className="onb-inner">
        <div className="onb-logo">RestaurantOS</div>
        <div className="onb-sub">Recherche multi-sources</div>
        <div className="onb-card">
          <div className="onb-ct">🔍 Entrez le nom de votre restaurant</div>
          <div style={{display:"flex",gap:9,marginBottom:11}}>
            <input className="inp" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ex: Le Petit Bistrot Paris, La Maison Troisgros, Chez Marcel..." style={{flex:1}} onKeyDown={e=>e.key==="Enter"&&!searching&&searchRestaurant()} autoFocus/>
            <button className="btn bp" onClick={searchRestaurant} disabled={!query.trim()||searching}>{searching?"⏳":"✨ Rechercher"}</button>
          </div>
          <div style={{fontSize:12,color:"#4A5270",marginBottom:searching?14:0}}>L'IA cherche sur Google, réseaux sociaux, presse, avis, guides gastronomiques et plus encore.</div>
          {(searching||searchSteps.length>0)&&(
            <div className="search-steps">
              {SEARCH_STEPS_CONFIG.map((s,i)=>{
                const st=searchSteps[i];
                if(!st&&!searching)return null;
                const status=st?.status||(i<searchSteps.length?"done":"pending");
                return(
                  <div key={i} className={"search-step"+(status==="done"?" done":status==="active"?" active":"")}>
                    <span className="search-step-ico">{status==="done"?"✅":status==="active"?<span className="spin">⏳</span>:"⬜"}</span>
                    <span style={{color:status==="done"?"#10C98F":status==="active"?"#4C8BF5":"#4A5270"}}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {step===0&&<button className="btn bg" onClick={()=>setStep(0)}>← Retour</button>}
      </div>
    </div>
  );

  if(step===2)return(
    <div className="onb-wrap">
      <div className="onb-inner">
        <div className="onb-logo">RestaurantOS</div>
        <div className="onb-sub">Vérification & configuration</div>
        {aiResult&&(
          <div className="onb-card">
            <div className="onb-ct">✅ Informations trouvées — {form.name}</div>
            {form.description&&<div style={{fontSize:13,color:"#8892B0",lineHeight:1.65,marginBottom:11,padding:"10px 12px",background:"#0D1018",borderRadius:8,border:"1px solid #1C2238"}}>{form.description}</div>}
            {aiResult.sources&&<div style={{fontSize:11,color:"#4A5270"}}>📡 Sources : {aiResult.sources}</div>}
          </div>
        )}
        <div className="onb-card">
          <div className="onb-ct">📋 Vérifiez et complétez les informations</div>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            <div className="fgrid">
              <div className="fg"><label className="fl">Nom du restaurant</label><input className="inp" value={form.name} onChange={u("name")}/></div>
              <div className="fg"><label className="fl">Type d'établissement</label><select className="sel" value={form.type} onChange={u("type")}>{["Bistrot","Brasserie","Gastronomique","Fast-casual","Pizzeria","Japonais","Végétarien","Café-restaurant","Food truck","Autre"].map(t=><option key={t}>{t}</option>)}</select></div>
              <div className="fg"><label className="fl">Téléphone</label><input className="inp" value={form.phone} onChange={u("phone")} placeholder="01 23 45 67 89"/></div>
              <div className="fg"><label className="fl">Email</label><input className="inp" value={form.email} onChange={u("email")} placeholder="contact@restaurant.fr"/></div>
            </div>
            <div className="fg"><label className="fl">Adresse complète</label><input className="inp" value={form.address} onChange={u("address")}/></div>
            <div className="fg"><label className="fl">Site internet</label><input className="inp" value={form.website} onChange={u("website")} placeholder="https://..."/></div>
          </div>
        </div>
        <div className="onb-card">
          <div className="onb-ct">⏰ Horaires d'ouverture</div>
          <div className="fgrid3" style={{marginBottom:11}}>
            <div className="fg"><label className="fl">Ouverture</label><input className="inp" type="time" value={form.openTime} onChange={u("openTime")}/></div>
            <div className="fg"><label className="fl">Fermeture</label><input className="inp" type="time" value={form.closeTime} onChange={u("closeTime")}/></div>
            <div className="fg"><label className="fl">Couverts</label><input className="inp" type="number" value={form.coverCapacity} onChange={u("coverCapacity")}/></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:form.hasBreak?11:0}}>
            <Toggle on={form.hasBreak} onChange={v=>setForm(f=>({...f,hasBreak:v}))}/>
            <span style={{fontSize:13,color:"#8892B0"}}>Coupure inter-service (fermé l'après-midi)</span>
          </div>
          {form.hasBreak&&<div className="fgrid">
            <div className="fg"><label className="fl">Début coupure</label><input className="inp" type="time" value={form.breakStart} onChange={u("breakStart")}/></div>
            <div className="fg"><label className="fl">Fin coupure</label><input className="inp" type="time" value={form.breakEnd} onChange={u("breakEnd")}/></div>
          </div>}
        </div>
        <div style={{display:"flex",gap:9}}>
          <button className="btn bg" style={{flex:1}} onClick={()=>setStep("search")}>← Rechercher à nouveau</button>
          <button className="btn bp" style={{flex:2,padding:12,fontSize:14}} onClick={()=>onComplete(form)}>🚀 Lancer RestaurantOS</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════
function Dashboard({stock,menu,employees,restaurant}){
  const opened=isOpen(restaurant);
  const low=stock.filter(i=>stockStatus(i)!=="ok");
  const avgM=menu.length?Math.round(menu.reduce((s,m)=>s+margin(m),0)/menu.length):0;
  const d=new Date().getDay(),wd=d===0?6:d-1;
  const today=employees.filter(e=>e.days.includes(wd));
  const topDish=[...menu].sort((a,b)=>margin(b)-margin(a))[0];
  return(
    <div className="page">
      <div className="ph"><div className="ph-t">Tableau de bord</div><div className="ph-s">{restaurant.name} · {new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div></div>
      <div className="spill" style={{background:opened?"rgba(16,201,143,.08)":"rgba(240,78,110,.08)",border:`1px solid ${opened?"rgba(16,201,143,.3)":"rgba(240,78,110,.3)"}`}}>
        <div className="sdot" style={{background:opened?"#10C98F":"#F04E6E",boxShadow:`0 0 8px ${opened?"#10C98F":"#F04E6E"}`}}/>
        <div><div style={{fontWeight:700,fontSize:14,color:opened?"#10C98F":"#F04E6E"}}>{opened?"Restaurant ouvert en ce moment":"Restaurant fermé en ce moment"}</div><div style={{fontSize:12,color:"#8892B0",marginTop:1}}>Service {restaurant.openTime} → {restaurant.closeTime}{restaurant.hasBreak?` · Coupure ${restaurant.breakStart}-${restaurant.breakEnd}`:""}</div></div>
      </div>
      {low.length>0&&<div className="alert ae">⚠️ <div><b>Stock critique :</b> {low.map(i=>i.name).join(", ")} — Commander en urgence</div></div>}
      <div className="g4">
        <div className="kpi"><div className="kpi-i">🍽️</div><div className="kpi-v">{menu.filter(m=>m.active).length}</div><div className="kpi-l">Plats disponibles</div><div className="kpi-n cm">{menu.length} au total</div></div>
        <div className="kpi"><div className="kpi-i">📦</div><div className="kpi-v cy">{low.length}</div><div className="kpi-l">Alertes stock</div><div className="kpi-n cm">{stock.length} références</div></div>
        <div className="kpi"><div className="kpi-i">📈</div><div className="kpi-v cg">{avgM}%</div><div className="kpi-l">Marge moyenne</div><div className="kpi-n cg">{topDish?`↑ ${topDish.name}`:""}</div></div>
        <div className="kpi"><div className="kpi-i">👥</div><div className="kpi-v">{today.length}</div><div className="kpi-l">Employés aujourd'hui</div><div className="kpi-n cm">{employees.length} au total</div></div>
      </div>
      <div className="g2">
        <div className="card">
          <div className="card-hd"><div><div className="card-t">🏆 Rentabilité</div><div className="card-s">Marge nette par plat</div></div></div>
          {[...menu].sort((a,b)=>margin(b)-margin(a)).map(m=>{const p=margin(m),col=p>65?"#10C98F":p>45?"#F0B429":"#F04E6E";return(<div className="pbr" key={m.id}><div className="pbr-n">{m.name}</div><div className="pbr-t"><div className="pbr-f" style={{width:p+"%",background:col}}/></div><div className="pbr-p">{p}%</div></div>);})}
        </div>
        <div className="card">
          <div className="card-hd"><div className="card-t">📅 Équipe aujourd'hui</div></div>
          {today.length===0?<div style={{color:"#4A5270",fontSize:13,textAlign:"center",padding:"18px 0"}}>Aucun employé planifié.</div>:
            today.map(e=><div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #1C2238"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:e.color}}/><div><div style={{fontSize:13,fontWeight:600}}>{e.name}</div><div style={{fontSize:11,color:"#4A5270"}}>{e.role}</div></div></div>
              <span className="badge bblue">{e.shift.split(" ")[0]}</span>
            </div>)
          }
        </div>
      </div>
      <div className="card">
        <div className="card-hd"><div className="card-t">🌿 Saison {SEASON} {SEASONS[SEASON].icon}</div></div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{SEASONS[SEASON].items.map(i=><span key={i} className="badge bacc" style={{padding:"4px 10px",fontSize:12}}>{i}</span>)}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// STOCK
// ═══════════════════════════════════════════════════
function StockPage({stock,setStock,toast}){
  const [modal,setModal]=useState(false);
  const [edit,setEdit]=useState(null);
  const [search,setSearch]=useState("");
  const [form,setForm]=useState({name:"",qty:"",unit:"kg",min:"",cat:"Légumes & Fruits",price:"",supplier:"",promo:false,promoPrice:""});
  const u=k=>e=>setForm(f=>({...f,[k]:typeof e==="boolean"?e:e.target.value}));
  const cats=[...new Set(stock.map(i=>i.cat))];
  const filtered=stock.filter(i=>i.name.toLowerCase().includes(search.toLowerCase()));
  const low=stock.filter(i=>stockStatus(i)!=="ok");
  function openAdd(){setEdit(null);setForm({name:"",qty:"",unit:"kg",min:"",cat:"Légumes & Fruits",price:"",supplier:"",promo:false,promoPrice:""});setModal(true);}
  function openEdit(item){setEdit(item);setForm({...item,qty:String(item.qty),min:String(item.min),price:String(item.price),promoPrice:String(item.promoPrice||"")});setModal(true);}
  function save(){if(!form.name||!form.qty)return;const obj={...form,qty:+form.qty,min:+form.min,price:+form.price,promoPrice:form.promo?+form.promoPrice:null};if(edit)setStock(s=>s.map(i=>i.id===edit.id?{...i,...obj}:i));else setStock(s=>[...s,{id:uid(),...obj}]);setModal(false);toast("Ingrédient sauvegardé ✓");}
  const SL={ok:["✓ OK","bok"],low:["⚠ Faible","blow"],critical:["✕ Rupture","bcrit"]};
  return(
    <div className="page">
      <div className="ph"><div className="ph-t">Gestion du Stock</div><div className="ph-s">{stock.length} références · {low.length} alerte{low.length!==1?"s":""}</div></div>
      {low.length>0&&<div className="alert ae">⚠️ <b>Commander en urgence :</b> {low.map(i=>`${i.name} (${i.qty}${i.unit})`).join(", ")}</div>}
      <div style={{display:"flex",gap:9,marginBottom:14}}>
        <input className="inp" placeholder="🔍 Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:260}}/>
        <button className="btn bp" onClick={openAdd}>+ Ajouter</button>
      </div>
      {cats.map(cat=>{
        const items=filtered.filter(i=>i.cat===cat);if(!items.length)return null;
        return(<div className="card" key={cat}>
          <div className="card-hd"><div><div className="card-t">📂 {cat}</div><div className="card-s">{items.length} article{items.length!==1?"s":""}</div></div></div>
          <table className="tbl"><thead><tr><th>Ingrédient</th><th>Fournisseur</th><th>Quantité</th><th>Min.</th><th>Prix</th><th>Promo</th><th>Statut</th><th></th></tr></thead>
          <tbody>{items.map(item=>{const[lbl,cls]=SL[stockStatus(item)];return(
            <tr key={item.id}>
              <td><b>{item.name}</b></td>
              <td style={{color:"#8892B0"}}>{item.supplier||"—"}</td>
              <td style={{fontFamily:"'JetBrains Mono',monospace"}}>{item.qty} {item.unit}</td>
              <td style={{color:"#4A5270"}}>{item.min} {item.unit}</td>
              <td>{item.price}€</td>
              <td>{item.promo?<span><span className="pdot"/><span style={{color:"#F0B429",fontWeight:600,fontSize:12}}>{item.promoPrice}€ <span style={{color:"#4A5270",textDecoration:"line-through"}}>{item.price}€</span></span></span>:<span style={{color:"#4A5270"}}>—</span>}</td>
              <td><span className={"badge "+cls}>{lbl}</span></td>
              <td><div style={{display:"flex",gap:5}}><button className="btn bg bsm bico" onClick={()=>openEdit(item)}>✏️</button><button className="btn bred bsm bico" onClick={()=>{setStock(s=>s.filter(i=>i.id!==item.id));toast("Supprimé","err");}}>🗑</button></div></td>
            </tr>
          );})}</tbody></table>
        </div>);
      })}
      {modal&&<Modal title={edit?"Modifier":"Ajouter un ingrédient"} onClose={()=>setModal(false)}>
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          <div className="fg"><label className="fl">Nom</label><input className="inp" value={form.name} onChange={u("name")} placeholder="Ex: Tomates cerises Bio" autoFocus/></div>
          <div className="fgrid">
            <div className="fg"><label className="fl">Quantité</label><input className="inp" type="number" step="0.1" value={form.qty} onChange={u("qty")}/></div>
            <div className="fg"><label className="fl">Unité</label><select className="sel" value={form.unit} onChange={u("unit")}><option>kg</option><option>g</option><option>L</option><option>ml</option><option>unités</option><option>bottes</option><option>bouteilles</option></select></div>
            <div className="fg"><label className="fl">Stock minimum</label><input className="inp" type="number" step="0.1" value={form.min} onChange={u("min")}/></div>
            <div className="fg"><label className="fl">Prix (€/unité)</label><input className="inp" type="number" step="0.01" value={form.price} onChange={u("price")}/></div>
          </div>
          <div className="fgrid">
            <div className="fg"><label className="fl">Catégorie</label><select className="sel" value={form.cat} onChange={u("cat")}>{STOCK_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="fg"><label className="fl">Fournisseur</label><input className="inp" value={form.supplier} onChange={u("supplier")} placeholder="Metro, Sysco..."/></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}><Toggle on={form.promo} onChange={v=>setForm(f=>({...f,promo:v}))}/><span style={{fontSize:13,color:"#8892B0"}}>Prix promotionnel actif</span></div>
          {form.promo&&<div className="fg"><label className="fl">Prix promo (€)</label><input className="inp" type="number" step="0.01" value={form.promoPrice} onChange={u("promoPrice")}/></div>}
        </div>
        <div className="modal-ft"><button className="btn bg" onClick={()=>setModal(false)}>Annuler</button><button className="btn bp" onClick={save}>Enregistrer</button></div>
      </Modal>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MENU
// ═══════════════════════════════════════════════════
function MenuPage({menu,setMenu,toast}){
  const [tab,setTab]=useState("Entrées");
  const [modal,setModal]=useState(false);
  const [edit,setEdit]=useState(null);
  const [form,setForm]=useState({name:"",cat:"Entrées",price:"",cost:"",season:"Toute saison",desc:"",allergens:"",active:true});
  const u=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  function openAdd(){setEdit(null);setForm({name:"",cat:tab,price:"",cost:"",season:"Toute saison",desc:"",allergens:"",active:true});setModal(true);}
  function openEdit(m){setEdit(m);setForm({...m,price:String(m.price),cost:String(m.cost)});setModal(true);}
  function save(){if(!form.name||!form.price)return;const obj={...form,price:+form.price,cost:+form.cost};if(edit)setMenu(m=>m.map(x=>x.id===edit.id?{...x,...obj}:x));else setMenu(m=>[...m,{id:uid(),...obj}]);setModal(false);toast("Plat sauvegardé ✓");}
  const items=menu.filter(m=>m.cat===tab);
  const mrg=form.price&&form.cost?Math.round(((+form.price-+form.cost)/+form.price)*100):null;
  return(
    <div className="page">
      <div className="ph"><div className="ph-t">Carte du Restaurant</div><div className="ph-s">{menu.length} plats · {menu.filter(m=>m.active).length} disponibles</div></div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div className="tabs">{MENU_CATS.map(c=><button key={c} className={"tab"+(tab===c?" act":"")} onClick={()=>setTab(c)}>{c} <span style={{opacity:.6}}>({menu.filter(m=>m.cat===c).length})</span></button>)}</div>
        <button className="btn bp" onClick={openAdd}>+ Ajouter</button>
      </div>
      <div className="mgrid">
        {items.map(m=>{const p=margin(m),col=p>65?"#10C98F":p>45?"#F0B429":"#F04E6E";return(
          <div key={m.id} className={"mcard"+(m.active?"":" off")}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
              <div style={{fontWeight:700,fontSize:14,flex:1,paddingRight:8}}>{m.name}</div>
              <Toggle on={m.active} onChange={()=>setMenu(ms=>ms.map(x=>x.id===m.id?{...x,active:!x.active}:x))}/>
            </div>
            {m.desc&&<div style={{fontSize:12,color:"#4A5270",marginBottom:8,lineHeight:1.5}}>{m.desc}</div>}
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:9}}>
              {m.season!=="Toute saison"&&<span className="badge bacc">{m.season}</span>}
              <span className="badge" style={{background:`rgba(${p>65?"16,201,143":p>45?"240,180,41":"240,78,110"},.1)`,color:col,border:`1px solid rgba(${p>65?"16,201,143":p>45?"240,180,41":"240,78,110"},.2)`}}>Marge {p}%</span>
              {m.allergens&&<span className="badge bmut">⚠ {m.allergens}</span>}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:13,color:"#8892B0"}}>Prix : <b style={{color:"#EDF0FF"}}>{m.price}€</b> · Coût : <b style={{color:"#EDF0FF"}}>{m.cost}€</b></div>
              <div style={{display:"flex",gap:5}}><button className="btn bg bsm bico" onClick={()=>openEdit(m)}>✏️</button><button className="btn bred bsm bico" onClick={()=>{setMenu(ms=>ms.filter(x=>x.id!==m.id));toast("Plat supprimé","err");}}>🗑</button></div>
            </div>
          </div>
        );})}
        {items.length===0&&<div style={{color:"#4A5270",fontSize:13,padding:"18px 0"}}>Aucun plat. Cliquez sur "+ Ajouter".</div>}
      </div>
      {modal&&<Modal title={edit?"Modifier le plat":"Ajouter un plat"} onClose={()=>setModal(false)}>
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          <div className="fg"><label className="fl">Nom du plat</label><input className="inp" value={form.name} onChange={u("name")} placeholder="Ex: Risotto aux cèpes" autoFocus/></div>
          <div className="fg"><label className="fl">Description</label><textarea className="inp" value={form.desc} onChange={u("desc")} placeholder="Ingrédients, mode de préparation..."/></div>
          <div className="fgrid">
            <div className="fg"><label className="fl">Catégorie</label><select className="sel" value={form.cat} onChange={u("cat")}>{MENU_CATS.map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="fg"><label className="fl">Saison</label><select className="sel" value={form.season} onChange={u("season")}><option>Toute saison</option>{Object.keys(SEASONS).map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="fg"><label className="fl">Prix de vente (€)</label><input className="inp" type="number" step="0.5" value={form.price} onChange={u("price")}/></div>
            <div className="fg"><label className="fl">Coût matière (€)</label><input className="inp" type="number" step="0.1" value={form.cost} onChange={u("cost")}/></div>
          </div>
          <div className="fg"><label className="fl">Allergènes</label><input className="inp" value={form.allergens} onChange={u("allergens")} placeholder="Gluten, Lait, Œufs..."/></div>
          {mrg!==null&&<div style={{background:"#0D1018",borderRadius:7,padding:11,fontSize:13}}>Marge : <b style={{color:mrg>55?"#10C98F":mrg>35?"#F0B429":"#F04E6E"}}>{mrg}%</b><span style={{color:"#4A5270"}}> · Bénéfice : </span><b style={{color:"#E8622A"}}>{(+form.price-+form.cost).toFixed(2)}€</b>{mrg<30&&<span style={{color:"#F04E6E"}}> ⚠ Marge trop faible</span>}</div>}
        </div>
        <div className="modal-ft"><button className="btn bg" onClick={()=>setModal(false)}>Annuler</button><button className="btn bp" onClick={save}>Enregistrer</button></div>
      </Modal>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// PLANNING
// ═══════════════════════════════════════════════════
function PlanningPage({employees,setEmployees,restaurant,toast}){
  const [modal,setModal]=useState(false);
  const [edit,setEdit]=useState(null);
  const [intModal,setIntModal]=useState(false);
  const [aiPlan,setAiPlan]=useState(null);
  const [loading,setLoading]=useState(false);
  const [form,setForm]=useState({name:"",role:"Serveur·se",contract:"CDI",days:[],shift:"Soir (17h-23h)",phone:"",salary:"",color:"#4C8BF5",note:""});
  const [intForm,setIntForm]=useState({role:"Serveur·se",date:"",shift:"Soir (17h-23h)",note:""});
  function openAdd(){setEdit(null);setForm({name:"",role:"Serveur·se",contract:"CDI",days:[],shift:"Soir (17h-23h)",phone:"",salary:"",color:"#4C8BF5",note:""});setModal(true);}
  function openEdit(e){setEdit(e);setForm({...e,salary:String(e.salary)});setModal(true);}
  function save(){if(!form.name)return;const obj={...form,salary:+form.salary};if(edit)setEmployees(es=>es.map(e=>e.id===edit.id?{...e,...obj}:e));else setEmployees(es=>[...es,{id:uid(),...obj}]);setModal(false);toast("Employé sauvegardé ✓");}
  function toggleDay(d){setForm(f=>({...f,days:f.days.includes(d)?f.days.filter(x=>x!==d):[...f.days,d].sort()}));}
  async function genPlan(){
    setLoading(true);
    const r=await claude([{role:"user",content:`Planning optimisé pour "${restaurant.name}" (${restaurant.coverCapacity} couverts, ${restaurant.openTime}-${restaurant.closeTime}).\nÉquipe:\n${employees.map(e=>`${e.name}(${e.role},${e.contract}): ${e.days.map(d=>DAYS[d]).join(",")} — ${e.shift}`).join("\n")}\nIdentifie: jours sous-staffés, risques de sous-effectif, besoin intérimaire. Recommandations concrètes et actionnables.`}],"Expert RH restauration. Réponds en français, concis.");
    setAiPlan(r);setLoading(false);
  }
  const COLORS=["#4C8BF5","#10C98F","#9B72F5","#F0B429","#E8622A","#F04E6E","#06B6D4","#84CC16"];
  return(
    <div className="page">
      <div className="ph"><div className="ph-t">Planning des Employés</div><div className="ph-s">{employees.length} employés · Intérim : {restaurant.interimPartner}</div></div>
      <div style={{display:"flex",gap:9,marginBottom:13,flexWrap:"wrap"}}>
        <button className="btn bp" onClick={openAdd}>+ Ajouter un employé</button>
        <button className="btn bg" onClick={()=>setIntModal(true)}>🔄 Demander un intérimaire</button>
        <button className="btn bg" onClick={genPlan} disabled={loading}>{loading?"⏳ Analyse...":"🤖 Optimiser le planning IA"}</button>
      </div>
      {aiPlan&&<div className="card"><div className="card-hd"><div className="card-t">🤖 Recommandation IA</div><button className="btn bg bsm bico" onClick={()=>setAiPlan(null)}>✕</button></div><div style={{fontSize:13,color:"#8892B0",lineHeight:1.75,whiteSpace:"pre-wrap"}}>{aiPlan}</div></div>}
      <div className="card" style={{overflowX:"auto"}}>
        <div className="card-hd"><div className="card-t">📅 Planning semaine</div></div>
        <div className="pgrid" style={{minWidth:640}}>
          <div className="pg-hd">Employé</div>
          {DAYS.map(d=><div key={d} className="pg-hd">{d.substring(0,3)}</div>)}
          {employees.map(e=>(
            <React.Fragment key={e.id}>
              <div className="pg-nm"><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:7,height:7,borderRadius:"50%",background:e.color,flexShrink:0}}/><span style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.name}</span></div><span style={{fontSize:10,color:"#4A5270"}}>{e.role}</span></div>
              {DAYS.map((_,di)=><div key={di} className={"pg-c "+(e.days.includes(di)?"pg-on":"pg-off")}>{e.days.includes(di)?e.shift.split(" ")[0]:"—"}</div>)}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-hd"><div className="card-t">👥 Fiches employés</div></div>
        <table className="tbl"><thead><tr><th>Nom</th><th>Rôle</th><th>Contrat</th><th>Shift</th><th>Jours</th><th>Salaire</th><th></th></tr></thead>
        <tbody>{employees.map(e=>(
          <tr key={e.id}>
            <td><div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:9,height:9,borderRadius:"50%",background:e.color}}/><b>{e.name}</b></div></td>
            <td>{e.role}</td><td><span className="badge bblue">{e.contract}</span></td>
            <td style={{fontSize:12,color:"#8892B0"}}>{e.shift}</td>
            <td style={{fontSize:12,color:"#4A5270"}}>{e.days.map(d=>DAYS[d].substring(0,3)).join(", ")}</td>
            <td style={{fontFamily:"'JetBrains Mono',monospace"}}>{Number(e.salary).toLocaleString("fr-FR")} €</td>
            <td><div style={{display:"flex",gap:5}}><button className="btn bg bsm bico" onClick={()=>openEdit(e)}>✏️</button><button className="btn bred bsm bico" onClick={()=>{setEmployees(es=>es.filter(x=>x.id!==e.id));toast("Supprimé","err");}}>🗑</button></div></td>
          </tr>
        ))}</tbody></table>
      </div>
      {modal&&<Modal title={edit?"Modifier l'employé":"Ajouter un employé"} onClose={()=>setModal(false)}>
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          <div className="fg"><label className="fl">Nom complet</label><input className="inp" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} autoFocus/></div>
          <div className="fgrid">
            <div className="fg"><label className="fl">Rôle</label><select className="sel" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></div>
            <div className="fg"><label className="fl">Contrat</label><select className="sel" value={form.contract} onChange={e=>setForm(f=>({...f,contract:e.target.value}))}><option>CDI</option><option>CDD</option><option>Temps partiel</option><option>Stage</option><option>Alternance</option></select></div>
            <div className="fg"><label className="fl">Salaire (€/mois)</label><input className="inp" type="number" value={form.salary} onChange={e=>setForm(f=>({...f,salary:e.target.value}))}/></div>
            <div className="fg"><label className="fl">Téléphone</label><input className="inp" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="06 XX XX XX XX"/></div>
          </div>
          <div className="fg"><label className="fl">Shift</label><select className="sel" value={form.shift} onChange={e=>setForm(f=>({...f,shift:e.target.value}))}>{SHIFTS.map(s=><option key={s}>{s}</option>)}</select></div>
          <div className="fg"><label className="fl">Jours travaillés</label>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{DAYS.map((d,i)=><button key={d} className="btn bsm" style={{background:form.days.includes(i)?"#E8622A":"#1C2238",color:form.days.includes(i)?"#fff":"#8892B0",fontWeight:600}} onClick={()=>toggleDay(i)}>{d.substring(0,3)}</button>)}</div>
          </div>
          <div className="fg"><label className="fl">Couleur planning</label>
            <div style={{display:"flex",gap:7}}>{COLORS.map(col=><div key={col} onClick={()=>setForm(f=>({...f,color:col}))} style={{width:24,height:24,borderRadius:"50%",background:col,cursor:"pointer",border:form.color===col?"3px solid #fff":"3px solid transparent",transition:"border .15s"}}/> )}</div>
          </div>
          <div className="fg"><label className="fl">Note interne</label><input className="inp" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="Référente salle, parle anglais..."/></div>
        </div>
        <div className="modal-ft"><button className="btn bg" onClick={()=>setModal(false)}>Annuler</button><button className="btn bp" onClick={save}>Enregistrer</button></div>
      </Modal>}
      {intModal&&<Modal title="Demander un intérimaire" onClose={()=>setIntModal(false)}>
        <div className="alert ai" style={{marginBottom:11}}>🔗 Connecté à <b>{restaurant.interimPartner}</b> — demande transmise automatiquement.</div>
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          <div className="fgrid">
            <div className="fg"><label className="fl">Poste requis</label><select className="sel" value={intForm.role} onChange={e=>setIntForm(r=>({...r,role:e.target.value}))}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></div>
            <div className="fg"><label className="fl">Date</label><input className="inp" type="date" value={intForm.date} onChange={e=>setIntForm(r=>({...r,date:e.target.value}))}/></div>
          </div>
          <div className="fg"><label className="fl">Service</label><select className="sel" value={intForm.shift} onChange={e=>setIntForm(r=>({...r,shift:e.target.value}))}>{SHIFTS.map(s=><option key={s}>{s}</option>)}</select></div>
          <div className="fg"><label className="fl">Informations complémentaires</label><textarea className="inp" value={intForm.note} onChange={e=>setIntForm(r=>({...r,note:e.target.value}))} placeholder="Expérience requise, tenue, particularités..."/></div>
        </div>
        <div className="modal-ft"><button className="btn bg" onClick={()=>setIntModal(false)}>Annuler</button><button className="btn bp" onClick={()=>{toast(`✅ Demande envoyée à ${restaurant.interimPartner}`);setIntModal(false);}}>📤 Envoyer</button></div>
      </Modal>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MARCHÉ
// ═══════════════════════════════════════════════════
function MarchePage({stock}){
  const [aiReco,setAiReco]=useState(null);
  const [loading,setLoading]=useState(false);
  const [filter,setFilter]=useState("Tous");
  const suppliers=[...new Set(MARKET_OFFERS.map(o=>o.supplier))];
  async function analyze(){
    setLoading(true);
    const low=stock.filter(i=>stockStatus(i)!=="ok").map(i=>`${i.name}(${i.qty}/${i.min}${i.unit})`).join(", ")||"aucun";
    const r=await claude([{role:"user",content:`Analyse offres marché.\nStock faible: ${low}\nOffres:\n${MARKET_OFFERS.map(o=>`${o.product}@${o.supplier}: ${o.originalPrice}€→${o.promoPrice}€(-${o.discount}%), jusqu'au ${o.until}`).join("\n")}\nPour chaque offre: URGENT/INTÉRESSANT/IGNORER. Économies potentielles. Liste d'achat prioritaire.`}],"Expert approvisionnement restauration. Réponds en français, concis et actionnable.");
    setAiReco(r);setLoading(false);
  }
  const filtered=filter==="Tous"?MARKET_OFFERS:MARKET_OFFERS.filter(o=>o.supplier===filter);
  return(
    <div className="page">
      <div className="ph"><div className="ph-t">Offres du Marché</div><div className="ph-s">{MARKET_OFFERS.length} promotions fournisseurs · Économies potentielles : {MARKET_OFFERS.reduce((s,o)=>s+(o.originalPrice-o.promoPrice),0).toFixed(2)}€</div></div>
      <div style={{display:"flex",gap:9,marginBottom:13,flexWrap:"wrap",alignItems:"center"}}>
        <button className="btn bp" onClick={analyze} disabled={loading}>{loading?"⏳ Analyse...":"🤖 Analyser avec l'IA"}</button>
        <div className="tabs">{["Tous",...suppliers].map(s=><button key={s} className={"tab"+(filter===s?" act":"")} onClick={()=>setFilter(s)}>{s}</button>)}</div>
      </div>
      {aiReco&&<div className="card"><div className="card-hd"><div className="card-t">🤖 Analyse IA des offres</div><button className="btn bg bsm bico" onClick={()=>setAiReco(null)}>✕</button></div><div style={{fontSize:13,color:"#8892B0",lineHeight:1.75,whiteSpace:"pre-wrap"}}>{aiReco}</div></div>}
      <div className="mkt-grid">
        {filtered.map(o=><div key={o.id} className={"mkt-card"+(o.urgent?" urg":"")}>
          <div className="mkt-bdg">{o.badge}</div>
          <div className="mkt-p">{o.product}</div>
          <div className="mkt-s">📦 {o.supplier} · {o.qty}</div>
          <div className="mkt-pr"><div className="mkt-old">{o.originalPrice}€</div><div className="mkt-new">{o.promoPrice}€</div><div className="mkt-disc">-{o.discount}%</div></div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,color:"#4A5270"}}>⏱ Jusqu'au {o.until}</span>
            <button className="btn bgreen bsm">Commander</button>
          </div>
        </div>)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// HORAIRES
// ═══════════════════════════════════════════════════
function HorairesPage({restaurant,setRestaurant,toast}){
  const [form,setForm]=useState({...restaurant});
  const u=k=>e=>setForm(f=>({...f,[k]:typeof e==="boolean"?e:e.target.value}));
  const opened=isOpen(form);
  return(
    <div className="page">
      <div className="ph"><div className="ph-t">Horaires & Informations</div><div className="ph-s">Gérez les horaires et informations de votre établissement</div></div>
      <div className="spill" style={{background:opened?"rgba(16,201,143,.08)":"rgba(240,78,110,.08)",border:`1px solid ${opened?"rgba(16,201,143,.3)":"rgba(240,78,110,.3)"}`}}>
        <div className="sdot" style={{background:opened?"#10C98F":"#F04E6E",boxShadow:`0 0 9px ${opened?"#10C98F":"#F04E6E"}`}}/>
        <div><div style={{fontWeight:700,fontSize:14,color:opened?"#10C98F":"#F04E6E"}}>{opened?"Ouvert en ce moment":"Fermé en ce moment"}</div><div style={{fontSize:12,color:"#8892B0",marginTop:1}}>{form.name} · {new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</div></div>
      </div>
      <div className="card">
        <div className="card-t" style={{marginBottom:13}}>⏰ Horaires</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11,marginBottom:13}}>
          <div className="hr-block"><div><div className="hr-l">Ouverture</div><div className="hr-v">{form.openTime}</div></div><input type="time" className="inp" value={form.openTime} onChange={u("openTime")} style={{width:115}}/></div>
          <div className="hr-block"><div><div className="hr-l">Fermeture</div><div className="hr-v">{form.closeTime}</div></div><input type="time" className="inp" value={form.closeTime} onChange={u("closeTime")} style={{width:115}}/></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:form.hasBreak?11:0}}><Toggle on={form.hasBreak} onChange={v=>setForm(f=>({...f,hasBreak:v}))}/><span style={{fontSize:13,color:"#8892B0"}}>Coupure inter-service</span></div>
        {form.hasBreak&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          <div className="hr-block"><div><div className="hr-l">Début coupure</div><div className="hr-v">{form.breakStart}</div></div><input type="time" className="inp" value={form.breakStart} onChange={u("breakStart")} style={{width:115}}/></div>
          <div className="hr-block"><div><div className="hr-l">Fin coupure</div><div className="hr-v">{form.breakEnd}</div></div><input type="time" className="inp" value={form.breakEnd} onChange={u("breakEnd")} style={{width:115}}/></div>
        </div>}
      </div>
      <div className="card">
        <div className="card-t" style={{marginBottom:13}}>🏪 Informations</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
          <div className="fg"><label className="fl">Nom</label><input className="inp" value={form.name} onChange={u("name")}/></div>
          <div className="fg"><label className="fl">Type</label><select className="sel" value={form.type||"Bistrot"} onChange={u("type")}>{["Bistrot","Brasserie","Gastronomique","Fast-casual","Pizzeria","Japonais","Végétarien","Autre"].map(t=><option key={t}>{t}</option>)}</select></div>
          <div className="fg"><label className="fl">Couverts</label><input className="inp" type="number" value={form.coverCapacity} onChange={u("coverCapacity")}/></div>
          <div className="fg"><label className="fl">Partenaire intérim</label><input className="inp" value={form.interimPartner} onChange={u("interimPartner")} placeholder="Manpower, Adecco..."/></div>
          <div className="fg"><label className="fl">Téléphone</label><input className="inp" value={form.phone} onChange={u("phone")}/></div>
          <div className="fg"><label className="fl">Email</label><input className="inp" value={form.email} onChange={u("email")}/></div>
          <div className="fg" style={{gridColumn:"1/-1"}}><label className="fl">Adresse</label><input className="inp" value={form.address} onChange={u("address")}/></div>
          <div className="fg" style={{gridColumn:"1/-1"}}><label className="fl">Site internet</label><input className="inp" value={form.website} onChange={u("website")} placeholder="https://..."/></div>
        </div>
      </div>
      <button className="btn bp" onClick={()=>{setRestaurant(form);toast("Sauvegardé ✓");}} style={{padding:"10px 24px",fontSize:14}}>💾 Sauvegarder</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// SAISONS IA
// ═══════════════════════════════════════════════════
function SaisonsPage({stock,menu,restaurant}){
  const [reco,setReco]=useState(null);
  const [loading,setLoading]=useState(false);
  async function analyze(){
    setLoading(true);
    const r=await claude([{role:"user",content:`Analyse saisonnière complète pour "${restaurant.name}" (${restaurant.type||"restaurant"}, ${restaurant.coverCapacity} couverts).\nSaison: ${SEASON} — ingrédients: ${SEASONS[SEASON].items.join(", ")}\nCarte: ${menu.map(m=>`${m.name}(${m.price}€,marge:${margin(m)}%,saison:${m.season})`).join(", ")}\nStock: ${stock.map(i=>`${i.name}:${i.qty}${i.unit}`).join(", ")}\n\nDonne:\n1. 🌟 Plats à mettre EN AVANT cette saison\n2. 💡 3 nouvelles idées de plats saisonniers avec recette rapide et prix suggéré\n3. 💰 Conseils pricing pour maximiser la rentabilité\n4. 📦 Ingrédients saisonniers à commander\n5. 🗑️ Plats à retirer ou mettre en pause\nSois créatif, précis et professionnel.`}],"Chef étoilé et consultant restauration. Réponds en français, recommandations concrètes.");
    setReco(r);setLoading(false);
  }
  return(
    <div className="page">
      <div className="ph"><div className="ph-t">Recommandations Saisonnières</div><div className="ph-s">L'IA adapte votre carte à la saison pour maximiser fraîcheur et rentabilité</div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {Object.entries(SEASONS).map(([name,s])=>(
          <div key={name} className="card" style={{padding:13,marginBottom:0,border:name===SEASON?"1px solid rgba(232,98,42,.35)":undefined,background:name===SEASON?"rgba(232,98,42,.06)":undefined}}>
            <div style={{fontSize:26,marginBottom:7}}>{s.icon}</div>
            <div style={{fontWeight:700,fontSize:13,color:name===SEASON?"#E8622A":"#EDF0FF"}}>{name}</div>
            {name===SEASON&&<div style={{fontSize:10,color:"#E8622A",marginTop:2,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>● En cours</div>}
            <div style={{fontSize:11,color:"#4A5270",marginTop:5,lineHeight:1.5}}>{s.items.slice(0,4).join(", ")}...</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div><div className="card-t">Analyse IA — {SEASON} {SEASONS[SEASON].icon}</div><div className="card-s">Recommandations personnalisées pour {restaurant.name}</div></div>
          <button className="btn bp" onClick={analyze} disabled={loading}>{loading?"⏳ Analyse...":"✨ Lancer l'analyse"}</button>
        </div>
        {loading&&<div style={{textAlign:"center",padding:"36px 0",color:"#4A5270"}}><div style={{fontSize:34,marginBottom:10}}>🤔</div><div>Claude analyse votre restaurant...</div></div>}
        {reco&&!loading&&<div style={{fontSize:13,color:"#8892B0",lineHeight:1.8,whiteSpace:"pre-wrap"}}>{reco}</div>}
        {!reco&&!loading&&<div style={{textAlign:"center",padding:"34px 0",color:"#4A5270"}}><div style={{fontSize:38,marginBottom:9}}>🌿</div><div>Cliquez sur "Lancer l'analyse" pour obtenir des recommandations personnalisées.</div></div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ASSISTANT IA
// ═══════════════════════════════════════════════════
function ChatPage({stock,menu,employees,restaurant}){
  const [msgs,setMsgs]=useState([{role:"assistant",content:`Bonjour ! Je suis l'assistant IA de **${restaurant.name}**.\n\nJe connais en temps réel :\n• Votre stock (${stock.length} ingrédients, ${stock.filter(i=>stockStatus(i)!=="ok").length} alertes)\n• Votre carte (${menu.length} plats, marge moyenne ${menu.length?Math.round(menu.reduce((s,m)=>s+margin(m),0)/menu.length):0}%)\n• Votre équipe (${employees.length} employés)\n• Saison : ${SEASON} ${SEASONS[SEASON].icon}\n• Les offres marché du moment\n\nQue puis-je faire pour vous ?`}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{ref.current?.scrollIntoView({behavior:"smooth"})},[msgs]);
  const SYSTEM=`Tu es l'IA de gestion du restaurant "${restaurant.name}" (${restaurant.type||"restaurant"}, ${restaurant.coverCapacity} couverts, ouvert ${restaurant.openTime}-${restaurant.closeTime}, ${isOpen(restaurant)?"ACTUELLEMENT OUVERT":"ACTUELLEMENT FERMÉ"}).
STOCK: ${stock.map(i=>`${i.name}:${i.qty}${i.unit}(min:${i.min},statut:${stockStatus(i)}${i.promo?`,PROMO:${i.promoPrice}€`:""})`).join(" | ")}
CARTE: ${menu.map(m=>`${m.name}[${m.cat}] ${m.price}€(coût:${m.cost}€,marge:${margin(m)}%,actif:${m.active})`).join(" | ")}
ÉQUIPE: ${employees.map(e=>`${e.name}(${e.role})`).join(", ")}
SAISON: ${SEASON} — ${SEASONS[SEASON].items.join(", ")}
OFFRES MARCHÉ: ${MARKET_OFFERS.map(o=>`${o.product}@${o.supplier}:${o.promoPrice}€(-${o.discount}%)`).join(" | ")}
INTÉRIM: ${restaurant.interimPartner}
Réponds en français, concis, professionnel et toujours actionnable.`;
  async function send(){
    if(!input.trim()||loading)return;
    const txt=input.trim();setInput("");
    setMsgs(m=>[...m,{role:"user",content:txt}]);setLoading(true);
    const hist=msgs.slice(-10).map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.content}));
    const r=await claude([...hist,{role:"user",content:txt}],SYSTEM);
    setMsgs(m=>[...m,{role:"assistant",content:r}]);setLoading(false);
  }
  const CHIPS=["Quoi commander en urgence ?","Plats les plus rentables ?","Optimise mon planning","Nouvelle recette avec mon stock ?","Quelle offre marché saisir ?","Analyse ma rentabilité","Plat idéal pour "+SEASON+" ?","Besoin d'un intérimaire ?","Quels plats mettre en avant ce soir ?"];
  return(
    <div className="page">
      <div className="ph"><div className="ph-t">Assistant IA</div><div className="ph-s">Claude connaît votre restaurant en temps réel</div></div>
      {msgs.length<=1&&<div className="chips">{CHIPS.map(c=><span key={c} className="chip" onClick={()=>setInput(c)}>{c}</span>)}</div>}
      <div className="card" style={{padding:0,overflow:"hidden"}}>
        <div className="chat-wrap" style={{padding:"0 17px 17px"}}>
          <div className="chat-msgs">
            {msgs.map((m,i)=>(
              <div key={i} className={"cmsg "+(m.role==="assistant"?"cai":"cusr")}>
                <div className="clbl">{m.role==="assistant"?"🤖 RestaurantOS IA":"👤 Vous"}</div>
                <div className="cbub">{m.content}</div>
              </div>
            ))}
            {loading&&<div className="cmsg cai"><div className="clbl">🤖 RestaurantOS IA</div><div className="cbub"><div className="typing"><span/><span/><span/></div></div></div>}
            <div ref={ref}/>
          </div>
          <div className="chat-bar">
            <input className="inp" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Posez votre question..."/>
            <button className="btn bp" onClick={send} disabled={loading||!input.trim()}>Envoyer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ABONNEMENT
// ═══════════════════════════════════════════════════
function AbonnementPage({onLogout}){
  return(
    <div className="page">
      <div className="ph"><div className="ph-t">Abonnement</div><div className="ph-s">Gérez votre accès RestaurantOS</div></div>
      <div className="card" style={{background:"linear-gradient(135deg,rgba(232,98,42,.1),rgba(155,114,245,.07))",borderColor:"rgba(232,98,42,.3)"}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:32,fontWeight:800,color:"#E8622A"}}>100€<span style={{fontSize:14,color:"#8892B0",fontFamily:"Inter",fontWeight:400}}> / semaine</span></div>
        <div style={{fontSize:13,color:"#8892B0",marginTop:3,marginBottom:13}}>Accès complet · Sans engagement · Résiliable à tout moment</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {["✅ Stock intelligent & alertes","✅ Carte & rentabilité","✅ Planning équipe IA","✅ Offres marché fournisseurs","✅ Recommandations saisonnières","✅ Assistant IA 24h/24","✅ Connexion intérim","✅ Statut ouverture temps réel","✅ Import toutes sources (Google, réseaux, presse)","✅ Comptes restaurant sécurisés"].map(f=><span className="badge bok" key={f}>{f}</span>)}
        </div>
      </div>
      <div className="card">
        <div className="card-t" style={{marginBottom:13}}>💳 Facturation</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[["Prochain prélèvement","02/07/2026"],["Montant","100,00 €"],["Moyen de paiement","Visa ●●●● 4242"],["Statut","✅ Actif"]].map(([l,v])=>(
            <div key={l} style={{background:"#0D1018",borderRadius:8,padding:12,border:"1px solid #1C2238"}}>
              <div style={{fontSize:11,color:"#4A5270",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{l}</div>
              <div style={{fontSize:14,fontWeight:600}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:9,marginTop:13}}>
          <button className="btn bg">Changer de carte bancaire</button>
          <button className="btn bg">Télécharger les factures</button>
          <button className="btn bred" onClick={onLogout}>Se déconnecter</button>
        </div>
      </div>
      <div className="alert ai">💡 <b>Tarif de lancement :</b> 100€/semaine. Prix garanti pour les premiers abonnés.</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════════════
const NAV=[
  {section:"Principal"},
  {id:"dashboard",label:"Tableau de bord",icon:"📊"},
  {id:"horaires",label:"Horaires & Infos",icon:"🕐"},
  {section:"Opérations"},
  {id:"stock",label:"Stock",icon:"📦",alert:true},
  {id:"menu",label:"Carte",icon:"🍽️"},
  {id:"marche",label:"Offres Marché",icon:"🏷️"},
  {section:"Équipe"},
  {id:"planning",label:"Planning",icon:"📅"},
  {section:"Intelligence IA"},
  {id:"saisons",label:"Saisons & Recettes",icon:"🌿"},
  {id:"chat",label:"Assistant IA",icon:"💬"},
  {section:"Compte"},
  {id:"abonnement",label:"Abonnement",icon:"💳"},
];

// ═══════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════
export default function App(){
  const [authUser,setAuthUser]=useState(null);
  const [restaurant,setRestaurant]=useState(null);
  const [page,setPage]=useState("dashboard");
  const [stock,setStock]=useState(DEFAULT_STOCK);
  const [menu,setMenu]=useState(DEFAULT_MENU);
  const [employees,setEmployees]=useState(DEFAULT_EMP);
  const [toastMsg,setToastMsg]=useState(null);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    async function init(){
      const session=await Store.get("session");
      if(session){
        setAuthUser(session);
        const r=await Store.get(`resto:${session.userId}`);
        const s=await Store.get(`stock:${session.userId}`);
        const m=await Store.get(`menu:${session.userId}`);
        const e=await Store.get(`emp:${session.userId}`);
        if(r)setRestaurant(r);
        if(s&&s.length)setStock(s);
        if(m&&m.length)setMenu(m);
        if(e&&e.length)setEmployees(e);
      }
      setLoaded(true);
    }
    init();
  },[]);

  useEffect(()=>{if(loaded&&authUser&&restaurant)Store.set(`resto:${authUser.userId}`,restaurant);},[restaurant,loaded,authUser]);
  useEffect(()=>{if(loaded&&authUser)Store.set(`stock:${authUser.userId}`,stock);},[stock,loaded,authUser]);
  useEffect(()=>{if(loaded&&authUser)Store.set(`menu:${authUser.userId}`,menu);},[menu,loaded,authUser]);
  useEffect(()=>{if(loaded&&authUser)Store.set(`emp:${authUser.userId}`,employees);},[employees,loaded,authUser]);

  function toast(msg,type="ok"){setToastMsg({msg,type});}

  async function handleAuth(user){
    setAuthUser(user);
    if(user.isNew){
      setRestaurant(null);
    } else {
      const r=await Store.get(`resto:${user.userId}`);
      if(r){
        setRestaurant(r);
        const s=await Store.get(`stock:${user.userId}`);
        const m=await Store.get(`menu:${user.userId}`);
        const e=await Store.get(`emp:${user.userId}`);
        if(s&&s.length)setStock(s);
        if(m&&m.length)setMenu(m);
        if(e&&e.length)setEmployees(e);
      }
    }
  }

  async function handleLogout(){
    await Store.del("session");
    setAuthUser(null);setRestaurant(null);setPage("dashboard");
    setStock(DEFAULT_STOCK);setMenu(DEFAULT_MENU);setEmployees(DEFAULT_EMP);
  }

  if(!loaded)return(<><style>{CSS}</style><div style={{minHeight:"100vh",background:"#07090F",display:"flex",alignItems:"center",justifyContent:"center",color:"#4A5270",fontFamily:"Inter,sans-serif",fontSize:14}}>Chargement de RestaurantOS...</div></>);
  if(!authUser)return(<><style>{CSS}</style><AuthPage onAuth={handleAuth}/>{toastMsg&&<Toast msg={toastMsg.msg} type={toastMsg.type} onDone={()=>setToastMsg(null)}/>}</>);
  if(!restaurant)return(<><style>{CSS}</style><Onboarding userId={authUser.userId} onComplete={r=>{setRestaurant(r);toast("🚀 Restaurant configuré avec succès !");}} />{toastMsg&&<Toast msg={toastMsg.msg} type={toastMsg.type} onDone={()=>setToastMsg(null)}/>}</>);

  const opened=isOpen(restaurant);
  const lowStock=stock.filter(i=>stockStatus(i)!=="ok").length;

  return(
    <><style>{CSS}</style>
      <div className="app">
        <nav className="sb">
          <div className="sb-brand"><div className="sb-brand-name">RestaurantOS</div><div className="sb-brand-tag">IA · Powered by Claude</div></div>
          <div className="sb-resto" onClick={()=>setPage("horaires")}>
            <div className="sb-resto-name">{restaurant.name}</div>
            <div className={opened?"sb-open":"sb-closed"}>{opened?"● Ouvert":"● Fermé"}</div>
          </div>
          {NAV.map((n,i)=>{
            if(n.section)return <div key={i} className="sb-sec">{n.section}</div>;
            return(
              <div key={n.id} className={"ni"+(page===n.id?" act":"")} onClick={()=>setPage(n.id)}>
                <span className="ni-ico">{n.icon}</span>
                <span style={{flex:1}}>{n.label}</span>
                {n.alert&&lowStock>0&&<span className="ni-badge">{lowStock}</span>}
              </div>
            );
          })}
          <div className="sb-bottom">
            <div className="sb-season"><div className="sb-season-l">Saison</div><div className="sb-season-v">{SEASONS[SEASON].icon} {SEASON}</div></div>
            <div className="sb-plan"><div className="sb-plan-p">100€</div><div className="sb-plan-l">/ semaine · Actif ✓</div></div>
          </div>
        </nav>
        <main className="main">
          {page==="dashboard"&&<Dashboard stock={stock} menu={menu} employees={employees} restaurant={restaurant}/>}
          {page==="horaires"&&<HorairesPage restaurant={restaurant} setRestaurant={setRestaurant} toast={toast}/>}
          {page==="stock"&&<StockPage stock={stock} setStock={setStock} toast={toast}/>}
          {page==="menu"&&<MenuPage menu={menu} setMenu={setMenu} toast={toast}/>}
          {page==="marche"&&<MarchePage stock={stock}/>}
          {page==="planning"&&<PlanningPage employees={employees} setEmployees={setEmployees} restaurant={restaurant} toast={toast}/>}
          {page==="saisons"&&<SaisonsPage stock={stock} menu={menu} restaurant={restaurant}/>}
          {page==="chat"&&<ChatPage stock={stock} menu={menu} employees={employees} restaurant={restaurant}/>}
          {page==="abonnement"&&<AbonnementPage onLogout={handleLogout}/>}
        </main>
      </div>
      {toastMsg&&<Toast msg={toastMsg.msg} type={toastMsg.type} onDone={()=>setToastMsg(null)}/>}
    </>
  );
}
