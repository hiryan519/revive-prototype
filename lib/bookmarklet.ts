export function resolveAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export function buildBookmarkletHref(appUrl: string) {
  const apiUrl = `${appUrl.replace(/\/+$/, "").replace(/'/g, "\\'")}/api/bookmarklet-import`;
  const fallbackUrlBase = `${appUrl.replace(/\/+$/, "").replace(/'/g, "\\'")}/bookmarklet/import?url=`;
  const script = `(function(){var url=location.href;var api='${apiUrl}';var fallbackBase='${fallbackUrlBase}';function showToast(msg,isError){var existing=document.getElementById('revive-toast');if(existing)existing.remove();var toast=document.createElement('div');toast.id='revive-toast';toast.style.cssText=['position:fixed','bottom:24px','right:24px','padding:12px 20px','border-radius:8px','font-size:14px','font-family:sans-serif','color:#fff','z-index:999999','box-shadow:0 4px 12px rgba(0,0,0,0.15)','transition:opacity 0.3s','background:'+(isError?'#e53e3e':'#2D7DD2')].join(';');toast.innerText=msg;document.body.appendChild(toast);setTimeout(function(){toast.style.opacity='0';setTimeout(function(){toast.remove();},300);},3000);}function openFallback(){window.open(fallbackBase+encodeURIComponent(url),'_blank','noopener,noreferrer,width=520,height=680');}showToast('正在加入最近收藏...');fetch(api,{method:'POST',mode:'cors',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:url})}).then(function(res){return res.json().catch(function(){return {success:false,error:'导入失败，请稍后重试'};});}).then(function(data){if(data.success){showToast('✓ 已加入最近收藏');}else{showToast('当前网页限制直接导入，正在打开 Revive 继续处理...');openFallback();}}).catch(function(){showToast('当前网页限制直接导入，正在打开 Revive 继续处理...');openFallback();});})();`;
  return `javascript:${script}`;
}
