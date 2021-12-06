
let fs = require('fs');
let uuid = require("uuid")
let path = require("path")


/*
import * as fs from 'fs';
import * as uuid from 'uuid';
import * as path from "path";
*/

//var input_path_kw = path.join(__dirname, "./output/safeguarding_malaysia.json");
//var input_path_fl = "./input/plh-international-flavour_ABtesting.json";


//let lang_code = "eng";

let input_args = process.argv.slice(2);
let input_path_kw = input_args[1];
let input_path_fl = input_args[0];
let lang_code = input_args[3];

var json_string_kw = fs.readFileSync(input_path_kw).toString();
var obj_keywords_by_cat = JSON.parse(json_string_kw);

var json_string_fl = fs.readFileSync(input_path_fl).toString();
var plh_flows = JSON.parse(json_string_fl);

const sg_flow_uuid = "3aa013de-3b69-482c-bbc9-acd8d23bae55";
const sg_flow_name = "PLH - Safeguarding - WFR interaction";


// create strings for case in wft nodes
var sg_keywords_eng = "";
var sg_keywords_transl = "";
var sg_keywords_by_cat_eng = {};
var sg_keywords_by_cat_transl = {};

for (let cat in obj_keywords_by_cat) {
    sg_keywords_cat_eng = "";
    sg_keywords_cat_transl = "";

    obj_keywords_by_cat[cat].forEach(eng_transl_pair =>{
    
        eng_transl_pair["English"]["keywords"].forEach(wd => {
            sg_keywords_eng = sg_keywords_eng + wd + ",";
            sg_keywords_cat_eng = sg_keywords_cat_eng + wd + ",";
        })
        eng_transl_pair["English"]["mispellings"].forEach(wd => {
            sg_keywords_eng = sg_keywords_eng + wd + ",";
            sg_keywords_cat_eng = sg_keywords_cat_eng + wd + ",";
        })
        if (eng_transl_pair.hasOwnProperty("Translation")){
            eng_transl_pair["Translation"]["keywords"].forEach(wd => {
                sg_keywords_transl = sg_keywords_transl + wd + ",";
                sg_keywords_cat_transl = sg_keywords_cat_transl + wd + ",";
            })
            eng_transl_pair["Translation"]["mispellings"].forEach(wd => {
                sg_keywords_cat_transl = sg_keywords_cat_transl + wd + ",";
            })
        }


    })
    sg_keywords_cat_eng = sg_keywords_cat_eng.slice(0, sg_keywords_cat_eng.length - 1);
    sg_keywords_cat_transl = sg_keywords_cat_transl.slice(0, sg_keywords_cat_transl.length - 1);
    sg_keywords_by_cat_eng[cat] =  sg_keywords_cat_eng;
    sg_keywords_by_cat_transl[cat] =  sg_keywords_cat_transl;
    
}
sg_keywords_eng = sg_keywords_eng.slice(0, sg_keywords_eng.length - 1);
sg_keywords_transl = sg_keywords_transl.slice(0, sg_keywords_transl.length - 1);


// add keywords to all safeguarding nodes
plh_flows.flows.forEach(flow => {
	//console.log(flow.name)
    let wfr_nodes = flow.nodes.filter(node => (node.hasOwnProperty('router') && node.router.operand == "@input.text" && node.router.hasOwnProperty("wait")))
    wfr_nodes.forEach(node => process_wfr_node(node, flow, sg_keywords_eng, sg_keywords_transl, lang_code));
});


// add keywords to redirect to topic flow
let redirect_flow = plh_flows.flows.filter(fl => fl.name == "PLH - Safeguarding - Redirect to topic")
if (redirect_flow.length != 1){
    console.error("no redirect flow found");
}
redirect_flow = redirect_flow[0];

let split_node = redirect_flow.nodes[0];

if (lang_code != "eng"){
   if (!redirect_flow.hasOwnProperty("localization")){
    redirect_flow.localization = {};
    redirect_flow.localization[lang_code] = {};
   } else if (!redirect_flow.localization.hasOwnProperty(lang_code)){
    redirect_flow.localization[lang_code] = {};
   }

} 

