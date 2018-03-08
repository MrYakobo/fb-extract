## Repository for extracting information out of `facebook.zip`

This repository takes a folder as input and outputs to other folders where all information is extracted into JSON-files/CSV, with scripts for importing these into a relational database (only postgres for now).

### Installation
`npm i -g fb-extract`

### Usage
Unzip facebook.zip that you downloaded from Facebook.com, then
`fb-extract /path/to/facebook_dir`

The tool creates two new folders in `/path/to/facebook_dir`:
.
├── csv
└── json

Protip: Converting long conversations takes quite a long time compared to short ones. Go ahead and take a coffee or two.

Run `psql < csv/import.sql` (or execute the SQL some way on your database)

Bam! Ur done. Go ahead and SQL your way to victory.

### Tables
The tables look like this:

`chats`
| Column    | Type   |
| --------- |:------:|
| cid       | serial |
| chat_name | text   |

`messages`
| Column    | Type   |
| --------- |:------:|
| mid       | serial |
| *cid*     | integer|
| *uid*     | integer|
| content   | text   |
| media     | text   |
| timestamp | timestamp without time zone |

`participants`
| Column    | Type   |
| --------- |:------:|
| pid       | serial |
| *uid*     | integer|
| *cid*     | integer|

`users`
| Column    | Type   |
| --------- |:------:|
| *uid*     | serial |
| name      | text |

`reactions`
| Column    | Type   |
| --------- |:------:|
| rid       | serial |
| *mid*     | integer|
| *uid*     | integer|
| emoji     | integer|


### Example queries
Found under examples/