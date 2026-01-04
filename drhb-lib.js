(function(){
  const DRHB = window.DRHB = window.DRHB || {};
  DRHB.__version = 'drhb-lib_V4';
  try{ window.__DRHB_LIB_LOADED__ = DRHB.__version; }catch(_){}
  const onceSet = DRHB.__once || (DRHB.__once = new Set());
  function loud(level, key, msg, ctx){
    if(onceSet.has(key)) return;
    onceSet.add(key);
    try{
      const fn = level === "error" ? console.error : console.warn;
      fn.call(console, msg, ctx || {});
    }catch(_){}
  }
  DRHB.loudWarnOnce = (key, msg, ctx)=>loud("warn", key, msg, ctx);
  DRHB.loudErrOnce = (key, msg, ctx)=>loud("error", key, msg, ctx);

  DRHB.getPersonelId = function(){
    try{
      const p = new URLSearchParams(window.location.search).get("PersonelID");
      if(p && String(parseInt(p,10))===p.trim()) return parseInt(p,10);
    }catch(e){}
    try{ if(window.__HBYS_PERSONEL_ID) return window.__HBYS_PERSONEL_ID; }catch(e){}
    return 999;
  };

  DRHB.configVersion = 2;

  DRHB.uKey = function(baseKey, persId, cfgVersion){
    const v = (cfgVersion!=null) ? cfgVersion : DRHB.configVersion;
    const pid = (persId!=null) ? persId : DRHB.getPersonelId();
    return `drhb:v${v}:p${pid}:${baseKey}`;
  };

  DRHB.cfgGetRaw = function(baseKey, persId, cfgVersion){
    const pid = (persId!=null) ? persId : DRHB.getPersonelId();
    try{
      const k = DRHB.uKey(baseKey, pid, cfgVersion);
      const v = localStorage.getItem(k);
      if(v !== null){
        if(typeof v === "string" && v.trim() === "") return null;
        return v;
      }
    }catch(e){}
    try{
      const byP = window.__HBYS_CONFIG_V1_BY_PERSONEL;
      if(byP && byP[pid] && typeof byP[pid][baseKey] !== "undefined"){
        const v = byP[pid][baseKey];
        if(typeof v === "string" && v.trim() === "") return null;
        return (typeof v === "string") ? v : JSON.stringify(v);
      }
      const g = window.__HBYS_CONFIG_V1;
      if(g && typeof g[baseKey] !== "undefined"){
        const v = g[baseKey];
        if(typeof v === "string" && v.trim() === "") return null;
        return (typeof v === "string") ? v : JSON.stringify(v);
      }
    }catch(e){}
    return null;
  };

  DRHB.cfgSetRaw = function(baseKey, rawValue, persId, cfgVersion){
    const pid = (persId!=null) ? persId : DRHB.getPersonelId();
    const persist = (window.__HBYS_PERSIST_TO_LOCALSTORAGE !== false);
    try{ if(persist) localStorage.setItem(DRHB.uKey(baseKey, pid, cfgVersion), rawValue); }catch(e){}
    try{
      if(window.__HBYS_CONFIG_V1_BY_PERSONEL){
        if(!window.__HBYS_CONFIG_V1_BY_PERSONEL[pid]) window.__HBYS_CONFIG_V1_BY_PERSONEL[pid] = {};
        window.__HBYS_CONFIG_V1_BY_PERSONEL[pid][baseKey] = rawValue;
      }
    }catch(e){}
    try{
      if(window.__HBYS_CONFIG_V1 && typeof window.__HBYS_CONFIG_V1 === "object"){
        window.__HBYS_CONFIG_V1[baseKey] = rawValue;
      }
    }catch(e){}
    try{
      if(typeof window.__HBYS_SAVE_CONFIG === "function"){
        window.__HBYS_SAVE_CONFIG(pid, baseKey, rawValue);
      }
    }catch(e){}
  };

  DRHB.ParametreDefaultGetir = function(){
    return {
      solPanelConfig: null,
      quickAccessConfig: null,
      edgeLeftMenuState: null,
      edgeRightMenuState: null,
      incePanelWidthPx: null,
      microGrid: null
    };
  };

  DRHB.ParametreOku = function(persId){
    const pid = (persId!=null) ? persId : DRHB.getPersonelId();
    const keys = ["solPanelConfig","quickAccessConfig","edgeLeftMenuState","edgeRightMenuState","incePanelWidthPx","microGrid"];
    const out = {};
    let any = false;
    for(const k of keys){
      const raw = DRHB.cfgGetRaw(k, pid);
      if(raw==null) continue;
      any = true;
      
      try{
        out[k] = JSON.parse(raw);
      }catch(e){
        out[k] = raw;
      }
      try{
        if(k==="solPanelConfig") out[k] = DRHB.normalizeSolPanelConfig(out[k]);
        if(k==="quickAccessConfig") out[k] = DRHB.normalizeQuickAccessConfig(out[k]);
      }catch(e2){}
}
    if(!any) return DRHB.ParametreDefaultGetir();
    return out;
  };

  DRHB.ParametreYaz = function(persId, parametre){
    const pid = (persId!=null) ? persId : DRHB.getPersonelId();
    const p = (parametre && typeof parametre === "object") ? parametre : {};
    for(const k in p){
      if(!Object.prototype.hasOwnProperty.call(p,k)) continue;
      
      let vv = v;
      try{
        if(k==="solPanelConfig") vv = DRHB.normalizeSolPanelConfig(vv);
        if(k==="quickAccessConfig") vv = DRHB.normalizeQuickAccessConfig(vv);
      }catch(e){}
      const raw = (typeof vv === "string") ? vv : JSON.stringify(vv);
      DRHB.cfgSetRaw(k, raw, pid);
}
  };

  
  DRHB.canonId = function(id){
    const s = String(id||"").trim();
    if(!s) return "";
    if(s.startsWith("panel-")) return s.slice(6);
    if(s.startsWith("qa-")) return s.slice(3);
    return s;
  };

  function __normItemsArray(arr){
    const out = [];
    const seen = new Set();
    for(const it of (arr||[])){
      if(!it || typeof it !== "object") continue;
      const id = DRHB.canonId(it.id);
      if(!id || seen.has(id)) continue;
      seen.add(id);
      out.push({ id, enabled: (it.enabled !== false), isDefault: !!it.isDefault });
    }
    return out;
  }

  DRHB.normalizeSolPanelConfig = function(cfg){
    const c = cfg;
    if(Array.isArray(c)){
      return __normItemsArray(c);
    }
    if(c && typeof c === "object"){
      const out = {};
      for(const k of ["desktop","tablet","mobile"]){
        if(Array.isArray(c[k])) out[k] = __normItemsArray(c[k]);
      }
      return out;
    }
    return cfg;
  };

  DRHB.normalizeQuickAccessConfig = function(cfg){
    const c = cfg;
    const normBlock = (b)=>{
      if(Array.isArray(b)) return { items: __normItemsArray(b).map(x=>({id:x.id, enabled:x.enabled})), align:"right", barVisible:true };
      if(b && typeof b === "object"){
        const items = Array.isArray(b.items) ? b.items : [];
        const align = String(b.align||"right").toLowerCase();
        const barVisible = (typeof b.barVisible === "boolean") ? b.barVisible : true;
        return { items: __normItemsArray(items).map(x=>({id:x.id, enabled:x.enabled})), align, barVisible };
      }
      return null;
    };
    if(Array.isArray(c)){
      const nb = normBlock(c);
      return nb ? nb.items : c;
    }
    if(c && typeof c === "object"){
      const out = {};
      for(const k of ["desktop","tablet","mobile"]){
        const nb = normBlock(c[k]);
        if(nb) out[k] = nb;
      }
      return out;
    }
    return cfg;
  };

DRHB.getCatalogItems = function(){
    let items = [];
    try{
      if(window.__ORTAK_MENU_V1 && Array.isArray(window.__ORTAK_MENU_V1.items) && window.__ORTAK_MENU_V1.items.length){
        items = window.__ORTAK_MENU_V1.items;
      }
    }catch(e){}
    try{
      if(!items.length && Array.isArray(window.MenuItemsTanimlamalari) && window.MenuItemsTanimlamalari.length){
        items = window.MenuItemsTanimlamalari;
      }
    }catch(e){}
    const out = [];
    const seen = new Set();
    try{
      (items||[]).forEach(it=>{
        if(!it) return;
        const id = String(it.id||"").trim();
        if(!id) return;
        if(seen.has(id)) return;
        seen.add(id);
        out.push(Object.assign({}, it, { id }));
      });
    }catch(e){}
    return out;
  };

  DRHB.filterCatalogByArea = function(area){
    const a = String(area||"").trim();
    const items = DRHB.getCatalogItems() || [];
    const out = [];
    for(const it of items){
      if(!it) continue;
      const allowed = it.allowedAreas;
      if(!allowed || (Array.isArray(allowed) && allowed.length===0)){
        out.push(it);
        continue;
      }
      if(Array.isArray(allowed) && allowed.map(x=>String(x)).includes(a)){
        out.push(it);
      }
    }
    return out;
  };

  DRHB.getQuickDefs = function(){
    try{
      return DRHB.filterCatalogByArea("quick") || [];
    }catch(e){
      DRHB.loudWarnOnce("quick:getDefs","[DRHB][quick] getQuickDefs failed",{ e });
      return [];
    }
  };


  DRHB.clamp = (n,min,max)=>Math.max(min, Math.min(max, n));

  DRHB.cssSet = function(name, value){
    try{ document.documentElement.style.setProperty(name, value); return; }catch(e){}
    loud("error", "cssSet:"+name, "[DRHB] cssSet failed", { name, value });
  };
  DRHB.cssGetPx = function(name){
    try{
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const n = parseInt(String(v).replace("px",""), 10) || 0;
      return n;
    }catch(e){
      loud("error", "cssGetPx:"+name, "[DRHB] cssGetPx failed", { name, e });
      return 0;
    }
  };

  DRHB.meDeviceMode = function(){
    try{
      if(typeof window.meDeviceMode === "function") return window.meDeviceMode();
    }catch(e){
      loud("error", "meDeviceMode:call", "[DRHB] meDeviceMode threw", { e });
    }
    try{
      const w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 1200;
      if(w <= 768) return "mobile";
      if(w <= 1024) return "tablet";
      return "desktop";
    }catch(e){
      loud("error", "meDeviceMode:fallback", "[DRHB] meDeviceMode fallback failed", { e });
      return "desktop";
    }
  };

  DRHB.pad = ()=>DRHB.cssGetPx("--grid-pad");
  DRHB.activeWidth = ()=>DRHB.cssGetPx("--active-width");
  DRHB.cellW = ()=>DRHB.cssGetPx("--cell-w");
  DRHB.cellH = ()=>DRHB.cssGetPx("--cell-h");

  const MICROGRID_KEY = "__ME_MICROGRID_V1__";
  DRHB.microGridKey = MICROGRID_KEY;

  DRHB.readMicroGrid = function(){
    try{
      const raw = localStorage.getItem(MICROGRID_KEY);
      if(!raw) return null;
      const o = JSON.parse(raw);
      if(!o || typeof o !== "object") return null;
      return o;
    }catch(e){
      loud("warn", "microGrid:read", "[DRHB] microGrid read failed", { e });
      return null;
    }
  };
  DRHB.writeMicroGrid = function(o){
    try{ localStorage.setItem(MICROGRID_KEY, JSON.stringify(o||{})); }catch(e){
      loud("warn", "microGrid:write", "[DRHB] microGrid write failed", { e });
    }
  };

  DRHB.getMicroGridForMode = function(){
    const mode = DRHB.meDeviceMode();
    const mg = DRHB.readMicroGrid() || {};
    const def = { mW: Math.max(1, Math.floor(DRHB.cellW()/4)), mH: Math.max(1, Math.floor(DRHB.cellH()/4)) };
    const mo = mg[mode] || null;
    const mwv = (mo && mo.mW!=null) ? (parseInt(mo.mW,10)||def.mW) : def.mW;
    const mhv = (mo && mo.mH!=null) ? (parseInt(mo.mH,10)||def.mH) : def.mH;
    return { mW: mwv, mH: mhv };
  };

  DRHB.applyMicroGrid = function(mwPx, mhPx){
    try{
      DRHB.cssSet("--micro-w", DRHB.clamp(mwPx, 8, 160) + "px");
      DRHB.cssSet("--micro-h", DRHB.clamp(mhPx, 8, 120) + "px");
    }catch(e){
      loud("error", "microGrid:apply", "[DRHB] microGrid apply failed", { e });
    }
  };

  DRHB.syncMicroGridUIFromMode = function(){
    try{
      const hv = document.getElementById("gsHVal");
      const wv = document.getElementById("gsWVal");
      if(!hv || !wv) return;
      const mg = DRHB.getMicroGridForMode();
      if(mg && mg.mH!=null && mg.mW!=null){
        hv.value = String(parseInt(mg.mH,10) || hv.value);
        wv.value = String(parseInt(mg.mW,10) || wv.value);
      }
    }catch(e){
      loud("warn", "microGrid:syncUI", "[DRHB] microGrid sync UI failed", { e });
    }
  };

  DRHB.syncMicroGridInputsFromCSS = function(){
    try{
      const root = getComputedStyle(document.documentElement);
      const mh = parseInt(root.getPropertyValue('--micro-h'), 10);
      const mw = parseInt(root.getPropertyValue('--micro-w'), 10);
      const gh = document.getElementById('gsHVal');
      const gw = document.getElementById('gsWVal');
      if(gh && Number.isFinite(mh)) gh.value = mh;
      if(gw && Number.isFinite(mw)) gw.value = mw;
    }catch(e){
      loud("warn", "microGrid:syncInputs", "[DRHB] microGrid sync inputs failed", { e });
    }
  };

  DRHB.refreshMicroGridFromStorage = function(){
    try{
      const mg = DRHB.getMicroGridForMode();
      if(mg && mg.mW!=null && mg.mH!=null){
        DRHB.applyMicroGrid(mg.mW, mg.mH);
        DRHB.syncMicroGridUIFromMode();
      }
    }catch(e){
      loud("error", "microGrid:refresh", "[DRHB] microGrid refresh failed", { e });
    }
  };

  DRHB.mW = function(){
    try{
      const mg = DRHB.getMicroGridForMode();
      if(mg && mg.mW) return mg.mW;
    }catch(e){
      loud("error", "mW:get", "[DRHB] mW failed", { e });
    }
    loud("warn", "mW:fallback", "[DRHB] microGrid missing → fallback cellW/4", { cellW: DRHB.cellW() });
    return Math.max(1, Math.floor(DRHB.cellW()/4));
  };
  DRHB.mH = function(){
    try{
      const mg = DRHB.getMicroGridForMode();
      if(mg && mg.mH) return mg.mH;
    }catch(e){
      loud("error", "mH:get", "[DRHB] mH failed", { e });
    }
    loud("warn", "mH:fallback", "[DRHB] microGrid missing → fallback cellH/4", { cellH: DRHB.cellH() });
    return Math.max(1, Math.floor(DRHB.cellH()/4));
  };

  DRHB.updateMicroCssVars = function(){
    const mwv = DRHB.mW();
    const mhv = DRHB.mH();
    DRHB.cssSet("--micro-w", mwv+"px");
    DRHB.cssSet("--micro-h", mhv+"px");
  };

  (function(){
    try{ setTimeout(DRHB.refreshMicroGridFromStorage, 0); }catch(e){}
    try{ setTimeout(DRHB.refreshMicroGridFromStorage, 80); }catch(e){}
    try{ setTimeout(DRHB.refreshMicroGridFromStorage, 250); }catch(e){}
    let t = null;
    try{
      window.addEventListener('resize', ()=>{
        try{ clearTimeout(t); }catch(e){}
        t = setTimeout(DRHB.refreshMicroGridFromStorage, 120);
      }, {passive:true});
    }catch(e){}
    DRHB.AFNK = DRHB.AFNK || {};
DRHB.AFNK.toIdPlacementsMap = function(raw){
    try{
      if(!raw) return new Map();
      if(raw && typeof raw.entries==="function"){
        const out = new Map();
        for(const [k,v] of raw.entries()){
          if(Array.isArray(v) && v.length>=2){
            const id = String(v[0]);
            const pos = v[1]||{};
            out.set(id,pos);
          }else{
            out.set(String(k), v||{});
          }
        }
        return out;
      }
      if(Array.isArray(raw)){
        const out = new Map();
        for(const p of raw){
          if(!p) continue;
          if(Array.isArray(p) && p.length>=2){
            out.set(String(p[0]), p[1]||{});
          }else if(p && p.id!=null){
            out.set(String(p.id), (p.pos||p));
          }
        }
        return out;
      }
      if(raw && typeof raw==="object"){
        const out = new Map();
        for(const [k,v] of Object.entries(raw)){
          if(!v) continue;
          out.set(String(k), v||{});
        }
        return out;
      }
      return new Map();
    }catch(e){
      try{ DRHB.loudWarnOnce("afnk:toIdMap","[DRHB][AFNK] toIdPlacementsMap failed", {e}); }catch(_){ }
      return new Map();
    }
  };

  DRHB.AFNK.normalizePlacements = function(raw){
    try{
      const base = DRHB.AFNK.toIdPlacementsMap(raw);
      const mp = new Map();
      for(const [id,pos0] of base.entries()){
        const pos = pos0||{};
        mp.set(String(id),{ r: (pos.r??pos.y??0)|0, c:(pos.c??pos.x??0)|0, w: (parseInt(pos.w??pos.wu??pos.width??1,10)||1), h:(parseInt(pos.h??pos.hu??pos.height??1,10)||1) });
      }
      return mp;
    }catch(e){
      try{ DRHB.loudWarnOnce("afnk:normPlac","[DRHB][AFNK] normalizePlacements failed", {e}); }catch(_){ }
      return new Map();
    }
  };
  
  DRHB.AFNK.createPlacedItemEl = function(args){
    try{
      const id = args && args.id!=null ? String(args.id) : "";
      const item = (args && args.item) || {};
      const st = (args && args.tileStyle) || null;

      const el = document.createElement("div");
      el.className = "placed-item";
      try{ el.dataset.id = id; }catch(_){}
      try{ el.dataset.itemId = id; }catch(_){}

      if(st && typeof st === "object"){
        try{ if(st.fontFamily) el.style.setProperty('--tile-font-family', String(st.fontFamily)); }catch(_){}
        try{ if(st.fontSize!=null) el.style.setProperty('--tile-font-size', (parseInt(st.fontSize,10)||st.fontSize) + 'px'); }catch(_){}
        try{ if(st.fontColor) el.style.setProperty('--tile-font-color', String(st.fontColor)); }catch(_){}
        try{ if(st.fontWeight) el.style.setProperty('--tile-font-weight', String(st.fontWeight)); }catch(_){}
        try{ if(st.iconSize!=null) el.style.setProperty('--tile-icon-size', (parseInt(st.iconSize,10)||st.iconSize) + 'px'); }catch(_){}
        try{ if(st.iconColor) el.style.setProperty('--tile-icon-color', String(st.iconColor)); }catch(_){}
        try{
          const iconPos = String(st.iconPos || "left");
          el.classList.remove("icon-left","icon-right","icon-top","icon-bottom");
          el.classList.add("icon-" + iconPos);
        }catch(_){}
        try{
          const align = String(st.align || "center");
          const h = (align === "left") ? "flex-start" : ((align === "right") ? "flex-end" : "center");
          el.style.setProperty("--tile-justify", h);
          el.style.setProperty("--tile-align-items", "center");
          el.style.setProperty("--tile-text-align", (align === "left") ? "left" : ((align === "right") ? "right" : "center"));
        }catch(_){}
      }

      let layerHTML = "";
      try{
        if(args && typeof args.styleToLayerHTML === "function" && st) layerHTML = String(args.styleToLayerHTML(st) || "");
      }catch(_){}
      if(layerHTML){
        try{
          const wrap = document.createElement("div");
          wrap.innerHTML = layerHTML;
          const node = wrap.firstElementChild;
          if(node) el.appendChild(node);
        }catch(_){}
      }

      const content = document.createElement("div");
      content.className = "tile-content";

      const iconText = (item.icon ?? item.ico ?? item.emoji ?? "").toString();
      if(iconText){
        const ic = document.createElement("div");
        ic.className = "icon";
        ic.textContent = iconText;
        content.appendChild(ic);
      }

      const titleText = (item.title ?? item.hit ?? item.name ?? id ?? "").toString();
      const tt = document.createElement("div");
      tt.className = "title";
      tt.textContent = titleText;
      try{ tt.title = (item.hit || item.title || id || ""); }catch(_){}
      content.appendChild(tt);

      el.appendChild(content);

      try{
        if(args && typeof args.applyTextIconVars === "function" && st){
          args.applyTextIconVars(el, st);
        }
      }catch(_){}

      return el;
    }catch(e){
      DRHB.loudWarnOnce("afnk:createEl","[DRHB][AFNK] createPlacedItemEl failed", {e});
      return null;
    }
  };

  function renderPlacements(state, opts){
    try{
      const o = opts || {};
      const __dbg = !!(o && o.debug) || !!window.__DRHB_DEBUG_PLACEMENTS;
      const __dbgMax = (o && typeof o.debugMax === "number") ? o.debugMax : 25;
      const __dbgLog = (tag, obj)=>{ try{ if(__dbg) console.warn(tag, obj||{}); }catch(e){} };
      const __dbgErr = (tag, obj)=>{ try{ if(__dbg) console.error(tag, obj||{}); }catch(e){} };
      const grid = o.containerEl || state.grid;
      __dbgLog('[DRHB][AFNK] renderPlacements enter', {context:o.context, editable:!!o.editable, showGrid:o.showGrid, side:o.side, gridType:(grid&&grid.nodeType), gridTag:(grid&&grid.tagName), hasState:!!state});
      if(!state || !grid){
        __dbgErr('[DRHB][AFNK] missing state/grid', {state:!!state, grid});
        DRHB.loudWarnOnce("afnk:noGrid","[DRHB][AFNK] missing grid/container", { hasState:!!state, hasGrid:!!grid });
        return [];
      }

      try{
        const gp = getComputedStyle(grid).position;
        if(!gp || gp === "static") grid.style.position = "relative";
      }catch(_){}

      const context = o.context || "preview";
      const editable = !!o.editable;
      const showGrid = (typeof o.showGrid === "boolean") ? o.showGrid : (context === "active");

      try{
        if(showGrid) grid.classList.add("drhb-show-grid");
        else grid.classList.remove("drhb-show-grid");
        try{ grid.style.setProperty("--drhb-show-grid", showGrid ? "1" : "0"); }catch(_){}
      }catch(_){}

      try{ [...grid.querySelectorAll(".placed-item")].forEach(n=>n.remove()); }catch(_){}

      const pad = state.pad ? state.pad() : 0;
      const mw = state.microW ? state.microW() : 1;
      const mh = state.microH ? state.microH() : 1;

      const getItemById = state.getItemById || function(){ return null; };
      const getTileSizePx = state.getTileSizePx || null;
      const tileStyles = state.tileStyles || null;

      const createElement = (typeof o.createElement === "function") ? o.createElement : null;
      const onSelect = (typeof o.onSelect === "function") ? o.onSelect : null;

      const styleFor = (typeof o.styleFor === "function") ? o.styleFor : null;
      const applyTextIconVars = (typeof o.applyTextIconVars === "function") ? o.applyTextIconVars : null;
      const styleToLayerHTML = (typeof o.styleToLayerHTML === "function") ? o.styleToLayerHTML : null;

      const out = [];

      state.placements = DRHB.AFNK.normalizePlacements(state.placements);
      const mp = state.placements;

      let __dbgSeen=0, __dbgDrawn=0, __dbgSkipNoItem=0, __dbgSkipNoEl=0, __dbgSkipOther=0;
      if(!mp || typeof mp.entries !== "function") return out;

      for(const [id,pos0] of mp.entries()){
        __dbgSeen++; if(__dbg && __dbgSeen<=__dbgMax) __dbgLog('[DRHB][AFNK] iter', {id:String(id), pos:pos0});
        const idStr = String(id);
        const item = getItemById(idStr);
        if(!item){ __dbgSkipNoItem++; if(__dbg && __dbgSkipNoItem<=__dbgMax) __dbgLog('[DRHB][AFNK] skip:noItem', {id:idStr}); continue; }

        const pos = pos0 || { r:0, c:0, w:1, h:1 };


        let st = null;
        try{
          if(styleFor) st = styleFor(idStr, item, pos, context);
          else if(tileStyles && typeof tileStyles === "object") st = tileStyles[idStr] || tileStyles[String(idStr)] || null;
        }catch(_){ st = null; }

        let el = null;
        if(createElement){
          try{ el = createElement({id:idStr, item, pos, context, tileStyle: st}); }catch(e){
            DRHB.loudWarnOnce("afnk:createElFn","[DRHB][AFNK] createElement threw", {e, id:idStr});
            el = null;
          }
        }else{
          el = DRHB.AFNK.createPlacedItemEl({id:idStr, item, pos, context, tileStyle: st, styleToLayerHTML, applyTextIconVars});
        }
        if(!el){ __dbgSkipNoEl++; if(__dbg && __dbgSkipNoEl<=__dbgMax) __dbgLog('[DRHB][AFNK] skip:noEl', {id:idStr}); continue; }

        try{ if(!el.classList.contains("placed-item")) el.classList.add("placed-item"); }catch(_){}
        try{ el.style.position = "absolute"; el.style.boxSizing = "border-box"; }catch(_){}

        if(editable){
          try{ el.style.pointerEvents = "auto"; }catch(_){}
          try{ el.tabIndex = 0; }catch(_){}
          try{
            el.addEventListener("click", (ev)=>{
              try{
                ev.preventDefault();
                ev.stopPropagation();
                try{
                  [...grid.querySelectorAll(".placed-item.selected")].forEach(n=>n.classList.remove("selected"));
                }catch(_){}
                try{ el.classList.add("selected"); }catch(_){}
                try{ onSelect && onSelect({ id:idStr, item, pos, el, grid, context }); }catch(e2){
                  DRHB.loudWarnOnce("afnk:onSelect","[DRHB][AFNK] onSelect threw", {e:e2});
                }
              }catch(_){}
            }, {passive:false});
          }catch(_){}
        }else{
          try{ el.style.pointerEvents = "none"; }catch(_){}
        }

        let wPx = (pos.w || 1) * mw;
        let hPx = (pos.h || 1) * mh;
        try{
          if(getTileSizePx){
            const wh = getTileSizePx(idStr, item, pos, context);
            if(wh && typeof wh === "object"){
              if(Number.isFinite(wh.wPx)) wPx = wh.wPx;
              if(Number.isFinite(wh.hPx)) hPx = wh.hPx;
              if(Number.isFinite(wh.w)) wPx = wh.w;
              if(Number.isFinite(wh.h)) hPx = wh.h;
            }
          }
        }catch(e){
          DRHB.loudWarnOnce("afnk:tileSize","[DRHB][AFNK] getTileSizePx failed", {e, id:idStr});
        }

        const left = pad + (Number.isFinite(pos.x) ? pos.x : ((pos.c || 0) * mw));
        const top  = pad + (Number.isFinite(pos.y) ? pos.y : ((pos.r || 0) * mh));

        try{
          el.style.left = left + "px";
          el.style.top = top + "px";
          el.style.width = wPx + "px";
          el.style.height = hPx + "px";
          el.style.setProperty("--tile-w", wPx + "px");
          el.style.setProperty("--tile-h", hPx + "px");
        }catch(_){}

        try{ grid.appendChild(el); }catch(e){
          DRHB.loudWarnOnce("afnk:append","[DRHB][AFNK] append failed", {e, id:idStr});
          continue;
        }

        __dbgDrawn++; if(__dbg && __dbgDrawn<=__dbgMax) __dbgLog('[DRHB][AFNK] drawn', {id:idStr, pos});
        out.push({id:idStr, item, pos, el});
      }

      __dbgLog('[DRHB][AFNK] renderPlacements summary', {seen:__dbgSeen, drawn:__dbgDrawn, skipNoItem:__dbgSkipNoItem, skipNoEl:__dbgSkipNoEl});
      return out;
    }catch(e){
      DRHB.loudWarnOnce("afnk:render","[DRHB][AFNK] renderPlacements failed", {e});
      return [];
    }
  }

DRHB.AFNK.renderPlacements = renderPlacements;
})();
})();
try{
  const D=window.DRHB;
  if(D && D.AFNK && typeof D.AFNK.renderPlacements==='function'){}
  else{
    if(D) D.loudErrOnce && D.loudErrOnce('afnk:missing','[DRHB][AFNK] renderPlacements missing after load', {version:(D&&D.__version)});
  }
}catch(_){}


