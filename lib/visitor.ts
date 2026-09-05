export type VisitorEvent = { event_type: string; event_data?: Record<string, unknown>; last_page?: string };

export function visitorClientScript() {
  return `
    (function () {
      if (location.pathname === "/admin" || document.cookie.indexOf("admin_session=") !== -1) return;
      var id = sessionStorage.getItem("visitor_id");
      var started = Date.now();
      function post(url, body, beacon) {
        var payload = JSON.stringify(body);
        if (beacon && navigator.sendBeacon) navigator.sendBeacon(url, new Blob([payload], {type:"application/json"}));
        else fetch(url, {method:"POST", headers:{"Content-Type":"application/json"}, body:payload, keepalive:true}).catch(function(){});
      }
      if (!id) fetch("/api/visitor/start", {method:"POST", keepalive:true}).then(function(r){return r.json()}).then(function(x){
        if (x.visitor_id) { id=x.visitor_id; sessionStorage.setItem("visitor_id", id); post("/api/visitor/event",{visitor_id:id,event_type:"enter_site"}); }
      }).catch(function(){});
      window.__visitorEvent = function(type, data, page) { if (id) post("/api/visitor/event",{visitor_id:id,event_type:type,event_data:data||{},last_page:page||location.pathname}); };
      function end(){ if(id) post("/api/visitor/end",{visitor_id:id,duration_seconds:Math.round((Date.now()-started)/1000),last_page:location.pathname},true); }
      addEventListener("pagehide", end); document.addEventListener("visibilitychange", function(){if(document.visibilityState==="hidden") end();});
    })();
  `;
}
