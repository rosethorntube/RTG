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
  const levels = [5,10,20,25,30,35,40,45,60];
  const descriptions = {5:'Rest in an inn between sessions',10:'Journeyman training',20:'Expert training',25:'+1 LP',30:'Character level',35:'Artisan training',40:'First mount for your main',45:'+1 LP',60:'+1 LP'};
  const ranks = [150,225,300], gates = [10,20,35], lpLevels = [25,45,60];
  // The number beside each dungeon is the original guide's suggested run level.
  const hordeGroups = [
    ['Novice', [['Ragefire Chasm',15],['Ruins of Lordaeron',18],['Wailing Caverns',20],['The Deadmines',20],['Shadowfang Keep',24],['Excavation Site: Wetlands',30]]],
    ['Experienced', [['Blackfathom Deeps',26],['Razorfen Kraul',30],['City of Dalaran',32],['Gnomeregan',32],['Scarlet Monastery: Graveyard',32],['Scarlet Monastery: Library',35],['Scarlet Monastery: Armoury',38],['The Drowned City',40],['Scarlet Monastery: Cathedral',40],["Krol'dok Stronghold",44]]],
    ['Master', [['Razorfen Downs',41],['Uldaman',45],["Zul'Farrak",47],['Maraudon',51],['Alcaz Prison',52],["The Temple of Atal'Hakkar",54],['Blackrock Depths',58],['Dire Maul: East',58],['Lower Blackrock Spire',58],['Blackmaw Hold',60],['Dire Maul: West',60],['Dire Maul: North',60],['Scholomance',60],['Stratholme: Live',60],['Stratholme: Dead',60],["The Shaper's Terrace",60],['Upper Blackrock Spire',60]]]
  ];
  const allianceGroups = hordeGroups.map(([name,runs]) => [name, runs.map(run =>
    run[0] === 'Ragefire Chasm' ? ['Hall of Thanes',16] : run)]);
  const groups = () => window.GuideFaction.alliance ? allianceGroups : hordeGroups;
  const key = () => window.GuideFaction.storageKey('rosethorn.planner.v2');
  const levelKey = (c,n) => 'level/'+c+'/'+n;
  const skillKey = (c,p,n) => 'skill/'+c+'/'+p+'/'+n;
  const dungeonKey = name => 'dungeon/'+name;
  const mainClass = p => p.order[0];
  function read(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
  const relatedKeys = () => ['rosethorn.fieldguide.v1.character','rosethorn.fieldguide.v1.complete',
    ...['',...classes].map(c=>'rosethorn.prequests.v1.'+c)].map(k=>window.GuideFaction.storageKey(k));
  function emptyPlan() {
    return {order:[],jobs:{},flags:{},started:false,otherLP:0,goal:null,goalChosen:false};
  }
  function savedGuideEntries() {
    const entries=[];
    try {
      for (const key of relatedKeys()) {
        const value=localStorage.getItem(key);
        if (value!==null) entries.push([key,value]);
      }
    } catch {}
    return entries;
  }
  function load() {
    const stored = read(key());
    const p = emptyPlan();
    if (stored && typeof stored === 'object') {
      p.order = [...new Set(Array.isArray(stored.order)?stored.order:[])].filter(c=>classes.includes(c));
      for (const c of classes) p.jobs[c] = [...new Set(Array.isArray(stored.jobs?.[c])?stored.jobs[c]:[])].filter(s=>professions.includes(s)).slice(0,2);
      if(stored.flags && typeof stored.flags==='object') p.flags=Object.fromEntries(Object.entries(stored.flags).filter(([,v])=>v===true));
      for(const c of classes) {
        const legacyMount='mount/'+c;
        if(p.flags[legacyMount] || stored.budget?.mounts?.[c]?.done===true)mark(p,levelKey(c,40),true);
        delete p.flags[legacyMount];
        const highest=level(p,c);
        if(highest>=5)mark(p,levelKey(c,highest),true);
      }
      p.started = stored.started===true;
      setOtherLP(p, stored.otherLP ?? 0);
      if(stored.goal===null || (Number.isSafeInteger(stored.goal) && stored.goal>0)) p.goal=stored.goal;
      // Earlier builds assigned 16 to every plan and offered no target control.
      p.goalChosen=stored.goalChosen===true || (stored.goalChosen==null && p.goal!=null && p.goal!==16);
    } else {
      const legacy=read(window.GuideFaction.storageKey('rosethorn.fieldguide.v1.complete'));
      if(Array.isArray(legacy) && legacy.length) {
        copyPreset(p);
        for(const c of classes) for(const n of levels) {
          if(legacy.includes(c.toLowerCase()+'-'+n)) mark(p,levelKey(c,n),true);
        }
        for(const [group,runs] of groups()) {
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
  function save(p) { try {localStorage.setItem(key(),JSON.stringify(p)); return true;} catch {return false;} }
  function assigned(p,c) {return p.jobs[c] || [];}
  function assignedCrafts(p,c) {return assigned(p,c).filter(prof=>crafts.includes(prof));}
  function mark(p,key,done) {
    const pieces=key.split('/'), value=Number(pieces.at(-1)), prefix=pieces.slice(0,-1).join('/')+'/';
    let keys=[key];
    if(pieces[0]==='level' && levels.includes(value)) keys=levels.filter(n=>done?n<=value:n>=value).map(n=>prefix+n);
    if(pieces[0]==='skill') keys=ranks.filter(n=>done?n<=value:n>=value).map(n=>prefix+n);
    for(const item of keys) {if(done)p.flags[item]=true;else delete p.flags[item];}
  }
  function available(p) {return p.order.length>0;}
  function level(p,c) {return Math.max(1,...levels.filter(n=>p.flags[levelKey(c,n)]));}
  function earned(p,prof,n) {return p.order.some(c=>p.flags[skillKey(c,prof,n)]);}
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
    const plannedCrafts = new Set(p.order.flatMap(c=>assignedCrafts(p,c)));
    let classLP=0, skillLP=0;
    for (const c of p.order) {
      for (const n of lpLevels) if (p.flags[levelKey(c,n)]) classLP++;
    }
    let plannedDone=classLP;
    for (const s of crafts) for(const n of ranks) if(earned(p,s,n)) {
      skillLP++;
      if(plannedCrafts.has(s)) plannedDone++;
    }
    const dungeonLP=groups().filter(([,runs])=>!missingRuns(p,runs).length).length;
    plannedDone+=dungeonLP;
    const plannedMax=p.order.length*lpLevels.length+plannedCrafts.size*ranks.length+groups().length;
    const otherLP=Number.isSafeInteger(p.otherLP) && p.otherLP>=0 ? p.otherLP : 0;
    return {earned:classLP+skillLP+dungeonLP+otherLP,classLP,skillLP,dungeonLP,otherLP,
      plannedDone,plannedMax,done:plannedDone,max:plannedMax};
  }
  function reward(p,id) {
    const [kind,name,tier,last]=id.split('/');
    let status='none', onCheck=0, creditedTo;
    if(kind==='level' && p.order.includes(name) && levels.includes(+tier)) {
      if(lpLevels.includes(+tier)) status=p.flags[id]?'earned':'available';
      onCheck=lpLevels.filter(n=>n<=+tier && !p.flags[levelKey(name,n)]).length;
    } else if(kind==='skill' && p.order.includes(name) && crafts.includes(tier) && ranks.includes(+last)) {
      // Flag insertion order tracks the first recorded owner even after the roster is reordered.
      const owned=new Set(p.order.filter(c=>p.flags[skillKey(c,tier,+last)]).map(c=>skillKey(c,tier,+last)));
      const first=Object.keys(p.flags).find(k=>owned.has(k));
      creditedTo=first?.split('/')[1];
      status=first?(first===id?'earned':'elsewhere'):'available';
      onCheck=ranks.filter(n=>n<=+last && !earned(p,tier,n)).length;
    } else if(kind==='dungeon' || kind==='spelunker') {
      const group=groups().find(([heading,runs])=>kind==='spelunker'?heading===name:runs.some(([d])=>d===name));
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

  function dungeonStep(p) {
    for(const [group,runs] of groups()) {
      const left=missingRuns(p,runs);
      if(left.length!==1)continue;
      const [[name,runLevel]]=left;
      const c=p.order.find(c=>level(p,c)>=runLevel);
      if(c)return {key:dungeonKey(name),title:c+' — Clear '+name,
        why:'This is the final clear for '+group+' Spelunker and its 1 LP.'};
    }
    return null;
  }

  function levelStep(p,c,end) {
    const current=level(p,c);
    const checkpoints=[5,...lpLevels];
    if(assignedCrafts(p,c).length)checkpoints.push(...gates);
    if(c===mainClass(p))checkpoints.push(40);
    const n=checkpoints.sort((a,b)=>a-b).find(n=>n>current && n<=end);
    if(!n)return null;
    if(n===40) return {
      key:levelKey(c,40),title:c+' - Reach level 40 and get your first mount',
      why:c==='Warlock'||c==='Paladin'?'Complete your level-40 class mount quest.':
        'Buy Apprentice Riding and complete the first mount quest. Keep levelling and gathering if you still need gold.'
    };
    const why=lpLevels.includes(n)?'This class milestone earns 1 LP.':
      n===5?'Log out in an inn between sessions to build rested XP.':
      'Continue levelling '+c+'.';
    return {key:levelKey(c,n),title:c+' — Reach level '+n,why};
  }


  function starterCraft(p) {
    const candidates=[];
    for(const c of p.order) {
      const jobs=assignedCrafts(p,c).filter(prof=>!earned(p,prof,150));
      if(jobs.length) candidates.push({c,jobs,current:level(p,c)});
    }
    candidates.sort((a,b)=>Number(b.current>=10)-Number(a.current>=10) || b.jobs.length-a.jobs.length);
    const next=candidates[0];
    if(!next)return null;
    const {c,current,jobs:[prof]}=next;
    if(current<10) return {key:levelKey(c,10),title:c+' — Reach level 10',
      why:'Level one rested alt to unlock '+prof+' 150. Gather or bank its materials before crafting.'};
    return {key:skillKey(c,prof,150),title:c+' — Reach '+prof+' 150',
      why:'The first '+prof+' 150 earns 1 LP. Use banked materials first and check the cost of anything you still need.'};
  }
  function advancedCraft(p) {
    for(const [i,rank] of ranks.entries()) {
      if(i===0)continue;
      for(const c of p.order) {
        if(level(p,c)<gates[i])continue;
        const prof=assignedCrafts(p,c).find(name=>!earned(p,name,rank)
          && p.flags[skillKey(c,name,ranks[i-1])]);
        if(prof) return {key:skillKey(c,prof,rank),title:c+' — Reach '+prof+' '+rank,
          why:'This craft already has its previous tier. Check the materials and training before spending on the next 1 LP.'};
      }
    }
    return null;
  }

  function priority(p) {
    return p.goalChosen && Number.isSafeInteger(p.goal) && p.goal>0 ? p.goal : null;
  }
  function setPriority(p,goal) {
    if(goal!==null && ![5,10,16].includes(goal) && goal!==priority(p))return false;
    p.goal=goal;p.goalChosen=true;
    return true;
  }


  function milestoneOrder(p) {
    const sim={...p,flags:{...p.flags}};
    const startLP=totals(p).earned,target=priority(p),main=mainClass(p);
    const first60=!!main && level(p,main)>=60;
    const result={startLP,target,phases:[],projectedLP:startLP,projectedPre60LP:startLP,first60,
      reachedGoal:target!==null && startLP>=target};
    if(!main)return result;
    const wantsLP=()=>target!==null && result.projectedLP<target;

    function phase(title) {
      const row={title,steps:[]};
      result.phases.push(row);
      return row;
    }
    function add(row,step) {
      const previous=result.projectedLP;
      mark(sim,step.key,true);
      const total=totals(sim).earned;
      row.steps.push({...step,lp:total-previous,total});
      result.projectedLP=total;
    }
    function advance(row,c,end) {
      let step;
      while((step=levelStep(sim,c,end))) add(row,step);
    }

    if(level(sim,main)<40) {
      const row=phase(main+' to level 40 and the first mount');
      advance(row,main,40);
      if(row.steps[0].key!==levelKey(main,40))row.steps[0].why+=' Save for your first mount as you level.';
    }

    function quickPoints() {
      if(!wantsLP())return;
      const row=phase('Work towards '+target+' LP');
      let step;
      while(wantsLP() && (step=dungeonStep(sim) || starterCraft(sim)))add(row,step);
    }
    quickPoints();

    if(!first60) {
      const row=phase(main+' to level 45');
      advance(row,main,45);
      if(wantsLP()) {
        const nearby=phase('Finish nearby class milestones');
        for(const c of p.order.slice(1)) {
          if(!wantsLP())break;
          const rank=level(sim,c);
          if(rank>=20 && rank<25)advance(nearby,c,25);
        }
      }
      result.projectedPre60LP=result.projectedLP;
      result.reachedGoal=target!==null && result.projectedPre60LP>=target;
      advance(phase(main+' to level 60'),main,60);
    }

    if(wantsLP()) {
      const row=phase('Work towards '+target+' LP after your main reaches 60');
      while(wantsLP()) {
        const close=dungeonStep(sim);
        const alt=p.order.slice(1).find(c=>level(sim,c)<25);
        let step=close;
        if(!step && alt && level(sim,alt)>=20)step=levelStep(sim,alt,25);
        step=step || advancedCraft(sim) || (alt && levelStep(sim,alt,25));
        if(!step)break;
        add(row,step);
      }
    }

    for(const c of sim.order) {
      const row=phase(level(sim,c)>=60?'Finish '+c+' crafting':c+' to level 60');
      advance(row,c,60);
      for(const prof of assignedCrafts(sim,c)) for(const rank of ranks) {
        const key=skillKey(c,prof,rank);
        if(sim.flags[key])continue;
        add(row,{key,title:c+' — '+prof+' '+rank,why:'Finish this profession using banked materials where possible.'});
      }
    }
    result.phases=result.phases.filter(row=>row.steps.length);
    return result;
  }
  function suggestion(p) {
    return milestoneOrder(p).phases[0]?.steps[0] || null;
  }

  window.WYHPlan={get key(){return key();}, get relatedKeys(){return relatedKeys();},get groups(){return groups();},emptyPlan,savedGuideEntries,classes,crafts,professions,levels,descriptions,ranks,lpLevels,levelKey,skillKey,dungeonKey,load,save,copyPreset,assigned,assignedCrafts,mark,available,earned,totals,reward,setOtherLP,priority,setPriority,milestoneOrder,suggestion};
})();
