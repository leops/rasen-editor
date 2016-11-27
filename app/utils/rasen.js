import {
    remote
} from 'electron';
import path from 'path';

const ffi = remote.require('ffi');

// eslint-disable-next-line import/prefer-default-export
export const {
    compile
} = ffi.Library(path.join(__dirname, '../native/target/debug/rasen'), {
    compile: ['string', ['string']]
});
