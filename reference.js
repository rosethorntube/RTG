(() => {
  'use strict';
  const s = (value) => value == null ? '' : String(value);
  const norm = (value) => s(value).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const node = (tag, className, text) => {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  };
  const table = (section) => section?.blocks.find(b => b.type === 'table');
  const entries = (t) => (t?.rows || []).slice(1).map((cells, i) => ({cells, i:i+1}));
  const section = (guide, id) => guide.sections.find(item => item.id === id);
  const state = { dungeonTab:'levels', dungeonRange:'0', query:'', profession:null, vendor:'all', fish:{}, read:'intro' };
  const validClass = name => ['Priest','Warrior','Druid','Hunter','Mage','Shaman','Warlock','Paladin','Rogue'].find(c=>norm(c)===norm(name)) || '';
  const classAlias = {warr:'Warrior',pala:'Paladin',lock:'Warlock',sham:'Shaman',bsmith:'Blacksmithing'};
  const classLabel = value => classAlias[norm(value)] || value;
  function addText(dest, raw, links, highlights) {
    const text = s(raw);
    const ranges = [];
    const endLinks = [];
    let cursor = 0;
    for (const link of (links || [])) {
      if (!link.text || !/^https?:\/\//i.test(link.url || '')) continue;
      const idx = text.indexOf(link.text, cursor);
      if (idx < 0) {endLinks.push(link);continue;}
      ranges.push({idx, end:idx+link.text.length, url:link.url});
      cursor = idx + link.text.length;
    }
    for (const part of (highlights || [])) {
      if (!part) continue;
      const idx = text.indexOf(part);
      if(idx >= 0) ranges.push({idx,end:idx+part.length});
    }
    ranges.sort((a,b)=>a.idx-b.idx || b.end-a.end);
    cursor = 0;
    for(const range of ranges) {
      if(range.idx < cursor) continue;
      dest.append(document.createTextNode(text.slice(cursor,range.idx)));
      const span = node(range.url ? 'a' : 'strong', range.url ? '' : 'ref-legacy', text.slice(range.idx,range.end));
      if(range.url) {span.href=range.url; span.target='_blank'; span.rel='noopener noreferrer';}
      dest.append(span);
      cursor = range.end;
    }
    dest.append(document.createTextNode(text.slice(cursor)));
    for(const link of endLinks) dest.append(' ',external(link.text,link.url));
    return dest;
  }
  function txtCell(block, r, c, dest) {
    const key = r+','+c;
    return addText(dest,block.rows[r]?.[c],block.cellLinks?.[key],block.legacy?.[key]);
  }
  function makeTable(block) {
    const wrap = node('div','ref-table-scroll');
    const t = node('table','ref-table');
    const head = t.createTHead(), body=t.createTBody();
    block.rows.forEach((cells, r) => {
      const row = (r ? body : head).insertRow();
      cells.forEach((_,c) => {
        const td = node(r ? 'td':'th');
        if(!r) td.scope='col';
        txtCell(block,r,c,td);
        row.append(td);
      });
    });
    wrap.tabIndex = 0;
    wrap.setAttribute('role','region');
    wrap.setAttribute('aria-label','Scrollable table: '+block.rows[0].filter(Boolean).join(', '));
    wrap.append(t);
    return wrap;
  }
  function blocks(parent, list) {
    for (const b of (list || [])) {
      if(b.type === 'table') {parent.append(makeTable(b)); continue;}
      if(b.type === 'list') {
        const ul=node('ul','ref-list');
        for(const it of b.items || []) {
          const li=node('li');
          addText(li, typeof it==='string' ? it : it.text, it.links);
          ul.append(li);
        }
        parent.append(ul);
      } else if(b.text) {
        const p=node(b.type==='heading'?'h3':'p',b.type==='heading'?'ref-subhead':'ref-copy');
        parent.append(addText(p,b.text,b.links));
      }
    }
  }
  function field(label, options, value, action) {
    const tag = node('label','ref-field');
    tag.append(node('span','ref-field-label',label));
    const select = node('select','ref-select');
    for (const [val,name] of options) {
      const opt = node('option','',name);
      opt.value=val;
      select.append(opt);
    }
    select.value=value;
    select.addEventListener('change',()=>action(select.value));
    tag.append(select);
    return tag;
  }
  function disclosure(title, meta, fill, open=false) {
    const d = node('details','ref-disclosure');
    d.open=open;
    const summary = node('summary','ref-summary');
    summary.append(node('span','ref-summary-title',title));
    if(meta) summary.append(node('span','ref-meta',meta));
    summary.append(node('span','ref-chevron'));
    const content=node('div','ref-detail');
    fill(content);
    d.append(summary,content);
    return d;
  }
  function title(host, name) {host.append(node('h2','ref-title',name));}
  function empty(host, text) {host.append(node('p','ref-empty',text));}
  function getChecks(character) {
    try {
      const found = JSON.parse(localStorage.getItem('rosethorn.prequests.v1.'+character) || '[]');
      return new Set(Array.isArray(found)?found:[]);
    } catch {return new Set();}
  }
  function questCheck(character,id) {
    const label=node('label','ref-tick');
    const check=node('input'); check.type='checkbox'; 
    check.checked=getChecks(character).has(id);
    check.addEventListener('change',()=>{
      const checked=getChecks(character);
      if(check.checked) checked.add(id); else checked.delete(id);
      try {localStorage.setItem('rosethorn.prequests.v1.'+character,JSON.stringify([...checked]));} catch {}
    });
    label.append(check,node('span','','Mark complete'+(character?' for '+character:'')));
    return label;
  }
  const aliases = [
    ['Ragefire','RFC'],['Ruins','Ruins'],['Wailing','WC'],['Blackfathom','BFD'],
    ['Excavation','Excavation'],['Library','SM Library|SM'],['Scarlet Monastery','SM'],
    ['Gnomeregan','Gnomeregan'],['Razorfen Kraul','RFK'],['Razorfen Downs','RFD'],
    ['City of Dalaran','Dalaran'],['Drowned City','Drowned City'],['Krol','Krol dok'],
    ['Uldaman','Uldaman'],['Zul','ZF'],['Maraudon','Maraudon'],['Sunken Temple','ST|Sunken Temple'],
    ['Blackmaw','Blackmaw'],['Alcaz','Alcaz'],['Blackrock Depths','BRD'],['Scholomance','Scholomance'],
    ['Lower Blackrock','LBRS'],['Upper Blackrock','UBRS'],['Dire Maul (DM) — East','Dire Maul East'],['Stratholme','Stratholme']
  ];
  function associated(dungeon, target) {
    const match=aliases.find(([name])=>norm(dungeon).includes(norm(name)));
    if(!match) return false;
    const scope=' '+norm(s(target).split(':')[0])+' ';
    return match[1].split('|').some(key=>scope.includes(' '+norm(key)+' ')) ||
      (norm(dungeon).includes('krol') && scope.includes('krol'));
  }
  function questRow(block, i, character, grouped=false) {
    const row = block.rows[i];
    const name = s(row[2]).split(/\s[—–]\s/)[0];
    return disclosure(name,grouped ? 'Level '+row[1] : 'Start '+row[0], content=>{
      const p=node('p','ref-copy');
      txtCell(block,i,2,p);
      content.append(p);
      if(!grouped) {
        const sub=node('p','ref-copy');
        txtCell(block,i,3,sub);
        content.append(sub,node('div','ref-min','Minimum quest level '+row[1]));
      } else content.append(node('div','ref-min',classLabel(row[0])));
      content.append(questCheck(character,norm(row[2])));
    });
  }
  const recommended = s => {
    const vals=String(s).match(/\d+/g) || [];
    return vals.length ? [Number(vals[0]),Number(vals[1]||vals[0])] : [];
  };
  function matchesRange(level) {
    if(state.dungeonRange === '0') return true;
    const a = Number(state.dungeonRange), [low,high]=recommended(level);
    return low<=a+9 && high>=a;
  }
  function dungeons(host, guide, character) {
    title(host,'Dungeon guide');
    const levelBlock=table(section(guide,'dungeons'));
    const pre=section(guide,'prequests')?.blocks.filter(b=>b.type==='table') || [];
    const toolbar=node('div','ref-tools'), content=node('div','ref-results');
    const filters=[['levels','Dungeon runs'],['prequests','Quest chains'],['class','Class & profession quests']];
    const focus=field('Show',filters,state.dungeonTab,val=>{state.dungeonTab=val; refresh();});
    const levels=field('Character levels',[['0','All levels'],['10','10–19'],['20','20–29'],['30','30–39'],['40','40–49'],['50','50–59'],['60','60']],state.dungeonRange,val=>{state.dungeonRange=val;refresh();});
    const label=node('label','ref-field ref-wide'); label.append(node('span','ref-field-label','Search'));
    const input=node('input','ref-search'); input.type='search'; input.value=state.query; 
    input.placeholder='Dungeon, quest or pickup'; input.addEventListener('input',()=>{state.query=input.value;refresh();});
    label.append(input); toolbar.append(focus,levels,label); host.append(toolbar,content);
    const matches=(cells)=>norm(cells.join(' ')).includes(norm(state.query));
    function refresh() {
      content.replaceChildren(); let count=0;
      if(state.dungeonTab==='levels') {
        content.append(node('p','ref-context','Levels are the guide’s recommendations for a run. Quest chains can start earlier.'));
        for(const {cells,i} of entries(levelBlock)) {
          if(!matchesRange(cells[1])) continue;
          const qs=entries(pre[0]).filter(p=>associated(cells[0],p.cells[3]));
          if(!matches([...cells,...qs.flatMap(q=>q.cells)])) continue;
          const notes=cells[2]?.trim();
          if(!notes && !qs.length) {
            const row=node('div','ref-static');
            row.append(node('span','ref-summary-title',cells[0]), node('span','ref-meta','Level '+cells[1]));
            content.append(row);
          } else {
            content.append(disclosure(cells[0],'Level '+cells[1],body=>{
              if(notes) {const p=node('p','ref-copy');body.append(txtCell(levelBlock,i,2,p));}
              for(const q of qs) body.append(questRow(pre[0],q.i,character));
            }));
          }
          count++;
        }
      } else if(state.dungeonTab==='prequests' && pre[0]) {
        content.append(node('p','ref-context','Start is the recommended level to begin the chain. Expand a quest for its minimum pickup level and next steps.'));
        for(const {cells,i} of entries(pre[0])) {
          if(matchesRange(cells[0]) && matches(cells)) {content.append(questRow(pre[0],i,character));count++;}
        }
      } else if(state.dungeonTab==='class'){
        for(const [groupIndex,b] of pre.slice(1).entries()) {
          let heading=false;
          for(const {cells,i} of entries(b)){
            if(!matchesRange(cells[1])||!matches([...cells,classLabel(cells[0])])) continue;
            if(character && classLabel(cells[0])!==character && !(norm(cells[0])==='bsmith' && window.RTGPlan.assigned(window.PlannerUI.plan,character).includes('Blacksmithing'))) continue;
            if(!heading) {content.append(node('h3','ref-subhead',groupIndex===0?'Dungeon chains':'Level 50 class quests'));heading=true;}
            content.append(questRow(b,i,character,true)); count++;
          }
        }
      }
      if(!count) empty(content,'No matches for these filters. Choose another level range or clear the search.');
    }
    refresh();
  }
  const profNames = {'profession-ranks':'Training ranks','blacksmithing':'Blacksmithing','engineering':'Engineering','leatherworking':'Leatherworking','tailoring':'Tailoring','enchanting':'Enchanting','alchemy':'Alchemy','first-aid':'First Aid','vendors':'Vendor shopping list'};
  function professions(host,guide,character) {
    title(host,'Professions');
    const tabs=Object.entries(profNames).filter(([id])=>section(guide,id));
    const defaultProf=(window.RTGPlan.assigned(window.PlannerUI.plan,character).map(s=>s.toLowerCase()).find(s=>tabs.some(([id])=>id===s))) || 'profession-ranks';
    const id=state.profession?.character===character?state.profession.id:defaultProf;
    let active=tabs.some(t=>t[0]===id)?id:tabs[0]?.[0];
    if(!active) {empty(host,'No profession entries available.');return;}
    const toolbar=node('div','ref-tools'), area=node('div','ref-content');
    toolbar.append(field('Profession or reference',tabs,active,val=>{active=val;state.profession={id:val,character};refresh();}));
    host.append(toolbar,area);
    function refresh() {
      const sec=section(guide,active); area.replaceChildren();
      if(active==='vendors') {
        const block=table(sec), rows=entries(block);
        const options=[['all','All locations'],...rows.map(r=>[String(r.i),r.cells[0]])];
        const out=node('div','ref-results'); const select=field('Location',options,state.vendor,val=>{state.vendor=val;show();});
        const inner=node('div','ref-tools'); inner.append(select);area.append(inner,out);
        function show() {
          out.replaceChildren();
          for(const r of rows) {
            if(state.vendor!=='all' && state.vendor!==String(r.i)) continue;
            out.append(disclosure(r.cells[0],'',body=>{body.append(txtCell(block,r.i,1,node('p','ref-copy')));},state.vendor!=='all'));
          }
          blocks(out,sec.blocks.filter(b=>b!==block));
        }
        show(); return;
      }
      if(['profession-ranks','first-aid'].includes(active)) {blocks(area,sec.blocks);return;}
      for(const b of sec.blocks) {
        if(b.type!=='table') {blocks(area,[b]); continue;}
        for(const row of entries(b)) {
          area.append(disclosure('Skill '+row.cells[0],'',body=>{
            body.append(node('h4','ref-label','Materials to gather'),txtCell(b,row.i,1,node('p','ref-copy')),node('h4','ref-label','Crafting order'));
            const ol=node('ol','ref-steps');
            for(const task of s(row.cells[2]).split(/\s*→\s*/)) if(task.trim()) ol.append(node('li','',task.trim()));
            body.append(ol);
          },row.i===1));
        }
      }
    }
    refresh();
  }
  const catchNames={
    'Brilliant Smallfish':[55,'Brilliant Smallfish'],
    'Slitherskin Mackerel':[55,'Slitherskin Mackerel'],
    'Rainbow Fin Albacore':[30,'Rainbow Fin Albacore'],
    'Longjaw Mud Snapper':['55–60','Longjaw Mud Snapper'],
    'Sagefish +':[50,'Smoked Sagefish'],
    'Bristle Whisker Catfish':['120–140','Bristle Whisker Catfish'],
    'Mithril Head Trout':['55–60','Mithril Head Trout'],
    'Greater Sagefish':[55,'Sagefish Delight'],
    'Spotted Yellowtail':[25,'Spotted Yellowtail'],
    'Glossy Mightfish':['120–140','Cooked Glossy Mightfish'],
    'Nightfin Snapper':['55–60','Nightfin Soup']
  };
  const casterFish=['Slitherskin Mackerel','Rainbow Fin Albacore','Sagefish +','Bristle Whisker Catfish','Greater Sagefish','Spotted Yellowtail','Nightfin Snapper'];
  const attackFish=['Brilliant Smallfish','Longjaw Mud Snapper','Bristle Whisker Catfish','Mithril Head Trout','Glossy Mightfish'];
  const sellers = {
    kelsey: ['Kelsey Yance', 'Booty Bay, Stranglethorn Vale (28.2, 74.3). From the Ratchet boat, follow the dock towards shore. Enter the first large building, the Old Port Authority, on the bottom deck and turn left.', 'https://www.wow-professions.com/forever/npc/kelsey-yance'],
    harn: ['Harn Longcast', 'Bloodhoof Village, Mulgore (46.7, 59.2). Find the fishing supplier beside Stonebull Lake.', 'https://foreverchanges.pro/item/6325/recipe-brilliant-smallfish'],
    zansoa: ['Zansoa', 'Sen’jin Village, Durotar (56.1, 73.4). Look for the fishing supplier on the coast.', 'https://www.warcraftforever.wiki/wiki/Zansoa'],
    kilxx: ['Kilxx', 'Ratchet, the Barrens (62.8, 38.2). Look for the fishing supplier at the waterfront.', 'https://azeroth.wiki/forever/map/the-barrens/kilxx'],
    gikkix: ['Gikkix', 'Steamwheedle Port, Tanaris (66.6, 22.1). Visit the coastal village east of Gadgetzan.', 'https://bindonforever.com/npc/8137'],
    sheendra: ['Sheendra Tallgrass', 'Camp Mojache, Feralas (74.5, 42.7). Look for the trade supplies vendor inside the Horde camp.', 'https://bindonforever.com/npc/8145']
  };
  const catches = [
    {fish:'Raw Rockscale Cod',meal:'Rockscale Cod',levels:[175,190,210,230],seller:'kelsey',price:'22s',buff:'+12 Fishing for 15 minutes',source:'https://www.foreverdb.app/en/forever/items/4594/rockscale-cod'},
    {fish:'Raw Brilliant Smallfish',meal:'Brilliant Smallfish',levels:[1,45,65,85],seller:'harn',price:'40c',buff:'+2 attack power'},
    {fish:'Raw Slitherskin Mackerel',meal:'Slitherskin Mackerel',levels:[1,45,65,85],seller:'zansoa',price:'40c',buff:'+6 attack power'},
    {fish:'Raw Longjaw Mud Snapper',meal:'Longjaw Mud Snapper',levels:[50,90,110,130],seller:'harn',price:'4s',buff:'+10 attack power'},
    {fish:'Raw Rainbow Fin Albacore',meal:'Rainbow Fin Albacore',levels:[50,90,110,130],seller:'zansoa',price:'4s',buff:'+1 spell damage'},
    {fish:'Raw Sagefish',meal:'Smoked Sagefish',levels:[80,120,140,160],seller:'kelsey',price:'5s',extra:'Mild Spices',buff:'+4 spell damage'},
    {fish:'Raw Bristle Whisker Catfish',meal:'Bristle Whisker Catfish',levels:[100,140,160,180],seller:'kilxx',price:'12s',buff:'+8 Fishing'},
    {fish:'Raw Mithril Head Trout',meal:'Mithril Head Trout',levels:[175,215,235,255],seller:'kelsey',price:'22s',buff:'+20 attack power'},
    {fish:'Raw Greater Sagefish',meal:'Sagefish Delight',levels:[175,215,235,255],seller:'kelsey',price:'50s',extra:'Hot Spices',buff:'+7 spell damage'},
    {fish:'Raw Spotted Yellowtail',meal:'Spotted Yellowtail',levels:[225,265,285,305],seller:'gikkix',price:'1g 60s',buff:'+22 spell damage'},
    {fish:'Raw Glossy Mightfish',meal:'Cooked Glossy Mightfish',levels:[225,265,285,305],seller:'kelsey',price:'1g 60s',extra:'Soothing Spices',buff:'+30 attack power'},
    {fish:'Raw Nightfin Snapper',meal:'Nightfin Soup',levels:[250,290,310,330],seller:'gikkix',price:'2g',extra:'Refreshing Spring Water',buff:'+22 spell damage'},
    {fish:'Raw Redgill',meal:'Filet of Redgill',levels:[225,265,285,305],seller:'kelsey',price:'1g 60s',buff:'+18 Fishing'},
    {fish:'Raw Sunscale Salmon',meal:'Poached Sunscale Salmon',levels:[250,290,310,330],seller:'gikkix',price:'2g',buff:'+40 attack power',station:'an Iron Oven',source:'https://www.wowhead.com/forever/spell=18244/poached-sunscale-salmon'},
    {fish:'Raw Whitescale Salmon',meal:'Baked Salmon',levels:[275,315,335,355],seller:'sheendra',price:'2g',extra:'Soothing Spices',buff:'+28 spell damage',station:'an Iron Oven',source:'https://www.wowhead.com/forever/spell=18247/baked-salmon'},
    {fish:'Large Raw Mightfish',meal:'Mightfish Steak',levels:[275,315,335,355],seller:'sheendra',price:'2g',extra:'Hot Spices + 1 Soothing Spices',buff:'+40 attack power',station:'an Iron Oven',source:'https://www.wowhead.com/forever/spell=18246/mightfish-steak'},
    {fish:'Oily Blackmouth',meal:'Blackmouth Oil',alchemy:'2 Oily Blackmouth + 1 Empty Vial make 1 Blackmouth Oil.'},
    {fish:'Firefin Snapper',meal:'Fire Oil',alchemy:'2 Firefin Snapper + 1 Empty Vial make 2 Fire Oil.'}
  ];
  const lookup = { fish:'Raw Rockscale Cod', skill:'180', search:'' };
  const bayCatch = new Set(['Raw Rockscale Cod','Raw Spotted Yellowtail','Firefin Snapper','Oily Blackmouth']);
  function external(text, url) {
    const link=node('a','',text);
    link.href=url; link.target='_blank'; link.rel='noopener noreferrer';
    return link;
  }
  function fishLookup(area) {
    const card=node('div','ref-lookup'), tools=node('div','ref-tools');
    const searchField=node('label','ref-field'), search=node('input','ref-search');
    search.type='search'; search.value=lookup.search; search.placeholder='Fish, food, vendor or town';
    searchField.append(node('span','ref-field-label','Search'),search);
    const fishField=node('label','ref-field'), select=node('select','ref-select');
    fishField.append(node('span','ref-field-label','Fish'),select);
    const skillField=node('label','ref-field ref-skill-field'), skill=node('input','ref-search');
    skill.type='number'; skill.min='1'; skill.max='300'; skill.step='1'; skill.value=lookup.skill;
    skillField.append(node('span','ref-field-label','Your Cooking'),skill);
    const result=node('div','ref-lookup-result'); result.setAttribute('aria-live','polite');
    tools.append(searchField,fishField,skillField);
    card.append(node('p','ref-context','Choose a fish from your bags and enter your current Cooking skill.'),tools,result);area.append(card);
    area.append(disclosure('Fish caught in Booty Bay','',body=>{
      body.append(node('p','ref-copy','These four fish were recorded in open water at 27.6, 76.8 in Stranglethorn Vale. Select a catch to look it up.'));
      const links=node('div','ref-fish-links');
      for(const name of bayCatch){
        const button=node('button','ref-fish-link',name);button.type='button';
        button.addEventListener('click',()=>{
          lookup.search='';search.value='';lookup.fish=name;filter();select.focus();
        });
        links.append(button);
      }
      body.append(links,external('Booty Bay fishing log','https://foreverdroprate.com/fishing/234'));
    }));
    select.addEventListener('change',()=>{lookup.fish=select.value;show();});
    skill.addEventListener('input',()=>{lookup.skill=skill.value;show();});
    search.addEventListener('input',()=>{lookup.search=search.value;filter();});
    function filter() {
      select.replaceChildren();
      const words=norm(lookup.search).split(' ').filter(Boolean);
      const results=catches.filter(rec=>{
        const wordsToMatch=norm([rec.fish,rec.meal,...(sellers[rec.seller] || []).slice(0,2),rec.alchemy?'Alchemy':'',bayCatch.has(rec.fish)?'Booty Bay':''].join(' '));
        return words.every(word=>wordsToMatch.includes(word));
      });
      for(const rec of results) {
        const opt=node('option','',rec.fish);opt.value=rec.fish;select.append(opt);
      }
      select.disabled=!results.length;
      if(results.length) select.value=results.some(r=>r.fish===lookup.fish)?lookup.fish:results[0].fish;
      show();
    }
    function show() {
      result.replaceChildren();
      const rec=catches.find(r=>r.fish===select.value);
      if(!rec){empty(result,'No matching fish in this guide. Try a shorter name or a nearby town.');return;}
      result.append(node('h3','',rec.meal));
      const details=node('dl');
      function line(label,value) {
        const dd=node('dd');
        dd.append(value);details.append(node('dt','',label),dd);
      }
      if(rec.alchemy){
        line('Cooking','No Cooking skill-up. Bank these fish for your Alchemist.');
        line('Alchemy',rec.alchemy+' Learn the recipe from an Alchemy trainer.');
        line('Source',external('Alchemy oils','https://urgametips.com/wow-forever/professions/alchemy/oils/'));
        result.append(details);return;
      }
      const value=Number(skill.value), [min,yellow,green,grey]=rec.levels;
      const status=node('span','ref-status');
      if(!skill.value || !Number.isInteger(value) || value<1 || value>300) {
        status.textContent='Enter a Cooking skill between 1 and 300.';
      } else if(value<min) {
        status.textContent='Requires Cooking '+min+' ('+(min-value)+' more skill points).';
      } else if(value===300 || value>=grey) {
        status.dataset.colour='grey';status.textContent=value===300?'Maximum Cooking skill.':'Grey at '+value+' · no skill-ups.';
      } else {
        const colour=value<yellow?'orange':value<green?'yellow':'green';
        status.dataset.colour=colour;
        status.textContent=colour[0].toUpperCase()+colour.slice(1)+' at '+value+' · '+({orange:'guaranteed skill-up',yellow:'likely skill-up',green:'occasional skill-up'})[colour]+' below your trained cap.';
      }
      line('Skill-up',status);
      line('Cook','1 '+rec.fish+(rec.extra?' + 1 '+rec.extra:'')+' at '+(rec.station || 'a cooking fire')+'.');
      const [vendor,where,vendorSource]=sellers[rec.seller];
      const sellerInfo=node('span');sellerInfo.append(node('strong','',vendor),' · '+rec.price+' base price. '+where);
      line('Buy recipe',sellerInfo);
      if(rec.buff)line('Food effect',rec.buff);
      line('Skill thresholds','Orange '+min+' · Yellow '+yellow+' · Green '+green+' · Grey '+grey);
      const links=node('span');
      links.append(external('Cooking recipes','https://wow-forever.gg/professions/cooking/'));
      if(rec.source)links.append(' · ',external('Food details',rec.source));
      if(vendorSource)links.append(' · ',external('Vendor directions',vendorSource));
      line('Sources',links);
      result.append(details);
    }
    filter();
  }
  function fishing(host,guide,character) {
    title(host,'Fishing & Cooking');
    const view=state.fish[character] || 'lookup';
    const toolbar=node('div','ref-tools'),area=node('div','ref-content');
    toolbar.append(field('View',[['lookup','Fish lookup'],['attack','Attack food route'],['caster','Caster food route'],['spots','Fishing spots by level']],view,v=>{state.fish[character]=v;refresh(v);}));
    host.append(toolbar,area);
    function refresh(value) {
      area.replaceChildren();
      if(value==='lookup') {fishLookup(area);return;}
      if(value==='spots') {
        const loc=section(guide,'fishing');
        if(loc) blocks(area,loc.blocks);
        return;
      }
      const comp=section(guide,'cooking'); const b=table(comp);
      if(!b) return;
      area.append(node('p','ref-context','Fish counts are estimates per cook. Budget one listed spice or water per fish. Both routes reach 300 on an ordinary cooking fire.'));
      const route=value==='caster'?casterFish:attackFish;
      const list=node('ol','ref-routes');
      for(const key of route) {
        const rec=entries(b).find(r=>s(r.cells[1]).startsWith(key));
        if(!rec) continue;
        const cat=key==='Bristle Whisker Catfish' && value==='caster';
        const qty=cat?'95–115':catchNames[key][0];
        const li=node('li','ref-route');
        const rng=node('div','ref-skill',(cat?'125–175':rec.cells[0]).replace(/-/g,'–'));
        const body=node('div','ref-route-body'); body.append(node('h3','',catchNames[key][1]));
        const ing=rec.cells[1].replace('Refr. Spring. Water','Refreshing Spring Water').replace('Grtr','Greater');
        body.append(node('p','',qty+' × '+ing),node('p','ref-place',s(rec.cells[2]).replace('Grtr','Greater')));
        const buff=s(rec.cells[3]).replace(/\bAP\b/,'attack power').replace(/\bSpell\b/,'spell damage');
        li.append(rng,body,node('span','ref-buff',buff));list.append(li);
      }
      area.append(list);
      area.append(disclosure('Recipe vendors and training','',body=>blocks(body,comp.blocks.filter(q=>q!==b))));
      const fish=section(guide,'fishing');
      if(fish) area.append(disclosure('Fishing spots by level','',body=>blocks(body,fish.blocks)));
    }
    refresh(view);
  }
  function library(host,guide) {
    title(host,'Guide library');
    const all=guide.sections.filter(sec=>sec.blocks.length);
    if(!all.length)return;
    const active=all.some(sec=>sec.id===state.read)?state.read:all[0].id;
    const toolbar=node('div','ref-tools'),area=node('div','ref-content');
    toolbar.append(field('Chapter',all.map(sec=>[sec.id,sec.title]),active,v=>{state.read=v;show(v);}));
    host.append(toolbar,area);
    function show(id){area.replaceChildren();blocks(area,section(guide,id).blocks);}
    show(active);
  }
  window.FieldReference = {
    render(panel, tab, guide, className) {
      const views={dungeons,professions,fishing,guide:library};
      if(!views[tab])return;
      panel.replaceChildren(); const inner=node('section','field-reference');
      panel.append(inner);
      views[tab](inner,guide,validClass(className));
    }
  };
})();

