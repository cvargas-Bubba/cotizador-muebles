# Cotizador de Muebles

Cotizador de muebles a medida: se ingresan las medidas y el mueble se cotiza solo,
con despiece y lista de compra. Funciona en el navegador, sin servidor ni instalación.

👉 **https://cvargas-bubba.github.io/cotizador-muebles/**

## Qué hace

- **Cotiza por medidas.** Eliges el tipo de mueble (base, colgante, closet, cajonera,
  librero, cubierta), pones ancho, alto y profundidad y defines puertas, cajones,
  entrepaños, zócalo y barra de colgar. El precio se arma desde el despiece real.
- **Calcula el despiece.** Cada pieza con su medida de corte, el tablero que le
  corresponde y en qué bordes lleva canto.
- **Lista de compra.** Planchas, metros de canto y herrajes de toda la cotización,
  con el porcentaje de desperdicio aplicado.
- **Catálogo editable.** Tableros, cantos, herrajes, mano de obra, desperdicio,
  gastos generales y margen se editan en la app y quedan guardados.
- **PDF de cotización y de despiece**, con los datos de tu empresa y tus
  condiciones comerciales.
- **Hoja de esquemas.** El PDF de la cotización termina con el dibujo de cada
  mueble, acotado y con la medida de corte escrita en cada puerta y cajón.
- **Historial** de cotizaciones, para reabrir, duplicar y seguir su estado.

## Cómo calcula el precio

```
costo directo = tableros + cantos + herrajes + mano de obra
precio neto   = (costo directo + gastos generales) + margen
total         = (neto − descuento) + IVA
```

- Los tableros se cargan a precio de plancha entera y cada pieza paga su
  superficie prorrateada, más el porcentaje de desperdicio.
- Las planchas de la lista de compra se redondean hacia arriba. **No es una
  optimización de corte**: es superficie más desperdicio, así que en muebles
  grandes conviene revisar el nesting antes de comprar.
- Los precios que vienen cargados son de referencia. Hay que reemplazarlos por los
  tuyos en **Materiales** antes de cotizarle a un cliente.

## Dónde quedan los datos

Todo se guarda en el `localStorage` del navegador que usas: cotizaciones, catálogo
y datos de la empresa. No hay servidor, no se comparte entre equipos y si borras
los datos del sitio se pierde. Para respaldar algo, descarga el PDF.

## Desarrollo

No hay build ni dependencias que instalar. Basta con abrir `index.html`, o servir
la carpeta:

```bash
python -m http.server 8000
```

| Archivo | Qué contiene |
|---|---|
| `data.js` | catálogo de referencia, tipos de mueble y utilidades |
| `calc.js` | despiece, herrajes y costeo |
| `draw.js` | esquema frontal en SVG |
| `store.js` | persistencia en `localStorage` |
| `pdf.js` | PDF de cotización y de despiece (jsPDF) |
| `app.js` | interfaz y eventos |
| `styles.css` | estilos |

Convención del proyecto: JavaScript sin framework, todo bajo el namespace global
`MQ`, textos y formatos en es-CL y precios netos en pesos chilenos.
