(() => {
  'use strict';
  const phases = {
    before: ['Pick up before entering', 'Pick up for the run'],
    inside: ['Inside the dungeon', 'Pick up inside'],
    followup: ['After the run', 'After the dungeon objective'],
    check: ['Check pickup location', 'Pickup location unlisted']
  };
  const state = new Map();
  const node = (tag, css, text) => {
    const el = document.createElement(tag);
    if (css) el.className = css;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const norm = value => String(value ?? '').toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f'’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const list = value => Array.isArray(value) ? value : value == null || value === '' ? [] : [value];
  const edgeTypes=['requires','any','active'];
  const deps = q => edgeTypes.flatMap(key=>list(q?.[key]));
  const showName = value => list(value).join(', ');
  const searchTerms = q => norm([q.name,q.npc,q.area,q.zone,q.class,q.race].filter(Boolean).join(' '));
  function factionQuests(catalogue,faction) {
    const allows=q=>!q || !list(q.sides).length || list(q.sides).includes(faction) || list(q.sides).includes('Both');
    const quests={};
    for(const [id,q] of Object.entries(catalogue)){
      if(!allows(q))continue;
      const row={...q};
      for(const edge of edgeTypes)row[edge]=list(q[edge]).filter(parent=>allows(catalogue[parent]));
      quests[id]=row;
    }
    return quests;
  }
  function classQuests(factionCatalogue,character) {
    const selected=norm(character);
    const eligible=new Set(Object.keys(factionCatalogue).filter(id=>{
      const classes=list(factionCatalogue[id].class).flatMap(name=>name.split(',')).map(norm);
      return !classes.length || classes.includes(selected);
    }));
    const allowed=id=>!factionCatalogue[id] || eligible.has(String(id));
    // A class-neutral label can still belong to a chain that requires a class quest.
    let removed;
    do {
      removed=false;
      for(const id of eligible) {
        const quest=factionCatalogue[id], alternatives=list(quest.any);
        if([...list(quest.requires),...list(quest.active)].some(parent=>!allowed(parent)) ||
            (alternatives.length && !alternatives.some(allowed))) {
          eligible.delete(id);
          removed=true;
        }
      }
    } while(removed);
    return Object.fromEntries([...eligible].map(id=>{
      const quest={...factionCatalogue[id]};
      for(const edge of edgeTypes)quest[edge]=list(quest[edge]).filter(allowed);
      return [id,quest];
    }));
  }
  function labelled(label, control) {
    const field = node('label','ref-field');
    field.append(node('span','ref-field-label',label), control);
    return field;
  }
  function option(name, value) {
    const entry = node('option', '', name); entry.value=value; return entry;
  }
  function closure(quests,id,seen=new Set()) {
    id=String(id);
    if (!quests[id] || seen.has(id)) return seen;
    seen.add(id);
    for (const parent of deps(quests[id])) closure(quests,parent,seen);
    return seen;
  }
  function routeSteps(quests,id) {
    const visited=new Set(), ordered=[];
    function visit(key) {
      key=String(key);
      if(visited.has(key) || !quests[key])return;
      visited.add(key);
      for(const parent of deps(quests[key]))visit(parent);
      ordered.push(key);
    }
    visit(id);
    return ordered;
  }
  function archivedChecklist(guide,quests,visible) {
    const aliases=new Map();
    const byTitle=new Map();
    for(const id of visible) {
      const q=quests[id], title=norm(q.name);
      if (!byTitle.has(title)) byTitle.set(title,[]);
      byTitle.get(title).push(q);
    }
    const section=guide.sections.find(x=>x.id==='prequests');
    for(const block of section?.blocks ?? []) for(const row of block.rows?.slice(1) ?? []) {
      const original=row[2] || '';
      const parts=original.split(/\s+[—–-]\s+/);
      const matches=byTitle.get(norm(parts[0])) || [];
      let q=matches.length === 1 ? matches[0] : null;
      if(!q && parts.length>1) {
        const giver=norm(parts.slice(1).join(' '));
        const candidates=matches.filter(item=>{
          const label=norm(showName(item.npc));
          return label && giver.includes(label);
        });
        if(candidates.length===1)q=candidates[0];
        else if(candidates.length>1){
          // Several legs can reuse both title and giver. A mark from the old
          // "first quest" table belongs to the single earliest matching leg.
          const ids=new Set(candidates.map(item=>String(item.id)));
          const earliest=candidates.filter(item=>![...closure(quests,item.id)]
            .some(id=>id!==String(item.id)&&ids.has(id)));
          if(earliest.length===1)q=earliest[0];
        }
      }
      if(q) {
        const id=String(q.id);
        aliases.set(id,[...(aliases.get(id)||[]),norm(original)]);
      }
    }
    return aliases;
  }
  function progress(character,aliases) {
    const key=window.GuideFaction.storageKey('rosethorn.prequests.v1.'+character);
    const load=()=>{
      try{
        const saved=JSON.parse(localStorage.getItem(key) || '[]');
        return new Set(Array.isArray(saved)?saved:[]);
      }catch{return new Set();}
    };
    const keys = (id,active) => active?['active:'+id]:['quest:'+id,...(aliases.get(String(id)) || [])];
    const has = (marks,id,active) => keys(id,active).some(k=>marks.has(k));
    const set = (id,on,active) => {
      const marks=load();
      const relevant=keys(id,active);
      for(const item of relevant)marks.delete(item);
      if(on)marks.add(relevant[0]);
      try { if(marks.size)localStorage.setItem(key,JSON.stringify([...marks]));else localStorage.removeItem(key); }
      catch {return false;}
      return true;
    };
    return {load,has,set};
  }
  function sharing(id) {
    const entry=window.WYH_QUEST_SHARING?.[id];
    const known=typeof entry?.share==='boolean';
    const text=known ? (entry.share?'Shareable':'Pick up individually') : 'Sharing unlisted';
    const badge=node('span','dq-sharing',text);
    badge.dataset.sharing=known ? String(entry.share) : 'unlisted';
    badge.title=known ? (entry.share?'A party member can share this step with an eligible player.':'Each player must pick up this step independently.')
      : 'The available quest records do not establish whether this step can be shared.';
    return badge;
  }
  function phaseOf(objective) { return phases[objective.phase] ? objective.phase : 'check'; }
  function requiresInstancePickup(q,quests,inside,seen=new Set()){
    const id=String(q.id);
    if(seen.has(id))return false;
    const next=new Set(seen);next.add(id);
    const visits=parent=>inside.has(String(parent)) || (quests[parent] && requiresInstancePickup(quests[parent],quests,inside,next));
    return list(q.requires).some(visits) || (list(q.any).length>0 && list(q.any).every(visits));
  }
  function questRow(q,role,context,showSharing=true) {
    const {tracker,marks,changes,quests}=context;
    const id=String(q.id);
    const active=context.keepActive.has(id);
    const item=node('li','dq-quest');item.dataset.questId=id;
    item.tabIndex=-1;
    if(context.query && searchTerms(q).includes(context.query))item.classList.add('dq-match');
    const check=node('input','dq-check');check.type='checkbox';check.checked=tracker.has(marks,id,active);
    check.setAttribute('aria-label',active?'Mark '+q.name+' in your quest log':'Mark '+q.name+' complete');
    item.classList.toggle('dq-complete',check.checked);
    const info=node('div','dq-quest-info'), heading=node('div','dq-quest-heading');
    const name=node('span','dq-name',q.name);
    const tick=node('label','dq-check-hit');
    tick.append(check);
    heading.append(name);
    if(showSharing)heading.append(sharing(id));
    info.append(heading);
    const meta=[];
    if(role)meta.push(role);
    if(q.min !== undefined && q.min !== null)meta.push('Min '+q.min);
    if(Number(q.level)>0)meta.push('Quest level '+q.level);
    if(q.start)meta.push('Start around '+q.start);
    if(meta.length)info.append(node('p','dq-quest-meta',meta.join(' · ')));
    const area=q.area && norm(q.area)!==norm(q.zone)?showName(q.area):'';
    const coords=Number.isFinite(q.x)&&Number.isFinite(q.y)?' ('+[q.x,q.y].map(n=>Number(n.toFixed(1))).join(', ')+')':'';
    const giver=q.itemStart && q.npc?'Start from '+showName(q.npc):showName(q.npc);
    const place=[giver,[area,showName(q.zone)].filter(Boolean).join(', ')].filter(Boolean).join(' · ')+coords;
    if(place)info.append(node('p','dq-place',place));
    if(q.objective)info.append(node('p','dq-objective',q.objective));
    const race=showName(q.race);
    const raceRule=race.startsWith('Except ') ? 'Unavailable to '+race.slice(7) : race && race+' only';
    const restrictions=[raceRule].filter(Boolean);
    if(restrictions.length)info.append(node('p','dq-restriction',restrictions.join(' · ').replace(/\bForsaken\b/g,'Forsaken (Undead)')));
    let note=q.note || '';
    for(const rule of restrictions){
      if(note.toLowerCase().startsWith(rule.toLowerCase()+'.'))note=note.slice(rule.length+1).trim();
    }
    if(note)info.append(node('p','dq-note',note));
    function relation(ids,label) {
      const parents=list(ids);
      if(!parents.length)return;
      const line=node('p','dq-relation',label);
      for(const [index,parent] of parents.entries()) {
        const prior=quests[parent];
        if(index>0)line.append(' / ');
        if(!prior || !/^\d+$/.test(String(parent))) {
          line.append(prior?.name || ('Quest '+parent));
          continue;
        }
        const link=node('button','dq-step-ref',prior.name);
        link.type='button';
        link.addEventListener('click',()=>{
          const step=item.closest('.dq-run')?.querySelector('[data-quest-id="'+parent+'"]');
          if(!step)return;
          const details=step.closest('.dq-prerequisites');
          if(details)details.open=true;
          step.focus({preventScroll:true});
          step.scrollIntoView({block:'center'});
        });
        line.append(link);
      }
      info.append(line);
    }
    relation(q.requires,'Complete first · ');
    relation(q.active,'Keep in your quest log · ');
    relation(q.any,'Complete one of these first · ');
    check.addEventListener('change',()=>{
      if(!tracker.set(id,check.checked,active)){
        check.checked=!check.checked;changes('Your browser could not save this change.');return;
      }
      item.classList.toggle('dq-complete',check.checked);changes();
    });
    item.append(tick,info);return item;
  }
  function drawRun(host,run,context) {
    const {quests,faction,tracker,character,common}=context;
    const objectives=(run[faction] || []).filter(step=>quests[step.id]);
    const rootIds=new Set(objectives.map(step=>String(step.id)));
    const inside=new Set(objectives.filter(step=>step.phase==='inside').map(step=>String(step.id)));
    const paths=new Map(objectives.map(step=>[String(step.id),routeSteps(quests,step.id)]));
    const ids=new Set([...paths.values()].flat());
    const needed=(keys)=>new Set([...ids].flatMap(id=>keys.flatMap(k=>list(quests[id][k]).map(String))));
    const keepActive=needed(['active']);
    for(const id of needed(['any','requires']))keepActive.delete(id);
    for(const id of rootIds)keepActive.delete(id);
    const alternatives=needed(['any']);
    for(const id of needed(['active','requires']))alternatives.delete(id);
    const chainMembers=needed(edgeTypes);
    for(const [id,path] of paths)if(path.length>1 || deps(quests[id]).length)chainMembers.add(id);
    const header=node('header','dq-run-head'), heading=node('div');
    heading.append(node('h3','dq-heading',run.name));
    if(run.recommended)heading.append(node('p','dq-run-level','Recommended run level '+run.recommended));
    const completion=node('span','dq-progress');
    completion.setAttribute('role','status');
    header.append(heading,completion);host.append(header);
    const coverage=typeof run.coverage==='string'?run.coverage:run.coverage?.[faction];
    if(coverage)host.append(node('p','dq-coverage',coverage));
    const phaseGroups={before:[],inside:[],followup:[],check:[],class:[]};
    for(const step of objectives) {
      const quest=quests[step.id];
      const phase=step.phase==='before' && requiresInstancePickup(quest,quests,inside)?'followup':phaseOf(step);
      phaseGroups[common[step.id]?phase:'class'].push({id:String(step.id),phase});
    }
    const phaseOrder=Object.keys(phases);
    phaseGroups.before.sort((left,right)=>Number(!!deps(quests[left.id]).length)-Number(!!deps(quests[right.id]).length));
    phaseGroups.class.sort((left,right)=>phaseOrder.indexOf(left.phase)-phaseOrder.indexOf(right.phase));
    function update(message) {
      if(message){completion.textContent=message;return;}
      if(!rootIds.size)return;
      const saved=tracker.load(); let checked=0;
      for(const id of rootIds)if(tracker.has(saved,id,false))checked++;
      completion.textContent=checked+' / '+rootIds.size+' quests marked';
    }
    update();
    const ctx={...context,keepActive,marks:tracker.load(),changes:update};
    const shown=new Set(rootIds);
    function section(key) {
      const steps=phaseGroups[key];
      if(!steps.length)return;
      const section=node('section','dq-group');
      section.dataset.questGroup=key;
      const title=key==='class'?character+' quests':phases[key][0];
      section.append(node('h4','dq-group-title',title));
      const entries=node('ul','dq-direct');
      for(const step of steps) {
        const quest=quests[step.id], neededHere=paths.get(step.id).filter(id=>!shown.has(id));
        const entry=questRow(quest,key==='class'?phases[step.phase][1]:'',ctx,!chainMembers.has(step.id));
        if(neededHere.length) {
          const details=node('details','dq-prerequisites');
          const required=node('ol','dq-chain');
          details.append(node('summary','', 'Prerequisites ('+neededHere.length+')'));
          for(const id of neededHere) {
            shown.add(id);
            const role=keepActive.has(id)?'Keep in your quest log':
              alternatives.has(id)?'Alternate prerequisite':'Complete first';
            required.append(questRow(quests[id],role,ctx,false));
          }
          details.append(required);entry.querySelector('.dq-quest-info').append(details);
          if(required.querySelector('.dq-match'))details.open=true;
        }
        entries.append(entry);
      }
      section.append(entries);host.append(section);
    }
    if(!objectives.length && !coverage)host.append(node('p','ref-empty','No quests listed for this checklist.'));
    section('before');
    section('inside');
    const navigation=window.WYHDungeonNavigation?.render(run,quests,{faction,objectives:Object.values(phaseGroups).flat()});
    if(navigation)host.append(navigation);
    section('followup');
    section('check');
    section('class');
    if(!character && (run[faction]||[]).some(step=>context.factionCatalogue[step.id] && !common[step.id])) {
      const hint=node('p','dq-class-hint', context.hasRoster?'Choose a character to include their class quests.':'Add a character in Setup to see their class quests.');
      if(!context.hasRoster) {
        const setup=node('a','','Open Setup');setup.href='#setup';
        hint.append(' ',setup);
      }
      host.append(hint);
    }
  }
  function render(host,guide,character,changeCharacter) {
    const db=window.WYHDungeonQuests,faction=window.GuideFaction.name;
    host.classList.add('dungeon-guide');
    host.append(node('h2','ref-title','Dungeon quests'));
    host.append(node('p','ref-context dq-intro','Choose a dungeon and a character to see their pickups, in-dungeon quests and follow-ups.'));
    if(!db){host.append(node('p','ref-empty','The dungeon catalogue could not be loaded. Reload the page to try again.'));return;}
    const runs=db.dungeons.filter(d=>Array.isArray(d[faction]));
    const factionCatalogue=factionQuests(db.quests,faction);
    const common=classQuests(factionCatalogue,'');
    const quests=character?classQuests(factionCatalogue,character):common;
    const allIds=new Set(),indices=new Map();
    for(const run of runs){
      const ids=new Set();
      for(const entry of run[faction]){
        closure(quests,entry.id,ids);
        closure(factionCatalogue,entry.id,allIds);
      }
      indices.set(run.id,[norm(run.name+' '+(run.legacy || '')),...[...ids].map(id=>searchTerms(quests[id]))]);
    }
    const tracker=progress(character,archivedChecklist(guide,factionCatalogue,allIds));
    const first=runs.find(run=>run[faction].length) || runs[0];
    const selected=state.get(faction)||{id:first?.id,query:'',character};
    if(selected.character!==character)selected.query='';
    selected.character=character;
    state.set(faction,selected);
    const tools=node('div','ref-tools dq-tools');
    const search=node('input','ref-search');search.type='search';search.id='dq-search';
    search.placeholder='Dungeon, quest or giver';search.value=selected.query;
    const choose=node('select','ref-select');choose.id='dq-run';
    const field=labelled('Dungeon',choose);field.classList.add('dq-run-select');
    tools.append(field,labelled('Search all dungeons',search));
    const roster=window.PlannerUI.plan.order;
    if(roster.length && typeof changeCharacter==='function'){
      const pick=node('select','ref-select');pick.id='dq-tracker';
      pick.append(option('Shared checklist',''));
      for(const member of roster)pick.append(option(member,member));
      pick.value=character || '';pick.addEventListener('change',()=>changeCharacter(pick.value));
      tools.append(labelled('Character checklist',pick));
    }
    const result=node('article','dq-run');
    const searchResult=node('div','dq-search-result'), count=node('span');
    count.setAttribute('role','status');
    const jump=node('button','dq-jump','Jump to first matching quest');jump.type='button';
    jump.addEventListener('click',()=>{
      const target=result.querySelector('.dq-match');
      if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'center'});}
    });
    searchResult.append(count,jump);host.append(tools,searchResult,result);
    const sources=node('a','dq-sources','Dungeon data sources');
    sources.href='dungeon-data-sources.txt';sources.target='_blank';sources.rel='noopener';host.append(sources);
    function refresh(){
      const query=norm(selected.query);
      const filtered=runs.filter(r=>!query || indices.get(r.id).some(part=>part.includes(query)));
      choose.replaceChildren();
      for(const run of filtered)choose.append(option(run.name+(run.recommended?' · '+run.recommended:''),run.id));
      const run=filtered.find(r=>r.id===selected.id)||filtered[0];
      choose.disabled=!run;
      if(run){selected.id=run.id;choose.value=run.id;}
      result.replaceChildren();
      if(run)drawRun(result,run,{quests,faction,tracker,query,common,factionCatalogue,character,hasRoster:roster.length>0});
      else result.append(node('p','ref-empty','No dungeons match this search. Clear the search to see all dungeons.'));
      searchResult.hidden=!query || !filtered.length;
      count.textContent=query && filtered.length ? filtered.length+' matching '+(filtered.length===1?'dungeon':'dungeons') : '';
      jump.hidden=!query || !result.querySelector('.dq-match');
    }
    search.addEventListener('input',()=>{selected.query=search.value;refresh();});
    choose.addEventListener('change',()=>{selected.id=choose.value;refresh();});
    refresh();
  }
  window.WYHDungeonUI={render};
})();

