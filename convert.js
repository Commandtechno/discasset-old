const sharp = require('sharp')
const fs = require('fs')
const folders = ['CDN', 'CSS', 'SVG']

let count = 1
const { pngSize } = require('./config.json')

async function render(folder, file, max, density) {
    let image = sharp(`out.${folder}/${file}`, { density: pngSize ? density ?? 2400 : null, limitInputPixels: false })

    if (pngSize) {
        const meta = await image.metadata()
        let size = { height: pngSize }
        if (meta.width > meta.height) size = { width: pngSize }
        image = image.resize(size)
    }

    return image.toFile(`out.${folder}/png/${file.replace('.svg', '.png')}`)
        .then(() => edit(`Converting \x1b[36m${count++}/${max}\x1b[0m vectors from ${folder}`))
        .catch(() => render(folder, file, max, (density ?? 100) / 2))
}

function edit(text) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(text);
}

(async () => {
    for (const folder of folders) {
        const files = fs.readdirSync('out.' + folder).filter(file => file.endsWith('.svg'))
        const max = files.length

        process.stdout.write(`Converting \x1b[36m0/${max}\x1b[0m vectors from ${folder}`);
        await Promise.all(files.map(file => render(folder, file, max)))
        edit(`Converted \x1b[36m${max}\x1b[0m vectors from ${folder}\n`);
        count = 1
    }

    console.log('Completed!')
    process.exit()
})()