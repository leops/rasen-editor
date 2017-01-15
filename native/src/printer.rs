use std::fmt;
use std::mem::transmute;

use rasen::Module as Mod;
use rasen::glsl::*;

use spirv_utils::instruction::Instruction as Inst;
use spirv_utils::instruction::Decoration as Deco;
use spirv_utils::desc::{
    Id, ResultId,
    TypeId, ValueId,
};

use serde_json::{
    to_string, to_value,
    Value, Map
};

enum Operand {
    Text(String),
    Id(u32),
    Type(u32),
    LitString(String),
    LitInt(u32),
    LitFloat(f32),
    LitDouble(f64),
    ExtInst(GLSL),
}

macro_rules! insert_operand {
    ( $res:ident, $name:expr, $value:expr ) => {
        $res.insert(String::from("operand"), Value::String(String::from($name)));
        $res.insert(String::from("value"), to_value($value));
    }
}

fn new_operand(operand: Operand) -> Value {
    let mut res = Map::new();

    match operand {
        Operand::Text(ref val) => {
            insert_operand!(res, "Text", val);
        },
        Operand::Id(val) => {
            insert_operand!(res, "Id", val);
        },
        Operand::Type(val) => {
            insert_operand!(res, "Type", val);
        },
        Operand::LitString(ref val) => {
            insert_operand!(res, "String", val);
        },
        Operand::LitInt(val) => {
            insert_operand!(res, "Int", val);
        },
        Operand::LitFloat(val) => {
            insert_operand!(res, "Float", val as f64);
        },
        Operand::LitDouble(val) => {
            insert_operand!(res, "Double", val);
        },
        Operand::ExtInst(ref val) => {
            insert_operand!(res, "ExtInst", format!("{:?}", val));
        }
    }

    Value::Object(res)
}

trait AsOperand {
    fn as_op(&self) -> Operand;
}

impl<T: fmt::Debug> AsOperand for T {
    default fn as_op(&self) -> Operand {
        Operand::Text(format!("{:?}", self))
    }
}

impl AsOperand for Id {
    fn as_op(&self) -> Operand {
        Operand::Id(self.0)
    }
}
impl AsOperand for ResultId {
    fn as_op(&self) -> Operand {
        Operand::Id(self.0)
    }
}
impl AsOperand for ValueId {
    fn as_op(&self) -> Operand {
        Operand::Id(self.0)
    }
}

impl AsOperand for TypeId {
    fn as_op(&self) -> Operand {
        Operand::Type(self.0)
    }
}

impl AsOperand for str {
    fn as_op(&self) -> Operand {
        Operand::Text(String::from(self))
    }
}
impl AsOperand for String {
    fn as_op(&self) -> Operand {
        Operand::LitString(self.clone())
    }
}

impl AsOperand for bool {
    fn as_op(&self) -> Operand {
        Operand::LitInt(if *self {1} else {0})
    }
}

impl AsOperand for u32 {
    fn as_op(&self) -> Operand {
        Operand::LitInt(*self)
    }
}

fn new_instruction<V>(class: &str, result_id: Option<u32>, operands: V) -> Result<Value, String> where V: IntoIterator<Item=Operand> {
    let mut res = Map::new();

    res.insert(String::from("class"), Value::String(String::from(class)));

    if let Some(id) = result_id {
        res.insert(String::from("result_id"), Value::U64(id as u64));
    }

    res.insert(String::from("operands"), Value::Array(
        operands.into_iter()
            .map(new_operand)
            .collect()
    ));

    Ok(Value::Object(res))
}

