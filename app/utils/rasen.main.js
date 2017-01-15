import fs from 'fs';
import path from 'path';
import {
    exec,
} from 'child_process';
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

function toAssembly(graph) {
    return Promise.resolve()
        .then(() => rasen.to_assembly(graph));
}

function toBytecode(graph) {
    return Promise.resolve()
        .then(() => {
            const ptr = rasen.to_bytecode(graph);
            const sizePtr = ref.reinterpret(ptr, 8);
            const size = sizePtr.readUIntLE(0, 8);
            return ref.reinterpret(ptr, size, 8);
        });
}

let tempId = 0;
function toGLSL(buffer) {
    return new Promise((resolve, reject) => {
        const file = path.resolve(process.env.TEMP, `__rasen_${tempId++}.spv`);
        fs.writeFile(file, buffer, error => {
            if (error) {
                return reject(error);
            }

            exec('spirv-cross --version 100 --es ' + file, (error, stdout, stderr) => {
                if (error) {
                    return reject(error);
                }

                if (stderr.length > 0) {
                    return reject(stderr);
                }

                resolve(stdout);
                fs.unlink(file);
            });
        });
    });
}

ipcMain.on('build', async ({ sender }, id, graph) => {
    try {
        const asm = JSON.parse(
            await toAssembly(graph)
        );
        if (asm.error) {
            throw asm.error;
        }

        const bin = await toBytecode(graph);

        let glsl;
        try {
            glsl = await toGLSL(bin);
        } catch (error) {
            glsl = error;
        }

        sender.send('build', id, {
            payload: {
                asm, bin, glsl,
            },
        });
    } catch (error) {
        sender.send('build', id, { error });
    }
});

ipcMain.on('export', async (evt, graph, file) => {
    let data;
    switch (path.extname(file)) {
        case '.spv':
            data = await toBytecode(graph);
            break;

        case '.spvasm': {
            const tree = JSON.parse(
                await toAssembly(graph)
            );

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
