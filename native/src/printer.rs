use std::mem::transmute;

use rasen::ShaderType;
use rasen::Module as Mod;

use spirv_utils::instruction::Instruction as Inst;
use spirv_utils::instruction::Decoration as Deco;
use spirv_utils::desc;

use rspirv::mr::*;
use rspirv::spirv::*;
use rspirv::binary::Disassemble;
use rspirv::grammar::InstructionTable;

fn new_instruction(opcode: Op, result_id: Option<u32>, result_type: Option<u32>, operands: Vec<Operand>) -> Instruction {
    Instruction {
        class: InstructionTable::lookup_opcode(
            opcode as u16
        ).expect("opcode not found"),
        result_id: result_id,
        result_type: result_type,
        operands: operands
    }
}

fn convert_instruction(inst: &Inst) -> Result<Instruction, String> {
    Ok(match inst {
        &Inst::Decorate { target, ref decoration } => new_instruction(
            Op::Decorate,
            None, None,
            vec![
                Operand::IdRef(target.0),
            ].into_iter()
                .chain(
                    vec![decoration].into_iter()
                        .flat_map(|d| match d {
                            &Deco::Location(loc) => vec![
                                Operand::Decoration(Decoration::Location),
                                Operand::LiteralInt32(loc),
                            ],
                            _ => vec![]
                        })
                )
                .collect()
        ),

        &Inst::TypeVoid { result_type } => new_instruction(
            Op::TypeVoid,
            Some(result_type.0), None,
            vec![]
        ),
        &Inst::TypeFunction { result_type, return_ty, ref params } => new_instruction(
            Op::TypeFunction,
            Some(result_type.0), None,
            vec![
                Operand::IdRef(return_ty.0)
            ].into_iter()
                .chain(
                    params.into_iter()
                        .map(|id| Operand::IdRef(id.0))
                )
                .collect()
        ),
        &Inst::TypeFloat { result_type, width } => new_instruction(
            Op::TypeFloat,
            Some(result_type.0), None,
            vec![
                Operand::LiteralInt32(width)
            ]
        ),
        &Inst::TypeVector { result_type, type_id, len } => new_instruction(
            Op::TypeVector,
            Some(result_type.0),
            Some(type_id.0),
            vec![
                Operand::LiteralInt32(len)
            ]
        ),
        &Inst::TypePointer { result_type, storage_class, pointee } => new_instruction(
            Op::TypePointer,
            Some(result_type.0), None,
            vec![
                Operand::StorageClass(match storage_class {
                    desc::StorageClass::Input => StorageClass::Input,
                    desc::StorageClass::Output => StorageClass::Output,
                    _ => return Err(format!("Unimplemented storage class {:?}", storage_class))
                }),
                Operand::IdRef(pointee.0)
            ]
        ),

        &Inst::Constant { result_type, result_id, ref val } => new_instruction(
            Op::Constant,
            Some(result_id.0), None,
            vec![
                Operand::IdRef(result_type.0)
            ].into_iter()
                .chain(
                    val.into_iter()
                        .map(|v| Operand::LiteralFloat32(unsafe {
                            transmute(*v)
                        }))
                )
                .collect()
        ),
        &Inst::ConstantComposite { result_type, result_id, ref flds } => new_instruction(
            Op::ConstantComposite,
            Some(result_id.0), None,
            vec![
                Operand::IdRef(result_type.0)
            ].into_iter()
                .chain(
                    flds.into_iter()
                        .map(|v| Operand::IdRef(v.0))
                )
                .collect()
        ),

        &Inst::Variable { result_type, result_id, storage_class, init } => new_instruction(
            Op::Variable,
            Some(result_id.0),
            Some(result_type.0),
            {
                let mut res = Vec::new();
                res.push(Operand::StorageClass(match storage_class {
                    desc::StorageClass::Input => StorageClass::Input,
                    desc::StorageClass::Output => StorageClass::Output,
                    _ => return Err(format!("Unimplemented storage class {:?}", storage_class))
                }));

                if init.0 != 0 {
                    res.push(Operand::IdRef(init.0));
                }

                res
            }
        ),
        &Inst::Load { result_type, result_id, value_id, memory_access } => new_instruction(
            Op::Load,
            Some(result_id.0),
            Some(result_type.0),
            vec![
                Operand::IdRef(value_id.0),
                Operand::MemoryAccess(
                    MemoryAccess::from_bits_truncate(memory_access.bits())
                )
            ]
        ),
        &Inst::Store { ptr, obj, memory_access } => new_instruction(
            Op::Store,
            None, None,
            vec![
                Operand::IdRef(ptr.0),
                Operand::IdRef(obj.0),
                Operand::MemoryAccess(
                    MemoryAccess::from_bits_truncate(memory_access.bits())
                )
            ]
        ),

        &Inst::ExtInst { result_type, result_id, set, instruction, ref operands } => new_instruction(
            Op::ExtInst,
            Some(result_id.0),
            Some(result_type.0),
            vec![
                Operand::IdRef(set.0),
                Operand::LiteralExtInstInteger(instruction)
            ].into_iter()
                .chain(
                    operands.into_iter()
                        .map(|id| Operand::IdRef(id.0))
                )
                .collect()
        ),
        &Inst::Dot { result_type, result_id, lhs, rhs } => new_instruction(
            Op::Dot,
            Some(result_id.0),
            Some(result_type.0),
            vec![
                Operand::IdRef(lhs.0),
                Operand::IdRef(rhs.0)
            ]
        ),

        &Inst::IAdd { result_type, result_id, lhs, rhs } => new_instruction(
            Op::IAdd,
            Some(result_id.0),
            Some(result_type.0),
            vec![
                Operand::IdRef(lhs.0),
                Operand::IdRef(rhs.0)
            ]
        ),
        &Inst::FAdd { result_type, result_id, lhs, rhs } => new_instruction(
            Op::FAdd,
            Some(result_id.0),
            Some(result_type.0),
            vec![
                Operand::IdRef(lhs.0),
                Operand::IdRef(rhs.0)
            ]
        ),

        &Inst::ISub { result_type, result_id, lhs, rhs } => new_instruction(
            Op::ISub,
            Some(result_id.0),
            Some(result_type.0),
            vec![
                Operand::IdRef(lhs.0),
                Operand::IdRef(rhs.0)
            ]
        ),
        &Inst::FSub { result_type, result_id, lhs, rhs } => new_instruction(
            Op::FSub,
            Some(result_id.0),
            Some(result_type.0),
            vec![
                Operand::IdRef(lhs.0),
                Operand::IdRef(rhs.0)
            ]
        ),

        &Inst::IMul { result_type, result_id, lhs, rhs } => new_instruction(
            Op::IMul,
            Some(result_id.0),
            Some(result_type.0),
            vec![
                Operand::IdRef(lhs.0),
                Operand::IdRef(rhs.0)
            ]
        ),
        &Inst::FMul { result_type, result_id, lhs, rhs } => new_instruction(
            Op::FMul,
            Some(result_id.0),
            Some(result_type.0),
            vec![
                Operand::IdRef(lhs.0),
                Operand::IdRef(rhs.0)
            ]
        ),

        &Inst::VectorTimesMatrix { result_type, result_id, vector, matrix } => new_instruction(
            Op::VectorTimesMatrix,
            Some(result_id.0),
            Some(result_type.0),
            vec![
                Operand::IdRef(vector.0),
                Operand::IdRef(matrix.0)
            ]
        ),
        &Inst::VectorTimesScalar { result_type, result_id, vector, scalar } => new_instruction(
            Op::VectorTimesScalar,
            Some(result_id.0),
            Some(result_type.0),
            vec![
                Operand::IdRef(vector.0),
                Operand::IdRef(scalar.0)
            ]
        ),

        &Inst::MatrixTimesVector { result_type, result_id, matrix, vector } => new_instruction(
            Op::MatrixTimesVector,
            Some(result_id.0),
            Some(result_type.0),
            vec![
                Operand::IdRef(matrix.0),
                Operand::IdRef(vector.0)
            ]
        ),
        &Inst::MatrixTimesMatrix { result_type, result_id, lhs, rhs } => new_instruction(
            Op::MatrixTimesMatrix,
            Some(result_id.0),
            Some(result_type.0),
            vec![
                Operand::IdRef(lhs.0),
                Operand::IdRef(rhs.0)
            ]
        ),

        &Inst::SDiv { result_type, result_id, lhs, rhs } => new_instruction(
            Op::SDiv,
            Some(result_id.0),
            Some(result_type.0),
            vec![
                Operand::IdRef(lhs.0),
                Operand::IdRef(rhs.0)
            ]
        ),
        &Inst::FDiv { result_type, result_id, lhs, rhs } => new_instruction(
            Op::FDiv,
            Some(result_id.0),
            Some(result_type.0),
            vec![
                Operand::IdRef(lhs.0),
                Operand::IdRef(rhs.0)
            ]
        ),

        &Inst::SMod { result_type, result_id, lhs, rhs } => new_instruction(
            Op::SMod,
            Some(result_id.0),
            Some(result_type.0),
            vec![
                Operand::IdRef(lhs.0),
                Operand::IdRef(rhs.0)
            ]
        ),
        &Inst::FMod { result_type, result_id, lhs, rhs } => new_instruction(
            Op::FMod,
            Some(result_id.0),
            Some(result_type.0),
            vec![
                Operand::IdRef(lhs.0),
                Operand::IdRef(rhs.0)
            ]
        ),

        _ => return Err(format!("Unimplemented instruction {:?}", inst))
    })
}