split_node.router.cases.forEach(cs => {
    let corresp_cat = split_node.router.categories.filter(cat => cat.uuid == cs.category_uuid)[0];
    //console.log(corresp_cat.name)
    if (corresp_cat.name == "generic"){
        cs.arguments = [sg_keywords_by_cat_eng["Generic (Police and Ambulance)"]];
        if (lang_code != "eng"){
            let loc_obj = {};
            loc_obj.arguments = [sg_keywords_by_cat_transl["Generic (Police and Ambulance)"]]
            redirect_flow.localization[lang_code][cs.uuid] = loc_obj 
        };
    } else if (corresp_cat.name == "mental health"){
        cs.arguments = [sg_keywords_by_cat_eng["Mental Health"]];
        if (lang_code != "eng"){
            let loc_obj = {};
            loc_obj.arguments = [sg_keywords_by_cat_transl["Mental Health"]];
            redirect_flow.localization[lang_code][cs.uuid] = loc_obj 
        };
    } else if (corresp_cat.name == "health"){
        cs.arguments = [sg_keywords_by_cat_eng["Health"]];
        if (lang_code != "eng"){
            let loc_obj = {};
            loc_obj.arguments = [sg_keywords_by_cat_transl["Health"]];
            redirect_flow.localization[lang_code][cs.uuid] = loc_obj 
        };
    } else if (corresp_cat.name == "violence"){
        cs.arguments = [sg_keywords_by_cat_eng["Violence"]];
        if (lang_code != "eng"){
            let loc_obj = {};
            loc_obj.arguments = [sg_keywords_by_cat_transl["Violence"]];
            redirect_flow.localization[lang_code][cs.uuid] =  loc_obj
        };
    } else if (corresp_cat.name == "natural disasters"){
        cs.arguments = [sg_keywords_by_cat_eng["Natural Disasters"]];
        if (lang_code != "eng"){
            let loc_obj = {};
            loc_obj.arguments = [sg_keywords_by_cat_transl["Natural Disasters"]];
            redirect_flow.localization[lang_code][cs.uuid] =  loc_obj
        };
    } else if (corresp_cat.name == "Help"){
        cs.arguments = [sg_keywords_by_cat_eng["Help"]];
        if (lang_code != "eng"){
            let loc_obj = {};
            loc_obj.arguments = [sg_keywords_by_cat_transl["Help"]];
            redirect_flow.localization[lang_code][cs.uuid] = loc_obj
         };
    }else if (corresp_cat.name == "Sos"){
        cs.arguments = [sg_keywords_by_cat_eng["SOS"]];
        if (lang_code != "eng"){
            let loc_obj = {};
            loc_obj.arguments = [sg_keywords_by_cat_transl["SOS"]] ;
            redirect_flow.localization[lang_code][cs.uuid] = loc_obj};
    }else {
console.error("category name not recognised");
    }
})





let new_flows = JSON.stringify(plh_flows, null, 2);


//var output_path = path.join(__dirname, "./output/flows_safeguarding.json");

var output_path = input_args[2];
fs.writeFile(output_path, new_flows, function (err, result) {
    if (err) console.log('error', err);
});




////////////////////////////////////////////////////////

function process_wfr_node(node, flow, sg_keywords_eng, sg_keywords_transl, lang_code) {

    // position of the wfr node
    if (flow.hasOwnProperty("_ui") && flow._ui.nodes.hasOwnProperty(node.uuid)){
        var node_position = flow._ui.nodes[node.uuid].position;
    } 

    // uuid of the send_message node parent of the wfr node
    let send_msg_uuid = get_send_msg_parent_uuid(flow, node.uuid)

    // generate uuid for the 2 nodes to add
    let enter_flow_node_uuid = uuid.v4();
    let split_node_uuid = uuid.v4();

    //add category with safeguarding keywords to wfr node
    add_safeguarding_cat(flow, node, enter_flow_node_uuid, sg_keywords_eng, sg_keywords_transl, lang_code);

    // generate enter_flow and split node
    let enter_flow_node = generate_enter_flow_node(enter_flow_node_uuid, split_node_uuid, sg_flow_name, sg_flow_uuid);
    let split_by_result_node = generate_split_by_result_node(split_node_uuid, send_msg_uuid)

    // add nodes to flow
    flow.nodes.push(enter_flow_node)
    flow.nodes.push(split_by_result_node)


    // position nodes far on the right in the _ui
    if (flow.hasOwnProperty("_ui")){
        flow._ui.nodes[enter_flow_node.uuid] = {
            position: {
                left: node_position.left + 2000,
                top: node_position.top
            },
            type: "split_by_subflow"
        };
        flow._ui.nodes[split_by_result_node.uuid] = {
            position: {
                left: node_position.left + 2000,
                top: node_position.top + 160
            },
            type: "split_by_expression"
        };
    }
    


}



