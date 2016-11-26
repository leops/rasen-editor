import {
    remote
} from 'electron';
import path from 'path';

const ffi = remote.require('ffi');
const {
    compile
} = ffi.Library(path.join(__dirname, '../native/target/debug/rasen'), {
    compile: ['string', ['string']]
});

export {
    compile
};
