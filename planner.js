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
  const descriptions = {5:'Rest in an inn between sessions',10:'Journeyman training',20:'Expert training',25:'+1 LP',30:'Optional early alt start',35:'Artisan training and usual alt start',40:'First mount',45:'+1 LP',60:'+1 LP'};
  const ranks = [150,225,300], gates = [10,20,35], lpLevels = [25,45,60];
  // Broad material-demand bands for the guide's starter recipes. Actual stock and prices vary.
  const starterBand = {Enchanting:0, Alchemy:0, Leatherworking:1, Engineering:1, Tailoring:1, Blacksmithing:2};
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
        const highest=level(p,c);
        if(highest>=5)mark(p,levelKey(c,highest),true);
      }
      p.started = stored.started===true;
      if(stored.budget && typeof stored.budget==='object')p.budget=stored.budget;
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
    const plannedCrafts = new Set(p.order.flatMap(c=>assigned(p,c)).filter(s=>crafts.includes(s)));
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

  const goldValue = value => typeof value==='number' && Number.isFinite(value) && value>=0 && value<=1000000
    ? Math.round(value*100)/100 : null;
  const toSilver = gold => Math.round(gold*100);
  const mainClass = p => p.order[0];
  const hasClassMount = c => c==='Warlock'||c==='Paladin';
  const defaultMountCost = c => hasClassMount(c)?0:100;
  function craftCost(p,prof,rank) {
    const value=goldValue(p.budget?.costs?.[prof]?.[rank]);
    return value ?? (rank===150?5:null);
  }
  function budget(p) {
    const main=mainClass(p);
    const prefs=p.budget || {};
    const mount=prefs.mounts?.[main];
    const gold=goldValue(prefs.gold);
    const mountCost=goldValue(mount?.cost)??defaultMountCost(main);
    const mountDone=mount?.done===true;
    const reserve=main && !mountDone?mountCost:0;
    const spendable=gold===null?null:Math.max(0,toSilver(gold)-toSilver(reserve))/100;
    let starterCount=0,starterCost=0;
    for(const c of p.order) for(const prof of assigned(p,c)) {
      if(!crafts.includes(prof) || p.flags[skillKey(c,prof,150)])continue;
      starterCount++;
      starterCost+=toSilver(craftCost(p,prof,150));
    }
    return {main,gold,altLevel:prefs.altLevel===30?30:35,mountCost,mountDone,
      mountShortfall:gold===null?null:Math.max(0,toSilver(reserve)-toSilver(gold))/100,
      spendable,starterCount,starterCost:starterCost/100};
  }
  function setBudgetValue(p,kind,value,prof,rank) {
    const v=goldValue(value);
    if(kind==='gold' && (v!==null || value===null)) {
      p.budget={...p.budget,gold:v};
    } else if(kind==='altLevel' && (value===30||value===35)) {
      p.budget={...p.budget,altLevel:value};
    } else if((kind==='mountCost' || kind==='mountDone') && mainClass(p)) {
      if(kind==='mountCost' && v===null && value!==null) return false;
      if(kind==='mountDone' && typeof value!=='boolean') return false;
      const main=mainClass(p),mounts={...p.budget?.mounts};
      mounts[main]={...mounts[main],[kind==='mountDone'?'done':'cost']:kind==='mountDone'?value:v};
      p.budget={...p.budget,mounts};
    } else if(kind==='cost' && crafts.includes(prof) && ranks.includes(rank) && (v!==null || value===null)) {
      const costs={...p.budget?.costs};
      costs[prof]={...costs[prof],[rank]:v};
      p.budget={...p.budget,costs};
    } else return false;
    return true;
  }
  function hasBudget(p) {
    const prefs=p.budget;
    if(!prefs)return false;
    return goldValue(prefs.gold)!==null || prefs.altLevel===30 ||
      Object.entries(prefs.mounts || {}).some(([name,m])=>m?.done===true ||
        (goldValue(m?.cost)!==null && m.cost!==defaultMountCost(name))) ||
      crafts.some(prof=>ranks.some(n=>craftCost(p,prof,n)!==(n===150?5:null)));
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
    const checkpoints=c===mainClass(p)?[5,10,20,25,30,35,40,45,60]:
      assigned(p,c).length?[5,10,20,25,35,45,60]:[5,...lpLevels];
    const n=checkpoints.find(n=>n>current && n<=end);
    if(!n)return null;
    const gather=assigned(p,c).filter(prof=>!crafts.includes(prof));
    const why=lpLevels.includes(n)?'This class milestone earns 1 LP.':
      n===5?'Log out in an inn between sessions to build rested XP.':
      n===40?'Reach level 40 to unlock the first mount.': 'Continue levelling '+c+'.';
    return {key:levelKey(c,n),title:c+' — Reach level '+n,
      why:why+(gather.length?' Pick up '+gather.join(' and ')+' materials along the way.':'')};
  }

  function nextCraft(p,spendable,maxRank,altsOnly=false) {
    const options=[];
    for(const c of p.order) {
      if(altsOnly && c===mainClass(p))continue;
      for(const prof of assigned(p,c)) {
        if(!crafts.includes(prof))continue;
        const i=ranks.findIndex(n=>!p.flags[skillKey(c,prof,n)]);
        const rank=ranks[i];
        if(!rank || rank>maxRank || earned(p,prof,rank))continue;
        const cost=craftCost(p,prof,rank);
        const current=level(p,c);
        if(cost===null || toSilver(cost)>spendable || (current<gates[i] && i>0))continue;
        options.push({c,prof,rank,cost,current,gate:gates[i]});
      }
    }
    options.sort((a,b)=>Number(b.current>=b.gate)-Number(a.current>=a.gate) ||
      a.cost-b.cost || starterBand[a.prof]-starterBand[b.prof] || b.current-a.current ||
      p.order.indexOf(a.c)-p.order.indexOf(b.c));
    const choice=options[0];
    if(!choice)return null;
    const {c,prof,rank,cost,current,gate}=choice;
    const price=cost===0?'Covered by your budgeted supplies.':'Allow '+cost+'g from the spending budget.';
    return current<gate?{
      key:levelKey(c,gate),title:c+' — Reach level '+gate,
      why:'Then take '+prof+' to '+rank+' for 1 LP. '+price
    }:{
      key:skillKey(c,prof,rank),title:c+' — Reach '+prof+' '+rank,
      cost,why:'The first '+prof+' '+rank+' earns 1 LP. '+price
    };
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
    const startLP=totals(p).earned,target=priority(p),cash=budget(p);
    const result={startLP,target,phases:[],projectedLP:startLP,fundedLP:startLP,spend:0,reachedGoal:!!target&&startLP>=target};
    const {main,gold,mountDone,mountCost,mountShortfall,altLevel}=cash;
    if(!main)return result;
    let wallet=toSilver(gold ?? 0), mounted=mountDone;
    const spare=()=>Math.max(0,wallet-(mounted?0:toSilver(mountCost)));
    const wantsLP=()=>target!==null && result.fundedLP<target;

    function phase(title) {
      const row={title,steps:[]};
      result.phases.push(row);
      return row;
    }
    function add(row,step) {
      if(sim.flags[step.key])return false;
      const mount=step.key.startsWith('mount/');
      const previous=totals(sim).earned;
      mark(sim,step.key,true);
      const total=totals(sim).earned,lp=total-previous;
      if(!step.funding) {
        if(mount)mounted=true;
        if(step.cost!==null && step.cost!==undefined) {
          wallet-=toSilver(step.cost);
          if(!mount)result.spend+=toSilver(step.cost);
        }
        result.fundedLP+=lp;
      }
      row.steps.push({...step,lp,total});
      result.projectedLP=total;
      return true;
    }
    function advance(row,c,end,why='',alternative=null) {
      let step, first=true;
      while((step=levelStep(sim,c,end))) {
        const extra=first&&why?' '+why:'';
        add(row,{...step,why:step.why+extra,alternative:first?alternative:null});
        first=false;
      }
    }
    function starterWave(title,limit,maxRank=150) {
      if(!wantsLP())return;
      const row=phase(title);
      const starterPoints=()=>crafts.filter(prof=>earned(sim,prof,150)).length;
      while(wantsLP() && (starterPoints()<limit || maxRank>150)) {
        const step=nextCraft(sim,spare(),maxRank);
        if(!step || !add(row,step))break;
      }
    }
    function closeDungeon() {
      if(!wantsLP())return;
      const step=dungeonStep(sim);
      if(step)add(phase('Finish a Spelunker set'),step);
    }

    if(level(sim,main)<40) {
      const row=phase(main+' to level 40');
      const reserveText=mountDone||mountCost===0?'':gold===null?
        'Set aside '+mountCost+'g for riding. Enter your gold to check what you can spend.':
        mountShortfall>0?'Keep saving for riding. You are '+mountShortfall+'g short.':
        'Keep '+mountCost+'g available for riding.';
      if(level(sim,main)<altLevel)advance(row,main,altLevel,reserveText);
      let alternate=null;
      if(wantsLP() && (mountDone || mountCost===0 || (gold!==null && mountShortfall===0)))
        alternate=nextCraft(sim,spare(),150,true);
      if(alternate)alternate={...alternate,why:'A short alt break is affordable. '+alternate.why};
      advance(row,main,40,reserveText,alternate);
    }
    if(!mounted && wallet>=toSilver(mountCost)) {
      const row=phase(main+' — First mount');
      const freeClassMount=mountCost===0 && hasClassMount(main);
      const why=freeClassMount?'Complete your level-40 mount quest.':
        mountCost>0?'Your budget covers '+mountCost+'g for riding and the first mount quest.':
        'Learn Apprentice Riding and complete the first mount quest.';
      add(row,{key:'mount/'+main,cost:mountCost,title:main+(freeClassMount?' — Complete your class mount quest':' — Get your level-40 mount'),
        why:why+' Tick the mount when you have it.'});
    }
    if(level(sim,main)<45) {
      closeDungeon();
      if(mounted)starterWave('Fund up to two starter crafts before level 45',2);
      const short=mounted?'':gold===null?'Record your gold to see what you still need for riding.':
        'Keep questing for mount gold. You are '+mountShortfall+'g short.';
      advance(phase(main+' to level 45'),main,45,short);
    }
    if(level(sim,main)<60) {
      closeDungeon();
      if(mounted)starterWave('Fund more starter crafts before level 60',4);
      const short=mounted?'':gold===null?'Record your gold to see what you still need for riding.':
        'Keep questing for mount gold. You are '+mountShortfall+'g short.';
      advance(phase(main+' to level 60'),main,60,short);
    }

    closeDungeon();
    if(mounted) {
      starterWave('Fund starter crafts for Legacy Points',crafts.length);
      starterWave('Fund higher crafting tiers for Legacy Points',crafts.length,300);
    }
    if(wantsLP()) {
      for(const c of p.order.slice(1)) {
        if(!wantsLP())break;
        if(level(sim,c)<25)advance(phase(c+' to level 25 for a class point'),c,25);
        if(mounted)starterWave('Use available gold for crafting Legacy Points',crafts.length,300);
      }
    }
    for(const c of p.order) {
      if(level(sim,c)<60)advance(phase(c+' to level 60'),c,60);
    }
    function finishProfessions(fundedOnly) {
      const row=phase(fundedOnly?'Finish professions within your budget':'Finish professions when funded');
      for(const c of p.order) for(const prof of assigned(p,c)) {
        let blocked=false;
        for(const rank of ranks) {
          const key=skillKey(c,prof,rank);
          if(sim.flags[key])continue;
          const isCraft=crafts.includes(prof);
          const cost=isCraft?craftCost(p,prof,rank):null;
          const funding=isCraft && (blocked?'prerequisite':cost===null?'unpriced':toSilver(cost)>spare()?'short':null);
          if(fundedOnly && funding)break;
          if(funding)blocked=true;
          add(row,{key,title:c+' — '+prof+' '+rank,cost,
            funding:funding||null,why:funding==='unpriced'?'Price the materials and training for this tier before spending.':
              funding==='short'?'Set aside more gold for this tier.':
              funding==='prerequisite'?'Fund and finish the earlier tier first.':
              isCraft?'Train this tier with the money set aside for it.':'Gather while levelling '+c+'. This is a skill checkpoint.'});
        }
      }
    }
    // Run the cash-backed route before recording any conditional skill milestones.
    finishProfessions(true);
    finishProfessions(false);
    result.phases=result.phases.filter(row=>row.steps.length);
    result.reachedGoal=!!target && result.fundedLP>=target;
    result.spend/=100;
    return result;
  }
  function suggestion(p) {
    return milestoneOrder(p).phases.flatMap(row=>row.steps).find(step=>!step.funding) || null;
  }

  window.WYHPlan={get key(){return key();}, get relatedKeys(){return relatedKeys();},get groups(){return groups();},emptyPlan,savedGuideEntries,classes,crafts,professions,levels,descriptions,ranks,lpLevels,levelKey,skillKey,dungeonKey,load,save,copyPreset,assigned,mark,available,earned,totals,reward,setOtherLP,budget,craftCost,setBudgetValue,hasBudget,priority,setPriority,milestoneOrder,suggestion};
})();
