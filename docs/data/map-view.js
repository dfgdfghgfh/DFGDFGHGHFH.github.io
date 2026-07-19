// 设定集Wiki — 世界地图交互 v3（独立版，filterId 参数）
function initMap(svgId, infoId, mapData, charData, filterId) {
  var svgArea = document.getElementById(svgId);
  var infoPanel = document.getElementById(infoId);
  var filterBar = document.getElementById(filterId);
  if (!svgArea || !mapData) return;

  var W = 800, H = 600, S = 'http://www.w3.org/2000/svg';
  var selectedLoc = null, selectedChar = null, activeFilter = 'all';

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
      b.className = 'filter-btn' + (a?' active':'');
      b.onclick=function(){activeFilter=f[0];renderMap();renderInfo();};
      filterBar.appendChild(b);
    });
  }

  // 渲染地图
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
    (mapData.continents||[]).forEach(function(c){mk('path',{d:c.d,fill:c.color,stroke:'rgba(255,255,255,0.06)','stroke-width':'1'});});
    var st=(mapData.territories||[]).sort(function(a,b){return si(a.name)-si(b.name);});
    st.forEach(function(t){
      mk('path',{d:t.d,fill:t.color,stroke:t.stroke,'stroke-width':'1.5','stroke-dasharray':'4,3'});
      var c2=ctr(t.d);mkt('text',{x:c2.x,y:c2.y,'text-anchor':'middle','dominant-baseline':'middle',fill:t.stroke,'font-size':'11',opacity:'0.5'},t.name);
    });
    (mapData.regions||[]).forEach(function(r){
      mk('path',{d:r.d,fill:r.color,stroke:r.stroke,'stroke-width':'1','stroke-dasharray':'3,4'});
      var c2=ctr(r.d);mkt('text',{x:c2.x,y:c2.y,'text-anchor':'middle','dominant-baseline':'middle',fill:'rgba(255,255,255,0.15)','font-size':'10'},r.name);
    });
    var lm={};(mapData.locations||[]).forEach(function(l){lm[l.id]=l;});
    (mapData.connections||[]).forEach(function(cn){
      var f=lm[cn.from],t=lm[cn.to];if(!f||!t)return;
      mk('line',{x1:String(f.x),y1:String(f.y),x2:String(t.x),y2:String(t.y),stroke:'rgba(255,255,255,0.07)','stroke-width':'1','stroke-dasharray':cn.dashed?'4,4':'none'});
      mkt('text',{x:String((f.x+t.x)/2),y:String((f.y+t.y)/2-6),'text-anchor':'middle',fill:'rgba(255,255,255,0.1)','font-size':'7'},cn.label);
    });
    var fl=(mapData.locations||[]).filter(function(l){
      if(activeFilter==='all')return true;
      if(activeFilter==='sect')return ['sect_gate','landmark','city'].includes(l.type);
      if(activeFilter==='dungeon')return l.type==='dungeon';
      if(activeFilter==='special')return ['special','ruins','mystery','encounter'].includes(l.type);
      return l.type==='danger';
    });
    fl.sort(function(a,b){var ta=a.sect?0:99,tb=b.sect?0:99;if(ta!==tb)return ta-tb;if(a.sect&&b.sect){var ss=si(a.sect)-si(b.sect);if(ss!==0)return ss;}return a.name.localeCompare(b.name,'zh-CN');});
    fl.forEach(function(loc){
      var g=mk('g',{style:'cursor:pointer;'});
      var r=loc.type==='sect_gate'?7:loc.type==='dungeon'?5:6;
      var mc=loc.sect?(SC[loc.sect]||C.gold):loc.type==='dungeon'?C.blue:loc.type==='danger'?C.red:C.gold;
      var sel=selectedLoc&&selectedLoc.id===loc.id;
      if(sel)mk('circle',{cx:String(loc.x),cy:String(loc.y),r:String(r+6),fill:'none',stroke:mc,'stroke-width':'2.5',opacity:'0.7',filter:'url(#g)'});
      mk('circle',{cx:String(loc.x),cy:String(loc.y),r:String(r),fill:mc,stroke:sel?'#fff':C.bg,'stroke-width':'1.5'});
      mkt('text',{x:String(loc.x),y:String(loc.y+1),'text-anchor':'middle','dominant-baseline':'central','font-size':'10'},loc.icon||'📍');
      var lb=mkt('text',{x:String(loc.x),y:String(loc.y-r-7),'text-anchor':'middle',fill:sel?C.gold:C.dim,'font-size':sel?'11':'9','font-weight':sel?'bold':'normal'},loc.name);
      g.onclick=function(){selectedLoc=loc;selectedChar=null;renderMap();renderInfo();};
      g.onmouseenter=function(){lb.setAttribute('fill',C.gold);lb.setAttribute('font-size','11');};
      g.onmouseleave=function(){if(!sel){lb.setAttribute('fill',C.dim);lb.setAttribute('font-size','9');}};
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

  // 信息面板
  function renderInfo() {
    if(!infoPanel)return;
    if(selectedChar){renderCharInfo();return;}
    if(selectedLoc){renderLocInfo();return;}
    infoPanel.innerHTML='<div style="color:rgba(212,207,196,0.5);">点击地图上的标记点查看详情</div>';
  }
  function renderLocInfo() {
    var loc=selectedLoc;if(!loc){infoPanel.innerHTML='';return;}
    var mc=loc.sect?(SC[loc.sect]||C.gold):C.gold;
    var h='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><span style="font-size:24px;">'+(loc.icon||'📍')+'</span><div><div style="font-size:18px;font-weight:bold;color:'+C.gold+';">'+loc.name+'</div></div></div>';
    h+='<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;"><span style="background:'+C.surface+';padding:2px 8px;border-radius:4px;font-size:11px;color:'+C.dim+';">'+(TM[loc.type]||loc.type)+'</span>';
    if(loc.sect)h+='<span style="background:'+mc+'33;color:'+mc+';padding:2px 8px;border-radius:4px;font-size:11px;">'+loc.sect+'</span>';
    h+='</div><div style="font-size:13px;line-height:1.6;color:'+C.text+';margin-bottom:10px;">'+loc.description+'</div>';
    if(charData){
      var chs=charData.characters.filter(function(c){return c.locationId===loc.id;});
      chs.sort(function(a,b){return rl(b.realm)-rl(a.realm);});
      if(chs.length>0){
        h+='<div style="font-weight:bold;color:'+C.jade+';margin:10px 0 4px;font-size:14px;">此地人物 ('+chs.length+')</div>';
        chs.forEach(function(ch){
          var sc2=SC[ch.sect]||C.gold;
          h+='<div style="background:'+C.surface+';border-left:3px solid '+sc2+';border-radius:0 6px 6px 0;padding:8px 10px;margin:4px 0;cursor:pointer;" onclick="window.selectChar(\''+ch.id+'\')">';
          h+='<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:18px;">'+(ch.avatar||'👤')+'</span>';
          h+='<div style="flex:1;"><strong>'+ch.name+'</strong> <span style="background:'+sc2+'22;color:'+sc2+';padding:1px 5px;border-radius:3px;font-size:10px;">'+ch.realm+'</span>';
          h+='<div style="font-size:11px;color:'+C.dim+';">'+ch.title+'</div></div></div></div>';
        });
      }
    }
    infoPanel.innerHTML=h;
  }
  window.selectChar=function(charId){
    if(!charData)return;
    var ch=charData.characters.find(function(c){return c.id===charId;});
    if(!ch)return;
    selectedChar=ch;renderInfo();
  };
  window.backToLoc=function(){selectedChar=null;renderInfo();};
  function renderCharInfo(){
    var ch=selectedChar;if(!ch){renderInfo();return;}
    var sc2=SC[ch.sect]||C.gold;
    var h='<div style="margin-bottom:6px;"><button onclick="backToLoc()" style="background:transparent;color:'+C.gold+';border:1px solid '+C.border+';padding:3px 10px;border-radius:4px;cursor:pointer;font-size:11px;font-family:inherit;">← 返回地点</button></div>';
    h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;"><span style="font-size:32px;">'+(ch.avatar||'👤')+'</span>';
    h+='<div><div style="font-size:18px;font-weight:bold;color:'+C.gold+';">'+ch.name+'</div><div style="font-size:12px;color:'+C.dim+';">'+ch.title+'</div></div></div>';
    h+='<div style="display:flex;gap:6px;margin-bottom:8px;"><span style="background:'+sc2+'33;color:'+sc2+';padding:2px 8px;border-radius:4px;font-size:11px;">'+ch.sect+'</span>';
    h+='<span style="background:'+C.surface+';padding:2px 8px;border-radius:4px;font-size:11px;color:'+C.dim+';">'+ch.realm+'期</span></div>';
    h+='<div style="font-size:12px;line-height:1.6;color:'+C.dim+';margin-bottom:8px;">'+ch.description+'</div>';
    if(ch.relationships&&ch.relationships.length>0){
      h+='<div style="font-weight:bold;color:'+C.purple+';margin:8px 0 4px;font-size:13px;">人际关系 ('+ch.relationships.length+')</div>';
      ch.relationships.forEach(function(r){
        h+='<div style="background:'+C.surface+';border-left:3px solid '+C.gold+';border-radius:0 6px 6px 0;padding:8px 10px;margin:4px 0;">';
        h+='<strong>'+r.targetId+'</strong> <span style="color:'+C.gold+';font-size:11px;"> \xB7 '+r.type+'</span>';
        h+='<div style="font-size:11px;color:'+C.dim+';">'+r.description+'</div></div>';
      });
    }
    infoPanel.innerHTML=h;
  }

  renderMap();
  renderInfo();
}
