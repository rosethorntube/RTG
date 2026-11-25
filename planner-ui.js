(() => {
  'use strict';
  const M=window.WYHPlan;
  let plan=M.load(), editing=plan.order[0], dragged=null, otherOpen=false;
  let previousSetup=null;
  const expanded=new Set(['Novice']);
  const node=(tag,css,text)=>{const n=document.createElement(tag);if(css)n.className=css;if(text!=null)n.textContent=text;return n;};
  function button(label,css,action) {
    const b=node('button',css,label);b.type='button';b.onclick=action;return b;
  }
  function art(c) {const img=node('img','class-art');img.src='class-'+c.toLowerCase()+'.webp';img.alt='';return img;}
  function go(tab) {location.hash=tab;}
  function move(c,to) {
    const from=plan.order.indexOf(c);
    if(from<0 || to<0 || to>=plan.order.length || from===to)return;
    plan.order.splice(from,1);plan.order.splice(to,0,c);
  }
  function draw(host,view) {
    host.replaceChildren();host.className='planner';
    const redraw=(save=true,focusId='')=>{
      const y=window.scrollY;
      if (save) {
        previousSetup=null;
        M.save(plan);
      }
      draw(host,view);
      if(focusId)document.getElementById(focusId)?.focus({preventScroll:true});
      window.scrollTo({top:y,behavior:'instant'});
    };
    if(view==='setup')setup(host,redraw);else milestones(host,redraw);
  }
  function saveReset(next,entries,undo) {
    const changed=[];
    try {
      for (const entry of entries) {
        const [key,value]=entry;
        if (undo) localStorage.setItem(key,value); else localStorage.removeItem(key);
        changed.push(entry);
      }
      if (M.save(next)) return true;
    } catch {}
    // A quota or privacy error can interrupt a multi-key write. Restore the completed changes.
    for (const [key,value] of changed.reverse()) {
      try {
        if (undo) localStorage.removeItem(key); else localStorage.setItem(key,value);
      } catch {}
    }
    return false;
  }
  function setup(host,redraw) {
    const head=node('div','plan-head'),intro=node('div');
    intro.append(node('h2','title','Plan your character roster'),node('p','plan-lead','Choose classes in levelling order and up to two professions each.'));
    const copy=button('Copy Rosethorn’s setup','plan-alt',()=>{M.copyPreset(plan);editing=plan.order[0];redraw();});
    copy.title='Select all nine classes with Rosethorn’s profession pairs';
    const related=M.savedGuideEntries();
    if (related.length) previousSetup=null;
    const actions=node('div');
    actions.setAttribute('role','group');
    actions.setAttribute('aria-label','Roster setup');
    const feedback=node('span');
    feedback.setAttribute('role','status');
    const clear=button(previousSetup?'Undo clear':'Clear','plan-alt',()=>{
      const snapshot=previousSetup;
      const next=snapshot?snapshot.plan:M.emptyPlan();
      if (!saveReset(next,snapshot?snapshot.related:related,!!snapshot)) {
        feedback.textContent='Your browser could not save this change. Please try again.';
        return;
      }
      previousSetup=snapshot?null:{plan,editing,related};
      editing=snapshot?snapshot.editing:undefined;
      plan=next;
      redraw(false,'clear-setup');
    });
    clear.id='clear-setup';
    clear.title=previousSetup?'Restore this roster and progress':'Reset the '+window.GuideFaction.name+' roster, professions, milestones, dungeon checklists and LP.';
    const hasProgress=plan.order.length || Object.values(plan.jobs).some(jobs=>jobs.length) ||
      Object.keys(plan.flags).length || plan.otherLP || plan.started || M.priority(plan)!==null || related.length;
    clear.disabled=!previousSetup && !hasProgress;
    actions.append(copy,document.createTextNode(' '),clear,feedback);
    head.append(intro,actions);host.append(head);
    const grid=node('div','setup-grid'), roster=node('section','plan-box'), sidebar=node('section','plan-box skill-editor');
    roster.append(node('h3','','Classes & levelling order'));
    const list=node('div','order-list');
    const selected=plan.order, others=M.classes.filter(c=>!selected.includes(c));
    if(!selected.includes(editing))editing=selected[0];
    for(const c of [...selected,...others]){
      const idx=selected.indexOf(c),chosen=idx>=0, jobs=M.assigned(plan,c);
      const row=node('div','setup-row'+(chosen?' chosen':'')+(chosen&&editing===c?' editing':''));
      const pick=node('input');pick.type='checkbox';pick.id='pick-'+c;pick.checked=chosen;pick.setAttribute('aria-label','Level '+c);
      pick.onchange=()=>{if(pick.checked){plan.order.push(c);editing=c;}else plan.order.splice(idx,1);redraw(true,pick.id);};
      const label=node('label','class-name');label.htmlFor=pick.id;label.append(art(c),node('b','',c));
      row.append(pick,label);
      if(chosen){
        const order=node('div','move-controls'), handle=node('span','drag-grip','⠿');handle.title='Drag to reorder';handle.setAttribute('aria-hidden','true');
        for(const [glyph,delta,word] of [['↑',-1,'up'],['↓',1,'down']]){
          const b=button(glyph,'move',()=>{move(c,idx+delta);redraw(true,'pick-'+c);});
          b.disabled=idx+delta<0||idx+delta>=selected.length;b.setAttribute('aria-label','Move '+c+' '+word);order.append(b);
        }
        row.draggable=true;
        row.ondragstart=e=>{dragged=c;e.dataTransfer.setData('text/plain',c);e.dataTransfer.effectAllowed='move';};
        row.ondragover=e=>{if(dragged){e.preventDefault();row.classList.add('over');}};
        row.ondragleave=()=>row.classList.remove('over');
        row.ondragend=()=>{dragged=null;for(const r of list.children)r.classList.remove('over');};
        row.ondrop=e=>{e.preventDefault();if(dragged){move(dragged,idx);dragged=null;redraw();}};
        const edit=button(jobs.length?jobs.join(' + '):'Choose professions','edit-jobs',()=>{editing=c;redraw(false,'prof-'+M.professions[0]);document.querySelector('.skill-editor')?.scrollIntoView({block:'nearest'});});
        edit.setAttribute('aria-label','Edit professions for '+c);edit.setAttribute('aria-pressed',String(editing===c));
        row.append(edit,order,handle);
      }
      list.append(row);
    }
    roster.append(list);grid.append(roster,sidebar);host.append(grid);
    if(editing){
      const top=node('div','skill-head');top.append(art(editing),node('h3','',editing+' professions'));sidebar.append(top);
      const jobs=M.assigned(plan,editing);
      sidebar.append(node('p','plan-note',jobs.length+' of 2 selected'));
      const field=node('fieldset','prof-choices');field.append(node('legend','sr-only','Professions for '+editing));
      for(const s of M.professions){
        const tag=node('label','job-choice'), check=node('input');check.type='checkbox';check.id='prof-'+s;check.checked=jobs.includes(s);check.disabled=jobs.length===2&&!check.checked;
        check.onchange=()=>{plan.jobs[editing]=check.checked?[...jobs,s]:jobs.filter(j=>j!==s);redraw(true,check.id);};
        tag.append(check,document.createTextNode(s));field.append(tag);
      }
      sidebar.append(field);
    }else sidebar.append(node('h3','','Professions'),node('p','plan-note','Tick a class to choose its professions.'));
    const next=button('Open my milestones →','cta',()=>{plan.started=true;M.save(plan);go('milestones');});
    next.disabled=!M.available(plan); sidebar.append(next);
    sidebar.append(node('p','plan-note','Your choices and ticks are saved in this browser.'));
    suggestedOrder(host,redraw);
  }
  function priorityControl(view,redraw) {
    const label=node('label','order-priority');
    const select=node('select','pselect');
    select.id=view+'-lp-priority';
    const active=M.priority(plan);
    const options=[null,5,10,16];
    if(active!==null && !options.includes(active))options.push(active);
    for(const goal of options) {
      const option=node('option','',goal===null?'No LP priority':goal+' LP');
      option.value=goal===null?'':String(goal);select.append(option);
    }
    select.value=active===null?'':String(active);
    select.onchange=()=>{
      if(M.setPriority(plan,select.value===''?null:Number(select.value)))redraw(true,select.id);
    };
    label.append(node('span','','LP priority'),select);
    return label;
  }
  function suggestedOrder(host,redraw) {
    const region=node('section','plan-box milestone-order');region.id='suggested-milestone-order';
    region.setAttribute('aria-labelledby','order-heading');
    const heading=node('h3','','Suggested Milestones Order');heading.id='order-heading';
    const head=node('div','order-heading');head.append(heading,priorityControl('setup',redraw));
    region.append(head);host.append(region);
    if(!plan.order.length) {
      region.append(node('p','plan-note','Select a class above to see its route to level 60.'));return;
    }
    const route=M.milestoneOrder(plan);
    if(!route.phases.length) {
      region.append(node('p','plan-note','All selected classes are at level 60 and every selected profession is at 300.'));
      if(route.target && !route.reachedGoal)
        region.append(node('p','order-limit','Record another '+(route.target-route.startLP)+' LP from other challenges or expand your roster to reach '+route.target+'.'));
      return;
    }
    const main=plan.order[0],mounted=plan.flags[M.levelKey(main,40)];
    const advice=[];
    if(!mounted) {
      advice.push('Level '+main+' to 40 and get your mount. Gather and sell materials as you level to help pay for riding.');
    }
    if(route.target && route.startLP<route.target) {
      if(route.first60) {
        advice.push('Work towards '+route.target+' LP as you level the rest of your roster.');
      } else if(route.reachedGoal) {
        advice.push((mounted?'Work':'Once mounted, work')+' towards '+route.target+' LP, then take '+main+' to 60.');
      } else {
        advice.push('This route projects '+route.projectedPre60LP+' LP before '+main+' reaches 60. Work towards the remaining points after that.');
      }
    } else if(!route.first60)advice.push((mounted?'Take':'Once mounted, take')+' '+main+' to 60, then level the rest of your roster.');
    if(advice.length)region.append(node('p','plan-note',advice.join(' ')));
    if(route.target && route.projectedLP<route.target)
      region.append(node('p','order-limit','This route projects '+route.projectedLP+' LP in total. Other Legacy Challenges can help you reach '+route.target+' LP.'));
    let number=1;
    for(const [index,phase] of route.phases.entries()) {
      const details=node('details','order-phase');
      details.open=index===0;
      const summary=node('summary');
      summary.append(node('b','',phase.title),node('span','order-count',phase.steps.length+(phase.steps.length===1?' step':' steps')));
      const list=node('ol','order-steps'),tail=node('ol','order-steps');
      list.start=number;tail.start=number+6;
      for(const [i,item] of phase.steps.entries()) {
        const li=node('li','order-step');li.dataset.key=item.key;
        li.append(node('span','',item.title));
        if(item.lp>0)li.append(rewardBadge('+'+item.lp+' LP · '+item.total+' total'));
        (i<6?list:tail).append(li);number++;
      }
      details.append(summary,list);
      if(phase.steps.length>6) {
        const more=node('details','order-more'),n=phase.steps.length-6;
        more.append(node('summary','','Show '+n+' more '+(n===1?'step':'steps')),tail);details.append(more);
      }
      region.append(details);
    }
  }
  function check(key,label,redraw) {
    const c=node('input','plan-check');c.type='checkbox';c.id=key;c.checked=!!plan.flags[key];c.setAttribute('aria-label',label);
    c.onchange=()=>{M.mark(plan,key,c.checked);redraw(true,key);};return c;
  }
  function tableFrame(headers) {
    const table=node('table','plan-table'),head=table.createTHead().insertRow();
    for(const [label,help] of headers){const th=node('th','',label);th.scope='col';if(help)th.title=help;head.append(th);}
    return {table,body:table.createTBody()};
  }
  function rewardBadge(text,earned=false) {
    return node('span','reward-tag'+(earned?' reward-earned':''),text);
  }
  function rewardCell(cell,key,label,redraw) {
    const reward=M.reward(plan,key);
    cell.append(check(key,label,redraw));
    if(!reward.eligible)return;
    cell.className='lp-cell';
    let badge;
    if(reward.status==='elsewhere')badge=rewardBadge('Counted',true);
    else if(reward.status==='earned')badge=rewardBadge('Earned',true);
    else badge=rewardBadge('+1 LP');
    cell.append(badge);
    const explanation=reward.status==='elsewhere'?'Already counted on another character':
      reward.status==='earned'?'Already included in earned LP':'One Legacy Point the first time';
    cell.title=label+' — '+explanation+(reward.status==='elsewhere' && reward.creditedTo?' ('+reward.creditedTo+')':'')+
      (reward.onCheck>1?'. Ticking this also fills earlier ranks for '+reward.onCheck+' LP in total.':'');
    cell.firstChild.setAttribute('aria-label',cell.title);
  }
  function accountTotal(host,summary,redraw) {
    const box=node('section','account-lp');box.setAttribute('aria-label','Legacy Points for the selected roster and shared challenges');
    const main=node('div','account-lp-main'),num=node('strong','earned-number',String(summary.earned));
    const caption=node('div','earned-caption');
    caption.append(node('b','',window.GuideFaction.name+' roster LP'),node('small','','Selected classes and this roster’s recorded challenges'));
    main.append(num,caption);
    const target=M.priority(plan), goal=node('div','lp-goal');
    goal.append(priorityControl('milestones',redraw));
    if(target>0){
      const bar=node('progress');bar.max=target;bar.value=Math.min(summary.earned,target);
      bar.setAttribute('aria-label','Progress towards '+target+' Legacy Points');
      goal.append(node('b','',summary.earned>=target?target+'-LP goal reached':(target-summary.earned)+' LP to your '+target+'-point goal'),bar);
    }
    const detail=node('div','lp-breakdown');
    for(const [name,value] of [['Class levels',summary.classLP],['Crafts',summary.skillLP],['Spelunker',summary.dungeonLP],['Other',summary.otherLP]]){
      const line=node('span');line.append(node('strong','',String(value)),document.createTextNode(' '+name));detail.append(line);
    }
    const extra=node('details','other-points');extra.open=otherOpen;
    extra.ontoggle=()=>{if(extra.isConnected)otherOpen=extra.open;};
    extra.append(node('summary','','Record other LP'));
    const label=node('label','','LP from other challenges '),input=node('input');
    input.type='number';input.min='0';input.step='1';input.value=String(summary.otherLP);input.id='lp-other';
    input.setAttribute('aria-describedby','other-lp-help');
    input.onchange=()=>{
      const amount=input.value.trim()===''?0:input.valueAsNumber;
      if(!input.validity.valid || !M.setOtherLP(plan,amount)){input.value=String(summary.otherLP);return;}
      otherOpen=true;redraw(true,'lp-other');
    };
    const help=node('p','plan-note','Enter only points earned outside these class, crafting and Spelunker milestones, such as PvP or exploration.');help.id='other-lp-help';
    label.append(input);extra.append(label,help);
    box.append(main,goal,detail,extra);host.append(box);
    host.append(node('p','plan-note','This is a faction planning total. Each account-wide reward counts once in game, even if you tick it on both boards.'));
  }
  function showStep(key) {
    const c=document.getElementById(key),box=c?.closest('details');
    if(box)box.open=true;
    c?.focus({preventScroll:true});c?.scrollIntoView({block:'center',behavior:'smooth'});
  }
  function milestones(host,redraw){
    const summary=M.totals(plan);
    const left=node('div','plan-head'),title=node('div');
    title.append(node('h2','title','Your milestones'),node('p','plan-lead','Tick your highest level or skill to fill earlier ranks. Gold labels mark Legacy Point rewards.'));
    left.append(title);host.append(left);accountTotal(host,summary,redraw);
    if(!M.available(plan)) {
      host.append(node('p','plan-lead','Choose a class in Setup to open your milestone board.'),button('Set up my roster','cta',()=>go('setup')));return;
    }
    const next=M.suggestion(plan);
    if(next){
      const callout=node('section','next-tip'),copy=node('div');
      copy.append(node('small','','Suggested next'),node('h3','',next.title),node('p','',next.why));
      callout.append(copy,button('Show on board ↓','plan-alt',()=>showStep(next.key)));host.append(callout);
    }else if(summary.max===summary.done)host.append(node('p','next-tip','All planned Legacy Points earned.'));
    const grid=node('div','board-grid'), lv=node('section','plan-box'),pro=node('section','plan-box'),dun=node('section','plan-box');
    host.append(grid);grid.append(lv,pro,dun);lv.append(node('h3','','Character levels'));
    const levelTable=tableFrame([['Class'],...M.levels.map(n=>[String(n),M.descriptions[n]])]);
    levelTable.table.classList.add('character-levels-table');
    for(const c of plan.order) {
      const row=levelTable.body.insertRow(),name=node('th');name.scope='row';name.append(art(c),document.createTextNode(c));row.append(name);
      for(const n of M.levels){
        const cell=row.insertCell(), label=c+' · Level '+n+' · '+M.descriptions[n];
        cell.title=label;rewardCell(cell,M.levelKey(c,n),label,redraw);
      }
    }
    lv.append(levelTable.table,node('p','plan-note','5 · Rest in an inn. 10 / 20 / 35 · Profession training. 40 · First mount. 25 / 45 / 60 · +1 LP each.'));
    pro.append(node('h3','','Professions'));
    const skillTable=tableFrame([['Class / profession'],...M.ranks.map(n=>[String(n)])]);
    for(const c of plan.order){
      for(const s of M.assigned(plan,c)){
        const row=skillTable.body.insertRow(),name=node('th');name.scope='row';name.append(node('small','skill-owner',c),document.createTextNode(s));row.append(name);
        for(const n of M.ranks){
          const cell=row.insertCell(),label=c+' · '+s+' '+n;
          cell.title=M.crafts.includes(s)?label:label+' · Gathering checkpoint';
          rewardCell(cell,M.skillKey(c,s,n),cell.title,redraw);
        }
      }
    }
    if(skillTable.body.children.length){
      pro.append(skillTable.table,node('p','plan-note','Each crafting tier counts once across selected classes, including professions they previously trained. Gathering ticks track skill only.'));
    }else{
      const setupLink=node('a','plan-note','Add professions in Setup');
      setupLink.href='#setup';
      pro.append(setupLink);
    }
    dun.append(node('h3','','Spelunker dungeons'),node('p','plan-note dungeon-intro','Tick each final boss. Each complete box earns 1 LP.'));
    for(const [group,runs] of M.groups){
      const box=node('details','spelunker');box.open=expanded.has(group);
      box.ontoggle=()=>{if(!box.isConnected)return;if(box.open)expanded.add(group);else expanded.delete(group);};
      const title=node('summary'), done=runs.filter(([d])=>plan.flags[M.dungeonKey(d)]).length;
      const complete=done===runs.length;
      title.append(node('b','',group+' Spelunker'),node('small','group-count',done+'/'+runs.length),
        rewardBadge(complete?'1 LP earned':'+1 LP for set',complete));box.append(title);
      for(const [d] of runs){
        const key=M.dungeonKey(d),lab=node('label','dungeon-line');
        const finalClear=!plan.flags[key]&&done===runs.length-1;
        lab.append(check(key,group+' Spelunker · '+d+(finalClear?' · Completes the set for one LP':''),redraw),document.createTextNode(d));
        if(finalClear)lab.append(rewardBadge('+1 LP to finish'));box.append(lab);
      }
      dun.append(box);
    }
  }
  window.PlannerUI={draw,get plan(){return plan;},reload(){previousSetup=null;plan=M.load();},defaultTab(){return plan.started && M.available(plan)?'milestones':'setup';}};
})();
