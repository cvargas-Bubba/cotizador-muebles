/* Persistencia en el navegador. Catálogo, empresa, cotizaciones y borrador
   quedan en localStorage de este equipo: no se comparten entre dispositivos. */
window.MQ = window.MQ || {};

MQ.store = (function () {
  const P = "mq.";
  const LS = {
    get(k) { try { const v = localStorage.getItem(P + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };

  /* Un catálogo guardado con una versión anterior puede no traer todas las
     claves: se completa con los valores de referencia. */
  function mergeCatalogo(c) {
    const d = MQ.clone(MQ.DEFAULT_CATALOGO);
    if (!c) return d;
    const out = MQ.clone(d);
    if (Array.isArray(c.tableros) && c.tableros.length) out.tableros = MQ.clone(c.tableros);
    if (Array.isArray(c.cantos) && c.cantos.length) out.cantos = MQ.clone(c.cantos);
    ["herrajes", "mano"].forEach((g) => {
      Object.keys(out[g]).forEach((k) => {
        if (c[g] && c[g][k]) out[g][k] = Object.assign(out[g][k], c[g][k]);
      });
    });
    out.params = Object.assign(out.params, c.params || {});
    return out;
  }
  const mergeEmpresa = (e) => Object.assign(MQ.clone(MQ.DEFAULT_EMPRESA), e || {});
  const ordenar = (a) => a.sort((x, y) => (y.numero || 0) - (x.numero || 0) || String(y.actualizado || "").localeCompare(String(x.actualizado || "")));

  const S = {
    catalogo: mergeCatalogo(LS.get("catalogo")),
    empresa: mergeEmpresa(LS.get("empresa")),
    quotes: ordenar(LS.get("quotes") || []),
    listeners: []
  };
  const emit = (kind) => S.listeners.forEach((fn) => fn(kind));
  S.on = (fn) => S.listeners.push(fn);

  S.saveCatalogo = function (c) {
    S.catalogo = mergeCatalogo(c); LS.set("catalogo", S.catalogo); emit("catalogo");
  };
  S.resetCatalogo = function () {
    S.catalogo = MQ.clone(MQ.DEFAULT_CATALOGO); LS.set("catalogo", S.catalogo); emit("catalogo");
  };
  S.saveEmpresa = function (e) {
    S.empresa = mergeEmpresa(e); LS.set("empresa", S.empresa); emit("empresa");
  };

  S.nextNumero = () => S.quotes.reduce((mx, q) => Math.max(mx, q.numero || 0), 0) + 1;

  S.saveQuote = function (q) {
    const body = MQ.clone(q);
    if (!body.numero) body.numero = S.nextNumero();
    body.actualizado = new Date().toISOString();
    const i = S.quotes.findIndex((x) => x.id === body.id);
    if (i >= 0) S.quotes[i] = body; else S.quotes.push(body);
    ordenar(S.quotes); LS.set("quotes", S.quotes); emit("quotes");
    return body;
  };

  S.deleteQuote = function (id) {
    S.quotes = S.quotes.filter((q) => q.id !== id); LS.set("quotes", S.quotes); emit("quotes");
  };

  S.loadDraft = () => LS.get("draft");
  S.saveDraft = (q) => LS.set("draft", q);

  return S;
})();
