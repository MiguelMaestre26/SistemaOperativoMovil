const { app, BrowserWindow, Menu, session, ipcMain, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');

// WhatsApp/Google/etc. bloquean o degradan el contenido si el User-Agent revela
// "Electron". Se enmascara como un Chrome normal para que las webs embebidas
// (webview) corran como en el navegador real.
const CHROME_UA = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome}.0.0.0 Safari/537.36`;
app.userAgentFallback = CHROME_UA;

const DEV_URL = 'http://localhost:5173';
const isDev = process.argv.includes('--dev') || process.argv.includes('--dev-flag') || !!process.env.ELECTRON_START_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 980,
    height: 980,
    minWidth: 460,
    minHeight: 700,
    backgroundColor: '#0f0f23',
    title: 'AuroraOS',
    webPreferences: {
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  win.setMenuBarVisibility(false);
  Menu.setApplicationMenu(null);

  const startUrl = process.env.ELECTRON_START_URL || (isDev ? DEV_URL : null);
  if (startUrl) {
    win.loadURL(startUrl);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  win.webContents.on('did-fail-load', (_e, code, desc) => {
    if (code === -3) return; // abort (ignorable)
    console.error(`[aurora] fallo de carga ${code}: ${desc}`);
  });

  return win;
}

// Descargas reales de los webviews (right-click "guardar", archivos adjuntos…):
// se capturan en el proceso principal y se mandan al renderer como data-URL para
// guardarlas en el sistema de archivos del OS y poder usarlas de fondo.
function setupDownloadListener(ses) {
  ses.on('will-download', (_event, item) => {
    const filename = item.getFilename();
    const mime = item.getMimeType() || 'application/octet-stream';
    const savePath = path.join(app.getPath('temp'), `aurora-dl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    item.setSavePath(savePath);
    item.once('done', (_ev, state) => {
      const main = BrowserWindow.getAllWindows()[0];
      if (state === 'completed' && main && !main.isDestroyed()) {
        try {
          const buf = fs.readFileSync(savePath);
          const dataUrl = `data:${mime};base64,${buf.toString('base64')}`;
          main.webContents.send('aurora:download-ready', { filename, mimeType: mime, dataUrl });
        } catch (err) {
          console.error('[aurora] error leyendo descarga', err);
        } finally {
          try { fs.unlinkSync(savePath); } catch { /* ya no existe */ }
        }
      } else {
        try { fs.unlinkSync(savePath); } catch { /* ya no existe */ }
      }
    });
  });
}

app.whenReady().then(() => {
  // Permisos de las webs embebidas (webview): cámara/micrófono/notificaciones
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = ['media', 'mediaKeySystem', 'notifications', 'fullscreen', 'geolocation'];
    callback(allowed.includes(permission));
  });

  // Limpia la caché (no las cookies) de cada webview para que no se quede la
  // pantalla de "navegador no compatible" o el QR viejo de rondando.
  const partitions = [
    'persist:aurora-wa',
    'persist:aurora-tg',
    'persist:aurora-browser-google',
    'persist:aurora-browser-firefox',
  ];
  for (const p of partitions) {
    const ses = session.fromPartition(p);
    ses.clearCache();
    setupDownloadListener(ses);
  }
  setupDownloadListener(session.defaultSession);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Nada de ventanas externas: todo se abre dentro del OS.
// Aplica a la ventana principal Y a los webviews (cada guest es un webContents).
app.on('web-contents-created', (_event, contents) => {
  // Los webviews usan el User-Agent de Chrome puro (sin "Electron")
  contents.setUserAgent(CHROME_UA);

  contents.setWindowOpenHandler(({ url }) => {
    const main = BrowserWindow.getAllWindows()[0];
    if (main && /^https?:/i.test(url)) {
      main.webContents.send('aurora:open-in-tab', url);
    }
    return { action: 'deny' };
  });

  contents.on('will-navigate', (event, url) => {
    // La ventana principal no debe salirse de la app; los webviews navegan libre.
    const main = BrowserWindow.getAllWindows()[0];
    if (contents === main?.webContents && /^https?:/i.test(url)) {
      event.preventDefault();
      main.webContents.send('aurora:open-in-tab', url);
    }
  });

  // Menú contextual en los webviews: permite "Guardar imagen" (se guarda en
  // Archivos/Downloads del OS) y copiar URLs de imágenes/enlaces.
  contents.on('context-menu', (_event, params) => {
    if (contents.getType() !== 'webview') return;
    const template = [];
    if (params.mediaType === 'image' && params.srcURL) {
      template.push({
        label: 'Guardar imagen',
        click: () => {
          const main = BrowserWindow.getAllWindows()[0];
          if (main && !main.isDestroyed()) {
            main.webContents.send('aurora:download-image', params.srcURL);
          }
        },
      });
      template.push({
        label: 'Copiar URL de la imagen',
        click: () => clipboard.writeText(params.srcURL),
      });
    }
    if (params.linkURL) {
      template.push({
        label: 'Copiar enlace',
        click: () => clipboard.writeText(params.linkURL),
      });
    }
    if (template.length > 0) {
      Menu.buildFromTemplate(template).popup({
        window: BrowserWindow.fromWebContents(contents) ?? undefined,
      });
    }
  });
});

// Red: fetch que hace el proceso principal (sin CORS), para Ollama, búsquedas y
// descargas de URLs. Con `binary:true` devuelve el contenido como data-URL.
ipcMain.handle('net:request', async (_event, { url, method = 'GET', body, binary = false }) => {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body || undefined,
    });
    if (binary) {
      const buf = Buffer.from(await res.arrayBuffer());
      const mime = res.headers.get('content-type') || 'application/octet-stream';
      return {
        ok: res.ok,
        status: res.status,
        mimeType: mime,
        dataUrl: `data:${mime};base64,${buf.toString('base64')}`,
      };
    }
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch (err) {
    return { ok: false, status: 0, text: err instanceof Error ? err.message : String(err) };
  }
});