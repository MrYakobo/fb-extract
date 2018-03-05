const fs = require('fs')
const path = require('path')

const ProgressBar = require('progress')
let msg = require('./lib/streams')
const json2CSV = require('./lib/json2CSV')
const c = require('./config')

try { fs.mkdirSync('output') }
catch(e){ }

async function iterateAll(overwrite = false, skipHuge = true){
    const alreadyDone = fs.readdirSync('output').map(t=>t.replace('json','html'))

    const filter = t => path.extname(t)==='.html' && (!(overwrite^alreadyDone.indexOf(t) > -1)||overwrite)

    const files = fs.readdirSync('messages').filter(t=>skipHuge && t != '386.html').filter(filter).sort((a,b)=>parseInt(a.split('.')[0]) - parseInt(b.split('.')[0]))

    const bar = new ProgressBar('[:bar] :percent :curr', {
        complete: '=',
        incomplete: ' ',
        width: 80,
        total: files.length
    })

    for (t of files){
        const f = path.join('messages', t)
        const out = path.join('output', t.replace('html','json'))

        bar.tick({curr: out})

        const m = await msg(f, c.lang)
        fs.writeFileSync(out, JSON.stringify(m, null, 2))
    }
}

iterateAll(true).then(()=>{
    json2CSV('output', c.name, 'csv')
})