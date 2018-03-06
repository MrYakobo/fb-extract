#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ProgressBar = require('progress')
const msg = require('./lib/html2json')
const json2CSV = require('./lib/json2csv')

const Conf = require('conf');
const config = new Conf({});

const program = require('commander')
const inquirer = require('inquirer')

let root = process.cwd()

program
    .arguments('<dir>')
    .action(dir=>{
        if(dir != null) root = dir
    })
.parse(process.argv)

async function iterateAll(overwrite = false, name, lang){
    
    const alreadyDone = fs.readdirSync(path.join(root, 'json')).map(t=>t.replace('json','html'))

    const filter = t => path.extname(t)==='.html' && (!(overwrite^alreadyDone.indexOf(t) > -1)||overwrite)

    const files = fs.readdirSync(path.join(root,'messages')).filter(filter).sort((a,b)=>parseInt(a.split('.')[0]) - parseInt(b.split('.')[0]))

    console.log('Converting from HTML to JSON...')
    const bar = new ProgressBar('[:bar] :percent :curr', {
        complete: '=',
        incomplete: ' ',
        width: 80,
        total: files.length,
        curr: alreadyDone.length
    })

    for (t of files){
        const f = path.join(root, 'messages', t)
        const out = path.join(root, 'json', t.replace('html','json'))

        bar.tick({curr: out})

        const m = await msg(f, lang)
        fs.writeFileSync(out, JSON.stringify(m, null, 2))
    }
}

async function main(){

    try{ fs.accessSync(path.join(root, 'index.htm')) }
    catch(e){
        console.error(`ERR: Couldn't find ${path.join(root,'index.htm')}. cd to the facebook directory or pass the path as the first argument and try again.`)
        process.exit(1)
    }

    let name = config.get('name')
    let lang = config.get('lang')

    let questions = [
        {
            type: 'input',
            name: 'name',
            message: 'Please input your full name:',
            validate: s=>s!=='' ,
            when: ()=>name==null
        },
        {
            type: 'list',
            name: 'lang',
            message: 'Please choose your language below:',
            choices: [ 'cs', 'da', 'de', 'en', 'es', 'fi', 'fr', 'nl', 'pt-br', 'ru', 'sk', 'sv', new inquirer.Separator() ],
            when: ()=>lang==null
        }
    ]

    ans = await inquirer.prompt(questions)
    
    if(name == null) {
        config.set('name', ans.name)
        name = ans.name
    }
    if(lang == null) {
        config.set('lang', ans.lang)
        lang = ans.name
    }


    try { fs.mkdirSync(path.join(root,'json')) }
    catch(e){ }

    await iterateAll(false, name, lang)
    await json2CSV(name, path.join(root, 'json'), path.join(root,'csv'))
    console.log('Done!')
}

main()