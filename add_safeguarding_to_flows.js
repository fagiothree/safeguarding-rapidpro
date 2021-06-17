/*
var fs = require('fs');
var path = require("path");
var uuid = require("uuid")
*/


import {fs} from 'fs';
import { process_wfr_node } from './functions.js';

var input_path = "C:/Users/fagio/Desktop/Safeguarding/code/safeguarding_keywords_by_cat.json";
var json_string = fs.readFileSync(input_path).toString();
var obj_keywords_by_cat = JSON.parse(json_string);


var input_path = "C:/Users/fagio/Desktop/Safeguarding/code/test_flows/plh_AB_tests_new_checkins.json";
var json_string = fs.readFileSync(input_path).toString();
var plh_flows = JSON.parse(json_string);

const sg_flow_uuid = "3aa013de-3b69-482c-bbc9-acd8d23bae55";
const sg_flow_name = "PLH - Safeguarding - WFR interaction";
var sg_keywords = "";
for (cat in obj_keywords_by_cat) {
    sg_keywords = sg_keywords + obj_keywords_by_cat[cat][0] + ",";
}
sg_keywords = sg_keywords.slice(0, sg_keywords.length - 1);




plh_flows.flows.forEach(flow => {
    let wfr_nodes = flow.nodes.filter(node => (node.hasOwnProperty('router') && node.router.operand == "@input.text" && node.router.hasOwnProperty("wait")))
    wfr_nodes.forEach(node => process_wfr_node(node,flow));
});


new_flows = JSON.stringify(plh_flows, null, 2);
var output_path = "C:/Users/fagio/Desktop/Safeguarding/code/test_flows/output/new_flows.json";
fs.writeFile(output_path, new_flows, function (err, result) {
    if (err) console.log('error', err);
});

