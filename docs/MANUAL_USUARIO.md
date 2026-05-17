# Manual de Usuario
## Visor Forestal ACOPAC-OSRO

> Herramienta de consulta y supervisión en campo de permisos de aprovechamiento forestal.
> Área de Conservación Pacífico Central — Oficina Subregional de Orotina.

---

## 1. ¿Qué es el Visor Forestal?

Es una aplicación web que muestra en un mapa interactivo la ubicación de **todos los árboles inscritos en los permisos de aprovechamiento forestal** del ACOPAC-OSRO, junto con el estado de cada uno (Aprobado, Denegado o Sin definir). Los datos provienen de una hoja de Google Sheets que la oficina actualiza continuamente, por lo que el visor refleja la información más reciente disponible.

El visor funciona en cualquier teléfono, tableta o computadora con navegador moderno (Chrome, Edge, Safari, Firefox) y conexión a internet. Una vez cargados los datos, conserva la información en caché por **7 días** para consultarla en zonas sin señal.

---

## 2. Acceso a la herramienta

1. Abra el enlace que le proporcionó el administrador desde el navegador de su preferencia.
2. La aplicación cargará automáticamente. No requiere usuario ni contraseña: **cualquier persona con el enlace puede ingresar**.
3. Al primer acceso, espere algunos segundos mientras se descargan los datos desde Google Sheets.

> 💡 **Recomendación:** guarde el enlace como acceso directo en la pantalla de inicio de su teléfono para abrirlo como si fuera una app.

---

## 3. La pantalla principal

Al abrir el visor verá:

- **Mapa central** con todos los árboles georreferenciados.
- **Marcadores de colores** que indican el estado de cada árbol:
  - 🟣 **Morado** — Aprobado
  - 🔴 **Rojo** — Denegado
  - 🟡 **Amarillo** — Sin definir
- **Botón de menú** (☰) en la esquina, que despliega filtros y herramientas.
- **Pie de página** discreto con la autoría de la herramienta.

---

## 4. Navegación en el mapa

| Acción | En móvil | En computadora |
|---|---|---|
| Acercar / alejar | Pellizcar con dos dedos | Rueda del ratón o botones `+` / `−` |
| Mover el mapa | Arrastrar con un dedo | Clic y arrastrar |
| Ver detalle de un árbol | Tocar el marcador | Clic en el marcador |
| Cambiar capa base | Selector de capas (esquina superior derecha) | Selector de capas |

### Capas base disponibles
- **Google Híbrido** — vista satelital con etiquetas (recomendada para campo).
- **Bing Satélite** — imagen satelital alterna.
- **ESRI Satélite** — imagen satelital adicional.
- **OpenStreetMap** — mapa de calles.

---

## 5. Consulta de información de un árbol

Toque cualquier marcador para abrir una ficha emergente con:

- **Número de expediente** del permiso
- **ID del árbol** dentro del permiso
- **Especie**
- **Estado** (Aprobado, Denegado o Sin definir)
- **Observaciones** y campos adicionales registrados en la hoja
- **Coordenadas** en CRTM05 y WGS84

---

## 6. Filtros y búsqueda

Abra el menú lateral (☰) para acceder a:

- **Filtro por expediente** — escriba el número y se mostrarán solo los árboles de ese permiso.
- **Filtro por estado** — Aprobado / Denegado / Sin definir.
- **Filtro por especie** — listado desplegable de especies registradas.
- **Búsqueda libre** — texto que busca en todos los campos.

Los filtros se combinan: por ejemplo, "expediente X + estado Denegado" muestra solo los árboles denegados de ese permiso.

---

## 7. Herramientas de navegación en campo

### 7.1 GPS de alta precisión

Al activar la ubicación del dispositivo, el visor:
- Muestra su posición actual con un círculo azul.
- Calcula un **promedio ponderado de 5 lecturas** para reducir el error del GPS.
- Indica la **precisión estimada** en metros.

### 7.2 Brújula y rumbo

Si su dispositivo cuenta con sensor de orientación:
- Aparecerá una **flecha de rumbo** que apunta hacia el árbol seleccionado.
- Verá la **distancia en metros** y el **acimut** (grados respecto al norte).
- El visor usa fusión de sensores (`AbsoluteOrientationSensor` con respaldo `DeviceOrientation`) para mayor estabilidad.

> ⚠️ En iOS, el navegador puede pedir permiso para acceder al sensor de orientación. Acepte para usar la brújula.

### 7.3 Medición de distancias y áreas

En el menú lateral encontrará **Herramientas de medición**:
- **Medir distancia** — toque dos o más puntos sobre el mapa para obtener la distancia total.
- **Medir área** — dibuje un polígono cerrado para obtener su área en hectáreas y metros cuadrados.

### 7.4 Importar archivos GPX o KML

Puede cargar tracks, waypoints o polígonos externos:
1. Menú ☰ → **Importar capa**.
2. Seleccione un archivo `.gpx` o `.kml` desde su dispositivo.
3. La capa se sobrepondrá al mapa hasta que la cierre.

---

## 8. Trabajo sin conexión

- La primera vez que abra el visor con internet, los datos se guardarán en el dispositivo.
- Si pierde la señal en campo, **los datos seguirán visibles** por hasta 7 días.
- Las capas satelitales sí requieren conexión para mostrar mosaicos nuevos; las zonas ya visitadas con señal quedan en caché del navegador.

---

## 9. Recargar datos manualmente

Si sabe que la oficina actualizó la hoja y quiere ver los cambios inmediatamente:

1. Menú ☰ → **🔄 Recargar Datos**.
2. Espere el mensaje de confirmación.

El visor además **se actualiza automáticamente cada 5 minutos** mientras está abierto.

---

## 10. Buenas prácticas en campo

- Lleve el teléfono **con batería completa** y, si es posible, una batería externa.
- Active el **modo de alto rendimiento de GPS** en su dispositivo.
- En zonas con dosel denso, espere 30–60 segundos para que el GPS estabilice las lecturas.
- Use el **modo de pantalla brillante** o un protector mate para visibilidad bajo el sol.
- Si va a usar la herramienta como evidencia, **tome captura de pantalla** del marcador con la ficha abierta.

---

## 11. Resolución de problemas

| Problema | Solución |
|---|---|
| No carga el mapa | Verifique conexión a internet y refresque la página. |
| No aparecen los árboles | Toque "Recargar Datos" desde el menú. |
| GPS impreciso | Salga de techos/dosel denso y espere unos segundos. |
| La brújula no funciona | Acepte el permiso de orientación; en iOS reinicie el navegador si fue denegado. |
| Datos desactualizados | Recargue manualmente o cierre y abra la pestaña. |

Para problemas no resueltos, contacte al administrador de la herramienta indicado en su oficina.

---

*Ing. Pablo César Sánchez Núñez · Asistido por Claude™*
