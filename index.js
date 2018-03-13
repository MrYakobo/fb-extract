#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ora = require('ora')
const spinner = ora({spinner: 'dots11', interval: 10, color: 'yellow'})

const msg = require('./lib/html2json')
const json2CSV = require('./lib/json2csv')

const Conf = require('conf');
const config = new Conf({});

const program = require('commander')
const inquirer = require('inquirer')

const chalk = require('chalk')
const cheerio = require('cheerio')

let root = '.'

program
    .arguments('<dir>')
    .action(dir=>{
        if(dir != null) root = dir
    })
.parse(process.argv)

/**
 * Function for iterating over all messages, generating JSON files. The logic applied to each file is found in lib/html2json.js
 * @param {String} lang Your language, used for translating timestamps in the HTML
 * @param {boolean} overwrite Overwrite existing files in JSON/
 * @returns {Promise}
 */
async function iterateAll(lang, overwrite = false){
    
    const alreadyDone = fs.readdirSync(path.join(root, 'json')).map(t=>t.replace('json','html'))

    const filter = t => path.extname(t)==='.html' && (!(overwrite^alreadyDone.indexOf(t) > -1)||overwrite)

    const files = fs.readdirSync(path.join(root,'messages')).filter(filter).sort((a,b)=>parseInt(a.split('.')[0]) - parseInt(b.split('.')[0]))

    const max = files.length+alreadyDone.length
    let i = alreadyDone.length
    spinner.start('')
    for (t of files){
        const f = path.join(root, 'messages', t)
        const out = path.join(root, 'json', t.replace('html','json'))

        spinner.text = `${f} => ${out} [${Math.round(++i/max*100)}% of all files done]`
        const m = await msg(f, lang)
        // spinner.succeed()
        fs.writeFileSync(out, JSON.stringify(m, null, 2))
    }
    spinner.succeed()
}

async function main(){

    try{ fs.accessSync(path.join(root, 'index.htm')) }
    catch(e){
        console.error(`ERR: Couldn't find ${path.join(root,'index.htm')}. Run either ${chalk.green('cd facebook && fb-extract/')} or ${chalk.green('fb-extract facebook/')}`)
        process.exit(1)
    }

    let lang

    if(config.has(lang))
        lang = config.get('lang') //get stored language
    else {
        let questions = [
            {
                type: 'list',
                name: 'lang',
                message: 'Please choose your language below:',
                choices: [ 'cs', 'da', 'de', 'en', 'es', 'fi', 'fr', 'nl', 'pt-br', 'ru', 'sk', 'sv', 'none', new inquirer.Separator() ],
                when: ()=>lang==null
            }
        ]
        ans = await inquirer.prompt(questions)
        config.set('lang', ans.lang)
        lang = ans.name
    }

    lang = lang == 'none' ? null : lang //if no language chosen, set to null

    try { fs.mkdirSync(path.join(root,'json')) }
    catch(e){ }

    await iterateAll(lang)
    spinner.text = 'Converting from JSON to CSV...'
    const name = cheerio.load(fs.readFileSync(path.join(root, 'index.htm')))('h1').text()
    await json2CSV(name, path.join(root, 'json'), path.join(root,'csv'))
    console.log('Done!')
}

main()