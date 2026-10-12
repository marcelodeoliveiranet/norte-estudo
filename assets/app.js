(function(){
  var body=document.body, chave=body.dataset.chave, prefixo=body.dataset.prefixo||"";
  var P="norte-estudo:";
  function ler(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function gravar(k,v){try{if(v)localStorage.setItem(k,"1");else localStorage.removeItem(k)}catch(e){}}

  // tema (escuro por padrão)
  var raiz=document.documentElement;
  try{if(localStorage.getItem(P+"tema")==="claro")raiz.dataset.tema="claro"}catch(e){}
  var bt=document.getElementById("tema");
  if(bt)bt.addEventListener("click",function(){
    var claro=raiz.dataset.tema!=="claro";
    if(claro)raiz.dataset.tema="claro";else delete raiz.dataset.tema;
    try{localStorage.setItem(P+"tema",claro?"claro":"escuro")}catch(e){}
  });

  // índice lateral no celular
  var abrir=document.getElementById("abrir-indice");
  if(abrir)abrir.addEventListener("click",function(){body.classList.toggle("indice-aberto")});
  document.querySelectorAll(".indice a").forEach(function(a){
    a.addEventListener("click",function(){body.classList.remove("indice-aberto")});
  });

  // copiar código
  document.querySelectorAll("pre").forEach(function(pre){
    var b=document.createElement("button");b.className="copiar";b.type="button";b.textContent="Copiar";
    b.addEventListener("click",function(){
      var t=pre.querySelector("code").innerText;
      (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){
        b.textContent="Copiado";setTimeout(function(){b.textContent="Copiar"},1200);
      },function(){b.textContent="Selecione e copie"});
    });
    pre.appendChild(b);
  });

  // entradas estudadas
  function marcar(id,feita){
    var btn=document.querySelector('.estudada[data-id="'+id+'"]');
    if(btn){btn.classList.toggle("feita",feita);btn.textContent=feita?"✓ Estudada":"Marcar como estudada";}
    var lat=document.querySelector('.indice a[data-id="'+id+'"]');
    if(lat)lat.classList.toggle("feita",feita);
  }
  document.querySelectorAll(".estudada").forEach(function(btn){
    var id=btn.dataset.id, k=P+chave+"#"+id;
    marcar(id,!!ler(k));
    btn.addEventListener("click",function(){
      var nova=!btn.classList.contains("feita");
      gravar(k,nova);marcar(id,nova);
    });
  });

  // seção atual no índice lateral
  var links={};document.querySelectorAll(".indice a").forEach(function(a){links[a.dataset.id]=a});
  if("IntersectionObserver" in window){
    var obs=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){
          Object.keys(links).forEach(function(k){links[k].classList.remove("atual")});
          var a=links[e.target.id];if(a)a.classList.add("atual");
        }
      });
    },{rootMargin:"-70px 0px -75% 0px"});
    document.querySelectorAll("article h1[id],article h2[id]").forEach(function(h){obs.observe(h)});
  }

  // progresso nos cartões da página inicial
  document.querySelectorAll(".cartao[data-total]").forEach(function(c){
    var total=+c.dataset.total;if(!total)return;
    var feitas=0,pref=P+c.dataset.chave+"#";
    try{for(var i=0;i<localStorage.length;i++){if(localStorage.key(i).indexOf(pref)===0)feitas++}}catch(e){}
    c.querySelector(".progresso").textContent=feitas+" de "+total+" entradas estudadas";
  });

  // busca
  var campo=document.getElementById("busca"), box=document.getElementById("resultados"), dados=null;
  function sa(s){return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")}
  function carregar(cb){
    if(!dados&&window.NORTE_INDICE)dados=window.NORTE_INDICE;
    if(dados)return cb();
    fetch(prefixo+"search-index.json").then(function(r){return r.json()}).then(function(d){dados=d;cb()});
  }
  function buscar(){
    var q=sa(campo.value.trim());
    if(q.length<2){box.hidden=true;return}
    var termos=q.split(/\s+/);
    var achados=[];
    dados.forEach(function(d){
      var t=sa(d.t),pts=0;
      for(var i=0;i<termos.length;i++){
        if(t.indexOf(termos[i])>=0)pts+=5;
        else if(d.n.indexOf(termos[i])>=0)pts+=1;
        else return;
      }
      achados.push({d:d,p:pts});
    });
    achados.sort(function(a,b){return b.p-a.p});
    box.innerHTML="";
    if(!achados.length){box.innerHTML="<small style='padding:10px;display:block'>Nada encontrado.</small>";box.hidden=false;return}
    achados.slice(0,20).forEach(function(x){
      var a=document.createElement("a");a.href=prefixo+x.d.p+"#"+x.d.i;
      var i=sa(x.d.x).indexOf(termos[0]);
      var trecho=i>=0?x.d.x.substr(Math.max(0,i-40),120):x.d.x.substr(0,120);
      a.innerHTML="<b></b><small></small>";
      a.querySelector("b").textContent=x.d.t;
      a.querySelector("small").textContent=x.d.pt+" — …"+trecho+"…";
      box.appendChild(a);
    });
    box.hidden=false;
  }
  if(campo){
    campo.addEventListener("input",function(){carregar(buscar)});
    campo.addEventListener("keydown",function(e){
      if(e.key==="Enter"){e.preventDefault();carregar(function(){buscar();var p=box.querySelector("a");if(p)location.href=p.href})}
    });
    campo.addEventListener("focus",function(){carregar(buscar)});
    document.addEventListener("click",function(e){if(!e.target.closest(".busca"))box.hidden=true});
    document.addEventListener("keydown",function(e){
      if(e.key==="Escape"){box.hidden=true;campo.blur()}
      if(e.key==="/"&&document.activeElement!==campo&&!/input|textarea/i.test(document.activeElement.tagName)){e.preventDefault();campo.focus()}
    });
  }
})();