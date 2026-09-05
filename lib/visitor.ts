export type VisitorEvent = { event_type: string; event_data?: Record<string, unknown>; last_page?: string };

export function visitorClientScript() {
  return `
    (function () {
      var pathname = location.pathname;
      var skip = pathname.startsWith("/admin");
      if (skip) return;
      var id = sessionStorage.getItem("visitor_id");
      var sessionId = sessionStorage.getItem("visitor_session_id");
      var started = Date.now();
      var ended = false;
      var pending = [];
      function post(url, body, beacon) {
        var payload = JSON.stringify(body);
        if (beacon && navigator.sendBeacon) navigator.sendBeacon(url, new Blob([payload], {type:"application/json"}));
        else fetch(url, {method:"POST", headers:{"Content-Type":"application/json"}, body:payload, keepalive:true}).catch(function(){});
      }
      function postEvent(type, data, page) {
        if (!id && !sessionId) return;
        var metadata = data || {};
        post("/api/visitor/event", {
          visitor_id: id,
          session_id: sessionId,
          event_type: type,
          event_data: metadata,
          metadata: metadata,
          page: page || location.pathname,
          last_page: page || location.pathname
        });
      }
      function flushPending() {
        pending.splice(0).forEach(function (item) { postEvent(item.type, item.data, item.page); });
      }
      window.__visitorEvent = function(type, data, page) {
        if (id || sessionId) postEvent(type, data, page);
        else pending.push({type:type, data:data, page:page});
      };
      function recordPageOpen() {
        postEvent("page_open", {path: pathname}, pathname);
      }
      if (!id || !sessionId) {
        fetch("/api/visitor/start", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({pathname: pathname, visitor_id: id, timestamp: new Date().toISOString()}),
          keepalive:true
        }).then(function(r){return r.json()}).then(function(x){
          if (x.visitor_id) { id=x.visitor_id; sessionStorage.setItem("visitor_id", id); }
          if (x.session_id) { sessionId=x.session_id; sessionStorage.setItem("visitor_session_id", sessionId); }
          flushPending();
          recordPageOpen();
          postEvent("enter_site", {}, pathname);
        }).catch(function(){});
      } else {
        // Reloads reuse the same visit while still recording each page open.
        recordPageOpen();
      }
      function end(){
        if (ended || (!id && !sessionId)) return;
        ended = true;
        post("/api/visitor/end", {
          visitor_id:id,
          session_id:sessionId,
          duration_seconds:Math.round((Date.now()-started)/1000),
          last_page:location.pathname,
          exit_page:location.pathname
        }, true);
      }
      addEventListener("pagehide", end); document.addEventListener("visibilitychange", function(){if(document.visibilityState==="hidden") end();});
    })();
  `;
}
