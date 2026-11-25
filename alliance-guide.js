(() => {
  'use strict';
  const source=window.ROSE_GUIDE;
  const find=id=>source.sections.find(s=>s.id===id);
  const rows=id=>find(id).blocks.find(b=>b.type==='table').rows;
  const text=value=>({type:'p',text:value});
  const table=rows=>({type:'table',rows});
  const link=(label,url)=>({type:'p',text:label,links:[{text:label,url}]});
  const section=(id,title,...blocks)=>({id,title,blocks});
  const wowhead='https://www.wowhead.com/forever/';
  const cookingSource=wowhead+'guide/professions/cooking/overview-leveling';
  const fishingSource='https://www.wow-professions.com/forever/fishing-and-cooking-leveling-guide';
  const professions=['engineering','blacksmithing','leatherworking','tailoring','enchanting','alchemy'];
  const craftSections=professions.map(id=>{
    const base=find(id);
    const [head,starter]=rows(id);
    return section(id,base.title,table([head,starter]),text('Materials are shopping estimates for the first crafting LP. Later shopping routes for Alliance are still being checked.'));
  });
  const dungeons=section('dungeons','Recommended dungeon levels',table(rows('dungeons')
    .filter(([name])=>!name.includes('Ragefire'))
    .map(([name,level],i)=>i===0?['Dungeon','Level','Notes']:[name,level,''])));
  const prequests=section('prequests','Alliance dungeon pickups',text('Opening pickups for the Hall of Thanes and the Deadmines. Later Alliance chains are still being checked.'),
    table([['Start','Min','First quest and pickup','Dungeon / when to continue'],
      ['11–13','9','Underground Map — Dark Iron Map from Dark Iron Spies, Ironband’s Compound, Dun Morogh','Hall of Thanes: Take the map to Earthseer Farsen at Gol’Bolar Quarry (64.8, 58.4) for Old Ironforge Incursion.'],
      ['13–16','10','Important Heirlooms — Thom Filch, Old Ironforge','Hall of Thanes: Cross the short bridge just outside the instance and look behind the column.'],
      ['14–16','14','The Defias Brotherhood — Gryan Stoutmantle, Sentinel Hill, Westfall (56, 47)','Deadmines: Pick up the first leg before visiting Lakeshire and Stormwind. The chain opens the VanCleef quest and Red Silk Bandanas from Scout Riell.'],
      ['14–16','14','Collecting Memories — Wilder Thistlenettle, Dwarven District, Stormwind (65, 21)','Deadmines: At 15, the same giver also has Oh Brother…. Do both in the tunnels outside the instance.'],
      ['15–16','15','Oh Brother… — Wilder Thistlenettle, Dwarven District, Stormwind (65, 21)','Deadmines: Pick up Underground Assault from Shoni during the same city visit.'],
      ['15–16','15','Underground Assault — Shoni the Shilent, Dwarven District, Stormwind (55, 13)','Deadmines: The objective is inside the instance.']]),
    link('Hall of Thanes quests',wowhead+'guide/hall-of-thanes-dungeon-overview-location-rewards'),
    link('The Deadmines quests',wowhead+'guide/the-deadmines-dungeon-overview-location-rewards'));
  const vendors=section('vendors','Alliance vendor shopping list',table([['Where','Who and what to buy'],
    ['Stormwind','Catherine Leland, on the Trade District dock (55.0, 69.6), sells the Brilliant Smallfish and Bristle Whisker Catfish recipes. Ben Trias sells Alterac Swiss for Artisan Cooking.'],
    ['Elwynn Forest','Tharynn Bouden in Goldshire (41.8, 67.0) sells Recipe: Longjaw Mud Snapper.'],
    ['Ashenvale','Shandrina near Mystral Lake (49.6, 67.0) sells the Expert Cookbook. Use it at Cooking 125 to raise your cap to 225. It can also be bought on the AH.'],
    ['Arathi Highlands','Deneb Walker at Stromgarde Keep (27.0, 58.8) sells Expert First Aid – Under Wraps and the Heavy Silk and Mageweave Bandage manuals. Buy the three together or check the AH.'],
    ['Booty Bay','Old Man Heming sells Expert Fishing – The Bass and You. Kelsey Yance sells Recipe: Mithril Head Trout and Recipe: Filet of Redgill.'],
    ['Feralas','Vivianna at Feathermoon Stronghold (31.3, 43.5) sells Recipe: Baked Salmon and Recipe: Mightfish Steak. Both need Cooking 275 and an Iron Oven to cook.'],
    ['Tanaris','Gikkix at Steamwheedle Port sells Recipe: Spotted Yellowtail and Recipe: Nightfin Soup.']]),
    link('Cooking vendors and skill requirements',cookingSource),
    link('First Aid books and trainers','https://forever-guides.com/en/wow-forever/professions/first-aid'),
    link('Feathermoon vendor','https://metabot.gg/en/wow-forever/npcs/vivianna-7947'));
  const aidRows=rows('first-aid').map(row=>row.slice());
  aidRows[2][1]='About 135 Silk Cloth and 20 Mageweave Cloth. Buy the Expert book and the two manuals from Deneb Walker in Stromgarde Keep or check the AH.';
  aidRows[3][1]='About 90 more Mageweave Cloth and 80 Runecloth. At level 35 and First Aid 225, complete Triage with Doctor Gustaf VanHowzen in Theramore. Return at 240, 260 and 290 for the later bandages.';
  const firstAid=section('first-aid','First Aid',table(aidRows),link('Alliance First Aid training','https://forever-guides.com/en/wow-forever/professions/first-aid'));
  const waters=section('fishing','Alliance fishing stops',text('Fishing shows the effective minimum and no-escape target for open water. Count your pole and lure.'),
    table([['Level','Where to fish','Fishing','What to keep and why'],
      ['5–10','Starter lakes in Elwynn Forest','1 / 25','Keep Brilliant Smallfish and Longjaw Mud Snapper. A single spot can feed two Cooking recipes.'],
      ['10–20','Stormwind canals','1 / 75','Fish on the way to the Trade District. Buy the Smallfish and Catfish recipes from Catherine Leland.'],
      ['20–30','Mystral Lake, Ashenvale','55 / 150','Catch Longjaw Mud Snapper and Bristle Whisker Catfish. Visit Shandrina nearby for the Expert Cookbook.'],
      ...rows('fishing').slice(1).filter(([,where])=>where.startsWith('Nesingwary') || where.startsWith('Steamwheedle') || where.startsWith('Verdantis'))]),
    link('Alliance Fishing and Cooking route',fishingSource));
  const cookingWater={'Brilliant Smallfish':'Starting lakes in Elwynn Forest','Slitherskin Mackerel':'Rut’theran Village coast, Teldrassil','Rainbow Fin Albacore':'Darkshore coast','Longjaw Mud Snapper':'Stormwind canals or Mystral Lake, Ashenvale','Bristle Whisker Catfish':'Mystral Lake, Ashenvale','Nightfin Snapper + Refr. Spring. Water':'Verdantis River, Feralas, at night'};
  const cooking=section('cooking','Cooking with fish',table(rows('cooking').map(([level,fish,water,effect])=>[level,fish,cookingWater[fish]||water,effect])),
    text('At Cooking 125, buy the Expert Cookbook from Shandrina near Mystral Lake or check the AH. Old Man Heming in Booty Bay sells the Expert Fishing book.'),
    text('At level 35 and Cooking 225, take 12 Giant Eggs, 10 Zesty Clam Meat and 20 Alterac Swiss to Dirge in Gadgetzan. At level 35 and Fishing 225, see Nat Pagle in Dustwallow Marsh.'),
    link('Cooking overview',cookingSource),link('Fishing and Cooking route',fishingSource));
  const intro=section('intro','Alliance route',text('Set your preferred class first in Setup. Use Milestones to track class, crafting and Spelunker points. On the Alliance board, Hall of Thanes fills the first Novice Spelunker slot.'),
    text('Dungeon runs list suggested levels through 60. The pickup checklist covers selected Hall of Thanes and Deadmines quests. Profession pages include starter shopping lists, First Aid, fishing and recipe vendors.'),
    link('Legacy challenge criteria',wowhead+'guide/legacy-system-overview-rewards'));
  window.ALLIANCE_GUIDE={...source,sections:[intro,find('profession-ranks'),dungeons,prequests,vendors,firstAid,...craftSections,cooking,waters]};
})();
