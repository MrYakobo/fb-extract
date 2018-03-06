## Repository for extracting information out of `facebook.zip`

This repository takes a folder as input and outputs to another folder (facebook-extracted/) where all information is extracted into JSON-files/CSV, with scripts for importing these into a relational database.

### Installation
`npm i -g fb-extract`

### Usage
Unzip facebook.zip that you downloaded from Facebook.com, then
`fb-extract /path/to/facebook_dir`

The tool creates two new folders in `/path/to/facebook_dir`:
.
├── csv
└── json

After conversion, you should run `psql < csv/import.sql` or in some other way run the SQL on your database.

Bam! Ur done.