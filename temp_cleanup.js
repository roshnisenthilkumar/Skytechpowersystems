const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// 1. Remove the stabs inside ser-solar
html = html.replace(/<div class="service-panel active" id="ser-solar">\s*<div class="stabs">[\s\S]*?<\/div>/, '<div class="service-panel active" id="ser-solar">');

// 2. Remove the duplicated sp-ongrid opening tags
html = html.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<!-- ONGRID -->\s*<div class="spanel active" id="sp-ongrid">/, '</div></div></div>');

// 3. Change all spanel to just generic divs with margin inside service-panels
html = html.replace(/<div class="spanel active" id="[^"]+">/g, '<div style="margin-bottom:60px; padding-bottom:60px; border-bottom:1px solid #e2e8f0">');
html = html.replace(/<div class="spanel" id="[^"]+">/g, '<div style="margin-bottom:60px; padding-bottom:60px; border-bottom:1px solid #e2e8f0">');

// 4. Remove other inner stabs
html = html.replace(/<div class="service-panel" id="ser-ups">\s*<div class="stabs">[\s\S]*?<\/div>/, '<div class="service-panel" id="ser-ups">');
html = html.replace(/<div class="service-panel active" id="ser-it-computers">\s*<div class="stabs">[\s\S]*?<\/div>/, '<div class="service-panel active" id="ser-it-computers">');
html = html.replace(/<div class="service-panel" id="ser-it-batteries">\s*<div class="stabs">[\s\S]*?<\/div>/, '<div class="service-panel" id="ser-it-batteries">');
html = html.replace(/<div class="service-panel" id="ser-it-stabilizers">\s*<div class="stabs">[\s\S]*?<\/div>/, '<div class="service-panel" id="ser-it-stabilizers">');

fs.writeFileSync('public/index.html', html);
console.log('Done!');
