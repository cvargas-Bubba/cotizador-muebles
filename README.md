# Cotizador de muebles — se mudó

El cotizador ahora vive en **<https://cvargas.org/muebles/>**, como módulo del
sitio de Fierro & Veta, y su código está en el repositorio
[cvargas-org](https://github.com/cvargas-Bubba/cvargas-org), en la carpeta
`muebles/`.

Este repositorio queda solo para que `muebles.cvargas.org` siga respondiendo y
redirija a la dirección nueva, para no romper los enlaces ya compartidos.

## Por qué se movió

Los módulos pasaron a servirse como rutas del mismo dominio
(`cvargas.org/muebles`) en vez de un subdominio cada uno: así hay un
repositorio, un certificado y un despliegue, en lugar de un registro DNS y un
certificado por módulo.

Se hizo en ese momento y no después porque el cotizador guarda los precios, las
cotizaciones y el logo en el almacenamiento del navegador, que está atado al
origen: `muebles.cvargas.org` y `cvargas.org/muebles` son orígenes distintos, así
que lo guardado no se traslada. Al mover no había nada que perder todavía.

## La historia

Los commits con el desarrollo del cotizador siguen acá, y también se importaron
al repositorio nuevo, así que las razones de cada decisión de cálculo no se
perdieron.
