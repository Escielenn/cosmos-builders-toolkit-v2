try{var p=JSON.parse(localStorage.getItem('sf-display')||'{}');
if(p.contrast==='high')document.documentElement.setAttribute('data-contrast','high');
if(p.ambient==='off')document.documentElement.setAttribute('data-ambient','off');}catch(e){}
