import fs from 'fs';
import path from 'path';
import {
    ipcMain,
} from 'electron';
import leftPad from 'left-pad';

import ffi from 'ffi';
import ref from 'ref';

const rasen = ffi.Library(path.join(__dirname, '../../native/target/release/rasen'), {
    to_bytecode: ['pointer', ['string']],
    to_assembly: ['string', ['string']],
});

ipcMain.on('to_bytecode', (evt, graph, file) => {
    let data;
    switch (path.extname(file)) {
        case '.spv': {
            // console.time('toBytecode');
            const ptr = rasen.to_bytecode(graph);
            // console.timeEnd('toBytecode');

            const sizePtr = ref.reinterpret(ptr, 8);
            const size = sizePtr.readUIntLE(0, 8);

            data = ref.reinterpret(ptr, size, 8);
        }
        break;

        case '.spvasm': {
            const asm = rasen.to_assembly(graph);
            const tree = JSON.parse(asm);

            if (tree.error) {
                console.error('error', tree.error);
                return;
            }

            let padding = 5;
            while (tree.bound > 10) {
                padding += 1;
                tree.bound /= 10;
            }

            data = tree.instructions
                .map((inst, key) => `${
                    inst.result_id ?
                        `${leftPad(`%${inst.result_id}`, padding - 3)} = ` :
                        new Array(inst.class === ';' ? 0 : padding).join(' ')
                }${inst.class} ${
                    inst.operands
                        .map((op, i) => {
                            switch (op.operand) {
                                case 'Id':
                                case 'Type':
                                    return `%${op.value}`;

                                case 'String':
                                    return `"${op.value}"`;

                                default:
                                    return op.value;
                            }
                        })
                        .join(' ')
                }`)
                .join('\n');
        }
        break;

        default:
            console.error('Unknown extension');
            return;
    }

    fs.writeFile(file, data, err => {
        if (err) {
            console.error(err);
        }
    });
});
