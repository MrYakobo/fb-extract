const fs = require('fs')
const path = require('path')

let msg = require('./lib/msg')

try { fs.mkdirSync('output') }
catch(e){

}

function iterateAll(){
    const files = fs.readdirSync('messages')

    files.filter(t=>t.indexOf('/')===-1).forEach(t=>{
        const f = path.join('messages', t)
        const out = path.join('output', t.replace('html','json'))
        const m = JSON.stringify(msg(f, 'sv'), null, 2)
        fs.writeFileSync(out, m)
    })
}

iterateAll()

// let res = msg('messages/13.html', 'sv')
// fs.writeFileSync('out.json', JSON.stringify(res, null, 2))