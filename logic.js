/*
    if overwrite:
        don't take into consideration what alreadyDone gives (ie keep all files, filter 1)
    else
        take into consideration what alreadyDone gives
    
    if overwrite:
        filter(t=>true)
    else
        filter(t=>alreadyDone)

    0:0 => 1
    0:1 => 0
    1:0 => 1
    1:1 => 1

    0:1 => 0
    0:0 => 1
    1:- => 1

    !((a^b)*!a)
*/
// const t = (a,b)=>!((a^b)&&!a)
/*
const t = (a,b)=>!(a^b)||a

for(var i = 0; i <= 1; i++)
    for(var j = 0; j <= 1; j++)
        console.log(`${i}:${j} => ${Number(t(i,j))}`)

*/
const json = ``