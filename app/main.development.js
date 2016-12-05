import {
    app, BrowserWindow, Menu,
} from 'electron';
import path from 'path';
import menuTemplate from './menu';

import './utils/rasen.main';

let mainWindow = null;

if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support'); // eslint-disable-line
    sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development') {
    require('electron-debug')(); // eslint-disable-line global-require
    const path = require('path'); // eslint-disable-line
    const p = path.join(__dirname, '..', 'app', 'node_modules'); // eslint-disable-line
    require('module').globalPaths.push(p); // eslint-disable-line
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

const installExtensions = async () => {
    if (process.env.NODE_ENV === 'development') {
        /* eslint-disable import/no-extraneous-dependencies */
        const installer = require('electron-devtools-installer'); // eslint-disable-line global-require

        const extensions = [
            'REACT_DEVELOPER_TOOLS',
            'REDUX_DEVTOOLS'
        ];
        const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
        for (const name of extensions) { // eslint-disable-line
            try {
                await installer.default(installer[name], forceDownload);
            } catch (e) {} // eslint-disable-line
        }
    }
};

app.on('ready', async () => {
    await installExtensions();

    mainWindow = new BrowserWindow({
        show: false,
        width: 1024,
        height: 728
    });

    mainWindow.loadURL(`file://${__dirname}/app.html`);

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.openDevTools();
        mainWindow.webContents.on('context-menu', (e, props) => {
            const { x, y } = props;

            Menu.buildFromTemplate([{
                label: 'Inspect element',
                click() {
                    mainWindow.inspectElement(x, y);
                }
            }]).popup(mainWindow);
        });
    }

    const menu = Menu.buildFromTemplate(
        menuTemplate.filter(elem => elem.filter === undefined || elem.filter)
    );

    if (process.platform === 'darwin') {
        Menu.setApplicationMenu(menu);
    } else {
        mainWindow.setMenu(menu);
    }
});
