const fs = require('fs')
const files = fs.readdirSync('./').filter(file => file.startsWith('extract-'))

async function cycle() {
    const file = files.shift()
    if (!file) {
        console.log('Completed!')
        process.exit()
    };

    await require('./' + file)()
    setTimeout(cycle, 1000)
}

cycle()