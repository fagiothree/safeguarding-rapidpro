import {uuid} from 'uuid';

////////////////////////////////////////////////////////

export function process_wfr_node(node,flow){

    // position of the wfr node
    let node_position = flow._ui.nodes[node.uuid].position;

    // uuid of the send_message node parent of the wfr node
    let send_msg_uuid = get_send_msg_parent_uuid(flow, node.uuid)

    // generate uuid for the 2 nodes to add
    let enter_flow_node_uuid = uuid.v4();
    let split_node_uuid = uuid.v4();

    //add category with safeguarding keywords to wfr node
    add_safeguarding_cat(node, enter_flow_node_uuid);

    // generate enter_flow and split node
    let enter_flow_node = generate_enter_flow_node(enter_flow_node_uuid, split_node_uuid, sg_flow_name, sg_flow_uuid);
    let split_by_result_node = generate_split_by_result_node(split_node_uuid, send_msg_uuid)

    // add nodes to flow
    flow.nodes.push(enter_flow_node)
    flow.nodes.push(split_by_result_node)


    // position nodes far on the right in the _ui
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



function add_safeguarding_cat(wfr_node, dest_uuid) {
    //create case object
    var sg_case = {};
    sg_case["arguments"] = [sg_keywords];
    sg_case["type"] = "has_any_word";
    sg_case["uuid"] = uuid.v4();
    sg_case["category_uuid"] = uuid.v4();

    wfr_node.router.cases.push(sg_case);

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
    let parent_nodes = flow.nodes.filter(nd => is_parent(nd,node_uuid) );
    if (parent_nodes.length == 0){
        return null
    } else if (parent_nodes.length == 1){
        // if there is only one parent and the parent is of type send_msg, that's the send_msg parent node
        if (is_send_msg_node(parent_nodes[0])){
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
        let grandparent_nodes = parent_nodes.map(nd => find_parents(nd,flow));
        //if all the parent nodes have a single parent and that parent is in common (==> it's a router), that's the output
        
        if (same_grandparent(grandparent_nodes)){
            //console.log("same grandparent")
            return grandparent_nodes[0][0]
        } else {
            let send_msg_parent_nodes = parent_nodes.filter(nd => is_send_msg_node(nd));
            if (send_msg_parent_nodes.length == parent_nodes.length){
                //console.log("all send mesg")
                //console.log(flow.name)
                for (let i=1; i< parent_nodes.length; i++){
                    if (!parent_nodes[parent_nodes.length-i].actions[0].text.startsWith("Sorry")){
                        return  parent_nodes[parent_nodes.length-i].uuid
                    }
                }
                console.log("sorry" + parent_nodes[0].actions[0].text)
                
                return  parent_nodes[0].uuid
                
                
                
            } else {
                console.log("----------------------------------------------")
                console.log("OTHER CASE")
                console.log(flow.name)
                console.log(node_uuid)
            }
           
           
        }


    }
    
    let send_msg_parent_uuid = null;
    //parent_uuid is null if the node has no send_msg parent (or grandparent) node
    return send_msg_parent_uuid
}


function is_parent(node,child_uuid){
    for (let ex = 0; ex < node.exits.length; ex++) {
        if (node.exits[ex].destination_uuid == child_uuid) {
            return true
        }
    }
    return false
    
}


function is_send_msg_node(node){
    for(let ac=0; ac < node.actions.length; ac++){
        if (node.actions[ac].type == "send_msg"){
            return true
        }
    }
    return false
}

function find_parents(node,flow){
    let parents_ids = [];
    flow.nodes.forEach(nd => {
        if (is_parent(nd,node.uuid)){
            parents_ids.push(nd.uuid);
        }
    })
    return parents_ids
}


function same_grandparent(nodes_ids){
    let parent_id = nodes_ids[0][0];
    if (nodes_ids.every(nd_list => (nd_list.length == 1 && nd_list[0] == parent_id))){
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

