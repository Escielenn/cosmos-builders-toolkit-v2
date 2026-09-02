try{var p=JSON.parse(localStorage.getItem('sf-display')||'{}');
if(p.contrast==='high')document.documentElement.setAttribute('data-contrast','high');
if(p.ambient==='off')document.documentElement.setAttribute('data-ambient','off');}catch(e){}

try{var t=localStorage.getItem('sf-theme');if(t&&/^[a-z]+-[a-z]+$/.test(t)&&t!=='void-teal')document.documentElement.setAttribute('data-theme',t);}catch(e){}
