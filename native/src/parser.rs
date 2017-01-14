use serde_json::{from_str, Value, Map};
use std::collections::HashMap;

use rasen::*;

fn as_typename(name: &str, node: &'static str) -> Result<&'static TypeName, String> {
    TypeName::from_string(name).ok_or(format!("Unknown {} type {:?}", node, name))
}

fn get_prop<'a>(obj: &'a Map<String, Value>, key: &str, context: &'static str) -> Result<&'a Value, String> {
    obj.get(key).ok_or(format!("{}.{} is undefined", context, key))
}

fn as_float(value: &Value, context: &'static str) -> Result<f32, String> {
    Ok(value.as_f64().ok_or(format!("{} is not a float", context))? as f32)
}
fn as_double(value: &Value, context: &'static str) -> Result<f64, String> {
    Ok(value.as_f64().ok_or(format!("{} is not a double", context))?)
}

fn as_int(value: &Value, context: &'static str) -> Result<i32, String> {
    Ok(value.as_i64().ok_or(format!("{} is not an integer", context))? as i32)
}
fn as_uint(value: &Value, context: &'static str) -> Result<u32, String> {
    Ok(value.as_u64().ok_or(format!("{} is not an unsigned integer", context))? as u32)
}

fn as_str<'a>(value: &'a Value, context: &'static str) -> Result<&'a str, String> {
    value.as_str().ok_or(format!("{} is not a string", context))
}

pub fn parse_input(input: String) -> Result<Graph, String> {
    let data: Value = match from_str(&input) {
        Ok(val) => val,
        Err(err) => return Err(format!("JSON error: {:?}", err))
    };

    let data = data.as_object().ok_or("JSON input is not an object")?;

    let mut graph = Graph::new();
    let mut mappings = HashMap::new();

    let nodes = get_prop(data, "nodes", "data")?;
    let nodes = nodes.as_object().ok_or("nodes is not an object")?;

    for (key, node) in nodes.iter() {
        let node = node.as_object().ok_or("node is not an object")?;

        let title = get_prop(node, "title", "node")?;
        let title = as_str(title, "node title")?;

        let graph_id = graph.add_node(match title {
            "Input" => {
                let location = get_prop(node, "location", "input")?;
                let location = as_uint(location, "input location")?;

                let data_type = get_prop(node, "type", "input")?;
                let data_type = as_str(data_type, "input type")?;

                Node::Input(location as u32, as_typename(data_type, "input")?)
            },
            "Output" => {
                let location = get_prop(node, "location", "output")?;
                let location = as_uint(location, "output location")?;

                let data_type = get_prop(node, "type", "output")?;
                let data_type = as_str(data_type, "output type")?;

                Node::Output(location as u32, as_typename(data_type, "output")?)
            },

            "Construct" => {
                let data_type = get_prop(node, "type", "input")?;
                let data_type = as_str(data_type, "construct type")?;

                Node::Construct(as_typename(data_type, "construct")?)
            },
            "Extract" => {
                let index = get_prop(node, "index", "extract")?;
                let index = as_uint(index, "extract index")?;

                Node::Extract(index as u32)
            },

            "Constant" => {
                let data_type = get_prop(node, "type", "constant")?;
                let data_type = as_str(data_type, "constant type")?;

                let value = get_prop(node, "value", "constant")?;

                Node::Constant(match as_typename(data_type, "constant")? {
                    &TypeName::Bool => {
                        let value = value.as_bool().ok_or("constant value is not a boolean")?;
                        TypedValue::Bool(value)
                    },

                    &TypeName::Int(signed) => if signed {
                        TypedValue::Int(
                            as_int(&value, "constant value")?
                        )
                    } else {
                        TypedValue::UInt(
                            as_uint(&value, "constant value")?
                        )
                    },

                    &TypeName::Float(precision) => if precision {
                        TypedValue::Double(
                            as_double(&value, "constant value")?
                        )
                    } else {
                        TypedValue::Float(
                            as_float(&value, "constant value")?
                        )
                    },

                    &TypeName::Vec(size, scalar) => {
                        let value = value.as_array().ok_or("constant value is not an array")?;
                        if value.len() != size as usize {
                            return Err(format!("Wrong array length for {}", data_type));
                        }

                        match scalar {
                            &TypeName::Bool => {
                                let res: Result<Vec<_>, _> =
                                    value.into_iter()
                                        .map(|v| v.as_bool().ok_or("vector element is not a boolean"))
                                        .collect();

                                let values = res?;
                                match size {
                                    2 => TypedValue::BVec2(
                                        values[0], values[1]
                                    ),
                                    3 => TypedValue::BVec3(
                                        values[0], values[1], values[2]
                                    ),
                                    4 => TypedValue::BVec4(
                                        values[0], values[1], values[2], values[3]
                                    ),
                                    _ => return Err(format!("Wrong bvec size: {}", size))
                                }
                            },

                            &TypeName::Int(signed) => if signed {
                                let res: Result<Vec<_>, _> =
                                    value.into_iter()
                                        .map(|v| as_int(&v, "vector element"))
                                        .collect();

                                let values = res?;
                                match size {
                                    2 => TypedValue::IVec2(
                                        values[0], values[1]
                                    ),
                                    3 => TypedValue::IVec3(
                                        values[0], values[1], values[2]
                                    ),
                                    4 => TypedValue::IVec4(
                                        values[0], values[1], values[2], values[3]
                                    ),
                                    _ => return Err(format!("Wrong ivec size: {}", size))
                                }
                            } else {
                                let res: Result<Vec<_>, _> =
                                    value.into_iter()
                                        .map(|v| as_uint(&v, "vector element"))
                                        .collect();

                                let values = res?;
                                match size {
                                    2 => TypedValue::UVec2(
                                        values[0], values[1]
                                    ),
                                    3 => TypedValue::UVec3(
                                        values[0], values[1], values[2]
                                    ),
                                    4 => TypedValue::UVec4(
                                        values[0], values[1], values[2], values[3]
                                    ),
                                    _ => return Err(format!("Wrong uvec size: {}", size))
                                }
                            },

                            &TypeName::Float(precision) => if precision {
                                let res: Result<Vec<_>, _> =
                                    value.into_iter()
                                        .map(|v| as_double(&v, "vector element"))
                                        .collect();

                                let values = res?;
                                match size {
                                    2 => TypedValue::DVec2(
                                        values[0], values[1]
                                    ),
                                    3 => TypedValue::DVec3(
                                        values[0], values[1], values[2]
                                    ),
                                    4 => TypedValue::DVec4(
                                        values[0], values[1], values[2], values[3]
                                    ),
                                    _ => return Err(format!("Wrong dvec size: {}", size))
                                }
                            } else {
                                let res: Result<Vec<_>, _> =
                                    value.into_iter()
                                        .map(|v| as_float(&v, "vector element"))
                                        .collect();

                                let values = res?;
                                match size {
                                    2 => TypedValue::Vec2(
                                        values[0], values[1]
                                    ),
                                    3 => TypedValue::Vec3(
                                        values[0], values[1], values[2]
                                    ),
                                    4 => TypedValue::Vec4(
                                        values[0], values[1], values[2], values[3]
                                    ),
                                    _ => return Err(format!("Wrong vec size: {}", size))
                                }
                            },

                            _ => return Err(format!("Wrong vector scalar type: {:?}", *scalar)),
                        }
                    },

                    // TODO: Support matrix constants

                    _ => return Err(format!("Unknown constant type {:?}", data_type))
                })
            },

            _ => Node::from_string(title).ok_or(format!("Unimplemented node {:?}", title))?,
        });

        mappings.insert(key.clone(), graph_id);
    }

    let edges = get_prop(data, "edges", "data")?;
    let edges = edges.as_array().ok_or("edges is not an array")?;

    for edge in edges.iter() {
        let edge = edge.as_object().ok_or("edge is not an object")?;

        let from = get_prop(edge, "from", "edge")?;
        let from = from.as_u64().ok_or("edge origin is not a number")?;

        let to = get_prop(edge, "to", "edge")?;
        let to = to.as_u64().ok_or("edge destination is not a number")?;

        let input = get_prop(edge, "input", "edge")?;
        let input = input.as_u64().ok_or("edge input is not a number")?;

        graph.add_edge(
            *mappings.get(&format!("{}", from)).ok_or("edge origin node is undefined")?,
            *mappings.get(&format!("{}", to)).ok_or("edge destination node is undefined")?,
            input as u32,
        );
    }

    Ok(graph)
}
