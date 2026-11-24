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
  // Broad material-demand bands for the guide's starter recipes. Actual stock and prices vary.
  const starterBand = {Enchanting:0, Alchemy:0, Leatherworking:1, Engineering:1, Tailoring:1, Blacksmithing:2};
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
    const p = {order:[], jobs:{}, flags:{}, started:false, otherLP:0, goal:16};
    if (stored && typeof stored === 'object') {
      p.order = [...new Set(Array.isArray(stored.order)?stored.order:[])].filter(c=>classes.includes(c));
      for (const c of classes) p.jobs[c] = [...new Set(Array.isArray(stored.jobs?.[c])?stored.jobs[c]:[])].filter(s=>professions.includes(s)).slice(0,2);
      if(stored.flags && typeof stored.flags==='object') p.flags=Object.fromEntries(Object.entries(stored.flags).filter(([,v])=>v===true));
      p.started = stored.started===true;
      setOtherLP(p, stored.otherLP ?? 0);
      if(stored.goal===null || (Number.isSafeInteger(stored.goal) && stored.goal>0)) p.goal=stored.goal;
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
  function setOtherLP(p,input) {
    const text=typeof input==='string'?input.trim():input;
    if(typeof text!=='number' && (typeof text!=='string' || !/^\d*$/.test(text))) return false;
    const value=Number(text);
    if(!Number.isSafeInteger(value) || value<0) return false;
    p.otherLP=value;
    return true;
  }
  function missingRuns(p,runs) {return runs.filter(([name])=>!p.flags[dungeonKey(name)]);}
  function totals(p) {
    const plannedCrafts = new Set(p.order.flatMap(c=>assigned(p,c)).filter(s=>crafts.includes(s)));
    let classLP=0, skillLP=0, plannedDone=0;
    for (const c of classes) for(const n of lpLevels) if(p.flags[levelKey(c,n)]) {
      classLP++;
      if(p.order.includes(c)) plannedDone++;
    }
    for (const s of crafts) for(const n of ranks) if(earned(p,s,n)) {
      skillLP++;
      if(plannedCrafts.has(s)) plannedDone++;
    }
    const dungeonLP=groups.filter(([,runs])=>!missingRuns(p,runs).length).length;
    plannedDone+=dungeonLP;
    const plannedMax=p.order.length*lpLevels.length+plannedCrafts.size*ranks.length+groups.length;
    const otherLP=Number.isSafeInteger(p.otherLP) && p.otherLP>=0 ? p.otherLP : 0;
    return {earned:classLP+skillLP+dungeonLP+otherLP,classLP,skillLP,dungeonLP,otherLP,
      plannedDone,plannedMax,done:plannedDone,max:plannedMax};
  }
  function reward(p,id) {
    const [kind,name,tier,last]=id.split('/');
    let status='none', onCheck=0, creditedTo;
    if(kind==='level' && classes.includes(name) && levels.includes(+tier)) {
      if(lpLevels.includes(+tier)) status=p.flags[id]?'earned':'available';
      onCheck=lpLevels.filter(n=>n<=+tier && !p.flags[levelKey(name,n)]).length;
    } else if(kind==='skill' && classes.includes(name) && crafts.includes(tier) && ranks.includes(+last)) {
      // Flag insertion order tracks the first recorded owner even after the roster is reordered.
      const owned=new Set(classes.filter(c=>p.flags[skillKey(c,tier,+last)]).map(c=>skillKey(c,tier,+last)));
      const first=Object.keys(p.flags).find(k=>owned.has(k));
      creditedTo=first?.split('/')[1];
      status=first?(first===id?'earned':'elsewhere'):'available';
      onCheck=ranks.filter(n=>n<=+last && !earned(p,tier,n)).length;
    } else if(kind==='dungeon' || kind==='spelunker') {
      const group=groups.find(([heading,runs])=>kind==='spelunker'?heading===name:runs.some(([d])=>d===name));
      if(group) {
        const remaining=missingRuns(p,group[1]);
        if(kind==='spelunker') status=remaining.length?'available':'earned';
        else {
          status=remaining.length===1 && remaining[0][0]===name?'available':'progress';
          onCheck=status==='available'?1:0;
        }
      }
    }
    const eligible=['earned','available','elsewhere'].includes(status);
    return {eligible,value:eligible?1:0,points:status==='available'?1:0,status,onCheck,creditedTo};
  }
  function craftChoices(p,n) {
    const i=ranks.indexOf(n);
    const choices=[];
    for(const c of p.order) for(const s of assigned(p,c)) {
      if(!crafts.includes(s) || earned(p,s,n)) continue;
      const step={key:skillKey(c,s,n),title:c+' · Reach '+s+' '+n};
      const ready=level(p,c)>=gates[i];
      const previous=i>0 && !!p.flags[skillKey(c,s,ranks[i-1])];
      step.why=n===150?'The first '+s+' 150 earns 1 LP. '+(starterBand[s]===0?'The guide has a low-cost starter route. ':'')+
        'If you have materials for a different craft, use those first. The board cannot see your bags or realm prices.'
        :'The first '+s+' '+n+' earns 1 LP. '+(previous?'The previous tier is recorded on this character. ':'')+
         'Take this route first if your actual skill is close or the materials are ready. The board records tiers and cannot see your bags.';
      choices.push({c,s,ready,previous,step});
    }
    // Prefer the character who has actually worked on this trade, then the player's order.
    return choices.sort((a,b)=>Number(b.previous)-Number(a.previous));
  }
  function lowAlt(p,options) {
    const candidates=p.order.map(c=>({c,level:level(p,c),jobs:options.filter(o=>o.c===c).map(o=>o.s)
      .sort((a,b)=>starterBand[a]-starterBand[b])}))
      .filter(t=>t.level<10 && t.jobs.length).sort((a,b)=>b.jobs.length-a.jobs.length || b.level-a.level
        || starterBand[a.jobs[0]]-starterBand[b.jobs[0]]);
    if(!candidates.length) return null;
    const {c,level:current,jobs}=candidates[0];
    const potential=jobs.length;
    return {level:current,potential,jobs,step:{key:levelKey(c,10),title:c+' · Reach level 10',
      why:'Level 10 opens '+jobs.join(' and ')+' 150 for '+potential+' new profession LP. The points come from crafting. Banked materials and rested XP favour this route.'}};
  }
  function dungeonStep(p,closingOnly) {
    for(const [group,runs] of groups) {
      const left=missingRuns(p,runs);
      if(closingOnly && left.length!==1) continue;
      for(const [d,n] of left) {
        const c=p.order.find(c=>level(p,c)>=n);
        if(c) return {key:dungeonKey(d),title:c+' · Clear '+d,why:left.length===1
          ?'This is the last recorded clear needed for '+group+' Spelunker and its 1 LP.'
          :'Your '+c+' has reached the suggested run level. Defeat the final boss towards '+group+' Spelunker.'};
      }
    }
    return null;
  }
  function levelStep(p,c,end) {
    const current=level(p,c);
    const n=levels.find(n=>n>current && n<=end);
    if(!n) return null;
    return {key:levelKey(c,n),title:c+' · '+(n===5?'Reach level 5 and park in an inn':'Reach level '+n),
      why:n===5?'Build rested XP while you play your other characters.':lpLevels.includes(n)?'This class milestone earns 1 LP.':
        'This opens '+descriptions[n].toLowerCase()+' for your professions.'};
  }
  function withAlternative(step,alternative) {
    return alternative && step.key!==alternative.key?{...step,alternative}:step;
  }
  function suggestion(p) {
    if(!p.order.length) return null;
    const goal=p.goal===undefined?16:p.goal;
    const lead=p.order.find(c=>level(p,c)<60);
    if(lead && goal>0 && totals(p).earned>=goal && !classes.some(c=>level(p,c)===60)) {
      const step=levelStep(p,lead,60);
      return {...step,why:'Your '+goal+' LP target is met. Take '+lead+', the first unfinished class in your chosen order, to 60.'};
    }
    if(p.order.every(c=>level(p,c)===1)) return levelStep(p,p.order[0],5);
    const first=craftChoices(p,150), pending=lowAlt(p,first);
    // At 10+ there is no levelling cost left to share. Compare starter routes first.
    // For equally economical routes favour a second point on one character, then roster order.
    const ready=first.filter(o=>o.ready);
    const counts=Object.fromEntries(p.order.map(c=>[c,ready.filter(o=>o.c===c).length]));
    ready.sort((a,b)=>starterBand[a.s]-starterBand[b.s] || counts[b.c]-counts[a.c]);
    const readyFirst=ready[0];
    const expert=craftChoices(p,225).find(choice=>choice.ready);
    if(readyFirst) {
      const otherJob=ready.find(o=>o.c===readyFirst.c && o.s!==readyFirst.s);
      if(otherJob) readyFirst.step.why+=' '+otherJob.s+' 150 can earn a second LP on this character without further levelling.';
      const otherStarter=ready.find(o=>o.s!==readyFirst.s)?.step ||
        lowAlt(p,first.filter(o=>o.s!==readyFirst.s))?.step;
      return withAlternative(readyFirst.step,expert?.previous?expert.step:otherStarter);
    }
    const closing=dungeonStep(p,true);
    if(closing) return withAlternative(closing,expert?.step || pending?.step);
    if(pending) {
      // A fresh one-craft alt has a complete level grind before it can earn its point.
      if(expert?.previous && pending.level===1 && pending.potential===1)
        return withAlternative(expert.step,pending.step);
      const otherStarter=lowAlt(p,first.filter(o=>!pending.jobs.includes(o.s)));
      return withAlternative(pending.step,expert?.step || otherStarter?.step);
    }
    if(expert) return expert.step;
    const nearby=dungeonStep(p,false);
    if(nearby) return nearby;
    const artisan=craftChoices(p,300).find(choice=>choice.ready);
    for(const end of lpLevels) {
      if(end===45 && artisan) return artisan.step;
      for(const c of p.order) {
        const step=levelStep(p,c,end);
        if(step) return step;
      }
    }
    return artisan?.step || null;
  }
  window.RTGPlan={key,classes,crafts,professions,levels,descriptions,ranks,groups,lpLevels,levelKey,skillKey,dungeonKey,load,save,copyPreset,assigned,mark,available,earned,totals,reward,setOtherLP,suggestion};
})();
