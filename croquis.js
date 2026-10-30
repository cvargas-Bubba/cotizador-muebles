/* Croquis de la cotización: un dibujo acotado, hecho con líneas, rectángulos,
   texto y cotas sobre una grilla.

   Se guarda como vectores (listas de puntos), no como imagen: ocupa unos pocos
   KB en lugar de cientos, se puede seguir editando y sale nítido en el PDF,
   porque `figura()` devuelve la misma estructura que MQ.draw y la dibuja el
   mismo render de pdf.js. */
window.MQ = window.MQ || {};

MQ.croquis = (function () {
  const W = 1200, H = 800;   // unidades del lienzo
  const CELDA = 20;          // lado de un cuadro de la grilla
  const PASO = CELDA / 2;    // a esto se ajustan los puntos
  const MIN = 6;             // trazos más cortos que esto se descartan

  const nuevo = () => ({ escala: 100, objetos: [] });
  /* milímetros que mide una unidad del lienzo */
  const mmPorUnidad = (c) => MQ.num(c.escala, 100) / CELDA;

  const ajustar = (v, libre) => (libre ? Math.round(v) : Math.round(v / PASO) * PASO);
  const dentro = (v, max) => Math.max(0, Math.min(max, v));

  /* ---------- geometría ---------- */
  const largo = (o) => Math.hypot(o.x2 - o.x1, o.y2 - o.y1);

  function distanciaASegmento(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const l2 = dx * dx + dy * dy;
    if (!l2) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  /* El objeto que está bajo el punto, probando del último al primero para que
     gane el que se dibujó encima. */
  function objetoEn(c, x, y) {
    for (let i = c.objetos.length - 1; i >= 0; i--) {
      const o = c.objetos[i];
      if (o.t === "rect") {
        const x1 = Math.min(o.x, o.x + o.w), x2 = Math.max(o.x, o.x + o.w);
        const y1 = Math.min(o.y, o.y + o.h), y2 = Math.max(o.y, o.y + o.h);
        const borde = 10;
        const fuera = x < x1 - borde || x > x2 + borde || y < y1 - borde || y > y2 + borde;
        const adentro = x > x1 + borde && x < x2 - borde && y > y1 + borde && y < y2 - borde;
        if (!fuera && !adentro) return o;
      } else if (o.t === "texto") {
        /* ancho aproximado: el texto se dibuja centrado en (x, y) */
        const an = o.s.length * 7, al = 20;
        if (Math.abs(x - o.x) < an / 2 + 6 && Math.abs(y - o.y + al / 3) < al) return o;
      } else if (distanciaASegmento(x, y, o.x1, o.y1, o.x2, o.y2) < 10) return o;
    }
    return null;
  }

  function mover(o, dx, dy) {
    if (o.t === "rect") { o.x += dx; o.y += dy; }
    else if (o.t === "texto") { o.x += dx; o.y += dy; }
    else { o.x1 += dx; o.y1 += dy; o.x2 += dx; o.y2 += dy; }
  }

  /* ---------- dibujo ---------- */
  /* Devuelve {w, h, formas} igual que MQ.draw.figura, para que lo pinten tanto
     el SVG de la pantalla como el render en PDF. */
  function figura(c, opciones) {
    const op = opciones || {};
    const formas = [];
    const linea = (x1, y1, x2, y2, clase) => formas.push({ t: "linea", x1, y1, x2, y2, clase });
    const texto = (x, y, s, clase) => formas.push({ t: "texto", x, y, s: String(s), clase, anclaje: "centro" });

    if (op.grilla) {
      for (let x = CELDA; x < W; x += CELDA) linea(x, 0, x, H, "grid");
      for (let y = CELDA; y < H; y += CELDA) linea(0, y, W, y, "grid");
    }

    const mm = mmPorUnidad(c);
    (c.objetos || []).forEach((o) => {
      if (o.t === "rect") {
        formas.push({ t: "rect", x: Math.min(o.x, o.x + o.w), y: Math.min(o.y, o.y + o.h), w: Math.abs(o.w), h: Math.abs(o.h), clase: "trazo" });
      } else if (o.t === "texto") {
        texto(o.x, o.y, o.s, "rotulo");
      } else if (o.t === "cota") {
        linea(o.x1, o.y1, o.x2, o.y2, "cota");
        /* topes en los extremos, perpendiculares a la cota */
        const d = largo(o) || 1;
        const nx = -(o.y2 - o.y1) / d * 5, ny = (o.x2 - o.x1) / d * 5;
        linea(o.x1 - nx, o.y1 - ny, o.x1 + nx, o.y1 + ny, "cota");
        linea(o.x2 - nx, o.y2 - ny, o.x2 + nx, o.y2 + ny, "cota");
        const valor = o.mm != null ? o.mm : Math.round(largo(o) * mm);
        texto((o.x1 + o.x2) / 2, (o.y1 + o.y2) / 2 - 7, valor + " mm", "dm");
      } else {
        linea(o.x1, o.y1, o.x2, o.y2, "trazo");
      }
    });

    if (op.previa) formas.push(op.previa);

    /* marco del objeto seleccionado */
    const sel = op.sel && (c.objetos || []).find((o) => o.id === op.sel);
    if (sel) {
      const m = 8;
      let x1, y1, x2, y2;
      if (sel.t === "rect") {
        x1 = Math.min(sel.x, sel.x + sel.w); x2 = Math.max(sel.x, sel.x + sel.w);
        y1 = Math.min(sel.y, sel.y + sel.h); y2 = Math.max(sel.y, sel.y + sel.h);
      } else if (sel.t === "texto") {
        const an = sel.s.length * 7;
        x1 = sel.x - an / 2; x2 = sel.x + an / 2; y1 = sel.y - 16; y2 = sel.y + 6;
      } else {
        x1 = Math.min(sel.x1, sel.x2); x2 = Math.max(sel.x1, sel.x2);
        y1 = Math.min(sel.y1, sel.y2); y2 = Math.max(sel.y1, sel.y2);
      }
      formas.push({ t: "rect", x: x1 - m, y: y1 - m, w: x2 - x1 + m * 2, h: y2 - y1 + m * 2, clase: "sel" });
    }

    return { w: W, h: H, formas };
  }

  const vacio = (c) => !c || !(c.objetos || []).length;

  /* ---------- editor ---------- */
  /* Monta el editor sobre `cont`. `leer()` entrega el croquis en edición y
     `alCambiar()` avisa para guardar y repintar los controles. */
  function montar(cont, leer, alCambiar) {
    let herramienta = "sel";
    let libre = false;      // sin ajuste a la grilla
    let sel = null;         // id del objeto seleccionado
    let trazando = null;    // {x1, y1, x2, y2} mientras se arrastra
    let arrastre = null;    // {id, x, y} mientras se mueve un objeto
    const historia = [];

    const guardar = () => {
      historia.push(JSON.stringify(leer().objetos));
      if (historia.length > 30) historia.shift();
    };

    function pintar() {
      const c = leer();
      const previa = trazando ? (
        herramienta === "rect"
          ? { t: "rect", x: Math.min(trazando.x1, trazando.x2), y: Math.min(trazando.y1, trazando.y2), w: Math.abs(trazando.x2 - trazando.x1), h: Math.abs(trazando.y2 - trazando.y1), clase: "previa" }
          : { t: "linea", x1: trazando.x1, y1: trazando.y1, x2: trazando.x2, y2: trazando.y2, clase: "previa" }
      ) : null;
      cont.innerHTML = MQ.draw.svg(figura(c, { grilla: true, sel, previa }), "Croquis de la cotización");
    }

    /* punto del evento en coordenadas del lienzo */
    function punto(ev) {
      const svg = cont.querySelector("svg");
      const p = svg.createSVGPoint();
      p.x = ev.clientX; p.y = ev.clientY;
      const m = svg.getScreenCTM();
      const q = m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 };
      return { x: dentro(ajustar(q.x, libre), W), y: dentro(ajustar(q.y, libre), H) };
    }

    cont.addEventListener("pointerdown", (ev) => {
      const c = leer(), p = punto(ev);
      cont.setPointerCapture(ev.pointerId);

      if (herramienta === "sel") {
        const o = objetoEn(c, p.x, p.y);
        sel = o ? o.id : null;
        if (o) { guardar(); arrastre = { id: o.id, x: p.x, y: p.y }; }
        pintar(); alCambiar();
        return;
      }
      if (herramienta === "texto") {
        const s = (prompt("Texto del rótulo:") || "").trim();
        if (s) {
          guardar();
          c.objetos.push({ id: MQ.uid(), t: "texto", x: p.x, y: p.y, s });
          alCambiar();
        }
        pintar();
        return;
      }
      trazando = { x1: p.x, y1: p.y, x2: p.x, y2: p.y };
    });

    cont.addEventListener("pointermove", (ev) => {
      if (arrastre) {
        const c = leer(), p = punto(ev);
        const o = c.objetos.find((x) => x.id === arrastre.id);
        if (o) { mover(o, p.x - arrastre.x, p.y - arrastre.y); arrastre.x = p.x; arrastre.y = p.y; }
        pintar();
        return;
      }
      if (!trazando) return;
      const p = punto(ev);
      trazando.x2 = p.x; trazando.y2 = p.y;
      pintar();
    });

    function soltar() {
      if (arrastre) { arrastre = null; alCambiar(); return; }
      if (!trazando) return;
      const t = trazando; trazando = null;
      const c = leer();
      const chico = herramienta === "rect"
        ? Math.abs(t.x2 - t.x1) < MIN || Math.abs(t.y2 - t.y1) < MIN
        : Math.hypot(t.x2 - t.x1, t.y2 - t.y1) < MIN;
      if (!chico) {
        guardar();
        if (herramienta === "rect") c.objetos.push({ id: MQ.uid(), t: "rect", x: t.x1, y: t.y1, w: t.x2 - t.x1, h: t.y2 - t.y1 });
        else c.objetos.push({ id: MQ.uid(), t: herramienta === "cota" ? "cota" : "linea", x1: t.x1, y1: t.y1, x2: t.x2, y2: t.y2 });
        alCambiar();
      }
      pintar();
    }
    cont.addEventListener("pointerup", soltar);
    cont.addEventListener("pointercancel", soltar);

    return {
      pintar,
      herramienta(h) { herramienta = h; sel = null; pintar(); },
      ajuste(v) { libre = !v; },
      haySeleccion: () => !!sel,
      borrar() {
        const c = leer();
        if (!sel) return false;
        guardar();
        c.objetos = c.objetos.filter((o) => o.id !== sel);
        sel = null; pintar(); alCambiar();
        return true;
      },
      deshacer() {
        if (!historia.length) return false;
        leer().objetos = JSON.parse(historia.pop());
        sel = null; pintar(); alCambiar();
        return true;
      },
      limpiar() {
        guardar();
        leer().objetos = [];
        sel = null; pintar(); alCambiar();
      }
    };
  }

  return { nuevo, figura, montar, vacio, mmPorUnidad, W, H, CELDA };
})();
