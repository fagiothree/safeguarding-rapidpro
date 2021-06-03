const HELP = 123;

function helper() {
    console.log("I'm helping!", HELP);
}

export function scream() {
    console.log('aaaaaargh!');
    helper();
}