function add_safeguarding_cat(flow, wfr_node, dest_uuid, sg_keywords_eng, sg_keywords_transl, lang_code) {
    //create case object
    var sg_case = {};
    sg_case["arguments"] = [sg_keywords_eng];
    sg_case["type"] = "has_any_word";
    sg_case["uuid"] = uuid.v4();
    sg_case["category_uuid"] = uuid.v4();

    wfr_node.router.cases.push(sg_case);

    // add translation to flow localization
    if (lang_code != "eng" && flow.hasOwnProperty("localization") && flow.localization.hasOwnProperty(lang_code)){
        let loc_obj = {};
        loc_obj.arguments = [sg_keywords_transl];
        flow.localization[lang_code][sg_case.uuid] = loc_obj;
    }

    //create corresponding category object
    var sg_cat = {};
    sg_cat["uuid"] = sg_case["category_uuid"];
    sg_cat["name"] = "Safeguarding";
    sg_cat["exit_uuid"] = uuid.v4();

    wfr_node.router.categories.push(sg_cat);

    var sg_exit = {};
    sg_exit["uuid"] = sg_cat.exit_uuid;
    sg_exit["destination_uuid"] = dest_uuid;

    wfr_node.exits.push(sg_exit);

    return sg_exit.destination_uuid

}


function generate_enter_flow_node(nodeId, dest_uuid, flow_name, flow_uuid) {
    let enter_flow_node = {
        uuid: nodeId,
        actions: [],
    };

    enter_flow_node.actions.push({
        flow: {
            name: flow_name,
            uuid: flow_uuid
        },
        type: "enter_flow",
        uuid: uuid.v4(),
    });

    let exits = [
        {
            uuid: uuid.v4(),
            destination_uuid: dest_uuid,
        },
        {
            uuid: uuid.v4(),
            destination_uuid: dest_uuid,
        },
    ];

    enter_flow_node.exits = exits;

    let node_categories = [
        {
            uuid: uuid.v4(),
            name: "Complete",
            exit_uuid: exits[0].uuid,
        },
        {
            uuid: uuid.v4(),
            name: "Expired",
            exit_uuid: exits[1].uuid,
        },
    ];
    let node_cases = [
        {
            uuid: uuid.v4(),
            type: "has_only_text",
            arguments: ["completed"],
            category_uuid: node_categories[0].uuid,
        },
        {
            uuid: uuid.v4(),
            type: "has_only_text",
            arguments: ["expired"],
            category_uuid: node_categories[1].uuid,
        },
    ];

    enter_flow_node.router = {
        cases: node_cases,
        categories: node_categories,
        operand: "@child.run.status",
        type: "switch",
        default_category_uuid: node_categories[1].uuid,
    };



    return enter_flow_node
}


function generate_split_by_result_node(node_uuid, dest_uuid) {
    let split_node = {
        uuid: node_uuid,
        actions: [],
    };
    let exits = [
        {
            uuid: uuid.v4()
        },
        {
            destination_uuid: dest_uuid,
            uuid: uuid.v4()
        }
    ];

    split_node.exits = exits;

    let node_categories = [
        {
            uuid: uuid.v4(),
            name: "Other",
            exit_uuid: exits[0].uuid,
        },
        {
            uuid: uuid.v4(),
            name: "Yes",
            exit_uuid: exits[1].uuid,
        }
    ];

    let node_cases = [
        {
            uuid: uuid.v4(),
            type: "has_any_word",
            arguments: ["yes"],
            category_uuid: node_categories[1].uuid,
        }
    ];

    split_node.router = {
        cases: node_cases,
        categories: node_categories,
        operand: "@child.results.sg_back",
        type: "switch",
        default_category_uuid: node_categories[0].uuid,
    };

    return split_node
}


