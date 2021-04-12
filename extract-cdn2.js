const superagent = require('superagent')
const fs = require('fs');

async function dl(url, name, path) {
  if (!fs.existsSync(`${path}${name}`)) {
    try {
      const dlAsset = await superagent.get(url)
      fs.writeFileSync(`${path}${name}`, dlAsset.body, 'utf8')
    } catch (e) { } //Asset cant be downloaded for some reason
  }
}

let stop = false

//Process Argument Handling
const processArgs = process.argv.slice(2);
if (processArgs.includes('-skip')) {
  stop = true
}

//Constants
const pattern = /(n\.p\+"(.{32}\.(svg|png|jpg|gif|mp4|mp3|webp|webm)))/g
const cdn = "https://canary.discord.com/assets/"

module.exports = async function () {
  var storage = fs.readFileSync('data.json', 'utf-8')
  var jsonstorage = JSON.parse(storage)
  var storage = fs.readFileSync('filteredAssets.json', 'utf-8')
  var f = JSON.parse(storage)
  if (!jsonstorage.assets.client) { //Set up the client asset array for people that used the previous version
    jsonstorage.assets.client = []
  }
  const data = fs.readFileSync('data.client.txt', 'utf-8');
  const matches = data.match(pattern)
  let newSaves = 0;
  matches.forEach(function (asset) {
    ext = asset.replace('n.p+"', '')
    assetId = ext.replace(/(.{32}).(svg|png|jpg|gif|mp4|mp3|webp|webm)/g, '$1')
    if (!f.filteredAssets.includes(assetId)) {
      dl(`${cdn}${ext}`, `${ext}`, `./out.cdn/`)
      if (!jsonstorage.assets.client.includes(assetId)) {
        jsonstorage.assets.client.push(assetId)
        newSaves++
      }
    }
  })
  const countData = fs.readFileSync('data.json')
  counting = JSON.parse(countData)
  console.log(`Downloaded ${jsonstorage.assets.client.length} assets.`)
  if (newSaves !== 0) {
    console.log(`Saved \x1b[36m${newSaves}\x1b[0m new assets.`)
    fs.writeFileSync('data.json', JSON.stringify(jsonstorage, null, 2), 'utf8') //Store version
  }
  if (stop == false) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 0));
  }
}