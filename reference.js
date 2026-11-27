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
  const state = { profession:null, vendor:'all', read:'intro' };
  window.addEventListener('guidefactionchange',()=>{
    state.vendor='all';state.profession=null;state.read='intro';
  });
  const validClass = name => ['Priest','Warrior','Druid','Hunter','Mage','Shaman','Warlock','Paladin','Rogue'].find(c=>norm(c)===norm(name)) || '';
  function addText(dest, raw, highlights) {
    const text = s(raw);
    const ranges = [];
    let cursor = 0;
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
      dest.append(node('strong','ref-legacy',text.slice(range.idx,range.end)));
      cursor = range.end;
    }
    dest.append(document.createTextNode(text.slice(cursor)));
    return dest;
  }
  function txtCell(block, r, c, dest) {
    const key = r+','+c;
    return addText(dest,block.rows[r]?.[c],block.legacy?.[key]);
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
          addText(li, typeof it==='string' ? it : it.text);
          ul.append(li);
        }
        parent.append(ul);
      } else if(b.text) {
        const p=node(b.type==='heading'?'h3':'p',b.type==='heading'?'ref-subhead':'ref-copy');
        parent.append(addText(p,b.text));
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
  function vendorDetour() {
    return disclosure('Is the vendor trip worth it?', '', body=>{
      body.append(node('p','ref-context','Use the actual price you would pay for one book or recipe. Compare only the extra travel time this purchase adds.'));
      const fields=node('div','ref-tools'), result=node('p','ref-copy');
      result.setAttribute('role','status');
      function amount(label,placeholder) {
        const wrapper=node('label','ref-field'), input=node('input','ref-search');
        input.type='number';input.min='0';input.step='any';input.placeholder=placeholder;
        input.addEventListener('input',update);
        wrapper.append(node('span','ref-field-label',label),input);fields.append(wrapper);
        return input;
      }
      const vendor=amount('Vendor (silver)','e.g. 100'), auction=amount('AH (silver)','e.g. 120'), rate=amount('Your gold per hour','e.g. 6');
      function update() {
        const values=[vendor,auction,rate].map(input=>input.value===''?NaN:Number(input.value));
        const [v,a,r]=values;
        if(!values.every(Number.isFinite)||v<0||a<0||r<=0)result.textContent='Enter both prices and a positive hourly rate.';
        else if(a<=v)result.textContent=a===v?'Same price. Buy wherever you already are.':'The AH is already cheaper by '+Number((v-a).toFixed(2))+'s.';
        else {
          const seconds=(a-v)*36/r;
          const limit=seconds<60?Math.max(1,Math.round(seconds))+' sec':Number((seconds/60).toFixed(1))+' min';
          result.textContent='The AH costs '+Number((a-v).toFixed(2))+'s extra. If the vendor detour takes longer than '+limit+', the AH is better value at your rate.';
        }
      }
      body.append(fields,result);update();
    });
  }
  const secondarySkills = ['Cooking','First Aid','Fishing'];
  const professionId = name => name.toLowerCase().replace(/ /g,'-');
  const recipeKey = name => norm(name).replace(/ /g,'');
  const componentUses = new Map();
  for(const [profession,data] of Object.entries(window.WYHProfessionRecipes || {})) {
    for(const [recipe,materials] of Object.values(data.recipes)) {
      for(const ingredient of materials.split(/,\s*/)) {
        const parts=ingredient.match(/^(\d+) (.+)$/);
        if(!parts)continue;
        const [,quantity,name]=parts;
        const key=recipeKey(name), uses=componentUses.get(key) || [];
        uses.push({profession,recipe,quantity});
        componentUses.set(key,uses);
      }
    }
  }

  function craftNote(label, text) {
    const note=node('p','ref-craft-use');
    note.append(node('strong','',label),document.createTextNode(' '+text));
    return note;
  }

  function trainingForBand(profession, rank, trainer) {
    const steps = {
      '1':['Learn Apprentice, then train Journeyman at skill 50 and level 10.',trainer],
      '150':['Train Expert from skill 125 and level 20.',trainer],
      '225':['Train Artisan from skill 200 and level 35.',trainer]
    };
    if(profession==='first-aid') {
      steps['150']=['Read Expert First Aid – Under Wraps at skill 125. Buy both later bandage manuals during this trip.',trainer];
      steps['225']=['Complete Triage at skill 225 and level 35. Return at 240, 260 and 290 for the next bandages.',trainer];
    }
    return steps[rank];
  }

  function routeSteps(raw, profession, data) {
    const ol=node('ol','ref-craft-steps');
    const alliance=window.GuideFaction.alliance;
    for(const segment of raw.split(/\s*→\s*/)) {
      const task=segment.trim();
      if(!task)continue;
      const item=node('li','ref-craft-step');
      const parts=task.match(/^(.+?)\s+(?:to\s+)?(\d+)\*?(?:\.\s*(.*))?$/);
      const recipe=parts && data?.recipes[recipeKey(parts[1])];
      if(!recipe) {
        item.append(node('strong','',task));
        ol.append(item);
        continue;
      }
      const [name,materials,source]=recipe;
      const titleRow=node('div','ref-craft-title');
      const target=profession==='leatherworking' && name==='Nightscape Headband' ? 210 : Number(parts[2]);
      titleRow.append(node('strong','',name),node('span','ref-craft-target','To '+target));
      item.append(titleRow);
      if(materials)item.append(node('p','ref-craft-materials','Per craft · '+materials));
      const where=alliance ? source.alliance || source.where : source.where;
      const acquisition={
        starter:['Starter recipe','Learned with the profession.'],
        ability:['Profession ability','Disenchant unwanted green items.'],
        trainer:['Trainer','Learn from a profession trainer.']
      };
      const [label,detail]=acquisition[source.kind] || [source.kind,where];
      const caption=node('p','ref-craft-source');
      caption.append(node('strong','',label+(source.skill ? ' · Skill '+source.skill : '')),document.createTextNode(detail ? ' · '+detail : ''));
      if(profession==='leatherworking' && name==='Nightscape Headband')caption.append(' Keep crafting this until Nightscape Pants unlocks at 210.');
      item.append(caption);
      const uses=componentUses.get(recipeKey(name));
      if(uses) {
        const recipes=uses.map(use=>{
          const other=use.profession===profession ? '' : ' in '+use.profession;
          return use.recipe+other+' ('+use.quantity+' per craft)';
        });
        item.append(craftNote('Keep','for '+recipes.join(', ')+'.'));
      }
      if(profession==='enchanting' && name==='Disenchant') {
        item.append(
          craftNote('Keep','Strange Dust and Lesser Magic Essence for early recipes, Lesser Astral Essence for Minor Agility, and Soul Dust for Lesser Stamina and Lesser Strength. Split one Greater Magic Essence into three Lesser as needed. Save one Greater Astral Essence for the Runed Golden Rod.'),
          craftNote('Sell','spare Glimmering or Glowing Shards once your other enchants are covered. Save Brilliant Shards for the Runed Arcanite Rod.')
        );
      }
      if(profession==='enchanting' && /^Runed .+ Rod$/.test(name))item.append(craftNote('Keep','this rod for enchanting.'));
      ol.append(item);
    }
    return ol;
  }

  function renderProfession(area,guide,active) {
    const gatheringName=Object.keys(window.WYHGathering).find(name=>professionId(name)===active);
    if(gatheringName) {
      const route=window.WYHGathering[gatheringName][window.GuideFaction.name];
      if(active==='skinning') area.append(node('p','ref-copy','Loot each beast before skinning. Below skill 100 you can skin beasts up to level 10 plus one per 10 skill. From 100, divide your effective skill by five and round down.'));
      area.append(makeTable({rows:[['Skill','What to gather','Where to go'],...route]}));
      return;
    }
    const sec=section(guide,active);
    if(!sec) return;
    if(active==='vendors') {
        const block=table(sec), rows=entries(block);
        const options=[['all','All locations'],...rows.map(r=>[String(r.i),r.cells[0]])];
        const out=node('div','ref-results'); const select=field('Location',options,state.vendor,val=>{state.vendor=val;show();});
        const inner=node('div','ref-tools'); inner.append(select);area.append(inner,vendorDetour(),out);
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
    if(['profession-ranks','fishing','cooking'].includes(active)) {
        blocks(area,sec.blocks);
        if(active==='cooking'||active==='fishing') {
          const link=node('a','ref-link','Open Fishing & Cooking');link.href='#fishing';area.append(link);
        }
        return;
    }
    const data=window.WYHProfessionRecipes?.[active];
    const trainers=data?.trainers[window.GuideFaction.name];
    const route=table(sec);
    for(const row of entries(route)) {
      const rank=s(row.cells[0]).match(/^\d+/)?.[0];
      const trainer=trainers?.[row.i-1];
      area.append(disclosure('Skill '+s(row.cells[0]).replace(/\s+LATER$/,''),
        row.i===3 && active==='blacksmithing'?'Plan purchases first':'',body=>{
        const training=trainer && trainingForBand(active,rank,trainer);
        if(training) {
          const stop=node('div','ref-craft-training');
          stop.append(node('h4','ref-label','Training stop'),node('p','ref-copy',training[0]),node('p','ref-craft-source',training[1]));
          body.append(stop);
        }
        if(row.i===3 && active==='blacksmithing') {
          body.append(node('p','ref-copy','Check the plans before buying materials. Some are costly or require a faction reputation.'));
        }
        const materials=node('div','ref-craft-materials-list');
        materials.append(node('h4','ref-label','Materials to gather'));
        materials.append(txtCell(route,row.i,1,node('p','ref-copy')));
        body.append(materials,node('h4','ref-label','Crafting order'),
          routeSteps(s(row.cells[2]),active,data));
      },row.i===1));
    }
    const notes=sec.blocks.filter(b=>b!==route);
    if(notes.length)area.append(disclosure('Route notes','',body=>blocks(body,notes)));
  }
  function professions(host,guide,character) {
    title(host,character ? character+' professions' : 'Professions');
    const plan=window.PlannerUI.plan;
    if(character) {
      const assigned=window.WYHPlan.assigned(plan,character);
      if(!assigned.length) {
        const line=node('p','ref-empty','No primary professions assigned to this '+character+'. ');
        const setup=node('a','','Choose professions in Setup');setup.href='#setup';line.append(setup);host.append(line);
        return;
      }
      for(const name of assigned) host.append(disclosure(name,'',area=>renderProfession(area,guide,professionId(name))));
      return;
    }
    const all=[...window.WYHPlan.professions,...secondarySkills].sort();
    const entries=all.map(name=>[professionId(name),name]);
    entries.push(['profession-ranks','Training ranks'],['vendors','Vendor shopping list']);
    let active=entries.some(([id])=>id===state.profession)?state.profession:'profession-ranks';
    const area=node('div','ref-content'), tools=node('div','ref-tools');
    function show(id) {
      active=id;state.profession=id;
      area.replaceChildren();
      renderProfession(area,guide,id);
    }
    tools.append(field('Profession or reference',entries,active,show));
    host.append(tools,area);show(active);
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
    {fish:'Raw Rockscale Cod',meal:'Rockscale Cod',auctionRecipe:6369,levels:[175,190,210,230],seller:'kelsey',price:'22s',buff:'+12 Fishing for 15 minutes',source:'https://www.foreverdb.app/en/forever/items/4594/rockscale-cod'},
    {fish:'Raw Brilliant Smallfish',meal:'Brilliant Smallfish',auctionRecipe:6325,levels:[1,45,65,85],seller:'harn',price:'40c',buff:'+2 attack power'},
    {fish:'Raw Slitherskin Mackerel',meal:'Slitherskin Mackerel',auctionRecipe:6326,levels:[1,45,65,85],seller:'zansoa',price:'40c',buff:'+6 attack power'},
    {fish:'Raw Longjaw Mud Snapper',meal:'Longjaw Mud Snapper',auctionRecipe:6328,levels:[50,90,110,130],seller:'harn',price:'4s',buff:'+10 attack power'},
    {fish:'Raw Rainbow Fin Albacore',meal:'Rainbow Fin Albacore',auctionRecipe:6368,levels:[50,90,110,130],seller:'zansoa',price:'4s',buff:'+1 spell damage'},
    {fish:'Raw Sagefish',meal:'Smoked Sagefish',auctionRecipe:21099,levels:[80,120,140,160],seller:'kelsey',price:'5s',extra:'Mild Spices',buff:'+4 spell damage'},
    {fish:'Raw Bristle Whisker Catfish',meal:'Bristle Whisker Catfish',auctionRecipe:6330,levels:[100,140,160,180],seller:'kilxx',price:'12s',buff:'+8 Fishing'},
    {fish:'Raw Mithril Head Trout',meal:'Mithril Head Trout',auctionRecipe:17062,levels:[175,215,235,255],seller:'kelsey',price:'22s',buff:'+20 attack power'},
    {fish:'Raw Greater Sagefish',meal:'Sagefish Delight',auctionRecipe:21219,levels:[175,215,235,255],seller:'kelsey',price:'50s',extra:'Hot Spices',buff:'+7 spell damage'},
    {fish:'Raw Spotted Yellowtail',meal:'Spotted Yellowtail',auctionRecipe:13939,levels:[225,265,285,305],seller:'gikkix',price:'1g 60s',buff:'+22 spell damage'},
    {fish:'Raw Glossy Mightfish',meal:'Cooked Glossy Mightfish',auctionRecipe:13940,levels:[225,265,285,305],seller:'kelsey',price:'1g 60s',extra:'Soothing Spices',buff:'+30 attack power'},
    {fish:'Raw Nightfin Snapper',meal:'Nightfin Soup',auctionRecipe:13945,levels:[250,290,310,330],seller:'gikkix',price:'2g',extra:'Refreshing Spring Water',buff:'+22 spell damage'},
    {fish:'Raw Redgill',meal:'Filet of Redgill',auctionRecipe:13941,levels:[225,265,285,305],seller:'kelsey',price:'1g 60s',buff:'+18 Fishing'},
    {fish:'Raw Sunscale Salmon',meal:'Poached Sunscale Salmon',auctionRecipe:13946,levels:[250,290,310,330],seller:'gikkix',price:'2g',buff:'+40 attack power',station:'an Iron Oven',source:'https://www.wowhead.com/forever/spell=18244/poached-sunscale-salmon'},
    {fish:'Raw Whitescale Salmon',meal:'Baked Salmon',auctionRecipe:13949,levels:[275,315,335,355],seller:'sheendra',price:'2g',extra:'Soothing Spices',buff:'+28 spell damage',station:'an Iron Oven',source:'https://www.wowhead.com/forever/spell=18247/baked-salmon'},
    {fish:'Large Raw Mightfish',meal:'Mightfish Steak',auctionRecipe:13948,levels:[275,315,335,355],seller:'sheendra',price:'2g',extra:'Hot Spices + 1 Soothing Spices',buff:'+40 attack power',station:'an Iron Oven',source:'https://www.wowhead.com/forever/spell=18246/mightfish-steak'},
    {fish:'Oily Blackmouth',meal:'Blackmouth Oil',alchemy:'2 Oily Blackmouth + 1 Empty Vial make 1 Blackmouth Oil.'},
    {fish:'Firefin Snapper',meal:'Fire Oil',alchemy:'2 Firefin Snapper + 1 Empty Vial make 2 Fire Oil.'}
  ];
  const lookup = { fish:'Raw Rockscale Cod', skill:'180', search:'' };
  const allianceCooking='https://www.wowhead.com/forever/guide/professions/cooking/overview-leveling';
  const allianceSellers={
    6325:['Catherine Leland','Trade District dock, Stormwind (55.0, 69.6).',allianceCooking],
    6328:['Tharynn Bouden','Goldshire, Elwynn Forest (41.8, 67.0).',allianceCooking],
    6330:['Catherine Leland','Trade District dock, Stormwind (55.0, 69.6).',allianceCooking],
    6326:['Nessa Shadowsong','Rut’theran Village, Teldrassil.','https://www.wowhead.com/forever/item=6326/recipe-slitherskin-mackerel']
  };
  function recipeSeller(rec) {
    if(!window.GuideFaction.alliance)return sellers[rec.seller];
    if(allianceSellers[rec.auctionRecipe])return allianceSellers[rec.auctionRecipe];
    if(rec.seller==='sheendra')return ['Vivianna','Feathermoon Stronghold, Feralas (31.3, 43.5).','https://metabot.gg/en/wow-forever/npcs/vivianna-7947'];
    return ['kelsey','gikkix','kilxx'].includes(rec.seller)?sellers[rec.seller]:undefined;
  }
  const bayCatch = new Set(['Raw Rockscale Cod','Raw Spotted Yellowtail','Firefin Snapper','Oily Blackmouth']);
  function sellerDescription(recipe) {
    const seller=recipeSeller(recipe);
    if(!seller)return 'Check the Auction House for the recipe.';
    const [vendor,where]=seller;
    return vendor+' · '+recipe.price+' base vendor price. '+where;
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
    const bayAdvice=node('p','ref-context');
    area.append(disclosure('What can I cook from the Booty Bay dock?','',body=>{
      body.append(bayAdvice);
      body.append(node('p','ref-copy','These four fish were recorded in open water at 27.6, 76.8 in Stranglethorn Vale. Select a catch to look it up.'));
      const links=node('div','ref-fish-links');
      for(const name of bayCatch){
        const button=node('button','ref-fish-link',name);button.type='button';
        button.addEventListener('click',()=>{
          lookup.search='';search.value='';lookup.fish=name;filter();select.focus();
        });
        links.append(button);
      }
      body.append(links);
    }));
    select.addEventListener('change',()=>{lookup.fish=select.value;show();});
    skill.addEventListener('input',()=>{lookup.skill=skill.value;show();});
    search.addEventListener('input',()=>{lookup.search=search.value;filter();});
    function filter() {
      select.replaceChildren();
      const words=norm(lookup.search).split(' ').filter(Boolean);
      const results=catches.filter(rec=>{
        const wordsToMatch=norm([rec.fish,rec.meal,...(recipeSeller(rec) || []).slice(0,2),rec.alchemy?'Alchemy':'',rec.auctionRecipe?'Auction House AH':'',bayCatch.has(rec.fish)?'Booty Bay':''].join(' '));
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
      const rank=Number(skill.value);
      if(Number.isInteger(rank) && rank>=1 && rank<=300) {
        const useful=catches.filter(r=>bayCatch.has(r.fish) && r.levels && rank<300 && rank>=r.levels[0] && rank<r.levels[3]);
        bayAdvice.textContent=useful.length?'At Cooking '+rank+', '+useful.map(r=>r.meal).join(' and ')+' can give skill-ups if learned and below your trained cap.':'At Cooking '+rank+', none of these four recorded catches gives a Cooking skill-up.';
      } else bayAdvice.textContent='Enter your Cooking skill above to see which catches can still give skill-ups.';
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
      line('Buy recipe',sellerDescription(rec)+(recipeSeller(rec) && rec.auctionRecipe?' Check the Auction House before travelling.':''));
      if(rec.buff)line('Food effect',rec.buff);
      line('Skill thresholds','Orange '+min+' · Yellow '+yellow+' · Green '+green+' · Grey '+grey);
      result.append(details);
    }
    filter();
  }
  function fishing(host,guide,character) {
    title(host,'Fishing & Cooking');
    const view='spots';
    const toolbar=node('div','ref-tools'),area=node('div','ref-content');
    toolbar.append(field('View',[['spots','Fishing spots by level'],['attack','Attack levelling route'],['caster','Caster levelling route'],['lookup','Fish lookup']],view,refresh));
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
        const food=catches.find(item=>item.meal===catchNames[key][1]);
        if(food)body.append(node('p','ref-craft-source','Recipe · '+sellerDescription(food)));
        const buff=s(rec.cells[3]).replace(/\bAP\b/,'attack power').replace(/\bSpell\b/,'spell damage');
        li.append(rng,body,node('span','ref-buff',buff));list.append(li);
      }
      area.append(list);
      area.append(disclosure('Recipe vendors, AH and training','',body=>blocks(body,comp.blocks.filter(q=>q!==b))));
      const fish=section(guide,'fishing');
      if(fish) area.append(disclosure('Fishing spots by level','',body=>blocks(body,fish.blocks)));
    }
    refresh(view);
  }
  function library(host,guide,character) {
    title(host,'Guide library');
    const all=guide.sections.filter(sec=>sec.blocks.length && sec.id!=='sleeping-bag');
    if(window.SleepingBagRoute)all.splice(1,0,{id:'sleeping-bag',title:'Cozy Sleeping Bag'});
    if(!all.length)return;
    const requested=location.hash==='#sleeping-bag'?'sleeping-bag':state.read;
    const active=all.some(sec=>sec.id===requested)?requested:all[0].id;
    const toolbar=node('div','ref-tools'),area=node('div','ref-content');
    toolbar.append(field('Chapter',all.map(sec=>[sec.id,sec.title]),active,v=>{
      state.read=v;
      if(location.hash==='#sleeping-bag' && v!=='sleeping-bag')location.hash='#guide';
      show(v);
    }));
    const warriorGear=node('a','top-addon','Warrior levelling gear');
    warriorGear.href='warrior-gear.html';
    toolbar.append(warriorGear);
    host.append(toolbar,area);
    function show(id){
      area.replaceChildren();
      if(id==='sleeping-bag') {
        area.append(window.SleepingBagRoute.panel(character,true));
        return;
      }
      blocks(area,section(guide,id).blocks);
    }
    show(active);
  }
  window.FieldReference = {
    render(panel, tab, guide, className, changeCharacter) {
      const views={dungeons:window.WYHDungeonUI.render,professions,fishing,guide:library};
      if(!views[tab])return;
      panel.replaceChildren(); const inner=node('section','field-reference');
      panel.append(inner);
      views[tab](inner,guide,validClass(className),changeCharacter);
    }
  };
})();

