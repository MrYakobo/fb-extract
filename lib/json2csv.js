const fs = require('fs')
const path = require('path')

/**
 * 
 * @param {String} myName The messenger user that the FB-dump was downloaded from. This is needed to ensure reactions are labelled correctly.
 * @param {String} jsonfolder Folder to JSON-generated files (from streams.js)
 * @param {String} output Output folder
 * @returns {Promise}
 */
function json2csv(myName, jsonfolder, output){
    return new Promise((resolve, reject)=>{

    const files = fs.readdirSync(jsonfolder).map(t=>path.join(jsonfolder,t)).sort((a,b)=>parseInt(path.basename(a).split('.')[0]) - parseInt(path.basename(b).split('.')[0]))
    console.log('Converting from JSON to CSV...')

    let chats = []
    let users = {} //object to make sure only one identifier for each user exists
    let messages = []
    let participants = []
    let reactions = []

    function findOrAdd(user){
        const ind = Object.keys(users).indexOf(user)
        if(ind == -1){ //if user not found, add it
            users[user] = null
            return Object.keys(users).indexOf(user)+1
        }
        return ind+1
    }

    users[myName] = null //hotfix

    for(t of files) {
        const d = JSON.parse(fs.readFileSync(t))

        chats.push(d.chat_name)
        if(d.participants)
            d.participants.forEach(p=>{
                users[p] = null
                participants.push({
                    uid: findOrAdd(p),
                    cid: chats.length
                })
            })

        d.messages.forEach(m=>{
            messages.push({
                cid: chats.length,
                uid: findOrAdd(m.sender),
                content: m.content,
                media: m.media,
                timestamp: m.timestamp
            })
            if(m.reactions) { //avoiding null.forEach
                m.reactions.forEach(r=>{
                    reactions.push({
                        mid: messages.length,
                        emoji: r.emoji,
                        uid: findOrAdd(r.sender)
                    })
                })
            }
        })
    }

    const esc = t=>{
        return t == null ? null : `"${t.replace(/"/g, `""`).replace(/\n/g,`\\n`)}"`
    }

    try {fs.mkdirSync(output)}
    catch(e){}

    const u = fs.createWriteStream(path.join(output, 'users.csv'))
    const c = fs.createWriteStream(path.join(output, 'chats.csv'))
    const p = fs.createWriteStream(path.join(output, 'participants.csv'))
    const m = fs.createWriteStream(path.join(output, 'messages.csv'))
    const r = fs.createWriteStream(path.join(output, 'reactions.csv'))

    const sql = fs.createWriteStream(path.join(output, 'import.sql'))
    sql.write(
`CREATE TABLE users (uid SERIAL PRIMARY KEY, name TEXT);
CREATE TABLE chats (cid SERIAL PRIMARY KEY, chat_name TEXT);
CREATE TABLE participants (pid SERIAL PRIMARY KEY, uid INTEGER REFERENCES users(uid), cid INTEGER REFERENCES chats(cid));
CREATE TABLE messages (mid SERIAL PRIMARY KEY, cid INTEGER REFERENCES chats(cid), uid INTEGER REFERENCES users(uid), content TEXT, media TEXT, timestamp TIMESTAMP);
CREATE TABLE reactions (rid SERIAL PRIMARY KEY, mid INTEGER REFERENCES messages(mid), uid INTEGER REFERENCES users(uid), emoji TEXT);
`)
    sql.write(
`\\copy users (name) FROM '${path.resolve(output, 'users.csv')}' WITH csv;
\\copy chats (chat_name) FROM '${path.resolve(output,'chats.csv')}' WITH csv;
\\copy messages (cid, uid, content, media, timestamp) FROM '${path.resolve(output,'messages.csv')}' WITH csv;
\\copy participants (uid, cid) FROM '${path.resolve(output, 'participants.csv')}' WITH csv;
\\copy reactions (mid, uid, emoji) FROM '${path.resolve(output,'reactions.csv')}' WITH csv;
`) //postgres requires absolute paths
    sql.end()
    Object.keys(users).forEach(t=>{
        u.write(`${esc(t)}\n`)
    })
    u.end()
    chats.forEach(t=>{
        c.write(`${esc(t)}\n`)
    })
    c.end()
    participants.forEach(t=>{
        p.write(`${t.uid},${t.cid}\n`)
    })
    p.end()
    messages.forEach(t=>{
        m.write(`${t.cid},${t.uid},${esc(t.content)},${esc(t.media)},${t.timestamp}\n`)
    })
    m.end()
    reactions.forEach(t=>{
        r.write(`${t.mid},${t.uid},${esc(t.emoji)}\n`)
    })
    r.end()

    resolve()
    })
}

module.exports = json2csv