const Cornet = require('cornet')
const Parser = require('htmlparser2').WritableStream
const fs = require('fs')
const $ = require('cheerio')
const moment = require('moment')

const ora = require('ora')

const FACEBOOK_THUMBS_UP = '👍'

let datenames
const datenames_en = require('date-names')

const locale = 'sv'
datenames = require('date-names/' + locale)
const AVERAGE_MSG = 300 //around 300 bytes for the average message (including HTML)

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
    return arr.map(t=>{
        const match = t.children[0].data.match(/^(\S+)  (.+)$/)
        return {emoji: match[1], sender: match[2]}
    })
}

function extract(filename){
    return new Promise((resolve, reject)=>{
        const size = fs.lstatSync(filename).size
        const estimatedMessages = Math.round(size/AVERAGE_MSG)

        const spinner = ora()
        spinner.start()
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
            participants = $('html>body>.thread').contents().filter(function(){return this.type === 'text' && this.data.indexOf('Participants:')>-1}).text()
            stream.removeListener('data', dataHandler)
        }

        stream
        .on('data', dataHandler)
        .pipe(new Parser(cornet, {xmlMode: true}))

        stream.on('end', ()=>{
            spinner.stop()
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
            if(counter % 9 == 0){
                spinner.text = `Processing message #${counter} (out of about ${estimatedMessages})`
            }
            counter++
            const reactions = $(msg).find('p>ul.meta>li')
            const media = $(msg).find('p>img, p>video')

            const hasReactions = reactions.html() != null
            const hasMedia = $.html(media) != ''

            const reactionsSplitted = hasReactions ? splitReactions(reactions.get()) : null

            const replacement = reactions.get().map(t=>t.children[0].data).join('|') //replacement is a reaction emoji, delete that from the content.
            const content = $(msg).text().replace(new RegExp(replacement), '') //if user didn't send media, it's plain text

            //if media is sent, content should be set to null.
            const mediaSrc = hasMedia ? $.html(media).match('src="(.+?)"')[1] : null //plocka sourcen från img/video
            messages.push({
                sender: $(msg).prev().find('.user').text(),
                content: content == '' ? FACEBOOK_THUMBS_UP : content == 'null' ? null : content, //null-hotfix 
                timestamp: momentify($(msg).prev().find('.meta').text()),
                media: mediaSrc,
                reactions: reactionsSplitted
            })
        })
    })

}

console.time('Extracting messages')
extract('messages/386.html').then((val)=>{
    console.timeEnd('Extracting messages')
    fs.writeFileSync('output/386.json', JSON.stringify(val, null, 2))
})