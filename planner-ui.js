(() => {
  'use strict';
  const M=window.WYHPlan;
  let plan=M.load(), editing=plan.order[0], dragged=null, otherOpen=false;
  let previousSetup=null;
  const expanded=new Set(['Novice']);
  const budgetOpen={setup:true,milestones:false};
  const costsOpen={setup:false,milestones:false};
  const goldFormat=new Intl.NumberFormat('en-GB',{maximumFractionDigits:2});
  const node=(tag,css,text)=>{const n=document.createElement(tag);if(css)n.className=css;if(text!=null)n.textContent=text;return n;};
  const goldLabel=value=>goldFormat.format(value)+'g';
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
    intro.append(node('h2','title','Plan your '+window.GuideFaction.name+' roster'),node('p','plan-lead','Choose classes in levelling order and up to two professions each. Each faction has its own saved plan.'));
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
    clear.title=previousSetup?'Restore this roster and progress':'Reset the '+window.GuideFaction.name+' roster, gold budget, professions, milestones, dungeon checklists and LP.';
    const hasProgress=plan.order.length || Object.values(plan.jobs).some(jobs=>jobs.length) ||
      Object.keys(plan.flags).length || plan.otherLP || plan.started || M.priority(plan)!==null || related.length || M.hasBudget(plan);
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
  function amountInput(view,id,label,value,update,redraw) {
    const input=node('input','budget-gold');
    input.id=view+'-'+id;
    input.type='number';
    input.inputMode='decimal';
    input.min='0';
    input.step='any';
    input.value=value??'';
    input.setAttribute('aria-label',label);
    input.onchange=()=>{
      const next=input.value===''?null:input.valueAsNumber;
      if(!input.validity.valid || !update(next)){input.value=value??'';return;}
      redraw(true,input.id);
    };
    return input;
  }
  function budgetPanel(view,redraw) {
    const budget=M.budget(plan);
    const box=node('details','plan-box gold-budget');
    box.open=budgetOpen[view];
    box.ontoggle=()=>{if(box.isConnected)budgetOpen[view]=box.open;};
    const summary=node('summary');
    const status=[];
    if(budget.gold===null)status.push('Enter your gold balance');
    else status.push(goldLabel(budget.gold)+' available');
    if(budget.main){
      if(budget.mountDone) status.push(budget.main+' mount acquired');
      else if(budget.mountCost===0) status.push(['Paladin','Warlock'].includes(budget.main)?'Free class mount at 40':'No mount gold reserved');
      else if(budget.mountShortfall>0)status.push(goldLabel(budget.mountShortfall)+' short of your mount');
      else status.push(goldLabel(budget.mountCost)+' mount reserve');
    }
    summary.append(node('b','','Gold and mount budget'),node('span','budget-summary',status.join(' · ')));
    box.append(summary);
    const inputs=node('div','budget-fields');
    const funds=amountInput(view,'gold','Available gold',budget.gold,
      value=>M.setBudgetValue(plan,'gold',value),redraw);
    funds.placeholder='Enter amount';
    const goldField=node('label','budget-field','Available gold (g)');
    goldField.append(funds);
    const altField=node('label','budget-field','Optional alt start');
    const alt=node('select','pselect');
    alt.id=view+'-alt-level';
    for(const level of [30,35]){
      const option=node('option','','Main at level '+level);
      option.value=String(level);
      alt.append(option);
    }
    alt.value=String(budget.altLevel);
    alt.onchange=()=>{
      if(M.setBudgetValue(plan,'altLevel',Number(alt.value)))redraw(true,alt.id);
    };
    altField.append(alt);
    inputs.append(goldField,altField);
    if(budget.main){
      const cost=amountInput(view,'mount-cost','Level 40 mount reserve',budget.mountCost,
        value=>M.setBudgetValue(plan,'mountCost',value),redraw);
      const costField=node('label','budget-field','Level 40 mount reserve (g)');
      costField.append(cost);
      const mount=node('input');
      mount.type='checkbox';
      mount.id=view+'-mount-earned';
      mount.checked=budget.mountDone;
      mount.onchange=()=>{
        if(M.setBudgetValue(plan,'mountDone',mount.checked))redraw(true,mount.id);
      };
      const mountField=node('label','budget-mount');
      mountField.append(mount,node('span','',budget.main+' has a mount'));
      inputs.append(costField,mountField);
    }
    box.append(inputs);
    const detail=node('p','plan-note budget-copy');
    if(budget.gold!==null && budget.main){
      detail.append(document.createTextNode(goldLabel(budget.spendable)+' available for crafting '+(budget.mountDone?'with your mount sorted.':'after protecting the mount reserve.')+' '));
    }
    detail.append(document.createTextNode('Enter your current gold after essentials such as training. Planned spending is an estimate. Update the balance after you earn or spend gold.'));
    box.append(detail);
    const mountNote=node('p','plan-note budget-copy','Budget 100g for level-40 riding or 90g with the Honored discount. Warlocks and Paladins can use their class mount quest. ');
    const mountSource=node('a','','Forever riding costs');
    mountSource.href='https://www.wowhead.com/forever/news/skyborne-dont-have-reputation-discount-for-mounts-in-wow-forever-383873';
    mountSource.target='_blank';
    mountSource.rel='noopener';
    mountNote.append(mountSource);
    box.append(mountNote);
    const estimates=node('details','budget-estimates');
    estimates.open=costsOpen[view];
    estimates.ontoggle=()=>{if(estimates.isConnected)costsOpen[view]=estimates.open;};
    const costSummary=budget.starterCount
      ? budget.starterCount+' remaining to 150 · '+goldLabel(budget.starterCost)+' estimated'
      : 'Remaining crafting costs';
    const craftNote=node('p','plan-note budget-copy',
      'Allow 5g per craft through 150 and adjust for your banked materials. Use herbs for Alchemy, ore and stone for either Engineering or Blacksmithing, skins for Leatherworking, cloth for Tailoring and saved greens for Enchanting. ');
    const materialLists=node('a','','See profession material lists');
    materialLists.href='#professions';
    craftNote.append(materialLists);
    estimates.append(node('summary','',costSummary),craftNote,node('p','plan-note budget-copy',
      'For 225 and 300, enter the extra cost from the previous tier or leave the field blank until priced.'));
    const grid=tableFrame([['Craft'],...M.ranks.map(rank=>[String(rank)])]);
    grid.table.classList.add('budget-cost-table');
    for(const craft of M.crafts){
      const row=grid.body.insertRow();
      const name=node('th','',craft);
      name.scope='row';
      row.append(name);
      for(const rank of M.ranks){
        const input=amountInput(view,'cost-'+craft+'-'+rank,craft+' to '+rank+' cost in gold',M.craftCost(plan,craft,rank),
          value=>M.setBudgetValue(plan,'cost',value,craft,rank),redraw);
        input.placeholder='—';
        row.insertCell().append(input);
      }
    }
    estimates.append(grid.table);
    box.append(estimates);
    return box;
  }
  function priceNote(step) {
    if(step.funding==='unpriced') return 'Needs an estimate';
    if(step.funding==='prerequisite') return 'Earlier tier needs funding';
    if(step.cost>0) return goldLabel(step.cost)+(step.funding==='short'?' · awaiting gold':'');
    if(step.funding==='short') return 'Awaiting gold';
    return '';
  }
  function suggestedOrder(host,redraw) {
    const region=node('section','plan-box milestone-order');region.id='suggested-milestone-order';
    region.setAttribute('aria-labelledby','order-heading');
    const heading=node('h3','','Suggested Milestones Order');heading.id='order-heading';
    const head=node('div','order-heading');head.append(heading,priorityControl('setup',redraw));
    region.append(head);host.append(region);
    region.append(budgetPanel('setup',redraw));
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
    region.append(node('p','plan-note','Build gold on your main first, then fit affordable profession milestones around levelling. Tick completed steps on Milestones to keep the route current.'));
    const forecast=['Projected with the entered budget: '+route.fundedLP+' LP'];
    if(route.projectedLP>route.fundedLP) forecast.push(route.projectedLP+' LP once deferred steps are funded');
    if(route.spend>0) forecast.push(goldLabel(route.spend)+' in planned crafting');
    region.append(node('p','order-forecast',forecast.join(' · ')));
    if(route.target && !route.reachedGoal){
      const message=route.projectedLP<route.target
        ? 'Add classes, crafts or other Legacy challenges to reach '+route.target+' LP.'
        : 'Recheck your cash and material costs before planning the rest of the '+route.target+' LP target.';
      region.append(node('p','order-limit',message));
    }
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
        const estimate=priceNote(item);
        if(estimate)li.append(node('span','order-price',estimate));
        if(item.lp>0)li.append(rewardBadge('+'+item.lp+' LP'+(item.funding?' if funded':' · '+item.total+' total')));
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
    const id=key.startsWith('mount/')?'milestones-mount-earned':key;
    const c=document.getElementById(id),box=c?.closest('details');
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
    const next=M.suggestion(plan), budget=M.budget(plan);
    if(next){
      const callout=node('section','next-tip'),copy=node('div');
      copy.append(node('small','','Suggested next'),node('h3','',next.title),node('p','',next.why));
      const estimate=priceNote(next);
      if(estimate)copy.append(node('p','next-price',estimate+' estimated'));
      callout.append(copy,button('Show on board ↓','plan-alt',()=>showStep(next.key)));host.append(callout);
      if(next.alternative){
        const alt=next.alternative;
        const section=node('div','plan-alternative');
        section.append(node('b','','Also worth considering'),node('span','',alt.title+'. '+alt.why),
          button('Show alternative','plan-alt',()=>showStep(alt.key)));host.append(section);
      }
    }else if(M.milestoneOrder(plan).phases.length || (budget.main && !budget.mountDone)) {
      const callout=node('div','next-tip');
      const prompt=budget.main && !budget.mountDone && budget.mountCost>0
        ? 'Update your gold balance to check the mount budget.'
        : 'Price and fund your next craft, then update your budget.';
      callout.append(node('p','',prompt),
        button('Update budget','plan-alt',()=>showStep('milestones-gold')));
      host.append(callout);
    }else if(summary.max===summary.done)host.append(node('p','next-tip','All planned Legacy Points earned.'));
    host.append(budgetPanel('milestones',redraw));
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
    lv.append(levelTable.table,node('p','plan-note','5 · Rest in an inn. 10 / 20 / 35 · Profession training. 30 / 35 · Alt planning. 40 · Mount. 25 / 45 / 60 · +1 LP each.'));
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
    const sources=node('a','plan-note','Legacy challenge criteria ↗');sources.href='https://www.wowhead.com/forever/guide/legacy-system-overview-rewards';sources.target='_blank';sources.rel='noopener';dun.append(sources);
  }
  window.PlannerUI={draw,get plan(){return plan;},reload(){previousSetup=null;plan=M.load();},defaultTab(){return plan.started && M.available(plan)?'milestones':'setup';}};
})();