;(function(){
  const DRHB = window.DRHB = window.DRHB || {};
  DRHB.AFNK = DRHB.AFNK || {};
  // PX-first normalize: preserve x/y, avoid mapping x->c (which causes huge jumps)
  DRHB.AFNK.normalizePlacements = function(raw){
    try{
      const base = (typeof DRHB.AFNK.toIdPlacementsMap === "function") ? DRHB.AFNK.toIdPlacementsMap(raw) : raw;
      const mp = new Map();
      if(!base || typeof base.entries !== "function") return mp;

      const n = (v)=>{
        if(Number.isFinite(v)) return Number(v);
        if(v==null) return NaN;
        const s = String(v).trim();
        if(!s) return NaN;
        const num = parseFloat(s.replace("px",""));
        return Number.isFinite(num) ? num : NaN;
      };

      for(const [id,pos0] of base.entries()){
        const pos = pos0 || {};
        const x0 = (pos.x!=null) ? pos.x : (pos.left!=null ? pos.left : null);
        const y0 = (pos.y!=null) ? pos.y : (pos.top!=null ? pos.top : null);
        const x = n(x0);
        const y = n(y0);
        const hasPX = Number.isFinite(x) || Number.isFinite(y);

        if(hasPX){
          mp.set(String(id),{
            x: Number.isFinite(x) ? x : 0,
            y: Number.isFinite(y) ? y : 0,
            r: 0,
            c: 0,
            w: (parseInt(pos.w ?? pos.wu ?? pos.width ?? 1,10) || 1),
            h: (parseInt(pos.h ?? pos.hu ?? pos.height ?? 1,10) || 1)
          });
        }else{
          mp.set(String(id),{
            r: (pos.r ?? pos.y ?? 0)|0,
            c: (pos.c ?? pos.x ?? 0)|0,
            w: (parseInt(pos.w ?? pos.wu ?? pos.width ?? 1,10) || 1),
            h: (parseInt(pos.h ?? pos.hu ?? pos.height ?? 1,10) || 1)
          });
        }
      }
      return mp;
    }catch(e){
      try{ DRHB.loudWarnOnce && DRHB.loudWarnOnce("afnk:normPlac2","[DRHB][AFNK] normalizePlacements failed", {e}); }catch(_){}
      return new Map();
    }
  };
})();
function canMovePx(){ return true; }

