// 设定集Wiki — 世界地图交互 v4（修复交互 + 增加地形背景）
function initMap(svgId, infoId, mapData, charData, filterId) {
  var svgArea = document.getElementById(svgId);
  var infoPanel = document.getElementById(infoId);
  var filterBar = document.getElementById(filterId);
  if (!svgArea || !mapData) return;

  var W = 800, H = 600, S = 'http://www.w3.org/2000/svg';
  var selLoc = null, selChar = null, activeFilter = 'all';

  var C = { bg:'#1a1a24', surface:'rgba(37,37,48,0.4)', text:'#d4cfc4', dim:'rgba(212,207,196,0.5)', bright:'#f0ead8', gold:'#c9a059', jade:'#5e8b7c', purple:'#a78bfa', red:'#c04b3d', blue:'#5eb3e8', border:'rgba(255,255,255,0.08)' };
  var SC = { '天渊宗':'#5eb3e8','金刚门':'#c04b3d','万象阁':'#5e8b7c','归一教':'#a78bfa','净言寺':'#c9a059' };
  var SO = ['天渊宗','金刚门','万象阁','归一教','净言寺'];
  var RL = { mortal:'散修',qi_refining:'炼气',foundation:'筑基',core_formation:'金丹',nascent_soul:'元婴',spirit_severing:'化神',tribulation:'渡劫',ascension:'大乘' };
  var TM = { sect_gate:'宗门',landmark:'地标',city:'坊市',dungeon:'秘境',special:'特殊',mystery:'秘地',ruins:'遗迹',encounter:'资源',danger:'危险' };

  function si(n) { var i=SO.indexOf(n); return i>=0?i:99; }
  function rl(r) { return {mortal:0,qi_refining:1,foundation:2,core_formation:3,nascent_soul:4,spirit_severing:5,tribulation:6,ascension:7}[r]||0; }
  function ctr(d) { var n=d.match(/[\d.]+/g); if(!n||n.length<4)return {x:400,y:300}; var sx=0,sy=0,c=0; for(var i=0;i<n.length-1;i+=2){sx+=+n[i];sy+=+n[i+1];c++;} return {x:sx/c,y:sy/c}; }

  // 工具栏
  if (filterBar) {
    filterBar.innerHTML = '';
    [['all','全部'],['sect','宗门'],['dungeon','秘境'],['special','特殊'],['danger','危险']].forEach(function(f) {
      var a=activeFilter===f[0];
      var b=document.createElement('button');
      b.textContent=f[1];
      b.className='filter-btn'+(a?' active':'');
      b.onclick=function(){activeFilter=f[0];fullRender();};
      filterBar.appendChild(b);
    });
  }

  // ── 地形装饰 ──
  function addTerrain(svg) {
    function mk(tag,a){var e=document.createElementNS(S,tag);for(var k in a)e.setAttribute(k,a[k]);svg.appendChild(e);return e;}
    // 山脉符号（小三角）
    var mtns = [
      [130,90,12],[140,85,10],[155,95,8],[170,85,11],[180,100,9], // 天渊山脉
      [80,270,10],[95,280,12],[75,295,8],[90,310,10],[65,320,9], // 金刚岭
      [270,350,9],[285,365,11],[300,355,8],[320,370,10], // 万象谷
      [400,130,10],[415,120,8],[430,135,11],[450,125,9],[465,140,8], // 中极山
      [550,90,9],[565,105,10],[580,95,8],[595,110,9], // 净言山
      [350,250,7],[370,240,8],[330,260,7],[390,250,7], // 散修荒原
      [650,190,9],[670,200,7],[690,185,9], // 概念荒漠
    ];
    mtns.forEach(function(m){
      var x=m[0],y=m[1],s=m[2];
      mk('polygon',{points:(x)+','+(y-s)+' '+(x-s)+','+(y+s/2)+' '+(x+s)+','+(y+s/2),fill:'rgba(255,255,255,0.03)',stroke:'rgba(255,255,255,0.06)','stroke-width':'0.5'});
    });

    // 树木符号（小圆点簇）
    var trees = [
      [460,470,6],[470,480,4],[450,485,5],[465,495,4],[480,470,5], // 地缚林海
      [220,200,4],[230,210,3],[215,215,5],[225,225,3], // 残响平原
    ];
    trees.forEach(function(t){
      var x=t[0],y=t[1],n=t[2];
      for(var i=0;i<n;i++){var ox=(Math.random()-0.5)*12,oy=(Math.random()-0.5)*12;
        mk('circle',{cx:String(x+ox),cy:String(y+oy),r:'2',fill:'rgba(94,139,124,0.12)'});
      }
    });

    // 河流/路径线条
    [
      [100,420,150,380],[150,380,200,350],[200,350,280,320],
      [400,450,450,420],[450,420,500,400],[500,400,550,380],
      [300,150,350,180],[350,180,400,200],[400,200,450,220],
    ].forEach(function(r){
      mk('path',{d:'M'+r[0]+','+r[1]+' Q'+((r[0]+r[2])/2)+','+((r[1]+r[3])/2)+' '+r[2]+','+r[3],
        fill:'none',stroke:'rgba(94,139,124,0.06)','stroke-width':'2'});
    });
  }

  // ── 完整渲染 ──
  function fullRender() {
    renderMap();
    renderInfo();
  }

  // ── 渲染地图 ──
  function renderMap() {
    svgArea.innerHTML = '';
    var svg = document.createElementNS(S,'svg');
    svg.setAttribute('viewBox','0 0 '+W+' '+H);
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    svg.style.cssText='display:block;width:100%;height:100%;';
    svgArea.appendChild(svg);

    function mk(tag,a){var e=document.createElementNS(S,tag);for(var k in a)e.setAttribute(k,a[k]);svg.appendChild(e);return e;}
    function mkt(tag,a,t){var e=mk(tag,a);e.textContent=t;return e;}

    var defs=mk('defs',{});defs.innerHTML='<filter id="g"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';

    mk('rect',{width:String(W),height:String(H),fill:C.bg});

    // 地形装饰
    addTerrain(svg);

    // 大陆
    (mapData.continents||[]).forEach(function(c){mk('path',{d:c.d,fill:c.color,stroke:'rgba(255,255,255,0.06)','stroke-width':'1'});});

    // 领地
    var st=(mapData.territories||[]).sort(function(a,b){return si(a.name)-si(b.name);});
    st.forEach(function(t){
      mk('path',{d:t.d,fill:t.color,stroke:t.stroke,'stroke-width':'1.5','stroke-dasharray':'4,3'});
      var c2=ctr(t.d);mkt('text',{x:c2.x,y:c2.y,'text-anchor':'middle','dominant-baseline':'middle',fill:t.stroke,'font-size':'11',opacity:'0.5'},t.name);
    });

    // 荒野
    (mapData.regions||[]).forEach(function(r){
      mk('path',{d:r.d,fill:r.color,stroke:r.stroke,'stroke-width':'1','stroke-dasharray':'3,4'});
      var c2=ctr(r.d);mkt('text',{x:c2.x,y:c2.y,'text-anchor':'middle','dominant-baseline':'middle',fill:'rgba(255,255,255,0.15)','font-size':'10'},r.name);
    });

    // 连线
    var lm={};(mapData.locations||[]).forEach(function(l){lm[l.id]=l;});
    (mapData.connections||[]).forEach(function(cn){
      var f=lm[cn.from],t=lm[cn.to];if(!f||!t)return;
      mk('line',{x1:String(f.x),y1:String(f.y),x2:String(t.x),y2:String(t.y),stroke:'rgba(255,255,255,0.07)','stroke-width':'1','stroke-dasharray':cn.dashed?'4,4':'none'});
      mkt('text',{x:String((f.x+t.x)/2),y:String((f.y+t.y)/2-6),'text-anchor':'middle',fill:'rgba(255,255,255,0.1)','font-size':'7'},cn.label);
    });

    // 标记点
    var fl=(mapData.locations||[]).filter(function(l){
      if(activeFilter==='all')return true;
      if(activeFilter==='sect')return ['sect_gate','landmark','city'].includes(l.type);
      if(activeFilter==='dungeon')return l.type==='dungeon';
      if(activeFilter==='special')return ['special','ruins','mystery','encounter'].includes(l.type);
      return l.type==='danger';
    });
    fl.sort(function(a,b){var ta=a.sect?0:99,tb=b.sect?0:99;if(ta!==tb)return ta-tb;if(a.sect&&b.sect){var ss=si(a.sect)-si(b.sect);if(ss!==0)return ss;}return a.name.localeCompare(b.name,'zh-CN');});

    fl.forEach(function(loc){
      var g=document.createElementNS(S,'g');
      g.style.cursor='pointer';
      svg.appendChild(g);
      var r=loc.type==='sect_gate'?7:loc.type==='dungeon'?5:6;
      var mc=loc.sect?(SC[loc.sect]||C.gold):loc.type==='dungeon'?C.blue:loc.type==='danger'?C.red:C.gold;
      var sel=selLoc&&selLoc.id===loc.id;
      if(sel)mkInG(g,'circle',{cx:String(loc.x),cy:String(loc.y),r:String(r+6),fill:'none',stroke:mc,'stroke-width':'2.5',opacity:'0.7',filter:'url(#g)'});
      mkInG(g,'circle',{cx:String(loc.x),cy:String(loc.y),r:String(r),fill:mc,stroke:sel?'#fff':C.bg,'stroke-width':'1.5'});
      var icon=mkInG(g,'text',{x:String(loc.x),y:String(loc.y+2),'text-anchor':'middle','dominant-baseline':'central','font-size':'10','pointer-events':'none'});icon.textContent=loc.icon||'📍';
      var lb=mkInG(g,'text',{x:String(loc.x),y:String(loc.y-r-7),'text-anchor':'middle',fill:sel?C.gold:C.dim,'font-size':sel?'11':'9','font-weight':sel?'bold':'normal','pointer-events':'none'});lb.textContent=loc.name;

      g.addEventListener('click',function(lockedLoc){
        return function(){selLoc=lockedLoc;selChar=null;fullRender();};
      }(loc));
      g.addEventListener('mouseenter',function(){lb.setAttribute('fill',C.gold);lb.setAttribute('font-size','11');});
      g.addEventListener('mouseleave',function(){if(!sel){lb.setAttribute('fill',C.dim);lb.setAttribute('font-size','9');}});
    });

    // 图例
    var leg=document.createElement('div');
    leg.style.cssText='position:absolute;bottom:6px;left:8px;display:flex;gap:8px;background:'+C.bg+';padding:3px 8px;border-radius:4px;border:1px solid '+C.border+';z-index:10;';
    [[C.jade,'宗门'],[C.blue,'秘境'],[C.gold,'特殊'],[C.red,'危险']].forEach(function(e){
      var sp=document.createElement('span');sp.style.cssText='display:inline-flex;align-items:center;gap:3px;font-size:10px;color:'+C.dim+';';
      var dot=document.createElement('span');dot.style.cssText='width:6px;height:6px;border-radius:50%;background:'+e[0]+';display:inline-block;';
      sp.appendChild(dot);sp.appendChild(document.createTextNode(' '+e[1]));leg.appendChild(sp);
    });
    svgArea.appendChild(leg);
  }

  function mkInG(g,tag,a){var e=document.createElementNS(S,tag);for(var k in a)e.setAttribute(k,a[k]);g.appendChild(e);return e;}

  // ── 信息面板 ──
  function renderInfo() {
    if(!infoPanel)return;
    if(selChar){renderChar();return;}
    if(selLoc){renderLoc();return;}
    infoPanel.innerHTML='<div style="padding:20px;color:rgba(212,207,196,0.5);text-align:center;">点击地图标记点查看详情</div>';
  }

  function renderLoc() {
    var loc=selLoc;if(!loc){infoPanel.innerHTML='';return;}
    var mc=loc.sect?(SC[loc.sect]||C.gold):C.gold;
    var h='';
    h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">';
    h+='<span style="font-size:28px;">'+(loc.icon||'📍')+'</span>';
    h+='<div><div style="font-size:18px;font-weight:bold;color:'+C.gold+';">'+loc.name+'</div></div></div>';
    h+='<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">';
    h+='<span style="background:rgba(37,37,48,0.6);padding:2px 10px;border-radius:4px;font-size:11px;color:'+C.dim+';">'+(TM[loc.type]||loc.type)+'</span>';
    if(loc.sect)h+='<span style="background:'+mc+'33;color:'+mc+';padding:2px 10px;border-radius:4px;font-size:11px;">'+loc.sect+'</span>';
    h+='</div>';
    h+='<div style="font-size:13px;line-height:1.8;color:'+C.text+';margin-bottom:14px;">'+loc.description+'</div>';

    // 人物
    if(charData){
      var chs=charData.characters.filter(function(c){return c.locationId===loc.id;});
      chs.sort(function(a,b){return rl(b.realm)-rl(a.realm);});
      if(chs.length>0){
        h+='<div style="font-weight:bold;color:'+C.jade+';font-size:13px;margin-bottom:6px;">此地人物 ('+chs.length+')</div>';
        chs.forEach(function(ch){
          var sc2=SC[ch.sect]||C.gold;
          h+='<div style="background:rgba(37,37,48,0.4);border-left:3px solid '+sc2+';border-radius:0 6px 6px 0;padding:10px 12px;margin-bottom:6px;cursor:pointer;" onclick="window.clickChar(\''+ch.id+'\')">';
          h+='<div style="display:flex;align-items:center;gap:8px;">';
          h+='<span style="font-size:20px;">'+(ch.avatar||'👤')+'</span>';
          h+='<div style="flex:1;"><strong style="font-size:13px;">'+ch.name+'</strong> <span style="background:'+sc2+'22;color:'+sc2+';padding:1px 6px;border-radius:3px;font-size:10px;">'+ch.realm+'</span>';
          h+='<div style="font-size:11px;color:rgba(212,207,196,0.5);margin-top:1px;">'+ch.title+'</div></div></div></div>';
        });
      }
    }

    // 任务
    if(mapData&&loc.linkedQuestIds&&loc.linkedQuestIds.length>0){
      var qs=mapData.quests.filter(function(q){return loc.linkedQuestIds.indexOf(q.id)>=0;});
      if(qs.length>0){
        h+='<div style="font-weight:bold;color:'+C.jade+';font-size:13px;margin:10px 0 6px;">可接任务 ('+qs.length+')</div>';
        qs.forEach(function(q){
          h+='<div style="background:rgba(37,37,48,0.4);border-radius:0 6px 6px 0;padding:8px 10px;margin-bottom:5px;border-left:3px solid '+C.blue+';">';
          h+='<div style="font-weight:bold;font-size:12px;color:'+C.gold+';">'+q.name+'</div>';
          h+='<div style="font-size:11px;color:'+C.text+';margin:2px 0;">'+q.description+'</div>';
          h+='<div style="font-size:10px;color:'+C.jade+';">奖励: '+q.rewards+'</div></div>';
        });
      }
    }

    infoPanel.innerHTML=h;
  }

  window.clickChar=function(id){
    if(!charData)return;
    var ch=charData.characters.find(function(c){return c.id===id;});
    if(ch){selChar=ch;renderInfo();}
  };
  window.backToLoc=function(){selChar=null;renderInfo();};

  function renderChar(){
    var ch=selChar;if(!ch){renderInfo();return;}
    var sc2=SC[ch.sect]||C.gold;
    var h='<div style="margin-bottom:8px;"><button onclick="backToLoc()" style="background:transparent;color:'+C.gold+';border:1px solid '+C.border+';padding:4px 12px;border-radius:4px;cursor:pointer;font-size:11px;font-family:inherit;">← 返回</button></div>';
    h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;"><span style="font-size:36px;">'+(ch.avatar||'👤')+'</span>';
    h+='<div><div style="font-size:18px;font-weight:bold;color:'+C.gold+';">'+ch.name+'</div><div style="font-size:12px;color:'+C.dim+';">'+ch.title+'</div></div></div>';
    h+='<div style="display:flex;gap:6px;margin-bottom:10px;"><span style="background:'+sc2+'33;color:'+sc2+';padding:2px 8px;border-radius:4px;font-size:11px;">'+ch.sect+'</span>';
    h+='<span style="background:rgba(37,37,48,0.6);padding:2px 8px;border-radius:4px;font-size:11px;color:'+C.dim+';">'+ch.realm+'期</span></div>';
    h+='<div style="font-size:12px;line-height:1.7;color:'+C.text+';margin-bottom:10px;">'+ch.description+'</div>';
    if(ch.relationships&&ch.relationships.length>0){
      h+='<div style="font-weight:bold;color:'+C.purple+';font-size:13px;margin:8px 0 6px;">人际关系 ('+ch.relationships.length+')</div>';
      ch.relationships.forEach(function(r){
        h+='<div style="background:rgba(37,37,48,0.4);border-left:3px solid '+C.gold+';border-radius:0 6px 6px 0;padding:8px 10px;margin-bottom:4px;">';
        h+='<strong>'+r.targetId+'</strong> <span style="color:'+C.gold+';font-size:11px;"> \xB7 '+r.type+'</span>';
        h+='<div style="font-size:11px;color:'+C.dim+';">'+r.description+'</div></div>';
      });
    }
    // 任务
    if(mapData&&ch.questIds&&ch.questIds.length>0){
      var qs=mapData.quests.filter(function(q){return ch.questIds.indexOf(q.id)>=0;});
      if(qs.length>0){
        h+='<div style="font-weight:bold;color:'+C.purple+';font-size:13px;margin:8px 0 6px;">发布任务 ('+qs.length+')</div>';
        qs.forEach(function(q){
          h+='<div style="background:rgba(37,37,48,0.4);border-left:3px solid '+C.blue+';border-radius:0 6px 6px 0;padding:8px 10px;margin-bottom:4px;">';
          h+='<div style="font-weight:bold;font-size:12px;color:'+C.gold+';">'+q.name+'</div>';
          h+='<div style="font-size:11px;color:'+C.text+';">'+q.description+'</div>';
          h+='<div style="font-size:10px;color:'+C.jade+';">'+q.rewards+'</div></div>';
        });
      }
    }
    infoPanel.innerHTML=h;
  }

  // 启动
  fullRender();
}
