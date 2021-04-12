const fs = require('fs')
const { sync: rimraf } = require('rimraf')

rimraf('out.cdn')
rimraf('out.css')
rimraf('out.lottie')
rimraf('out.svg')

if (fs.existsSync('data.client.txt')) fs.unlinkSync('data.client.txt')
if (fs.existsSync('data.css.txt')) fs.unlinkSync('data.css.txt')
if (fs.existsSync('data.js.txt')) fs.unlinkSync('data.js.txt')

fs.writeFileSync('data.json', JSON.stringify({
    "discasset": "1.1",
    "version": {
        "buildId": "0",
        "buildHash": ""
    },
    "assets": {
        "css": [],
        "cdn": [],
        "svg": {
            "1": [],
            "2": []
        },
        "lottie": [],
        "client": []
    }
}, null, 2))

console.log('Cleared!')
