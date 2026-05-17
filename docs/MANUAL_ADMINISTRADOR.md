# Manual de Administrador
## Visor Forestal ACOPAC-OSRO

> Guía técnica para la persona responsable del mantenimiento, configuración y traspaso de la herramienta.

---

## 1. Componentes de la herramienta

La herramienta consta de **tres elementos** que conviven en línea:

| Componente | Servicio | Función |
|---|---|---|
| **Código fuente** | GitHub (`super.visor-forestal`) | Aloja el archivo `index.html` y la documentación. |
| **Hospedaje web** | GitHub Pages | Sirve la aplicación en una URL pública. |
| **Fuente de datos** | Google Sheets | Contiene los registros de permisos, árboles y estados. |

No existe servidor propio ni base de datos centralizada: todo se sirve desde GitHub Pages y se alimenta de la hoja de Google.

---

## 2. Estructura del repositorio

```
super.visor-forestal/
├── index.html        ← aplicación completa (HTML + CSS + JS)
├── README.md         ← descripción breve
└── docs/
    ├── MANUAL_USUARIO.md
    ├── MANUAL_ADMINISTRADOR.md  ← este documento
    └── PRESENTACION_INSTITUCIONAL.md
```

Todo el código de la aplicación está en **un solo archivo** (`index.html`). Esto facilita el despliegue (no requiere compilación ni dependencias).

---

## 3. Configuración de la fuente de datos

### 3.1 Cambiar el Google Sheet conectado

Cualquier usuario puede cambiar la fuente desde la propia herramienta:

1. Abrir el visor.
2. Menú ☰ → **⚙️ Fuente de Datos**.
3. Modificar:
   - **Sheet ID** — el identificador del documento de Google Sheets (la parte entre `/d/` y `/edit` en su URL).
   - **GID** — identificador numérico de la pestaña (visible en la URL después de `gid=`).
   - **Webhook de logs** (opcional) — URL de un Google Apps Script para registrar el uso.
4. Guardar cada campo y recargar los datos.

La configuración se guarda en el `localStorage` del navegador del usuario que la modificó.

### 3.2 Cambiar la fuente por defecto del repositorio

Si quiere que **todos los usuarios nuevos** carguen automáticamente una hoja distinta:

1. Abrir `index.html` en GitHub → botón ✏️ (Edit).
2. Localizar (cerca del inicio del bloque `<script>`):
   ```js
   let SHEET_ID_DATA = 'XXXXXXXXXXXXXXXXXXXXXXXX';
   let GID_DATA      = '0';
   let LOGS_WEBHOOK_URL = '';
   ```
3. Reemplazar los valores y guardar el cambio (commit).
4. En 1–2 minutos GitHub Pages republica la página actualizada.

### 3.3 Estructura esperada de la hoja de Google

La pestaña debe tener encabezados que incluyan, como mínimo:

- Número de **expediente**
- **ID del árbol**
- **Especie**
- **Estado** (Aprobado / Denegado / Sin definir)
- **Coordenadas** (CRTM05 o WGS84)

El visor detecta los encabezados de forma flexible (acepta variaciones como "ESPECIE", "Especie", "esp"). Para máxima compatibilidad mantenga los nombres tal como están en la hoja vigente al momento del traspaso.

> ⚠️ **Importante:** la hoja debe estar publicada o compartida como **"Cualquier persona con el enlace puede ver"**, para que el visor pueda exportarla como CSV.

---

## 4. Hospedaje en GitHub Pages

### 4.1 Verificar que Pages está activo

1. Ingresar al repositorio en GitHub.
2. Pestaña **Settings** → barra lateral **Pages**.
3. En *Source* debe figurar `Deploy from a branch` → `main` → `/ (root)`.
4. La URL pública aparecerá en la parte superior (`https://<usuario>.github.io/super.visor-forestal/`).

### 4.2 Reactivar Pages si se desactiva

Repita los pasos anteriores y seleccione manualmente `main` + `/ (root)` → **Save**. El despliegue tarda 1–2 minutos.

---

## 5. Procedimiento de traspaso a otro administrador

Esta sección describe cómo **trasladar la propiedad de la herramienta** de una cuenta de GitHub a otra (por ejemplo, del administrador saliente al entrante de ACOPAC-OSRO).

### 5.1 Prerrequisitos

Antes de comenzar, asegúrese de tener:

- Acceso a la **cuenta de GitHub actual** (administrador saliente).
- El **nombre de usuario de la cuenta nueva** (administrador entrante) ya creada.
- Acceso al **Google Sheet** fuente, para luego compartir/transferir su propiedad.
- La **URL pública** actual del visor (para informar a los usuarios del cambio si aplica).

### 5.2 Opción A — Transferir el repositorio completo (recomendada)

