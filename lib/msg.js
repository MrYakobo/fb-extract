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

function dehexify(str){
    const escapeChars = { lt: '<', gt: '>', quot: '"', apos: "'", amp: '&' };

    return str.replace(/\&([^;]+);/g, function(entity, entityCode) {
        var match;

        if ( entityCode in escapeChars) {
            return escapeChars[entityCode];
        } else if ( match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
            return String.fromCharCode(parseInt(match[1], 16));
        } else if ( match = entityCode.match(/^#(\d+)$/)) {
            return String.fromCharCode(~~match[1]);
        } else {
            return entity;
        }
    });
}

function splitReactions(arr){
    return arr.map(t=>{
        const match = t.match(/^(\S+)  (.+)$/)
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
            // const notPlain = $(this).next().children('p') //if user sent some media, it will be wrapped in an extra p-tag
            const reactions = $(this).next().find('p>ul.meta>li')
            const media = $(this).next().find('p>img, p>video')

            const hasReactions = reactions.html() != null
            const hasMedia = media.html() != null

            const content = $(this).next().text() //if user didn't send media, it's plain text
            let reactionsSplitted = null
            if(content.indexOf('TEJ303')>-1){
                reactionsSplitted = splitReactions(reactions.map(function(){
                    return $(this).text()
                }).get())
            }

            // const c = notPlain == null ?  : notPlain.replace(/<.+?src.+?>/g, 'null')
            //if media is sent, content should be set to null.
            const mediaSrc = hasMedia ? media.html().match('src="(.+?)"')[1] : null //plocka sourcen från img/video
            return {
                sender: $(this).find('.user').text(),
                content: content == '' ? FACEBOOK_THUMBS_UP : content == 'null' ? null : content, //null-hotfix 
                timestamp: momentify($(this).find('.meta').text()),
                media: mediaSrc,
                reactions: reactionsSplitted
            }
        }).get()

        const ret = {
                chat_name: $('html>head>title').text().replace(/^\w+ \w+ /, ''),
                participants: $('html>body>.thread').contents().filter(function(){return this.type === 'text' && this.data.indexOf('Participants:')>-1}).text().split(': ')[1].split(', '),
                messages: messages
        }
        return ret
    // })
}