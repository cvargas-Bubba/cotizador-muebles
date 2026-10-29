/* PDF de la cotización y del despiece, con jsPDF (sin plugins). */
window.MQ = window.MQ || {};

MQ.pdf = (function () {
  const M = 16;            // margen en mm
  const ANCHO = 210, ALTO = 297;
  const GRIS = [110, 110, 110];
  const NEGRO = [25, 25, 25];
  const LINEA = [205, 205, 205];

  const fecha = (iso) => {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  function nuevo() {
    const { jsPDF } = window.jspdf;
    return new jsPDF({ unit: "mm", format: "a4" });
  }

  function hoja(doc, empresa, titulo, numero, estado) {
    doc.setTextColor.apply(doc, NEGRO);
    doc.setFont("helvetica", "bold").setFontSize(15);
    doc.text(empresa.nombre || "Mueblería", M, M + 4);
    doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor.apply(doc, GRIS);
    const datos = [empresa.rut && "RUT " + empresa.rut, empresa.direccion, empresa.telefono, empresa.email].filter(Boolean);
    doc.text(datos.join("  ·  "), M, M + 9.5);

    doc.setFont("helvetica", "bold").setFontSize(10.5).setTextColor.apply(doc, NEGRO);
    doc.text(titulo, ANCHO - M, M + 4, { align: "right" });
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor.apply(doc, GRIS);
    doc.text("N° " + (numero || "—") + "   ·   " + fecha(), ANCHO - M, M + 9.5, { align: "right" });
    if (estado) doc.text(estado, ANCHO - M, M + 14, { align: "right" });

    doc.setDrawColor.apply(doc, LINEA).setLineWidth(0.3);
    doc.line(M, M + 17, ANCHO - M, M + 17);
    return M + 25;
  }

  function pie(doc) {
    const n = doc.internal.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor.apply(doc, GRIS);
      doc.text("Página " + i + " de " + n, ANCHO - M, ALTO - 8, { align: "right" });
    }
  }

  /* Reserva espacio: si no cabe, abre página nueva y devuelve la nueva y */
  const salto = (doc, y, alto, empresa, titulo, numero) =>
    y + alto > ALTO - 20 ? (doc.addPage(), hoja(doc, empresa, titulo, numero)) : y;

  function descripcion(m) {
    const t = MQ.tipo(m.tipo);
    const usa = (p) => t.partes.indexOf(p) >= 0;
    const partes = [];
    if (usa("puertas") && m.puertas) partes.push(m.puertas + (m.puertas === 1 ? " puerta" : " puertas"));
    if (usa("cajones") && m.cajones) partes.push(m.cajones + (m.cajones === 1 ? " cajón" : " cajones") + (usa("cajonCol") && m.cajonCol ? " en columna" : ""));
    if (usa("entrepanos") && m.entrepanos) partes.push(m.entrepanos + (m.entrepanos === 1 ? " entrepaño" : " entrepaños"));
    if (usa("barra") && m.barra) partes.push("barra de colgar");
    if (usa("zocalo") && m.zocalo) partes.push("zócalo");
    if (usa("cubierta") && m.cubierta) partes.push("cubierta");
    if (m.instalar) partes.push("instalado");
    return partes.join(", ");
  }

  const medidas = (m) => m.tipo === "cubierta"
    ? m.ancho + " × " + m.prof + " mm"
    : m.ancho + " × " + m.alto + " × " + m.prof + " mm";

  /* ---------- cotización ---------- */
  function cotizacion(quote, cat, empresa) {
    const doc = nuevo();
    const titulo = "COTIZACIÓN";
    let y = hoja(doc, empresa, titulo, quote.numero);
    const T = MQ.calc.totales(quote, cat, empresa);

    /* cliente */
    const c = quote.cliente || {};
    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor.apply(doc, GRIS);
    doc.text("CLIENTE", M, y);
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor.apply(doc, NEGRO);
    doc.text(c.nombre || "—", M, y + 5.5);
    doc.setFontSize(8.5).setTextColor.apply(doc, GRIS);
    const cd = [c.rut && "RUT " + c.rut, c.telefono, c.email].filter(Boolean).join("  ·  ");
    if (cd) doc.text(cd, M, y + 10);
    if (c.obra) doc.text("Obra: " + c.obra, M, y + 14);
    y += 22;

    /* tabla */
    const col = { desc: M, med: 104, cant: 142, uni: 170, tot: ANCHO - M };
    doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor.apply(doc, GRIS);
    doc.text("DETALLE", col.desc, y);
    doc.text("MEDIDAS", col.med, y);
    doc.text("CANT.", col.cant, y, { align: "right" });
    doc.text("UNITARIO", col.uni, y, { align: "right" });
    doc.text("TOTAL", col.tot, y, { align: "right" });
    y += 2.5;
    doc.setDrawColor.apply(doc, LINEA).line(M, y, ANCHO - M, y);
    y += 6;

    T.lineas.forEach((l, i) => {
      const m = l.mueble;
      y = salto(doc, y, 16, empresa, titulo, quote.numero);
      doc.setFont("helvetica", "bold").setFontSize(9.5).setTextColor.apply(doc, NEGRO);
      doc.text(String(i + 1) + ". " + (m.nombre || MQ.tipo(m.tipo).nombre), col.desc, y);
      doc.setFont("helvetica", "normal").setFontSize(8.5);
      doc.text(medidas(m), col.med, y);
      doc.setFontSize(9);
      doc.text(String(m.cantidad || 1), col.cant, y, { align: "right" });
      doc.text(MQ.clp(l.calc.unitario), col.uni, y, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text(MQ.clp(l.calc.total), col.tot, y, { align: "right" });

      const d = descripcion(m);
      const nom = (id) => (cat.tableros.find((t) => t.id === id) || {}).nombre;
      const cuerpo = nom(m.mat.cuerpo), frente = nom(m.mat.frente);
      /* la cubierta es una sola pieza: solo tiene sentido nombrar su tablero */
      const mat = m.tipo === "cubierta"
        ? (frente ? "Tablero " + frente : "")
        : (cuerpo ? "Cuerpo " + cuerpo + (frente && frente !== cuerpo ? " · frentes " + frente : "") : "");
      const sub = [d, mat].filter(Boolean).join(". ");
      if (sub) {
        doc.setFont("helvetica", "normal").setFontSize(8).setTextColor.apply(doc, GRIS);
        const lines = doc.splitTextToSize(sub, 82);
        doc.text(lines, col.desc + 4, y + 4);
        y += 4 + lines.length * 3.6;
      }
      y += 6;
      doc.setDrawColor(235, 235, 235).line(M, y - 2.5, ANCHO - M, y - 2.5);
    });

    /* totales */
    y = salto(doc, y, 40, empresa, titulo, quote.numero) + 4;
    const fila = (k, v, bold, size) => {
      doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(size || 9.5);
      doc.setTextColor.apply(doc, bold ? NEGRO : GRIS);
      doc.text(k, 136, y, { align: "right" });
      doc.setTextColor.apply(doc, NEGRO);
      doc.text(v, ANCHO - M, y, { align: "right" });
      y += 5.5;
    };
    fila("Neto", MQ.clp(T.neto));
    if (T.descuento > 0) fila("Descuento " + T.descPct + "%", "− " + MQ.clp(T.descuento));
    fila("IVA " + T.ivaPct + "%", MQ.clp(T.iva));
    y += 1;
    doc.setDrawColor.apply(doc, LINEA).line(136, y - 4, ANCHO - M, y - 4);
    fila("TOTAL", MQ.clp(T.total), true, 12);

    /* notas y condiciones */
    y += 6;
    const bloque = (t, txt) => {
      if (!txt) return;
      y = salto(doc, y, 24, empresa, titulo, quote.numero);
      doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor.apply(doc, GRIS);
      doc.text(t, M, y); y += 4.5;
      doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor.apply(doc, NEGRO);
      const ls = doc.splitTextToSize(String(txt), ANCHO - M * 2);
      doc.text(ls, M, y); y += ls.length * 3.8 + 5;
    };
    bloque("NOTAS", quote.notas);
    bloque("CONDICIONES COMERCIALES", empresa.condiciones);
    if (empresa.validez) {
      doc.setFont("helvetica", "normal").setFontSize(8).setTextColor.apply(doc, GRIS);
      doc.text("Valores netos en pesos. Cotización válida por " + empresa.validez + " días.", M, y);
    }

    pie(doc);
    return doc;
  }

  /* ---------- despiece y lista de compra ---------- */
  function despiece(quote, cat, empresa) {
    const doc = nuevo();
    const titulo = "DESPIECE";
    let y = hoja(doc, empresa, titulo, quote.numero);
    const nom = (id) => (cat.tableros.find((t) => t.id === id) || {}).nombre || id;

    doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor.apply(doc, GRIS);
    doc.text("Medidas de corte en mm. El canto se descuenta del tablero, no se suma a la medida.", M, y);
    y += 8;

    (quote.muebles || []).forEach((m, i) => {
      const c = MQ.calc.costear(m, cat);
      y = salto(doc, y, 30, empresa, titulo, quote.numero);
      doc.setFont("helvetica", "bold").setFontSize(10).setTextColor.apply(doc, NEGRO);
      doc.text(String(i + 1) + ". " + (m.nombre || MQ.tipo(m.tipo).nombre) + "  ·  " + medidas(m) + (m.cantidad > 1 ? "  ·  " + m.cantidad + " unidades" : ""), M, y);
      y += 5;

      doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor.apply(doc, GRIS);
      doc.text("PIEZA", M, y); doc.text("CANT.", 72, y, { align: "right" });
      doc.text("LARGO", 92, y, { align: "right" }); doc.text("ANCHO", 112, y, { align: "right" });
      doc.text("TABLERO", 118, y); doc.text("CANTOS", ANCHO - M, y, { align: "right" });
      y += 2; doc.setDrawColor.apply(doc, LINEA).line(M, y, ANCHO - M, y); y += 4.5;

      c.piezas.forEach((p) => {
        y = salto(doc, y, 8, empresa, titulo, quote.numero);
        doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor.apply(doc, NEGRO);
        doc.text(p.nombre, M, y);
        doc.text(String(p.cant * Math.max(1, m.cantidad || 1)), 72, y, { align: "right" });
        doc.text(String(p.largo), 92, y, { align: "right" });
        doc.text(String(p.ancho), 112, y, { align: "right" });
        doc.setFontSize(7.5).setTextColor.apply(doc, GRIS);
        doc.text(doc.splitTextToSize(nom(p.mat), 42)[0], 118, y);
        const cantos = p.canto ? [p.cl ? p.cl + " × largo" : "", p.ca ? p.ca + " × ancho" : ""].filter(Boolean).join(" + ") : "—";
        doc.text(cantos, ANCHO - M, y, { align: "right" });
        y += 4.4;
      });
      y += 5;
    });

    /* lista de compra */
    const L = MQ.calc.listaCompra(quote, cat);
    y = salto(doc, y, 60, empresa, titulo, quote.numero) + 2;
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor.apply(doc, NEGRO);
    doc.text("Lista de compra", M, y); y += 5;
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor.apply(doc, GRIS);
    doc.text("Planchas con " + cat.params.desperdicio + "% de desperdicio, redondeadas hacia arriba.", M, y); y += 6;

    const item = (a, b) => {
      y = salto(doc, y, 8, empresa, titulo, quote.numero);
      doc.setFont("helvetica", "normal").setFontSize(9).setTextColor.apply(doc, NEGRO);
      doc.text(a, M, y);
      doc.setFont("helvetica", "bold");
      doc.text(b, ANCHO - M, y, { align: "right" });
      y += 4.8;
    };
    L.tableros.forEach((t) => item(t.nombre, t.planchasEnteras + (t.planchasEnteras === 1 ? " plancha" : " planchas") + "  (" + t.m2.toFixed(2) + " m²)"));
    L.cantos.forEach((c) => item(c.nombre, Math.ceil(c.ml) + " m"));
    L.herrajes.forEach((h) => item(h.nombre, Math.ceil(h.cant) + " " + h.unidad));

    pie(doc);
    return doc;
  }

  const nombreArchivo = (base, quote, cliente) =>
    [base, "N" + (quote.numero || 0), (cliente || "").trim().replace(/[^\wáéíóúñÁÉÍÓÚÑ ]/g, "").replace(/\s+/g, "_")]
      .filter(Boolean).join("_") + ".pdf";

  return {
    descargarCotizacion(quote, cat, empresa) {
      cotizacion(quote, cat, empresa).save(nombreArchivo("Cotizacion", quote, (quote.cliente || {}).nombre));
    },
    descargarDespiece(quote, cat, empresa) {
      despiece(quote, cat, empresa).save(nombreArchivo("Despiece", quote, (quote.cliente || {}).nombre));
    }
  };
})();
