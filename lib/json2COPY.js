const fs = require('fs')
const squel = require('squel')

function json2sql(output, myName){
    const files = fs.readdirSync(output).map(t=>output+'/'+t)

    let chats = []
    let users = {} //object to make sure only one identifier for each user exists
    let messages = []
    let participants = []
    let reactions = []

    users[myName] = null //hotfix

    files.forEach(t=>{
        const d = JSON.parse(fs.readFileSync(t))

        chats.push(d.chat_name)
        if(d.participants)
            d.participants.forEach(p=>{
                users[p] = null
                participants.push({
                    uid: Object.keys(users).indexOf(p)+1,
                    cid: chats.length
                })
            })

        d.messages.forEach(m=>{
            messages.push({
                cid: chats.length,
                uid: Object.keys(users).indexOf(m.sender)+1,
                content: m.content,
                media: m.media,
                timestamp: m.timestamp
            })
            if(m.reactions) { //avoiding null.forEach
                m.reactions.forEach(r=>{
                    reactions.push({
                        mid: messages.length,
                        emoji: r.emoji,
                        uid: Object.keys(users).indexOf(r.sender)+1,
                    })
                })
            }
        })
    })
    
    //here, chats, users, messages and reactions are filled.
    /*
        Tables:
            users: uid, name
            chats: cid, chat_name

            participants: pid, uid, cid     [relationstabell]

            messages: mid, chat (cid), sender (uid), content, media, timestamp
            reactions: rid, message (mid), sender (uid), emoji
    */

    // const esc = t=> {
    //     const a = JSON.stringify(t)
    //     return a == null ? null : `'${a.substr(1, a.length-2)}'`
    // }
    const esc = t=>{
        return t == null ? null : `'${t.replace(/'/g, `''`).replace(/\n/g,`\\n`)}'`
    }

    try{fs.mkdirSync('csv')}
    catch(e){}

    const u = fs.createWriteStream('csv/users.csv')
    const c = fs.createWriteStream('csv/chats.csv')
    const p = fs.createWriteStream('csv/chats.csv')
    const m = fs.createWriteStream('csv/messages.csv')
    const r = fs.createWriteStream('csv/reactions.csv')

    const sql = fs.createWriteStream('csv/import.sql')
    sql.write(
`CREATE TABLE users (uid SERIAL PRIMARY KEY, name TEXT);
CREATE TABLE chats (cid SERIAL PRIMARY KEY, chat_name TEXT);
CREATE TABLE participants (pid SERIAL PRIMARY KEY, uid INTEGER REFERENCES users(uid), cid INTEGER REFERENCES chats(cid));
CREATE TABLE messages (mid SERIAL PRIMARY KEY, cid INTEGER REFERENCES chats(cid), uid INTEGER REFERENCES users(uid), content TEXT, media TEXT, timestamp TIMESTAMP);
CREATE TABLE reactions (rid SERIAL PRIMARY KEY, mid INTEGER REFERENCES messages(mid), uid INTEGER REFERENCES users(uid), emoji TEXT);
`)
    sql.write(
`COPY users (name) FROM 'users.csv';
COPY chats (chat_name) FROM 'chats.csv';
COPY participants (uid, cid) FROM 'participants.csv';
COPY messages (cid, uid, content, media, timestamp) FROM 'messages.csv';
COPY reactions (mid, uid, emoji) FROM 'reactions.csv';
`)
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
}

module.exports = json2sql

console.time('Converting JSON to SQL...')
json2sql('output', 'Jakob Lindskog')
console.timeEnd('Converting JSON to SQL...')
