-- Select some messages along with reaction info (aka like a "normal" read from messenger)
-- Also, list the participants in this chat.

-- Create a "global variable", which holds a randomized chat-id.
CREATE TEMPORARY TABLE t (cid INTEGER);
INSERT INTO t (SELECT FLOOR(RANDOM()*(SELECT COUNT(*) from chats)));

-- Select name of chat
SELECT chat_name FROM chats
    JOIN t USING (cid);
    
-- Select name(s) of participant(s)
SELECT name AS participant FROM participants
    JOIN t USING (cid)
    LEFT JOIN users USING (uid);

-- Select the messages. Multiple reactions are listed as multiple rows. Select messages.mid to distinguish between duplicate messages and reactions.
SELECT content, media, users.name, r.name AS reactor, emoji, to_char(timestamp AT TIME ZONE (current_setting('TIMEZONE')), 'HH24:MI DD Mon YYYY') AS timezone FROM messages
    JOIN t USING (cid)
    LEFT JOIN chats USING (cid)
    LEFT JOIN users USING (uid)
    LEFT JOIN reactions using (mid)
    LEFT JOIN users r ON (r.uid=reactions.uid)

ORDER BY timestamp
LIMIT 500;

-- Select username
SELECT name FROM users WHERE uid=1;

DROP TABLE t;