fn convert_instruction(inst: &Inst) -> Result<Value, String> {
    match inst {
        &Inst::Capability { capability } => new_instruction(
            "OpCapability",
            None,
            Some(capability.as_op())
        ),
        &Inst::MemoryModel { addressing_model, memory_model } => new_instruction(
            "OpMemoryModel",
            None,
            vec![
                addressing_model.as_op(),
                memory_model.as_op(),
            ]
        ),
        &Inst::EntryPoint { execution_model, func, ref name, ref interface } => new_instruction(
            "OpEntryPoint",
            None,
            vec![
                execution_model.as_op(),
                func.as_op(),
                name.as_op(),
            ].into_iter()
                .chain(
                    interface.iter()
                        .map(|id| id.as_op())
                )
        ),
        &Inst::ExecutionMode { entry, ref execution_mode } => new_instruction(
            "OpExecutionMode",
            None,
            vec![
                entry.as_op(),
                execution_mode.as_op(),
            ]
        ),
        &Inst::Decorate { target, ref decoration } => new_instruction(
            "OpDecorate",
            None,
            vec![
                target.as_op(),
            ].into_iter()
                .chain(
                    match decoration {
                        &Deco::Location(loc) => vec![
                            "Location".as_op(),
                            Operand::LitInt(loc),
                        ],
                        _ => vec![]
                    }
                )
        ),

        &Inst::Function { result_type, result_id, function_control, fn_ty } => new_instruction(
            "OpFunction",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                format!("{}", function_control).as_str().as_op(),
                fn_ty.as_op(),
            ]
        ),

        &Inst::TypeFloat { result_type, width } => new_instruction(
            "OpTypeFloat",
            Some(result_type.0),
            Some(width.as_op())
        ),
        &Inst::TypeInt { result_type, width, signed } => new_instruction(
            "OpTypeInt",
            Some(result_type.0),
            vec![
                width.as_op(),
                signed.as_op(),
            ]
        ),
        &Inst::TypeVector { result_type, type_id, len } => new_instruction(
            "OpTypeVector",
            Some(result_type.0),
            vec![
                type_id.as_op(),
                len.as_op(),
            ]
        ),
        &Inst::TypeMatrix { result_type, type_id, cols } => new_instruction(
            "OpTypeMatrix",
            Some(result_type.0),
            vec![
                type_id.as_op(),
                cols.as_op(),
            ]
        ),
        &Inst::TypePointer { result_type, storage_class, pointee } => new_instruction(
            "OpTypePointer",
            Some(result_type.0),
            vec![
                storage_class.as_op(),
                pointee.as_op(),
            ]
        ),

        &Inst::Constant { result_type, result_id, ref val } => new_instruction(
            "OpConstant",
            Some(result_id.0),
            vec![
                result_type.as_op(),
            ].into_iter()
                .chain(
                    match val.len() {
                        1 => Some(
                            Operand::LitFloat(unsafe {
                                transmute(val[0])
                            })
                        ),
                        2 => Some(
                            Operand::LitDouble(unsafe {
                                let mut a: [u32; 2] = Default::default();
                                a.copy_from_slice(val);
                                transmute(a)
                            })
                        ),
                        _ => return Err(format!("Unexpected constant size {}", val.len()))
                    }
                )
        ),

        &Inst::Variable { result_type, result_id, storage_class, init } => new_instruction(
            "OpVariable",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                storage_class.as_op(),
            ].into_iter()
                .chain(
                    if init.0 != 0 {
                        Some(init.as_op())
                    } else {
                        None
                    }
                )
        ),
        &Inst::Load { result_type, result_id, value_id, memory_access } => new_instruction(
            "OpLoad",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                value_id.as_op(),
                format!("{}", memory_access).as_str().as_op(),
            ]
        ),
        &Inst::Store { ptr, obj, memory_access } => new_instruction(
            "OpStore",
            None,
            vec![
                ptr.as_op(),
                obj.as_op(),
                format!("{}", memory_access).as_str().as_op(),
            ]
        ),

        &Inst::CompositeExtract { result_type, result_id, obj, ref indices } => new_instruction(
            "OpCompositeExtract",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                obj.as_op(),
            ].into_iter()
                .chain(
                    indices.into_iter()
                        .map(|i| i.as_op())
                )
        ),

        &Inst::ExtInst { result_type, result_id, set, instruction, ref operands } => new_instruction(
            "OpExtInst",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                set.as_op(),
                Operand::ExtInst(unsafe {
                    transmute(instruction)
                })
            ].into_iter()
                .chain(
                    operands.iter().map(|id| id.as_op())
                )
        ),
        &Inst::ExtInstImport { result_id, ref name } => new_instruction(
            "OpExtInstImport",
            Some(result_id.0),
            Some(name.as_op())
        ),

        _ => new_instruction(
            inst.name(),
            inst.defines_value_inner().map(|id| id.0),
            inst.type_id_of().into_iter()
                .map(|id| id.as_op())
                .chain(
                    inst.defines_type().into_iter()
                        .map(|id| id.as_op())
                )
                .chain(
                    inst.uses().into_iter()
                        .map(|id| id.as_op())
                )
        )
    }
}

pub fn module_printer(module: Mod) -> Result<String, String> {
    let operations = module.get_operations();
    let mut instructions = Vec::with_capacity(operations.len() + 5);

    instructions.extend(vec![
        new_instruction(";", None, Some(
            "SPIR-V".as_op()
        ))?,
        new_instruction(";", None, Some(
            "Version: 1.0".as_op()
        ))?,
        new_instruction(";", None, Some(
            "Generator: Rasen; 1".as_op()
        ))?,
        new_instruction(";", None, Some(
            format!("Bound: {}", module.bound()).as_str().as_op()
        ))?,
        new_instruction(";", None, Some(
            "Schema: 0".as_op()
        ))?,
    ].into_iter());

    for op in operations {
        instructions.push(convert_instruction(&op)?);
    }

    let mut result = Map::new();
    result.insert("bound", Value::U64(module.bound() as u64));
    result.insert("instructions", Value::Array(instructions));

    to_string(&result).map_err(|err| format!("{}", err))
}