pub fn module_printer(module: Mod) -> Result<String, String> {
    let program = Module {
        header: Some(ModuleHeader::new(
            0x07230203u32,
            0x00010000,
            0x000c0001,
            module.bound(),
            0
        )),
        capabilities: vec![
            Capability::Shader
        ],
        ext_inst_imports: module.get_imports(),
        addressing_model: Some(
            AddressingModel::Logical
        ),
        memory_model: Some(
            MemoryModel::GLSL450
        ),
        entry_points: vec![new_instruction(
            Op::EntryPoint,
            None, None,
            vec![
                Operand::ExecutionModel(match module.get_type() {
                    ShaderType::Vertex => ExecutionModel::Vertex,
                    ShaderType::Fragment => ExecutionModel::Fragment,
                    _ => return Err(format!("Unimplemented execution model {:?}", module.get_type()))
                }),
                Operand::IdRef(2),
                Operand::LiteralString(String::from("main"))
            ].into_iter()
                .chain(
                    module.get_io()
                        .into_iter()
                        .map(|id| Operand::IdRef(id))
                )
                .collect()
        )],
        execution_modes: vec![new_instruction(
            Op::ExecutionMode,
            None, None,
            vec![
                Operand::IdRef(4),
                Operand::ExecutionMode(
                    ExecutionMode::OriginUpperLeft
                )
            ]
        )],
        annotations: try!(
            module.get_annotations().iter()
                .map(|inst| convert_instruction(inst))
                .collect()
        ),
        types_global_values: try!(
            module.get_declarations().iter()
                .map(|inst| convert_instruction(inst))
                .collect()
        ),
        functions: vec![
            Function {
                def: Some(new_instruction(
                    Op::Function,
                    Some(4), Some(1),
                    vec![
                        Operand::FunctionControl(
                            FunctionControl::empty()
                        ),
                        Operand::IdRef(2)
                    ]
                )),
                parameters: vec![],
                basic_blocks: vec![BasicBlock {
                    label: Some(new_instruction(
                        Op::Label,
                        Some(3), None, vec![]
                    )),
                    instructions: try!(
                        module.get_instructions()
                            .iter()
                            .map(|inst| convert_instruction(inst))
                            .chain(vec![Ok(
                                new_instruction(
                                    Op::Return,
                                    None, None, vec![]
                                )
                            )].into_iter())
                            .collect()
                    ),
                }],
                end: Some(new_instruction(
                    Op::FunctionEnd,
                    None, None, vec![]
                )),
                ..Function::new()
            }
        ],
        ..Module::new()
    };


    Ok(program.disassemble())
}
