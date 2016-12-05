use serde_json::{from_str, Value, Map};
use std::collections::HashMap;

use rasen::*;

fn as_typename(name: &str, node: &'static str) -> Result<TypeName, String> {
    Ok(match name {
        "bool" => TypeName::Bool,
        "float" => TypeName::Float,
        "int" => TypeName::Int,
        "vec2" => TypeName::Vec(2),
        "vec3" => TypeName::Vec(3),
        "vec4" => TypeName::Vec(4),
        "mat2" => TypeName::Mat(2),
        "mat3" => TypeName::Mat(3),
        "mat4" => TypeName::Mat(4),
        _ => return Err(format!("Unknown {} type {:?}", node, name))
    })
}

fn get_prop<'a>(obj: &'a Map<String, Value>, key: &str, context: &'static str) -> Result<&'a Value, String> {
    obj.get(key).ok_or(format!("{}.{} is undefined", context, key))
}

fn as_float(value: &Value, context: &'static str) -> Result<f32, String> {
    Ok(try!(value.as_f64().ok_or(format!("{} is not a float", context))) as f32)
}

fn as_int(value: &Value, context: &'static str) -> Result<i32, String> {
    Ok(try!(value.as_i64().ok_or(format!("{} is not an integer", context))) as i32)
}
fn as_uint(value: &Value, context: &'static str) -> Result<u32, String> {
    Ok(try!(value.as_u64().ok_or(format!("{} is not an unsigned integer", context))) as u32)
}

fn as_str<'a>(value: &'a Value, context: &'static str) -> Result<&'a str, String> {
    value.as_str().ok_or(format!("{} is not a string", context))
}

pub fn parse_input(input: String) -> Result<Graph, String> {
    let data: Value = match from_str(&input) {
        Ok(val) => val,
        Err(err) => return Err(format!("JSON error: {:?}", err))
    };

    let data = try!(data.as_object().ok_or("JSON input is not an object"));

    let mut graph = Graph::new();
    let mut mappings: HashMap<String, NodeIndex<u32>> = HashMap::new();

    let nodes = try!(get_prop(data, "nodes", "data"));
    let nodes = try!(nodes.as_object().ok_or("nodes is not an object"));

    for (key, node) in nodes.iter() {
        let node = try!(node.as_object().ok_or("node is not an object"));

        let title = try!(get_prop(node, "title", "node"));
        let title = try!(as_str(title, "node title"));

        let graph_id = graph.add_node(match title {
            "Input" => {
                let location = try!(get_prop(node, "location", "input"));
                let location = try!(as_uint(location, "input location"));

                let data_type = try!(get_prop(node, "type", "input"));
                let data_type = try!(as_str(data_type, "input type"));

                Node::Input(location as u32, try!(as_typename(data_type, "input")))
            },
            "Output" => {
                let location = try!(get_prop(node, "location", "output"));
                let location = try!(as_uint(location, "output location"));

                let data_type = try!(get_prop(node, "type", "output"));
                let data_type = try!(as_str(data_type, "output type"));

                Node::Output(location as u32, try!(as_typename(data_type, "output")))
            },
            "Constant" => {
                let data_type = try!(get_prop(node, "type", "constant"));
                let data_type = try!(as_str(data_type, "constant type"));

                let value = try!(get_prop(node, "value", "constant"));

                Node::Constant(match data_type {
                    "bool" => {
                        let value = try!(value.as_bool().ok_or("constant value is not a boolean"));

                        TypedValue::Bool(value)
                    },
                    "float" => TypedValue::Float(
                        try!(as_float(&value, "constant value"))
                    ),
                    "int" => TypedValue::Int(
                        try!(as_int(value, "constant value"))
                    ),
                    "vec2" => {
                        let value = try!(value.as_array().ok_or("constant value is not an array"));
                        if value.len() != 2 {
                            return Err(String::from("Wrong array length for vec2"));
                        }

                        TypedValue::Vec2(
                            try!(as_float(&value[0], "vector element")),
                            try!(as_float(&value[1], "vector element"))
                        )
                    },
                    "vec3" => {
                        let value = try!(value.as_array().ok_or("constant value is not an array"));
                        if value.len() != 3 {
                            return Err(String::from("Wrong array length for vec3"));
                        }

                        TypedValue::Vec3(
                            try!(as_float(&value[0], "vector element")),
                            try!(as_float(&value[1], "vector element")),
                            try!(as_float(&value[2], "vector element"))
                        )
                    },
                    "vec4" => {
                        let value = try!(value.as_array().ok_or("constant value is not an array"));
                        if value.len() != 4 {
                            return Err(String::from("Wrong array length for vec4"));
                        }

                        TypedValue::Vec4(
                            try!(as_float(&value[0], "vector element")),
                            try!(as_float(&value[1], "vector element")),
                            try!(as_float(&value[2], "vector element")),
                            try!(as_float(&value[3], "vector element"))
                        )
                    },
                    _ => return Err(format!("Unknown constant type {:?}", data_type))
                })
            },

            "Normalize" => Node::Normalize,
            "Clamp" => Node::Clamp,
            "Dot" => Node::Dot,
            "Cross" => Node::Cross,

            "Floor" => Node::Floor,
            "Ceil" => Node::Ceil,
            "Round" => Node::Round,

            "Sin" => Node::Sin,
            "Cos" => Node::Cos,
            "Tan" => Node::Tan,

            "Pow" => Node::Pow,

            "Min" => Node::Min,
            "Max" => Node::Max,

            "Length" => Node::Length,
            "Distance" => Node::Distance,

            "Reflect" => Node::Reflect,
            "Refract" => Node::Refract,

            "Add" => Node::Add,
            "Substract" => Node::Substract,
            "Multiply" => Node::Multiply,
            "Divide" => Node::Divide,
            "Modulus" => Node::Modulus,

            _ => return Err(format!("Unimplemented node {:?}", title))
        });

        mappings.insert(key.clone(), graph_id);
    }

    let edges = try!(get_prop(data, "edges", "data"));
    let edges = try!(edges.as_object().ok_or("edges is not an object"));

    for (id, edge) in edges.iter() {
        let edge = try!(edge.as_object().ok_or("edge is not an object"));

        let from = try!(get_prop(edge, "from", "edge"));
        let from = try!(from.as_u64().ok_or("edge origin is not a number"));

        let to = try!(get_prop(edge, "to", "edge"));
        let to = try!(to.as_u64().ok_or("edge destination is not a number"));

        let id = id.split(":");
        let id = try!(id.last().ok_or("edge index has invalid format"));

        graph.add_edge(
            *try!(mappings.get(&format!("{}", from)).ok_or("edge origin node is undefined")),
            *try!(mappings.get(&format!("{}", to)).ok_or("edge destination node is undefined")),
            try!(id.parse().map_err(|_| String::from("edge index is not an integer"))),
        );
    }

    Ok(graph)
}
