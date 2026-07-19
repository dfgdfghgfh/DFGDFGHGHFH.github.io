# 🗺️ 世界地图

<div id="map-toolbar" style="display:flex;gap:4px;padding:6px 10px;background:#1a1a24;border-bottom:1px solid rgba(255,255,255,0.08);flex-wrap:wrap;"></div>
<div id="map-wrapper" style="display:flex;flex:1;overflow:hidden;background:#1a1a24;min-height:500px;position:relative;">
  <div id="map-svg-area" style="flex:1;position:relative;min-width:150px;"></div>
  <div id="map-info" style="width:320px;max-width:35%;min-width:200px;overflow-y:auto;border-left:1px solid rgba(255,255,255,0.08);padding:12px 14px;color:#d4cfc4;font-size:13px;flex-shrink:0;"></div>
</div>

<script src="../data/map-view.js"></script>
<script>
var mapContainer = document.getElementById('map-svg-area');
var mapInfo = document.getElementById('map-info');

// 修正过的路径 mapData 
var basePath = window.location.pathname.replace(/\/地图\/.*$/, '');
Promise.all([
  fetch(basePath + '/data/world-map.json').then(function(r) { return r.json(); }),
  fetch(basePath + '/data/人物志数据.json').then(function(r) { return r.json(); })
]).then(function(results) {
  initMap('map-svg-area', 'map-info', results[0], results[1]);
}).catch(function(err) {
  document.getElementById('map-info').innerHTML = '地图加载失败: ' + err.message;
});
</script>
