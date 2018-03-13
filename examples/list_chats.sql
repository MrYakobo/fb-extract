-- Lists chats, ordering by the amount of messages total in that chat.

SELECT cid, chat_name, COUNT(*) AS messages FROM chats
    JOIN messages USING (cid)
    GROUP BY cid
    ORDER BY COUNT(*) DESC;

SELECT cid, name FROM participants
    JOIN users USING (uid);