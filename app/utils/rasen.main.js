import fs from 'fs';
import path from 'path';
import {
    ipcMain,
} from 'electron';

import ffi from 'ffi';
import ref from 'ref';

const rasen = ffi.Library(path.join(__dirname, '../../native/target/debug/rasen'), {
    to_bytecode: ['pointer', ['string']],
});

ipcMain.on('to_bytecode', (evt, graph, file) => {
    // console.time('toBytecode');
    const ptr = rasen.to_bytecode(graph);
    // console.timeEnd('toBytecode');

    const sizePtr = ref.reinterpret(ptr, 8);
    const size = sizePtr.readUIntLE(0, 8);

    const buffer = ref.reinterpret(ptr, size, 8);
    fs.writeFile(file, buffer, err => {
        if (err) {
            console.error(err);
        }
    });
});