Mantiene el historial, las issues, el nombre y la URL si la cuenta nueva conserva el mismo `username`.

1. Cuenta saliente → entrar al repositorio `super.visor-forestal`.
2. **Settings** → bajar hasta **Danger Zone** → **Transfer ownership**.
3. Escribir:
   - Nombre del repositorio: `super.visor-forestal`
   - Nuevo dueño: `<usuario-cuenta-entrante>` (o nombre de la organización)
4. Confirmar con la contraseña.
5. GitHub envía un correo al administrador entrante, quien debe **aceptar la transferencia** desde su buzón o desde GitHub.
6. Una vez aceptada:
   - El administrador entrante entra a **Settings → Pages** y confirma que está activo en `main / (root)`.
   - La nueva URL pública será `https://<nuevo-usuario>.github.io/super.visor-forestal/`.
7. Comunicar la **nueva URL** a los usuarios del ACOPAC-OSRO si cambió el `username`.

### 5.3 Opción B — Fork + archivar (cuando no se quiere transferir)

Útil cuando el administrador saliente desea conservar el repositorio en su cuenta como respaldo.

1. Administrador entrante → **Fork** del repositorio a su cuenta.
2. Activar **GitHub Pages** en el fork (Settings → Pages → `main` → `/ (root)`).
3. Administrador saliente → archivar su repositorio (Settings → Archive this repository) para evitar confusiones.
4. Comunicar la nueva URL.

### 5.4 Traspaso del Google Sheet

El repositorio de código y la hoja de datos son independientes. Realice además:

1. Abrir la hoja → menú **Compartir**.
2. Cambiar la propiedad: agregar al usuario entrante como editor → menú de tres puntos → **Hacer propietario**.
3. Mantener el permiso de visualización pública ("Cualquier persona con el enlace puede ver") para que el visor siga leyendo los datos.
4. Confirmar que el **Sheet ID** no cambió; si por algún motivo se crea una hoja nueva, actualizar el ID en la herramienta (sección 3.1 o 3.2).

### 5.5 Webhook de logs (si está habilitado)

Si la oficina mantiene un Google Apps Script para registrar el uso del visor:

1. Abrir el script en el Google Drive del saliente.
2. Compartirlo con la cuenta entrante con permiso de edición.
3. Hacer al entrante propietario del script y del Spreadsheet de logs asociado.
4. Si la URL del webhook cambia, actualizarla desde el panel **⚙️ Fuente de Datos** de la herramienta.

### 5.6 Lista de verificación final del traspaso

- [ ] Repositorio en la cuenta del nuevo administrador.
- [ ] GitHub Pages activo y URL pública verificada en navegador.
- [ ] Google Sheet con propietario actualizado y permiso público de lectura.
- [ ] Webhook de logs (si aplica) transferido.
- [ ] Manual de Usuario distribuido a los funcionarios de la oficina.
- [ ] Manual de Administrador conservado por el nuevo responsable.
- [ ] Cuenta saliente desvinculada o conservada únicamente como respaldo.

---

## 6. Operaciones rutinarias

### 6.1 Actualizar el código

1. Desde GitHub web: editar `index.html` y hacer *commit*.
2. Desde local: clonar el repositorio, modificar, `git commit` y `git push`.
3. GitHub Pages republica automáticamente en 1–2 minutos.

### 6.2 Revertir un cambio

1. En GitHub, ir a **Commits**.
2. Localizar el commit problemático → **Revert**.
3. Confirmar el commit de reversión.

### 6.3 Backup

- **Código:** GitHub conserva todo el historial; descargue periódicamente un `.zip` del repositorio desde **Code → Download ZIP**.
- **Datos:** descargue la hoja de Google como `.xlsx` con frecuencia (mensual sugerido).

---

## 7. Diagnóstico de problemas comunes

| Síntoma | Causa probable | Acción |
|---|---|---|
| El visor abre pero no muestra árboles | La hoja no es pública o el ID cambió | Reabrir permisos del Sheet o actualizar el Sheet ID |
| Error "CORS" en consola | Los proxies de respaldo están saturados | Esperar unos minutos; el visor intenta 5 proxies |
| Datos viejos persisten | Caché de 7 días en el navegador | Pedir al usuario que recargue datos o limpie caché |
| GitHub Pages devuelve 404 | Pages desactivado o rama cambiada | Reactivar en Settings → Pages |
| Sensor de brújula no funciona en iOS | Permiso de orientación denegado | Reiniciar Safari y aceptar permiso al cargar |

---

## 8. Contactos y referencias

- Repositorio: `https://github.com/<owner>/super.visor-forestal`
- Documentación de GitHub Pages: https://docs.github.com/pages
- Documentación de Google Sheets (publicar): https://support.google.com/docs/answer/183965

---

*Ing. Pablo César Sánchez Núñez · Asistido por Claude™*
