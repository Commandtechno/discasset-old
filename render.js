const fs = require('fs')
const renderLottie = require('puppeteer-lottie')
const files = fs.readdirSync('out.lottie').filter(file => file.endsWith('.json'))
const total = files.length;

const { lottieSize } = require('./config.json')

async function render() { //Render all lottie files
    const file = files.shift()
    if(!file) {
        console.log(`Downloaded and rendered ${total} lottie assets. Press any key to exit.`)
        process.exit()
    }

    console.log(`[Lottie] Rendering Lottie File ${total - files.length}/${total}.`);
    const out = file.replace('.json', '.gif')

    await renderLottie({
        path: `./out.lottie/${file}`,
        output: `./out.lottie/gif/${out}`,
        width: lottieSize
    })

    render()
}

render()