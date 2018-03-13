const Cornet = require('cornet')
const Parser = require('htmlparser2').WritableStream
const fs = require('fs')
const $ = require('cheerio')
const he = require('he')
const moment = require('moment')
const ora = require('ora')

const FACEBOOK_THUMBS_UP = '👍'

let datenames
const datenames_en = require('date-names')

function momentify(str){
    datenames.months.forEach((t,i)=>{
        str = str.replace(new RegExp(t, 'gi'), datenames_en.months[i])
    })

    let s = str.split(' ')

    s.splice(0,1)
    s.splice(3,1)

    s = s.join(' ')
    return moment(s, 'DD MMMM YYYY HH:mm UTC+Z').toISOString()
}

function splitReactions(arr){
    let ret = []
    arr.forEach(t=>{
        const match = t.children[0].data.match(/^(\S+)  (.+)$/)
        match[2].split(', ').forEach(s=>{
            ret.push({emoji: match[1], sender: s})
        })
    })
    return ret
}

let AVERAGE_MSG = 0

/**
 * 
 * @param {string} filename Path to `messages`-folder
 * @param {string} locale Locale to use. Must exist in date-names package. If omitted, all timestamps are recorded as null.
 * @returns {Promise}
 */
function extract(filename, locale=null){
    return new Promise((resolve, reject)=>{
        if(locale != null)
            datenames = require('date-names/' + locale)

        const size = fs.lstatSync(filename).size
        let estimatedMessages = Math.round(size/80) //around 80 bytes for the average message (including HTML), used for approximating how many messages there are
        const spin = estimatedMessages > 5000
        const spinner = spin ? ora({spinner: 'triangle'}).start('') : null

        let counter = 0
        const cornet = new Cornet()
        const stream = fs.createReadStream(filename)

        let messages = []
        let participants
        let chat_name

        const dataHandler = dat=>{
            const head = dat.toString()
            const $$ = $.load(head)
            chat_name = $$('html>head>title').text().replace(/^\w+ \w+ /, '')
            participants = $$('html>body>.thread').contents().filter(function(){return this.type === 'text' && this.data.indexOf('Participants:')>-1}).text()
            stream.removeListener('data', dataHandler)
        }

        stream
        .on('data', dataHandler)
        .pipe(new Parser(cornet, {xmlMode: true}))

        stream.on('end', ()=>{
            if(spin) spinner.succeed()
            resolve({
                chat_name: chat_name,
                participants: participants != '' ? participants.split(': ')[1].split(', ') : null,
                messages: messages
            })
        })

        stream.on('close', ()=>{
            reject('Lost access to file somehow.')
        })

        cornet.select('html>body>.thread>.message+p', (msg)=>{
            const reactions = $(msg).find('p>ul.meta>li')
            const media = $(msg).find('p>img, p>video, p>a')

            const hasReactions = reactions.html() != null
            const hasMedia = $.html(media) != ''

            const reactionsSplitted = hasReactions ? splitReactions(reactions.get()) : null

            const replacement = reactions.get().map(t=>t.children[0].data).join('|') //replacement is a reaction emoji, delete that from the content.
            const content = hasMedia ? null : he.decode($(msg).text().replace(new RegExp(replacement, 'g'), ''))

            let mediaSrc = null
            if(hasMedia) {
                const href = $(media).prop('href') 
                const src = $(media).prop('src')
                mediaSrc = href || src //pick source from img/video/file
            }
            messages.push({
                sender: $(msg).prev().find('.user').text(),
                content: content == '' ? FACEBOOK_THUMBS_UP : content,
                timestamp: locale == null ? null : momentify($(msg).prev().find('.meta').text()),
                media: mediaSrc,
                reactions: reactionsSplitted
            })

            if(spin && !hasMedia){
                AVERAGE_MSG = (AVERAGE_MSG*counter + content.length)/++counter
                estimatedMessages = Math.round(size/AVERAGE_MSG)
                spinner.text = `Extracting message #${counter} of approximately ${estimatedMessages} from ${filename}`
            }
        })
    })

}

module.exports = extract