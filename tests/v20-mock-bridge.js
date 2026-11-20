// v2.0 TEST FIXTURE ONLY. Never loaded by a published game.
(function(){
 const registered=new Set(),disconnected=new Set();
 window.Playroom={
   async insertCoin(){return true},
   onTikTokLiveEvent(fn){registered.add(fn);return()=>registered.delete(fn)},
   onDisconnect(fn){disconnected.add(fn);return()=>disconnected.delete(fn)}
 };
 window.__mockTikTok={
   mock:true,
   active(){return registered.size},
   emit(type,data){const ev={type,data}; for(const fn of [...registered])fn(ev)},
   disconnect(){for(const fn of [...disconnected])fn()},
   count(){return registered.size}
 };
})();
