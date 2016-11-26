extern crate spirv_utils;
extern crate serde_json;
extern crate rspirv;
extern crate rasen;

mod parser;
mod printer;

use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::mem;

use rasen::*;

use parser::*;
use printer::*;

#[no_mangle]
pub extern fn compile(input: *const c_char) -> *mut c_char {
    let input = unsafe {
        CStr::from_ptr(input).to_string_lossy().into_owned()
    };

    let result = match parse_input(input) {
        Ok(graph) => match Module::build(&graph, ShaderType::Fragment) {
            Ok(module) => match module_printer(module) {
                Ok(code) => code,
                Err(msg) => msg
            },
            Err(msg) => String::from(msg)
        },
        Err(msg) => msg
    };

    let c_string = CString::new(result).unwrap();
    let ret: *mut c_char = unsafe {
        mem::transmute(c_string.as_ptr())
    };
    mem::forget(c_string);
    ret
}
