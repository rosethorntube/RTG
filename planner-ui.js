(() => {
  'use strict';
  const M=window.RTGPlan;
  let plan=M.load(), editing=plan.order[0], dragged=null, otherOpen=false;
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
      if(save)M.save(plan);
      draw(host,view);
      if(focusId)document.getElementById(focusId)?.focus({preventScroll:true});
      window.scrollTo({top:y,behavior:'instant'});
    };
    if(view==='setup')setup(host,redraw);else milestones(host,redraw);
  }
  function setup(host,redraw) {
    const head=node('div','plan-head'),intro=node('div');
    intro.append(node('h2','title','What are you planning to level?'),node('p','plan-lead','Choose your classes in levelling order and tick two professions for each.'));
    const copy=button('Copy Rosethorn’s setup','plan-alt',()=>{M.copyPreset(plan);editing=plan.order[0];redraw();});
    copy.title='Select all nine classes with Rosethorn’s profession pairs';
    head.append(intro,copy);host.append(head);
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
    const incomplete=plan.order.filter(c=>M.assigned(plan,c).length<2);
    sidebar.append(node('p','plan-note',incomplete.length?'Still to assign: '+incomplete.join(', ')+'.':'Your choices and ticks are saved in this browser.'));
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
    const box=node('section','account-lp');box.setAttribute('aria-label','Legacy Points earned on this account');
    const main=node('div','account-lp-main'),num=node('strong','earned-number',String(summary.earned));
    const caption=node('div','earned-caption');
    caption.append(node('b','','LP earned'),node('small','','Recorded in this browser'));
    main.append(num,caption);
    const target=plan.goal, goal=node('div','lp-goal');
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
      host.append(node('p','plan-lead',plan.order.length?'Finish choosing two professions per class to open your board.':'Choose the classes you want to level to build your milestone board.'),button('Set up my roster','cta',()=>go('setup')));return;
    }
    const next=M.suggestion(plan);
    if(next){
      const callout=node('section','next-tip'),copy=node('div');
      copy.append(node('small','','Suggested next'),node('h3','',next.title),node('p','',next.why));callout.append(copy,button('Show on board ↓','plan-alt',()=>{
        const c=document.getElementById(next.key);const box=c?.closest('details');if(box)box.open=true;c?.focus({preventScroll:true});c?.scrollIntoView({block:'center',behavior:'smooth'});
      }));host.append(callout);
      if(next.alternative){
        const alt=next.alternative;
        const section=node('div','plan-alternative');
        section.append(node('b','','Also worth considering'),node('span','',alt.title+'. '+alt.why),
          button('Show alternative','plan-alt',()=>showStep(alt.key)));host.append(section);
      }
    }else if(summary.max===summary.done)host.append(node('p','next-tip','All planned Legacy Points earned.'));
    const grid=node('div','board-grid'), lv=node('section','plan-box'),pro=node('section','plan-box'),dun=node('section','plan-box');
    host.append(grid);grid.append(lv,pro,dun);lv.append(node('h3','','Character levels'));
    const levelTable=tableFrame([['Class'],...M.levels.map(n=>[String(n),M.descriptions[n]])]);
    for(const c of plan.order) {
      const row=levelTable.body.insertRow(),name=node('th');name.scope='row';name.append(art(c),document.createTextNode(c));row.append(name);
      for(const n of M.levels){
        const cell=row.insertCell(), label=c+' · Level '+n+' · '+M.descriptions[n];
        cell.title=label;rewardCell(cell,M.levelKey(c,n),label,redraw);
      }
    }
    lv.append(levelTable.table,node('p','plan-note','5 · Park in an inn. 10 / 20 / 35 · Journeyman, Expert and Artisan training. 25 / 45 / 60 · +1 LP each.'));
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
    pro.append(skillTable.table,node('p','plan-note','Each crafting tier earns 1 LP once per account. Gathering ticks track skill only.'));
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
  window.PlannerUI={draw,get plan(){return plan;},reload(){plan=M.load();},defaultTab(){return plan.started && M.available(plan)?'milestones':'setup';}};
})();
