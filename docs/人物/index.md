# 👥 人物谱

<script src="/data/人物志数据.json"></script>
<script>
(function() {
  try {
    var data = %人物志数据%;
  } catch(e) { return; }
  
  var container = document.currentScript.parentElement;
  container.innerHTML = '';
  
  var sects = {};
  data.characters.forEach(function(ch) {
    if (!sects[ch.sect]) sects[ch.sect] = [];
    sects[ch.sect].push(ch);
  });
  
  var sectOrder = ['天渊宗','金刚门','万象阁','归一教','净言寺'];
  var sectColors = {'天渊宗':'#5eb3e8','金刚门':'#c04b3d','万象阁':'#5e8b7c','归一教':'#a78bfa','净言寺':'#c9a059'};
  
  var html = '';
  sectOrder.forEach(function(sect) {
    if (!sects[sect]) return;
    var color = sectColors[sect] || '#c9a059';
    html += '<h3 style="color:' + color + ';border-bottom:2px solid ' + color + ';padding-bottom:4px;margin-top:20px;">' + sect + ' (' + sects[sect].length + '人)</h3>';
    
    sects[sect].forEach(function(ch) {
      html += '<div style="background:var(--md-code-bg-color);border-left:3px solid ' + color + ';border-radius:0 6px 6px 0;padding:12px 14px;margin:8px 0;">';
      html += '<div style="display:flex;align-items:center;gap:10px;">';
      html += '<span style="font-size:28px;">' + (ch.avatar || '👤') + '</span>';
      html += '<div style="flex:1;">';
      html += '<div><strong style="font-size:16px;color:var(--md-typeset-color);">' + ch.name + '</strong>';
      html += ' <span style="background:' + color + '22;color:' + color + ';padding:1px 6px;border-radius:3px;font-size:11px;">' + ch.realm + '</span></div>';
      html += '<div style="font-size:12px;color:var(--md-default-fg-color--light);">' + ch.title + '</div></div></div>';
      html += '<div style="font-size:13px;line-height:1.6;margin-top:6px;color:var(--md-default-fg-color);">' + ch.description.substring(0, 120) + '...</div>';
      
      if (ch.relationships && ch.relationships.length > 0) {
        html += '<div style="margin-top:6px;font-size:11px;color:var(--md-default-fg-color--light);">';
        html += '<span style="font-weight:bold;">关系:</span> ';
        ch.relationships.forEach(function(r, i) {
          html += (i > 0 ? ' · ' : '') + r.targetId + '(' + r.type + ')';
        });
        html += '</div>';
      }
      html += '</div>';
    });
  });
  
  container.innerHTML = html;
})();
</script>

## 快速索引

| 宗门 | 人数 | 代表人物 |
|:----|:---:|:---------|
| 天渊宗 | 5 | 秋骊、陆明夷、秦不疑、商时序、卫芥舟 |
| 金刚门 | 5 | 钟山岳、铁髯、石婆婆、穆铁 |
| 万象阁 | 5 | 锦书、花影、段青崖、苏念、檀不语 |
| 归一教 | 5 | 太和子、殷不平、秦澈、司空鉴、蓝观鱼 |
| 净言寺 | 6 | 不语僧、释说、破诺、如念、澄心、静竹 |

完整人物详情请查看 [宗门人物志](../设定集/02.修仙体系扩展/14_宗门人物志.md)。