function canPlacePx(){ return true; }


// Canonical px-only helper (scroll + scale + padding safe)

function __meFindScrollWrap(el){
  try{
    let cur = el;
    while(cur && cur !== document.body && cur !== document.documentElement){
      const pe = cur.parentElement;
      if(!pe) break;
      try{
        const cs = window.getComputedStyle(pe);
        const oy = cs ? cs.overflowY : "";
        const ox = cs ? cs.overflowX : "";
        const sy = (pe.scrollHeight - pe.clientHeight) > 1;
        const sx = (pe.scrollWidth  - pe.clientWidth ) > 1;
        const oky = (oy === "auto" || oy === "scroll" || oy === "overlay");
        const okx = (ox === "auto" || ox === "scroll" || ox === "overlay");
        if((sy && oky) || (sx && okx)) return pe;
      }catch(_){}
      cur = pe;
    }
    return null;
  }catch(_){
    return null;
  }
}

function __meClientToPx(clientX, clientY){
  try{
    try{
      const ww = window.innerWidth  || 0;
      const wh = window.innerHeight || 0;
      const sxw = window.scrollX || window.pageXOffset || 0;
      const syw = window.scrollY || window.pageYOffset || 0;
      if(sxw && clientX > ww + 1) clientX = clientX - sxw;
      if(syw && clientY > wh + 1) clientY = clientY - syw;
    }catch(_){}
    const wrap0 =
      (typeof gridWrap !== "undefined" && gridWrap && gridWrap.getBoundingClientRect) ? gridWrap
      : (function(){ try{ return document.getElementById("gridWrap"); }catch(_){ return null; } })()
      || null;

    const wrap = wrap0 || __meFindScrollWrap(grid) || (grid && grid.parentElement ? grid.parentElement : grid);

    const rr = wrap && wrap.getBoundingClientRect ? wrap.getBoundingClientRect()
              : (grid && grid.getBoundingClientRect ? grid.getBoundingClientRect() : {left:0, top:0});
    const p = pad();
    const scaleX = (typeof getScaleX==="function") ? getScaleX() : 1;
    const scaleY = (typeof getScaleY==="function") ? getScaleY() : 1;

    const sx = (wrap && wrap.scrollLeft) ? wrap.scrollLeft : 0;
    const sy = (wrap && wrap.scrollTop ) ? wrap.scrollTop  : 0;

    const cl = (wrap && wrap.clientLeft) ? wrap.clientLeft : 0;
    const ct = (wrap && wrap.clientTop ) ? wrap.clientTop  : 0;

    const x = (((clientX - rr.left - cl) + sx) / scaleX) - p;
    const y = (((clientY - rr.top  - ct) + sy) / scaleY) - p;

    const out = { x: Math.max(0, x), y: Math.max(0, y) };

    try{
      if(window.__DRHB_DEBUG_PX || window.__ME_DRAG_DEBUG || (function(){try{return localStorage.getItem("ME_DRAG_DEBUG")==="1";}catch(_){return false;}})()){
        window.__DRHB_DEBUG_PX_LAST = window.__DRHB_DEBUG_PX_LAST || 0;
        const now = Date.now();
        if(now - window.__DRHB_DEBUG_PX_LAST > 200){
          window.__DRHB_DEBUG_PX_LAST = now;
          console.log("[DRHB][PX]", {clientX, clientY, wrapLeft: rr.left, wrapTop: rr.top, sx, sy, clientLeft: cl, clientTop: ct, scaleX, scaleY, pad: p, out});
        }
      }
    }catch(_){}
    return out;
  }catch(_){
    return { x: 0, y: 0 };
  }
}


try{ DRHB.clientToPx = __meClientToPx; }catch(_){ }