function get_send_msg_parent_uuid(flow, node_uuid) {
    let parent_nodes = flow.nodes.filter(nd => is_parent(nd, node_uuid));
    if (parent_nodes.length == 0) {
        return null
    } else if (parent_nodes.length == 1) {
        // if there is only one parent and the parent is of type send_msg (has at least one action of that type),
        // that's the send_msg parent node
        if (is_send_msg_node(parent_nodes[0])) {
            return parent_nodes[0].uuid;
        } else {
            // if there is only one parent but it's not of type send_msg
            console.log("----------------------------------------------")
            console.log("only one parent but not send_msg")
            console.log(flow.name)
            console.log(parent_nodes[0].uuid)

        }
    } else {
        //console.log("multiple parents found in flow " + flow.name)
        let grandparent_nodes = parent_nodes.map(nd => find_parents(nd, flow));
        //if all the parent nodes have a single parent and that parent is in common (==> it's a router), that's the output

        if (same_grandparent(grandparent_nodes)) {
            //console.log("same grandparent")
            return grandparent_nodes[0][0]
        } else {
            let send_msg_parent_nodes = parent_nodes.filter(nd => is_send_msg_node(nd));
            if (send_msg_parent_nodes.length == parent_nodes.length) {
                //console.log("all send msg")
                //console.log(flow.name)
                // if one of the parent send_msg nodes is of type "Sorry I don't understand", return that node
                // otherwise return the last in the list
                for (let i = 1; i < parent_nodes.length; i++) {
                    let n_send_msg_action = find_send_msg_action(parent_nodes[parent_nodes.length - i]);
                    if (parent_nodes[parent_nodes.length - i].actions[n_send_msg_action].text.startsWith("Sorry")) {
                        return parent_nodes[parent_nodes.length - i].uuid
                    }
                }


                return parent_nodes[parent_nodes.length - 1].uuid



            } else {
                // for the parents that are not of type send_msg, find the parent
                let mixed_generation_nodes = parent_nodes.map(nd => find_first_parent_if_not_send_msg(nd, flow));
                let send_msg_mixed_generation_nodes = mixed_generation_nodes.filter(nd => is_send_msg_node(nd));
                if (send_msg_mixed_generation_nodes.length == mixed_generation_nodes.length) {
                    //console.log("all send msg")
                    //console.log(flow.name)
                    // if one of the parent send_msg nodes is of type "Sorry I don't understand", return that node
                    // otherwise return the last in the list
                    for (let i = 1; i < mixed_generation_nodes.length; i++) {
                        let n_send_msg_action = find_send_msg_action(mixed_generation_nodes[mixed_generation_nodes.length - i]);
                        if (mixed_generation_nodes[mixed_generation_nodes.length - i].actions[n_send_msg_action].text.startsWith("Sorry")) {
                            return mixed_generation_nodes[mixed_generation_nodes.length - i].uuid
                        }
                    }


                    return mixed_generation_nodes[mixed_generation_nodes.length - 1].uuid
                } else {

                    console.log("----------------------------------------------")
                    console.log("OTHER CASE")
                    console.log(flow.name)
                    console.log(node_uuid)
                }
            }


        }


    }

    let send_msg_parent_uuid = null;
    //parent_uuid is null if the node has no send_msg parent (or grandparent) node
    return send_msg_parent_uuid
}


function is_parent(node, child_uuid) {
    for (let ex = 0; ex < node.exits.length; ex++) {
        if (node.exits[ex].destination_uuid == child_uuid) {
            return true
        }
    }
    return false

}


function is_send_msg_node(node) {
 
    for (let ac = 0; ac < node.actions.length; ac++) {
        if (node.actions[ac].type == "send_msg") {
            return true
        }
    }
    return false
}

function find_send_msg_action(node){
    for (let ac = 0; ac < node.actions.length; ac++) {
        if (node.actions[ac].type == "send_msg") {
            return ac
        }
    }
    return "error"
}

function find_parents(node, flow) {
    let parents_ids = [];
    flow.nodes.forEach(nd => {
        if (is_parent(nd, node.uuid)) {
            parents_ids.push(nd.uuid);
        }
    })
    return parents_ids
}

function find_first_parent_if_not_send_msg(node, flow) {
    
    if (is_send_msg_node(node)) {
        return node
    } else {
        let node_gps = flow.nodes.filter(nd => is_parent(nd, node.uuid));;
        if (node_gps.length > 0) {
            return node_gps[0]
        } else {
            return node
        }
    }

}

function same_grandparent(nodes_ids) {
    let parent_id = nodes_ids[0][0];
    if (nodes_ids.every(nd_list => (nd_list.length == 1 && nd_list[0] == parent_id))) {
        return true
    }
    return false
}
///////////////////////////////////////////////////////////////////////////////////////////////

function collect_uuids(collector, data) {
    if (typeof (data) != "object") {

        return
    }
    for (k in data) {
        if (typeof (data[k]) == "object") {
            collect_uuids(collector, data[k]);
        }
        else if (Array.isArray(data[k])) {
            for (var entry = 0; entry < data[k].length; entry++) {
                if (typeof (data[k][entry]) == "object" && data[k][entry].hasOwnProperty("type") && data[k][entry]["type"] == "enter_flow") {
                    collector[data[k][entry]["uuid"]] = uuid.v4();

                    break
                } else {
                    collect_uuids(collector, data[k][entry]);
                }
            }
        }
        else if (k.search("uuid") != -1) {
            if (data[k] != null) {
                collector[data[k]] = uuid.v4();

            }

        }


    }

}


function replace_uuids(collector, data) {
    if (typeof (data) != "object") {

        return
    }
    for (k in data) {
        if (typeof (data[k]) == "object") {
            replace_uuids(collector, data[k]);
        }
        else if (Array.isArray(data[k])) {
            for (var entry = 0; entry < data[k].length; entry++) {
                if (typeof (data[k][entry]) == "object" && data[k][entry].hasOwnProperty("type") && data[k][entry]["type"] == "enter_flow") {
                    data[k][entry]["uuid"] = collector[data[k][entry]["uuid"]];

                    break
                } else {
                    replace_uuids(collector, data[k][entry]);
                }
            }
        }
        else if (k.search("uuid") != -1) {
            if (data[k] != null) {
                data[k] = collector[data[k]];

            }

        }


    }

}

