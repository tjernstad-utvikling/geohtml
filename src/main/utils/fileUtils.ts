import { BrowserWindow, dialog } from 'electron';
import fs from 'fs';
import { isFile } from '../contracts/file';

export async function openFile(mainWindow: BrowserWindow) {
  const files = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Html', extensions: ['htm', 'html', 'txt'] }],
  });

  if (!files || files.canceled) return;

  const filePath = files.filePaths[0];

  const pathArray = filePath.split('\\');
  const lastIndex = pathArray.length - 1;

  const content = fs.readFileSync(filePath).toString();
  mainWindow.webContents.send('new-file', {
    content,
    name: pathArray[lastIndex],
    path: filePath,
  });
}

export async function startSaveFile(
  mainWindow: BrowserWindow,
  isSaveAs: boolean
) {
  mainWindow.webContents.send('start-save-file', isSaveAs);
}

export async function startNewFile(mainWindow: BrowserWindow) {
  mainWindow.webContents.send('start-new-file');
}

export async function saveFile(
  mainWindow: BrowserWindow,
  event: Electron.IpcMainEvent,
  data: unknown
) {
  if (!isFile(data)) return;
  console.log({ data });
  if (data.path) {
    fs.writeFile(data.path, data.content, (err) => {
      console.log(err);
    });
  } else {
    const res = await dialog.showSaveDialog(mainWindow, {
      title: 'Lagre som',
      defaultPath: data.name,
    });

    if (res.canceled || !res.filePath) return;

    const pathArray = res.filePath.split('\\');
    const lastIndex = pathArray.length - 1;
    const fileName = pathArray[lastIndex];

    const regMatch = res.filePath.match(/([\\/])([^/`.\\]*)$/);

    const saveName =
      regMatch === null ? fileName : `${regMatch[1]}${regMatch[2]}.html`;

    const path = res.filePath.replace(/[\\/][^/`.\\]*$/, saveName);

    fs.writeFile(path, data.content, (err) => {
      console.log({ err });
    });

    event.reply('save-file', {
      ...data,
      path,
      name: regMatch === null ? fileName : `${regMatch[2]}.html`,
    });
  }
}
