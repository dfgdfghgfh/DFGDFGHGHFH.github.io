# 🗺️ 世界地图

<script src="/data/map-data.js"></script>
<script src="/data/map-view.js"></script>
<div id="map-container" style="width:100%;height:600px;background:#1a1a24;border-radius:4px;overflow:hidden;position:relative;"></div>

<div id="map-info" style="margin-top:12px;padding:12px 16px;background:var(--md-code-bg-color);border-radius:6px;border-left:4px solid #c9a059;min-height:60px;">
  <span style="color:var(--md-default-fg-color--light);">点击地图上的标记点查看地点详情、人物和任务</span>
</div>

<script>
// 加载地图数据
Promise.all([
  fetch('/data/world-map.json').then(r=>r.json()),
  fetch('/data/人物志数据.json').then(r=>r.json())
]).then(([mapData, charData]) => {
  initMap('map-container', 'map-info', mapData, charData);
});
</script>
