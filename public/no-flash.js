try{var p=JSON.parse(localStorage.getItem('sf-display')||'{}');
if(p.contrast==='high')document.documentElement.setAttribute('data-contrast','high');
if(p.ambient==='off')document.documentElement.setAttribute('data-ambient','off');}catch(e){}

try{var t=localStorage.getItem('sf-theme');if(t&&/^[a-z]+-[a-z]+$/.test(t)&&t!=='void-teal'){var h=document.documentElement;h.setAttribute('data-theme',t);if(/^(paper|sky|fog|dawn)-/.test(t)){h.classList.remove('dark');h.classList.add('light');}}}catch(e){}
