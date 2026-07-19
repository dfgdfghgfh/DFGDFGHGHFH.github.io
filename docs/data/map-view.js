// 设定集Wiki — 世界地图交互（浏览器独立版）
function initMap(containerId, infoId, mapData, charData) {
  var container = document.getElementById(containerId);
  var infoPanel = document.getElementById(infoId);
  if (!container || !mapData) return;

  var W = 800, H = 600;
  var S = 'http://www.w3.org/2000/svg';
  var selectedLoc = null;
  var selectedChar = null;
  var activeFilter = 'all';

  var C = { bg:'#1a1a24', surface:'rgba(37,37,48,0.4)', text:'#d4cfc4', dim:'rgba(212,207,196,0.5)', bright:'#f0ead8', gold:'#c9a059', jade:'#5e8b7c', purple:'#a78bfa', red:'#c04b3d', blue:'#5eb3e8', border:'rgba(255,255,255,0.08)' };
  var SC = { '天渊宗':'#5eb3e8','金刚门':'#c04b3d','万象阁':'#5e8b7c','归一教':'#a78bfa','净言寺':'#c9a059' };
  var SO = ['天渊宗','金刚门','万象阁','归一教','净言寺'];
  var RL = { mortal:'散修',qi_refining:'炼气',foundation:'筑基',core_formation:'金丹',nascent_soul:'元婴',spirit_severing:'化神',tribulation:'渡劫',ascension:'大乘' };
  var TM = { sect_gate:'宗门',landmark:'地标',city:'坊市',dungeon:'秘境',special:'特殊',mystery:'秘地',ruins:'遗迹',encounter:'资源',danger:'危险' };

  function sectIdx(n) { var i=SO.indexOf(n); return i>=0?i:99; }
  function realmLevel(r) { return {mortal:0,qi_refining:1,foundation:2,core_formation:3,nascent_soul:4,spirit_severing:5,tribulation:6,ascension:7}[r]||0; }

  function centerOf(d) { var nums=d.match(/[\d.]+/g); if(!nums||nums.length<4) return {x:400,y:300}; var sx=0,sy=0,n=0; for(var i=0;i<nums.length-1;i+=2){sx+=+nums[i];sy+=+nums[i+1];n++;} return {x:sx/n,y:sy/n}; }

  function mkSvg(tag,attrs,parent) {
    var el = document.createElementNS(S,tag);
    for(var k in attrs) el.setAttribute(k,attrs[k]);
    (parent||svg).appendChild(el);
    return el;
  }
  function mkText(tag,attrs,text,parent) {
    var el = mkSvg(tag,attrs,parent);
    el.textContent = text;
    return el;
  }

  function render() {
    container.innerHTML = '';

    // 工具栏
    var toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex;gap:4px;padding:6px 10px;border-bottom:1px solid '+C.border+';background:'+C.bg+';';
    [['all','全部'],['sect','宗门'],['dungeon','秘境'],['special','特殊'],['danger','危险']].forEach(function(f) {
      var a=activeFilter===f[0];
      var b=document.createElement('button');
      b.textContent=f[1];
      b.style.cssText='background:'+(a?C.jade:'transparent')+';color:'+(a?'#fff':C.dim)+';border:1px solid '+(a?C.jade:C.border)+';padding:3px 10px;border-radius:4px;cursor:pointer;font-size:12px;font-family:inherit;';
      b.onclick=function(){activeFilter=f[0];render();};
      toolbar.appendChild(b);
    });
    container.appendChild(toolbar);

    // SVG 地图
    var svgWrap = document.createElement('div');
    svgWrap.style.cssText = 'flex:1;position:relative;background:'+C.bg+';';
    container.appendChild(svgWrap);
    container.style.cssText = 'display:flex;flex-direction:column;height:100%;';

    var svg = document.createElementNS(S,'svg');
    svg.setAttribute('viewBox','0 0 '+W+' '+H);
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    svg.style.cssText = 'display:block;width:100%;height:100%;';
    svgWrap.appendChild(svg);

    // defs
    var defs = mkSvg('defs',{},svg);
    defs.innerHTML = '<filter id="g"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';

    // 底图
    mkSvg('rect',{width:String(W),height:String(H),fill:C.bg},svg);
    (mapData.continents||[]).forEach(function(c){ mkSvg('path',{d:c.d,fill:c.color,stroke:'rgba(255,255,255,0.06)','stroke-width':'1'},svg); });

    // 领地
    var st = (mapData.territories||[]).sort(function(a,b){return sectIdx(a.name)-sectIdx(b.name);});
    st.forEach(function(t){
      mkSvg('path',{d:t.d,fill:t.color,stroke:t.stroke,'stroke-width':'1.5','stroke-dasharray':'4,3'},svg);
      var ct=centerOf(t.d);
      mkText('text',{x:ct.x,y:ct.y,'text-anchor':'middle','dominant-baseline':'middle',fill:t.stroke,'font-size':'11',opacity:'0.5',style:'font-family:serif;'},t.name,svg);
    });

    // 荒野
    (mapData.regions||[]).forEach(function(r){
      mkSvg('path',{d:r.d,fill:r.color,stroke:r.stroke,'stroke-width':'1','stroke-dasharray':'3,4'},svg);
      var rc=centerOf(r.d);
      mkText('text',{x:rc.x,y:rc.y,'text-anchor':'middle','dominant-baseline':'middle',fill:'rgba(255,255,255,0.15)','font-size':'10',style:'font-family:serif;'},r.name,svg);
    });

    // 连线
    var lm={}; (mapData.locations||[]).forEach(function(l){lm[l.id]=l;});
    (mapData.connections||[]).forEach(function(cn){
      var f=lm[cn.from],t=lm[cn.to];
      if(!f||!t)return;
      mkSvg('line',{x1:cn?String(f.x):'0',y1:String(f.y),x2:String(t.x),y2:String(t.y),stroke:'rgba(255,255,255,0.07)','stroke-width':'1','stroke-dasharray':cn.dashed?'4,4':'none'},svg);
      mkText('text',{x:String((f.x+t.x)/2),y:String((f.y+t.y)/2-6),'text-anchor':'middle',fill:'rgba(255,255,255,0.1)','font-size':'7',style:'font-family:serif;'},cn.label,svg);
    });

    // 标记
    var fl = (mapData.locations||[]).filter(function(l){
      if(activeFilter==='all')return true;
      if(activeFilter==='sect')return ['sect_gate','landmark','city'].includes(l.type);
      if(activeFilter==='dungeon')return l.type==='dungeon';
      if(activeFilter==='special')return ['special','ruins','mystery','encounter'].includes(l.type);
      return l.type==='danger';
    });
    fl.sort(function(a,b){
      var ta=a.sect?0:99,tb=b.sect?0:99;
      if(ta!==tb)return ta-tb;
      if(a.sect&&b.sect){var ss=sectIdx(a.sect)-sectIdx(b.sect);if(ss!==0)return ss;}
      return a.name.localeCompare(b.name,'zh-CN');
    });

    fl.forEach(function(loc){
      var g=mkSvg('g',{style:'cursor:pointer;'},svg);
      var r=loc.type==='sect_gate'?7:loc.type==='dungeon'?5:6;
      var mc=loc.sect?(SC[loc.sect]||C.gold):loc.type==='dungeon'?C.blue:loc.type==='danger'?C.red:C.gold;
      var sel=selectedLoc&&selectedLoc.id===loc.id;

      if(sel) mkSvg('circle',{cx:String(loc.x),cy:String(loc.y),r:String(r+6),fill:'none',stroke:mc,'stroke-width':'2.5',opacity:'0.7',filter:'url(#g)'},g);
      mkSvg('circle',{cx:String(loc.x),cy:String(loc.y),r:String(r),fill:mc,stroke:sel?'#fff':C.bg,'stroke-width':'1.5'},g);
      mkText('text',{x:String(loc.x),y:String(loc.y+1),'text-anchor':'middle','dominant-baseline':'central','font-size':'10'},loc.icon||'📍',g);

      var lb=mkText('text',{x:String(loc.x),y:String(loc.y-r-7),'text-anchor':'middle',fill:sel?C.gold:C.dim,'font-size':sel?'11':'9','font-weight':sel?'bold':'normal',style:'font-family:serif;pointer-events:none;'},loc.name,g);

      g.onclick=function(){selectedLoc=loc;selectedChar=null;renderInfo();render();};
      g.onmouseenter=function(){lb.setAttribute('fill',C.gold);lb.setAttribute('font-size','11');};
      g.onmouseleave=function(){if(!sel){lb.setAttribute('fill',C.dim);lb.setAttribute('font-size','9');}};
    });

    // 图例
    var leg=document.createElement('div');
    leg.style.cssText='position:absolute;bottom:6px;left:8px;display:flex;gap:8px;background:'+C.bg+';padding:3px 8px;border-radius:4px;border:1px solid '+C.border+';';
    [[C.jade,'宗门'],[C.blue,'秘境'],[C.gold,'特殊'],[C.red,'危险']].forEach(function(e){
      var sp=document.createElement('span');
      sp.style.cssText='display:inline-flex;align-items:center;gap:3px;font-size:10px;color:'+C.dim+';';
      var dot=document.createElement('span');
      dot.style.cssText='width:6px;height:6px;border-radius:50%;background:'+e[0]+';display:inline-block;';
      sp.appendChild(dot);
      sp.appendChild(document.createTextNode(' '+e[1]));
      leg.appendChild(sp);
    });
    svgWrap.appendChild(leg);
  }

  function renderInfo() {
    if(!infoPanel)return;
    if(selectedLoc) renderLocInfo();
    else infoPanel.innerHTML='<span style="color:var(--md-default-fg-color--light);">点击地图上的标记点查看详情</span>';
  }

  function renderLocInfo() {
    var loc=selectedLoc;
    if(!loc){infoPanel.innerHTML='';return;}
    var mc=loc.sect?(SC[loc.sect]||C.gold):loc.type==='dungeon'?C.blue:C.gold;
    var html='';
    html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">';
    html+='<span style="font-size:24px;">'+(loc.icon||'📍')+'</span>';
    html+='<div style="font-size:18px;font-weight:bold;color:'+C.gold+';">'+loc.name+'</div></div>';
    html+='<div style="display:flex;gap:6px;margin-bottom:8px;">';
    html+='<span style="background:'+C.surface+';padding:2px 8px;border-radius:4px;font-size:11px;">'+(TM[loc.type]||loc.type)+'</span>';
    if(loc.sect) html+='<span style="background:'+mc+'33;color:'+mc+';padding:2px 8px;border-radius:4px;font-size:11px;">'+loc.sect+'</span>';
    html+='</div>';
    html+='<div style="font-size:13px;line-height:1.6;color:'+C.text+';margin-bottom:10px;">'+loc.description+'</div>';

    // 人物
    if(charData){
      var chs=charData.characters.filter(function(c){return c.locationId===loc.id;});
      chs.sort(function(a,b){return realmLevel(b.realm)-realmLevel(a.realm);});
      if(chs.length>0){
        html+='<div style="font-weight:bold;color:'+C.jade+';margin:10px 0 4px;font-size:14px;">此地人物 ('+chs.length+')</div>';
        chs.forEach(function(ch){
          var sc2=SC[ch.sect]||C.gold;
          html+='<div style="background:'+C.surface+';border-left:3px solid '+sc2+';border-radius:0 6px 6px 0;padding:8px 10px;margin:4px 0;cursor:pointer;" onclick="selectChar(\''+ch.id+'\')">';
          html+='<div style="display:flex;align-items:center;gap:8px;">';
          html+='<span style="font-size:18px;">'+(ch.avatar||'👤')+'</span>';
          html+='<div style="flex:1;"><strong>'+ch.name+'</strong> <span style="background:'+sc2+'22;color:'+sc2+';padding:1px 5px;border-radius:3px;font-size:10px;">'+ch.realm+'</span>';
          html+='<div style="font-size:11px;color:'+C.dim+';">'+ch.title+'</div></div></div></div>';
        });
      }
    }

    infoPanel.innerHTML=html;
  }

  // 字符选择 - 暴露到全局
  window.selectChar = function(charId) {
    if(!charData)return;
    var ch=charData.characters.find(function(c){return c.id===charId;});
    if(!ch)return;
    selectedChar=ch;
    renderCharInfo();
  };

  function renderCharInfo() {
    var ch=selectedChar;
    if(!ch){renderInfo();return;}
    var sc2=SC[ch.sect]||C.gold;
    var html='';
    html+='<div style="margin-bottom:6px;"><button onclick="backToLoc()" style="background:transparent;color:'+C.gold+';border:1px solid '+C.border+';padding:3px 10px;border-radius:4px;cursor:pointer;font-size:11px;">← 返回地点</button></div>';
    html+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">';
    html+='<span style="font-size:32px;">'+(ch.avatar||'👤')+'</span>';
    html+='<div><div style="font-size:18px;font-weight:bold;color:'+C.gold+';">'+ch.name+'</div>';
    html+='<div style="font-size:12px;color:'+C.dim+';">'+ch.title+'</div></div></div>';
    html+='<div style="display:flex;gap:6px;margin-bottom:8px;">';
    html+='<span style="background:'+sc2+'33;color:'+sc2+';padding:2px 8px;border-radius:4px;font-size:11px;">'+ch.sect+'</span>';
    html+='<span style="background:'+C.surface+';padding:2px 8px;border-radius:4px;font-size:11px;">'+ch.realm+'期</span></div>';
    html+='<div style="font-size:12px;line-height:1.6;color:'+C.dim+';margin-bottom:8px;">'+ch.description+'</div>';

    if(ch.relationships&&ch.relationships.length>0){
      html+='<div style="font-weight:bold;color:'+C.purple+';margin:8px 0 4px;font-size:13px;">人际关系 ('+ch.relationships.length+')</div>';
      ch.relationships.forEach(function(r){
        html+='<div style="background:'+C.surface+';border-left:3px solid '+C.gold+';border-radius:0 6px 6px 0;padding:8px 10px;margin:4px 0;">';
        html+='<strong>'+r.targetId+'</strong> <span style="color:'+C.gold+';font-size:11px;">\xB7 '+r.type+'</span>';
        html+='<div style="font-size:11px;color:'+C.dim+';">'+r.description+'</div></div>';
      });
    }

    infoPanel.innerHTML=html;
  }

  window.backToLoc = function() {
    selectedChar=null;
    renderInfo();
  };

  render();
  renderInfo();
}
