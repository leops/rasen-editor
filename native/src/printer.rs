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
    ExtInst(GLSL),
}

macro_rules! insert_operand {
    ( $res:ident, $name:expr, $value:expr ) => {
        $res.insert(String::from("operand"), to_value($name));
        $res.insert(String::from("value"), to_value($value));
    }
}

fn new_operand(operand: Operand) -> Value {
    let mut res = Map::new();

    match operand {
        Operand::Text(val) => {
            insert_operand!(res, "Text", val);
        },
        Operand::Id(val) => {
            insert_operand!(res, "Id", val);
        },
        Operand::Type(val) => {
            insert_operand!(res, "Type", val);
        },
        Operand::LitString(val) => {
            insert_operand!(res, "String", val);
        },
        Operand::LitInt(val) => {
            insert_operand!(res, "Int", val);
        },
        Operand::LitFloat(val) => {
            insert_operand!(res, "Float", val);
        },
        Operand::ExtInst(val) => {
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

fn new_instruction(class: &str, result_id: Option<u32>, operands: Vec<Operand>) -> Result<Value, String> {
    let mut res = Map::new();

    res.insert(String::from("class"), to_value(class));

    if let Some(id) = result_id {
        res.insert(String::from("result_id"), to_value(id));
    }

    res.insert(String::from("operands"), Value::Array(
        operands.into_iter()
            .map(new_operand)
            .collect()
    ));

    Ok(Value::Object(res))
}

fn convert_instruction(inst: Inst) -> Result<Value, String> {
    match inst {
        Inst::Capability { capability } => new_instruction(
            "OpCapability",
            None,
            vec![
                capability.as_op(),
            ]
        ),
        Inst::MemoryModel { addressing_model, memory_model } => new_instruction(
            "OpMemoryModel",
            None,
            vec![
                addressing_model.as_op(),
                memory_model.as_op(),
            ]
        ),
        Inst::EntryPoint { execution_model, func, name, interface } => new_instruction(
            "OpEntryPoint",
            None,
            vec![
                execution_model.as_op(),
                func.as_op(),
                name.as_op(),
            ].into_iter()
                .chain(
                    interface.into_iter()
                        .map(|id| id.as_op())
                )
                .collect()
        ),
        Inst::ExecutionMode { entry, execution_mode } => new_instruction(
            "OpExecutionMode",
            None,
            vec![
                entry.as_op(),
                execution_mode.as_op(),
            ]
        ),
        Inst::Decorate { target, ref decoration } => new_instruction(
            "OpDecorate",
            None,
            vec![
                target.as_op(),
            ].into_iter()
                .chain(
                    vec![decoration].into_iter()
                        .flat_map(|d| match d {
                            &Deco::Location(loc) => vec![
                                "Location".as_op(),
                                Operand::LitInt(loc),
                            ],
                            _ => vec![]
                        })
                )
                .collect()
        ),

        Inst::Function { result_type, result_id, function_control, fn_ty } => new_instruction(
            "OpFunction",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                format!("{}", function_control).as_str().as_op(),
                fn_ty.as_op(),
            ]
        ),
        Inst::Label { result_id } => new_instruction(
            "OpLabel",
            Some(result_id.0),
            vec![]
        ),
        Inst::Return => new_instruction(
            "OpReturn",
            None, vec![]
        ),
        Inst::FunctionEnd => new_instruction(
            "OpFunctionEnd",
            None, vec![]
        ),

        Inst::TypeVoid { result_type } => new_instruction(
            "OpTypeVoid",
            Some(result_type.0),
            vec![]
        ),
        Inst::TypeFunction { result_type, return_ty, ref params } => new_instruction(
            "OpTypeFunction",
            Some(result_type.0),
            vec![
                return_ty.as_op(),
            ].into_iter()
                .chain(
                    params.into_iter()
                        .map(|id| id.as_op())
                )
                .collect()
        ),
        Inst::TypeFloat { result_type, width } => new_instruction(
            "OpTypeFloat",
            Some(result_type.0),
            vec![
                width.as_op(),
            ]
        ),
        Inst::TypeInt { result_type, width, signed } => new_instruction(
            "OpTypeInt",
            Some(result_type.0),
            vec![
                width.as_op(),
                signed.as_op(),
            ]
        ),
        Inst::TypeVector { result_type, type_id, len } => new_instruction(
            "OpTypeVector",
            Some(result_type.0),
            vec![
                type_id.as_op(),
                len.as_op(),
            ]
        ),
        Inst::TypePointer { result_type, storage_class, pointee } => new_instruction(
            "OpTypePointer",
            Some(result_type.0),
            vec![
                storage_class.as_op(),
                pointee.as_op(),
            ]
        ),

        Inst::Constant { result_type, result_id, ref val } => new_instruction(
            "OpConstant",
            Some(result_id.0),
            vec![
                result_type.as_op(),
            ].into_iter()
                .chain(
                    val.into_iter()
                        .map(|v| Operand::LitFloat(unsafe {
                            transmute(*v)
                        }))
                )
                .collect()
        ),
        Inst::ConstantComposite { result_type, result_id, ref flds } => new_instruction(
            "OpConstantComposite",
            Some(result_id.0),
            vec![
                result_type.as_op(),
            ].into_iter()
                .chain(
                    flds.into_iter()
                        .map(|v| v.as_op())
                )
                .collect()
        ),

        Inst::Variable { result_type, result_id, storage_class, init } => new_instruction(
            "OpVariable",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                storage_class.as_op(),
            ].into_iter()
                .chain((if init.0 != 0 {
                    vec![init.as_op()]
                } else {
                    vec![]
                }).into_iter())
                .collect()
        ),
        Inst::Load { result_type, result_id, value_id, memory_access } => new_instruction(
            "OpLoad",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                value_id.as_op(),
                format!("{}", memory_access).as_str().as_op(),
            ]
        ),
        Inst::Store { ptr, obj, memory_access } => new_instruction(
            "OpStore",
            None,
            vec![
                ptr.as_op(),
                obj.as_op(),
                format!("{}", memory_access).as_str().as_op(),
            ]
        ),

        Inst::ExtInst { result_type, result_id, set, instruction, ref operands } => new_instruction(
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
                    operands.into_iter()
                        .map(|id| id.as_op())
                )
                .collect()
        ),
        Inst::ExtInstImport { result_id, ref name } => new_instruction(
            "OpExtInstImport",
            Some(result_id.0),
            vec![
                name.as_op(),
            ]
        ),

        Inst::Dot { result_type, result_id, lhs, rhs } => new_instruction(
            "OpDot",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                lhs.as_op(),
                rhs.as_op(),
            ]
        ),

        Inst::IAdd { result_type, result_id, lhs, rhs } => new_instruction(
            "OpIAdd",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                lhs.as_op(),
                rhs.as_op(),
            ]
        ),
        Inst::FAdd { result_type, result_id, lhs, rhs } => new_instruction(
            "OpFAdd",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                lhs.as_op(),
                rhs.as_op(),
            ]
        ),

        Inst::ISub { result_type, result_id, lhs, rhs } => new_instruction(
            "OpISub",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                lhs.as_op(),
                rhs.as_op(),
            ]
        ),
        Inst::FSub { result_type, result_id, lhs, rhs } => new_instruction(
            "OpFSub",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                lhs.as_op(),
                rhs.as_op(),
            ]
        ),

        Inst::IMul { result_type, result_id, lhs, rhs } => new_instruction(
            "OpIMul",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                lhs.as_op(),
                rhs.as_op(),
            ]
        ),
        Inst::FMul { result_type, result_id, lhs, rhs } => new_instruction(
            "OpFMul",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                lhs.as_op(),
                rhs.as_op(),
            ]
        ),

        Inst::VectorTimesMatrix { result_type, result_id, vector, matrix } => new_instruction(
            "OpVectorTimesMatrix",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                vector.as_op(),
                matrix.as_op(),
            ]
        ),
        Inst::VectorTimesScalar { result_type, result_id, vector, scalar } => new_instruction(
            "OpVectorTimesScalar",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                vector.as_op(),
                scalar.as_op(),
            ]
        ),

        Inst::MatrixTimesVector { result_type, result_id, matrix, vector } => new_instruction(
            "OpMatrixTimesVector",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                matrix.as_op(),
                vector.as_op(),
            ]
        ),
        Inst::MatrixTimesMatrix { result_type, result_id, lhs, rhs } => new_instruction(
            "OpMatrixTimesMatrix",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                lhs.as_op(),
                rhs.as_op(),
            ]
        ),

        Inst::SDiv { result_type, result_id, lhs, rhs } => new_instruction(
            "OpSDiv",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                lhs.as_op(),
                rhs.as_op(),
            ]
        ),
        Inst::FDiv { result_type, result_id, lhs, rhs } => new_instruction(
            "OpFDiv",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                lhs.as_op(),
                rhs.as_op(),
            ]
        ),

        Inst::SMod { result_type, result_id, lhs, rhs } => new_instruction(
            "OpSMod",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                lhs.as_op(),
                rhs.as_op(),
            ]
        ),
        Inst::FMod { result_type, result_id, lhs, rhs } => new_instruction(
            "OpFMod",
            Some(result_id.0),
            vec![
                result_type.as_op(),
                lhs.as_op(),
                rhs.as_op(),
            ]
        ),

        _ => return Err(format!("Unimplemented instruction {:?}", inst))
    }
}

pub fn module_printer(module: Mod) -> Result<String, String> {
    let mut result = Map::new();

    result.insert("bound", to_value(module.bound()));

    result.insert("instructions", Value::Array(try!(
        vec![
            new_instruction(";", None, vec![
                "SPIR-V".as_op()
            ]),
            new_instruction(";", None, vec![
                "Version: 1.0".as_op()
            ]),
            new_instruction(";", None, vec![
                "Generator: Rasen; 1".as_op()
            ]),
            new_instruction(";", None, vec![
                format!("Bound: {}", module.bound()).as_str().as_op()
            ]),
            new_instruction(";", None, vec![
                "Schema: 0".as_op()
            ]),
        ].into_iter().chain(
            module.get_operations().into_iter()
                .map(convert_instruction)
        ).collect()
    )));

    to_string(&result).map_err(|err| format!("{}", err))
}
