(() => {
  'use strict';
  const preset = {
    Priest: ['Mining', 'Skinning'], Warrior: ['Mining', 'Engineering'], Druid: ['Skinning', 'Leatherworking'],
    Hunter: ['Mining', 'Engineering'], Mage: ['Tailoring', 'Enchanting'], Shaman: ['Skinning', 'Leatherworking'],
    Warlock: ['Herbalism', 'Alchemy'], Paladin: ['Mining', 'Blacksmithing'], Rogue: ['Skinning', 'Leatherworking']
  };
  const classes = Object.keys(preset);
  const crafts = ['Alchemy','Blacksmithing','Enchanting','Engineering','Leatherworking','Tailoring'];
  const professions = [...crafts,'Herbalism','Mining','Skinning'].sort();
  const levels = [5,10,20,25,35,45,60];
  const descriptions = {5:'Park in an inn',10:'Journeyman training',20:'Expert training',25:'+1 LP',35:'Artisan training',45:'+1 LP',60:'+1 LP'};
  const ranks = [150,225,300], gates = [10,20,35], lpLevels = [25,45,60];
  // The number beside each dungeon is the original guide's suggested run level.
  const groups = [
    ['Novice', [['Ragefire Chasm',15],['Ruins of Lordaeron',18],['Wailing Caverns',20],['The Deadmines',20],['Shadowfang Keep',24],['Excavation Site: Wetlands',30]]],
    ['Experienced', [['Blackfathom Deeps',26],['Razorfen Kraul',30],['City of Dalaran',32],['Gnomeregan',32],['Scarlet Monastery: Graveyard',32],['Scarlet Monastery: Library',35],['Scarlet Monastery: Armoury',38],['The Drowned City',40],['Scarlet Monastery: Cathedral',40],["Krol'dok Stronghold",44]]],
    ['Master', [['Razorfen Downs',41],['Uldaman',45],["Zul'Farrak",47],['Maraudon',51],['Alcaz Prison',52],["The Temple of Atal'Hakkar",54],['Blackrock Depths',58],['Dire Maul: East',58],['Lower Blackrock Spire',58],['Blackmaw Hold',60],['Dire Maul: West',60],['Dire Maul: North',60],['Scholomance',60],['Stratholme: Live',60],['Stratholme: Dead',60],["The Shaper's Terrace",60],['Upper Blackrock Spire',60]]]
  ];
  const key = 'rosethorn.planner.v2';
  const levelKey = (c,n) => 'level/'+c+'/'+n;
  const skillKey = (c,p,n) => 'skill/'+c+'/'+p+'/'+n;
  const dungeonKey = name => 'dungeon/'+name;
  function read(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
  function load() {
    const stored = read(key);
    const p = {order:[], jobs:{}, flags:{}, started:false};
    if (stored && typeof stored === 'object') {
      p.order = [...new Set(Array.isArray(stored.order)?stored.order:[])].filter(c=>classes.includes(c));
      for (const c of classes) p.jobs[c] = [...new Set(Array.isArray(stored.jobs?.[c])?stored.jobs[c]:[])].filter(s=>professions.includes(s)).slice(0,2);
      if(stored.flags && typeof stored.flags==='object') p.flags=Object.fromEntries(Object.entries(stored.flags).filter(([,v])=>v===true));
      p.started = stored.started===true;
    } else {
      const legacy=read('rosethorn.fieldguide.v1.complete');
      if(Array.isArray(legacy) && legacy.length) {
        copyPreset(p);
        for(const c of classes) for(const n of levels) {
          if(legacy.includes(c.toLowerCase()+'-'+n)) mark(p,levelKey(c,n),true);
        }
        for(const [group,runs] of groups) {
          const old=(group==='Master'?'expert':group.toLowerCase())+'-spelunker';
          if(legacy.includes(old)) for(const [name] of runs) p.flags[dungeonKey(name)]=true;
        }
      }
    }
    return p;
  }
  function copyPreset(p) {
    p.order=classes.slice();
    p.jobs=Object.fromEntries(classes.map(c=>[c,preset[c].slice()]));
  }
  function save(p) { try {localStorage.setItem(key,JSON.stringify(p)); return true;} catch {return false;} }
  function assigned(p,c) {return p.jobs[c] || [];}
  function mark(p,key,done) {
    const pieces=key.split('/'), value=Number(pieces.at(-1)), prefix=pieces.slice(0,-1).join('/')+'/';
    let keys=[key];
    if(pieces[0]==='level' && value!==5) keys=levels.filter(n=>n!==5 && (done?n<=value:n>=value)).map(n=>prefix+n);
    if(pieces[0]==='skill') keys=ranks.filter(n=>done?n<=value:n>=value).map(n=>prefix+n);
    for(const item of keys) {if(done)p.flags[item]=true;else delete p.flags[item];}
  }
  function available(p) {return p.order.length>0 && p.order.every(c=>assigned(p,c).length===2);}
  function level(p,c) {return Math.max(1,...levels.filter(n=>p.flags[levelKey(c,n)]));}
  function earned(p,prof,n) {return classes.some(c=>p.flags[skillKey(c,prof,n)]);}
  function totals(p) {
    const plannedCrafts = new Set(p.order.flatMap(c=>assigned(p,c)).filter(s=>crafts.includes(s)));
    let classLP=0, skillLP=0, dungeonLP=0;
    for (const c of p.order) for(const n of lpLevels) if(p.flags[levelKey(c,n)]) classLP++;
    for (const s of plannedCrafts) for(const n of ranks) if(earned(p,s,n)) skillLP++;
    for (const [,runs] of groups) if(runs.every(([d])=>p.flags[dungeonKey(d)])) dungeonLP++;
    return {done:classLP+skillLP+dungeonLP, max:p.order.length*3+plannedCrafts.size*3+3};
  }
  function suggestion(p) {
    if(!p.order.length) return null;
    // Prioritise trainable, unclaimed LP, then nearby clears; break ties by the player's order.
    for(const c of p.order) for(const [i,n] of ranks.entries()) {
      if(level(p,c)<gates[i]) continue;
      for(const s of assigned(p,c)) if(crafts.includes(s) && !earned(p,s,n))
        return {key:skillKey(c,s,n), title:c+' · Reach '+s+' '+n, why:'Your level unlocks this rank. The first '+s+' '+n+' on your account earns 1 LP.'};
    }
    for(const [group,runs] of groups) for(const [d,n] of runs) {
      const c=p.order.find(c=>level(p,c)>=n);
      if(c && !p.flags[dungeonKey(d)]) return {key:dungeonKey(d),title:c+' · Clear '+d,why:'Your '+c+' has reached the suggested run level. Defeat the final boss towards '+group+' Spelunker.'};
    }
    // In each LP band, follow the chosen order before pushing a class to the next band.
    for(const end of lpLevels) for(const c of p.order) {
      const n=levels.find(n=>n<=end && !p.flags[levelKey(c,n)] && (n!==5 || level(p,c)<=5));
      if(n) return {key:levelKey(c,n),title:c+' · '+(n===5?'Reach level 5 and park in an inn':'Reach level '+n),why:n===5?'Build rested XP while you play the next character.':lpLevels.includes(n)?'This class milestone earns 1 LP.':'This opens '+descriptions[n].toLowerCase()+' for your chosen professions.'};
    }
    return null;
  }
  window.RTGPlan={key,classes,crafts,professions,levels,descriptions,ranks,groups,lpLevels,levelKey,skillKey,dungeonKey,load,save,copyPreset,assigned,mark,available,earned,totals,suggestion};
})();
