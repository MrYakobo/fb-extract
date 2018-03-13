## Tool for extracting information out of `facebook.zip`

Facebook appearently allows you to download your data in a `.zip`-file (try it [here](https://www.facebook.com/dyi?x=AdnvjkapTQheYqqJ)). Sadly, the files are in HTML and are meant to be viewed in a web browser; the raw data is hard to consume. Then, this repository happened.

`fb-extract` is a CLI that extracts your facebook data (messages) from HTML into JSON/CSV. Using this tool, you get the power to do whatever you want with your precious data. Word completetion, a chatbot that uses your expressions, machine learning etc. Endless possibilities! With your own data! Yay!

Anyhow, my conversion is probably not perfect. If you feel like something is lost in the conversion, file up an issue.

These platforms/databases/languages are tested so far:
- Linux/PostgreSQL/Swedish

I have no idea if this tool works at all with any language other than Swedish, and I have currently no way of testing that. As such, PR are **very** welcome :)

#### NOTE! Your language has to be in [this](https://github.com/martinandert/date-names) repository to convert timestamps correctly. The timestamps looks like "den 10 november 2013 kl. 10:18 UTC+01" and are thus impossible to convert without a locale. If your language isn't supported, timestamps will be recorded as null.

### Installation
`npm i -g fb-extract`

### Usage
Unzip facebook.zip that you downloaded from [here](https://www.facebook.com/dyi?x=AdnvjkapTQheYqqJ), then run
`fb-extract /path/to/facebook_dir`.

The tool will now ask you for your language the first time you run it. This is to make sure that timestamps are converted properly. The config is stored in `~/.config/fb-extract-nodejs/config.json`. If interrupted, the tool restarts at where it left off by scanning the JSON-dir.

Converting long conversations takes quite a long time compared to short ones. Go ahead and take a coffee or two.

The tool creates two new folders in `/path/to/facebook_dir`

    .
    ├── csv
    └── json

where files are placed accordingly.

If you wan't to play around with [TensorFlow](https://www.tensorflow.org/api_docs/python/tf/decode_csv), you're all set. Just use the csv-files.

If you wan't to have your messages in your database however, you should run `psql < csv/import.sql` (or execute `csv/import.sql` in some way on your database)

### Tables
> Columns in *italics* indicate a foreign key referencing another table key.

`chats`

| Column    | Type   |
| --------- |--------|
| cid       | serial |
| chat_name | text   |

`messages`

| Column    | Type   |
| --------- |--------|
| mid       | serial |
| *cid*     | integer|
| *uid*     | integer|
| content   | text   |
| media     | text   |
| timestamp | timestamp without time zone |

`participants`

| Column    | Type   |
| --------- |--------|
| pid       | serial |
| *uid*     | integer|
| *cid*     | integer|

`users`

| Column    | Type   |
| --------- |--------|
| *uid*     | serial |
| name      | text |

`reactions`

| Column    | Type   |
| --------- |--------|
| rid       | serial |
| *mid*     | integer|
| *uid*     | integer|
| emoji     | integer|


### Example queries
Found under `examples/`

### License
MIT
