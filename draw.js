/* Esquema frontal del mueble en SVG, a escala, con las medidas acotadas. */
window.MQ = window.MQ || {};

MQ.draw = (function () {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  function esquema(m, cat) {
    const t = MQ.tipo(m.tipo);
    const usa = (p) => t.partes.indexOf(p) >= 0;
    const tab = cat.tableros.find((x) => x.id === m.mat.cuerpo) || cat.tableros[0];
    const e = tab.espesor;

    const A = Math.max(1, m.ancho), H = Math.max(1, m.alto);
    const W = 420, Hv = 320, pad = 46;
    const k = Math.min((W - pad * 2) / A, (Hv - pad * 2) / Math.max(H, 120));
    const w = A * k, h = Math.max(H * k, 8);
    const x0 = (W - w) / 2, y0 = (Hv - h) / 2;

    const p = [];
    const rect = (x, y, rw, rh, cls) => p.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(0.5, rw).toFixed(1)}" height="${Math.max(0.5, rh).toFixed(1)}" class="${cls}"/>`);
    const texto = (x, y, s, cls) => p.push(`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="${cls || "dm"}">${esc(s)}</text>`);

    if (m.tipo === "cubierta") {
      rect(x0, y0, w, Math.max(h, 14), "cuerpo");
      texto(W / 2, y0 + Math.max(h, 14) / 2 + 4, "cubierta", "dl");
    } else {
      rect(x0, y0, w, h, "cuerpo");

      const g = MQ.calc.geometria(m, cat);
      const nCaj = g.nCaj, nPu = g.nPuertas;
      const hCaj = g.hCaj * k;
      const zonaCaj = g.zonaCajones * k;
      const hZoc = usa("zocalo") && m.zocalo ? MQ.calc.ALTO_ZOCALO * k : 0;
      const wCol = g.anchoCol * k;

      /* con columna propia los cajones se apilan abajo en la primera columna;
         si no, cruzan todo el ancho por arriba */
      const xCaj = x0 + 2;
      const wCaj = g.colCaj ? wCol - 3 : w - 4;
      const yCaj = g.colCaj ? y0 + h - hZoc - 2 - nCaj * hCaj : y0 + 2;
      for (let i = 0; i < nCaj; i++) rect(xCaj, yCaj + i * hCaj, wCaj, hCaj - 3, "frente");

      /* puertas */
      const yPu = y0 + zonaCaj + 2;
      const hPu = h - zonaCaj - hZoc - 4;
      const xPu = x0 + 2 + (g.colCaj ? wCol : 0);
      if (nPu > 0 && hPu > 6) {
        for (let i = 0; i < nPu; i++) {
          rect(xPu + i * wCol, yPu, wCol - 2, hPu, "frente");
          /* tirador */
          const cx = xPu + i * wCol + (i % 2 === 0 ? wCol - 10 : 6);
          p.push(`<circle cx="${cx.toFixed(1)}" cy="${(yPu + hPu / 2).toFixed(1)}" r="2.6" class="tir"/>`);
        }
      } else if (usa("entrepanos")) {
        /* sin puertas se ven los entrepaños */
        const n = Math.max(0, Math.round(m.entrepanos));
        const libre = h - zonaCaj - hZoc;
        for (let i = 1; i <= n; i++) {
          const y = y0 + zonaCaj + (libre * i) / (n + 1);
          rect(x0 + 2, y, w - 4, Math.max(1.5, e * k), "entrepano");
        }
      }
      if (hZoc > 0) rect(x0 + 2, y0 + h - hZoc, w - 4, hZoc - 2, "zocalo");
      if (usa("barra") && m.barra) {
        /* la barra cruza solo la zona de colgar, no la columna de cajones */
        const y = y0 + zonaCaj + 14;
        p.push(`<line x1="${(xPu + 4).toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x0 + w - 6).toFixed(1)}" y2="${y.toFixed(1)}" class="barra"/>`);
      }
    }

    /* cotas */
    const yc = y0 + h + 22;
    p.push(`<line x1="${x0.toFixed(1)}" y1="${yc}" x2="${(x0 + w).toFixed(1)}" y2="${yc}" class="cota"/>`);
    texto(W / 2, yc - 6, A + " mm");
    const xc = x0 - 16;
    p.push(`<line x1="${xc.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${xc.toFixed(1)}" y2="${(y0 + h).toFixed(1)}" class="cota"/>`);
    p.push(`<text x="${xc - 6}" y="${(y0 + h / 2).toFixed(1)}" class="dm rot" transform="rotate(-90 ${xc - 6} ${(y0 + h / 2).toFixed(1)})">${H} mm</text>`);
    texto(W - 4, Hv - 6, "prof. " + m.prof + " mm", "dm der");

    return `<svg viewBox="0 0 ${W} ${Hv}" role="img" aria-label="Esquema frontal del mueble">${p.join("")}</svg>`;
  }

  return { esquema };
})();
