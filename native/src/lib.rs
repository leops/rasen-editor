#![feature(specialization)]

extern crate error_chain;
extern crate spirv_utils;
extern crate serde;
extern crate serde_json;
extern crate rasen;

mod parser;
mod printer;

use error_chain::ChainedError;
use std::ffi::{CStr, CString};
use std::os::raw::{
    c_char, c_void,
};
use std::mem;
use std::fmt::Write;

use rasen::*;

use parser::*;
use printer::*;

fn print_err<E>(e: E) -> String where E: ChainedError {
    let mut err = String::new();
    writeln!(&mut err, "{}", e).unwrap();

    for e in e.iter().skip(1) {
        writeln!(&mut err, "caused by: {}", e).unwrap();
    }

    if let Some(backtrace) = e.backtrace() {
        writeln!(&mut err, "backtrace: {:?}", backtrace).unwrap();
    }

    err
}

fn convert_asm(input: String) -> Result<String, String> {
    let graph = parse_input(input)?;
    module_printer(
        Module::build(&graph, ShaderType::Fragment)
            .map_err(print_err)?
    )
}

fn convert_bc(input: String) -> Result<Vec<u8>, String> {
    let graph = parse_input(input)?;
    build_program(&graph, ShaderType::Fragment)
        .map_err(print_err)
}

#[no_mangle]
pub extern fn to_assembly(input: *const c_char) -> *mut c_char {
    let input = unsafe {
        CStr::from_ptr(input).to_string_lossy().into_owned()
    };

    let result = match convert_asm(input) {
        Ok(code) => code,
        Err(msg) => format!("{{\"error\":{:?}}}", msg)
    };

    let c_string = CString::new(result).unwrap();
    let ret: *mut c_char = unsafe {
        mem::transmute(c_string.as_ptr())
    };
    mem::forget(c_string);
    ret
}

#[repr(C)]
pub struct Array {
    len: usize,
    data: *const c_void,
}

#[no_mangle]
pub extern fn to_bytecode(input: *const c_char) -> *const u8 {
    let input = unsafe {
        CStr::from_ptr(input).to_string_lossy().into_owned()
    };

    let vec = match convert_bc(input) {
        Ok(code) => code,
        Err(msg) => msg.into_bytes()
    };

    let size: [u8; 8] = unsafe {
        mem::transmute(vec.len() as u64)
    };

    let mut res = Vec::new();
    res.extend(size.into_iter());
    res.extend(vec.into_iter());

    let ptr = res.as_ptr();
    mem::forget(res);
    ptr
}
