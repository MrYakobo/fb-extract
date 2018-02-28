const fs = require('fs')
const cheerio = require('cheerio')
const moment = require('moment')

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
    return arr.map(t=>{
        const match = t.children[0].data.match(/^(\S+)  (.+)$/)
        return {emoji: match[1], sender: match[2]}
    })
}

/**
 * 
 * @param {string} folder Path to `messages`-folder
 * @param {string} locale Locale to use. Must exist in date-names package
 */
module.exports = (file, locale)=>{
        datenames = require('date-names/' + locale)

        const html = fs.readFileSync(file, 'utf8')
        const $ = cheerio.load(html, {xmlMode: true})

        const messages = $('html>body>.thread>.message').map(function(){
            const reactions = $(this).next().find('p>ul.meta>li')
            const media = $(this).next().find('p>img, p>video')

            const hasReactions = reactions.html() != null
            const hasMedia = $.html(media) != ''

            const reactionsSplitted = hasReactions ? splitReactions(reactions.get()) : null

            const replacement = reactions.get().map(t=>t.children[0].data).join('|') //replacement is a reaction emoji, delete that from the content.
            const content = $(this).next().text().replace(new RegExp(replacement), '') //if user didn't send media, it's plain text

            //if media is sent, content should be set to null.
            const mediaSrc = hasMedia ? $.html(media).match('src="(.+?)"')[1] : null //plocka sourcen från img/video
            return {
                sender: $(this).find('.user').text(),
                content: content == '' ? FACEBOOK_THUMBS_UP : content == 'null' ? null : content, //null-hotfix 
                timestamp: momentify($(this).find('.meta').text()),
                media: mediaSrc,
                reactions: reactionsSplitted
            }
        }).get()

        const participants = $('html>body>.thread').contents().filter(function(){return this.type === 'text' && this.data.indexOf('Participants:')>-1}).text()
        const hasParticipants = participants != ''

        const ret = {
                chat_name: $('html>head>title').text().replace(/^\w+ \w+ /, ''),
                participants: hasParticipants ? participants.split(': ')[1].split(', ') : null,
                messages: messages
        }
        return ret
    // })
}