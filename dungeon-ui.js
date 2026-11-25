(() => {
  'use strict';
  const phases = {
    before: ['Pick up before entering', 'Pick up for the run'],
    inside: ['Inside the dungeon', 'Pick up inside'],
    followup: ['Follow-ups', 'After the dungeon objective'],
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
  const edgeTypes=['requires','any','active','optional'];
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
  function outsideLink(label, href, css) {
    const anchor = node('a', css, label);
    if (/^https?:\/\//i.test(href || '')) {
      anchor.href = href; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer';
    }
    return anchor;
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
  // Objectives in the same run can share an opener. Show that journey once.
  function families(quests,roots) {
    const groups=[];
    for (const objective of roots) {
      const members=closure(quests,objective.id);
      if (!members.size) continue;
      const group={members,roots:[objective]};
      for(let i=groups.length-1;i>=0;--i) {
        const earlier=groups[i];
        if (![...earlier.members].some(id=>members.has(id))) continue;
        for(const id of earlier.members)members.add(id);
        group.roots.unshift(...earlier.roots);
        groups.splice(i,1);
      }
      groups.push(group);
    }
    return groups;
  }
  function ordered(quests,group) {
    const done=new Set(),active=new Set(),rows=[];
    const visit = id => {
      id=String(id);
      if(done.has(id) || active.has(id) || !quests[id]) return;
      active.add(id);
      for(const prior of deps(quests[id])) visit(prior);
      active.delete(id); done.add(id); rows.push(quests[id]);
    };
    group.roots.forEach(r=>visit(r.id));
    return rows;
  }
  function archivedChecklist(guide,quests,visible) {
    const aliases=new Map(), unmatched=new Map();
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
      } else if(original) unmatched.set(norm(original),original);
    }
    return {aliases,unmatched};
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
    const badge=known && entry.src ? outsideLink(text,entry.src,'dq-sharing') : node('span','dq-sharing',text);
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
  function questRow(q,role, context) {
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
    const name=q.source ? outsideLink(q.name,q.source,'dq-name') : node('span','dq-name',q.name);
    const tick=node('label','dq-check-hit');
    tick.append(check);
    heading.append(name,sharing(id));
    info.append(heading);
    const meta=[];
    if(role)meta.push(role);
    if(q.min !== undefined && q.min !== null)meta.push('Min '+q.min);
    if(Number(q.level)>0)meta.push('Quest level '+q.level);
    if(q.start)meta.push('Start around '+q.start);
    const sides=list(q.sides);
    if(sides.length)meta.push(sides.includes('Both') || sides.length===2 ? 'Both factions' : sides[0]+' only');
    if(meta.length)info.append(node('p','dq-quest-meta',meta.join(' · ')));
    const area=q.area && norm(q.area)!==norm(q.zone)?showName(q.area):'';
    const coords=Number.isFinite(q.x)&&Number.isFinite(q.y)?' ('+[q.x,q.y].map(n=>Number(n.toFixed(1))).join(', ')+')':'';
    const place=[showName(q.npc),[area,showName(q.zone)].filter(Boolean).join(', ')].filter(Boolean).join(' · ')+coords;
    if(place)info.append(node('p','dq-place',place));
    const cls=showName(q.class),race=showName(q.race);
    const raceRule=race.startsWith('Except ') ? 'Unavailable to '+race.slice(7) : race && race+' only';
    const restrictions=[cls && cls+' only',raceRule].filter(Boolean);
    if(restrictions.length)info.append(node('p','dq-restriction',restrictions.join(' · ').replace(/\bForsaken\b/g,'Forsaken (Undead)')));
    let note=q.note || '';
    for(const rule of restrictions){
      if(note.toLowerCase().startsWith(rule.toLowerCase()+'.'))note=note.slice(rule.length+1).trim();
    }
    if(note)info.append(node('p','dq-note',note));
    const names=ids=>list(ids).map(i=>quests[i]?.name || ('Quest '+i)).join(' / ');
    if(list(q.requires).length>1)info.append(node('p','dq-relation','Complete all of these first: '+names(q.requires)+'.'));
    else if(list(q.requires).length && !quests[q.requires[0]])info.append(node('p','dq-relation','Complete '+names(q.requires)+' first.'));
    if(list(q.active).length)info.append(node('p','dq-relation','Keep in your quest log: '+names(q.active)+'.'));
    if(list(q.any).length)info.append(node('p','dq-relation','Complete one of these first: '+names(q.any)+'.'));
    if(list(q.optional).length)info.append(node('p','dq-relation','Optional introduction: '+names(q.optional)+'.'));
    check.addEventListener('change',()=>{
      if(!tracker.set(id,check.checked,active)){
        check.checked=!check.checked;changes('Your browser could not save this change.');return;
      }
      item.classList.toggle('dq-complete',check.checked);changes();
    });
    item.append(tick,info);return item;
  }
  function drawRun(host,run,context) {
    const {quests,faction,tracker}=context;
    const objectives=run[faction] || [];
    const byID=new Map(objectives.map(r=>[String(r.id),r]));
    const inside=new Set(objectives.filter(r=>r.phase==='inside').map(r=>String(r.id)));
    const groups=families(quests,objectives);
    const ids=new Set(groups.flatMap(group=>[...group.members]));
    const needed=(keys)=>new Set([...ids].flatMap(id=>keys.flatMap(k=>list(quests[id][k]).map(String))));
    const keepActive=needed(['active']);
    for(const id of needed(['any','requires']))keepActive.delete(id);
    for(const id of byID.keys())keepActive.delete(id);
    const header=node('header','dq-run-head'), heading=node('div');
    heading.append(node('h3','dq-heading',run.name));
    if(run.recommended)heading.append(node('p','dq-run-level','Recommended run level '+run.recommended));
    const completion=node('span','dq-progress');
    completion.setAttribute('role','status');
    header.append(heading,completion);host.append(header);
    const coverage=typeof run.coverage==='string'?run.coverage:run.coverage?.[faction];
    if(coverage)host.append(node('p','dq-coverage',coverage));
    if(!ids.size){
      if(!coverage)host.append(node('p','ref-empty','No documented '+faction+' quest pickups for this run.'));
      return;
    }
    function update(message) {
      if(message){completion.textContent=message;return;}
      const saved=tracker.load(); let checked=0;
      for(const id of ids)if(tracker.has(saved,id,keepActive.has(id)))checked++;
      completion.textContent=checked+' / '+ids.size+' steps marked';
    }
    update();
    const ctx={...context,keepActive,marks:tracker.load(),changes:update};
    const buckets={chain:[],before:[],inside:[],followup:[],check:[]};
    for(const group of groups) {
      const chain=[...group.members].some(id=>deps(quests[id]).length);
      buckets[chain?'chain':phaseOf(group.roots[0])].push(group);
    }
    for(const [key,items] of Object.entries(buckets)){
      if(!items.length)continue;
      const section=node('section','dq-group');
      section.append(node('h4','dq-group-title',key==='chain'?'Quest chains':phases[key][0]));
      for(const group of items){
        const orderedQuests=ordered(quests,group);
        const listEl=node(key==='chain'?'ol':'ul',key==='chain'?'dq-chain':'dq-direct');
        if(key==='chain'){
          const requiredBy=new Set(orderedQuests.flatMap(q=>list(q.requires).map(String)));
          const choices=new Set(orderedQuests.flatMap(q=>list(q.any).map(String)));
          const optional=new Set(orderedQuests.flatMap(q=>list(q.optional).map(String)));
          const outcomes=group.roots.filter(r=>!requiredBy.has(String(r.id)) && !choices.has(String(r.id)) && !optional.has(String(r.id)));
          const family=node('div','dq-family');
          const goals=[...new Set((outcomes.length?outcomes:group.roots).map(r=>quests[r.id]?.name).filter(Boolean))];
          const label=goals.length>2 || goals.join(' / ').length>95 ? 'From '+orderedQuests[0].name : goals.join(' / ');
          family.append(node('h5','dq-family-title',label));
          for(const quest of orderedQuests){
            const id=String(quest.id),entry=byID.get(id);
            let role;
            if(entry){
              role=entry.phase==='before' && requiresInstancePickup(quest,quests,inside)
                ? 'Return to this giver after the in-dungeon step' : phases[phaseOf(entry)][1];
            } else if(requiredBy.has(id)){
              const earlier=context.runsForQuest.get(id);
              role=earlier?.length ? 'Earlier dungeon step · '+earlier[0] : 'Complete first';
            } else role=choices.has(id)?'Alternative prerequisite':keepActive.has(id)?'Keep active in your quest log':'Optional introduction';
            listEl.append(questRow(quest,role,ctx));
          }
          family.append(listEl);section.append(family);
        }else{
          for(const quest of orderedQuests)listEl.append(questRow(quest,'',ctx));
          section.append(listEl);
        }
      }
      host.append(section);
    }
  }
  function render(host,guide,character,changeCharacter) {
    const db=window.WYHDungeonQuests,faction=window.GuideFaction.name;
    host.classList.add('dungeon-guide');
    host.append(node('h2','ref-title','Dungeon quests'));
    host.append(node('p','ref-context dq-intro','Choose your dungeon to see the quests to collect, the chains to finish first and the pickups inside. Party members must meet the requirements for a shared quest.'));
    if(!db){host.append(node('p','ref-empty','The dungeon catalogue could not be loaded. Reload the page to try again.'));return;}
    const runs=db.dungeons.filter(d=>Array.isArray(d[faction]));
    const quests=factionQuests(db.quests,faction),allIds=new Set(),indices=new Map(),runsForQuest=new Map();
    for(const run of runs){
      const ids=new Set();
      for(const entry of run[faction]){
        closure(quests,entry.id,ids);
        const id=String(entry.id),others=runsForQuest.get(id)||[];
        others.push(run.name);runsForQuest.set(id,others);
      }
      for(const id of ids)allIds.add(id);
      indices.set(run.id,[norm(run.name+' '+(run.legacy || '')),...[...ids].map(id=>searchTerms(quests[id]))]);
    }
    const earlier=archivedChecklist(guide,quests,allIds);
    const tracker=progress(character,earlier.aliases);
    const first=runs.find(run=>run[faction].length) || runs[0];
    const selected=state.get(faction)||{id:first?.id,query:''};
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
      tools.append(labelled('Checklist for',pick));
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
    const retained=[...tracker.load()].filter(mark=>earlier.unmatched.has(mark));
    if(retained.length){
      const history=node('details','dq-archive'), oldList=node('ul');
      history.append(node('summary','','Earlier marked entries ('+retained.length+')'),
        node('p','','These entries from your previous checklist could not be matched to a single quest step.'));
      retained.forEach(mark=>oldList.append(node('li','',earlier.unmatched.get(mark))));
      history.append(oldList);host.append(history);
    }
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
      if(run)drawRun(result,run,{quests,faction,tracker,query,runsForQuest});
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

