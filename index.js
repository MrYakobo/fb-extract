const fs = require('fs')
const path = require('path')

const ProgressBar = require('progress')

let msg = require('./lib/msg')

try { fs.mkdirSync('output') }
catch(e){ }

function iterateAll({complete = true}){
    const alreadyDone = fs.readdirSync('output').map(t=>t.replace('json','html'))
    const files = fs.readdirSync('messages').filter(t=> path.extname(t)==='.html' && (complete || alreadyDone.indexOf(t)===-1)).sort((a,b)=>parseInt(a.split('.')[0]) - parseInt(b.split('.')[0]))

    const bar = new ProgressBar(':bar :currentFile', {total: files.length})

    files.forEach(t=>{
        console.log('curr file ' + t)
        const f = path.join('messages', t)
        const out = path.join('output', t.replace('html','json'))
        const m = JSON.stringify(msg(f, 'sv'), null, 2)
        fs.writeFileSync(out, m)
        bar.tick({currentFile: f})
    })
}

iterateAll(false)

// let res = msg('messages/100.html', 'sv')
// fs.writeFileSync('out.json', JSON.stringify(res, null, 2))