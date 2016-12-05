import {
    app,
} from 'electron';

export default [{
    label: app.getName(),
    filter: process.platform === 'darwin',

    submenu: [{
        role: 'about',
    }, {
        type: 'separator',
    }, {
        role: 'services',
        submenu: [],
    }, {
        type: 'separator',
    }, {
        role: 'hide',
    }, {
        role: 'hideothers',
    }, {
        role: 'unhide',
    }, {
        type: 'separator',
    }, {
        role: 'quit',
    }]
}, {
    label: '&File',

    submenu: [{
        label: '&New',
        accelerator: 'CmdOrCtrl+N',
        click(evt, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.webContents.send('action', 'newFile');
            }
        }
    }, {
        label: '&Open',
        accelerator: 'CmdOrCtrl+O',
        click(evt, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.webContents.send('action', 'open');
            }
        }
    }, {
        type: 'separator',
    }, {
        label: '&Save',
        accelerator: 'CmdOrCtrl+S',
        click(evt, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.webContents.send('action', 'save');
            }
        }
    }, {
        label: 'Save as ...',
        accelerator: 'CmdOrCtrl+Shift+S',
        click(evt, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.webContents.send('action', 'saveAs');
            }
        }
    }, {
        label: 'Export',
        click(evt, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.webContents.send('action', 'saveBC');
            }
        }
    }, {
        type: 'separator',
    }, {
        role: 'close',
    }]
}, {
    label: '&Edit',

    submenu: [{
        label: 'Undo',
        accelerator: 'CommandOrControl+Z',
        click(evt, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.webContents.send('action', 'undo');
            }
        }
    }, {
        label: 'Redo',
        accelerator: process.platform === 'win32' ? 'Control+Y' : 'Shift+CommandOrControl+Z',
        click(evt, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.webContents.send('action', 'redo');
            }
        }
    }, {
        type: 'separator',
    }, {
        label: 'Cut',
        accelerator: 'CommandOrControl+X',
        click(evt, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.webContents.send('action', 'cut');
            }
        }
    }, {
        label: 'Copy',
        accelerator: 'CommandOrControl+C',
        click(evt, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.webContents.send('action', 'copy');
            }
        }
    }, {
        label: 'Paste',
        accelerator: 'CommandOrControl+V',
        click(evt, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.webContents.send('action', 'paste');
            }
        }
    }, {
        label: 'Select All',
        accelerator: 'CommandOrControl+A',
        click(evt, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.webContents.send('action', 'selectAll');
            }
        }
    }, {
        label: 'Delete',
        accelerator: 'Delete',
        click(evt, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.webContents.send('action', 'deleteSelection');
            }
        }
    }]
}, {
    label: '&View',
    submenu: (process.env.NODE_ENV === 'development') ? [{
        label: '&Reload',
        accelerator: 'CmdOrCtrl+R',
        click(evt, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.webContents.reload();
            }
        }
    }, {
        role: 'togglefullscreen',
    }, {
        label: 'Toggle &Developer Tools',
        accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        click(evt, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.toggleDevTools();
            }
        }
    }] : [{
        role: 'togglefullscreen',
    }]
}, {
    role: 'window',
    filter: process.platform === 'darwin',

    submenu: [{
        role: 'minimize',
    }, {
        role: 'close',
    }, {
        type: 'separator',
    }, {
        role: 'front',
    }]
}];
