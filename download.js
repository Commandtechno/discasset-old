const superagent = require("superagent")
const fs = require('fs')

if (!fs.existsSync('out.cdn')) fs.mkdirSync('out.cdn')
if (!fs.existsSync('out.cdn/png')) fs.mkdirSync('out.cdn/png')

if (!fs.existsSync('out.css')) fs.mkdirSync('out.css')
if (!fs.existsSync('out.css/png')) fs.mkdirSync('out.css/png')

if (!fs.existsSync('out.svg')) fs.mkdirSync('out.svg')
if (!fs.existsSync('out.svg/png')) fs.mkdirSync('out.svg/png')

if (!fs.existsSync('out.lottie')) fs.mkdirSync('out.lottie')
if (!fs.existsSync('out.lottie/gif')) fs.mkdirSync('out.lottie/gif')

//CONSTANTS
const stylesheet = /stylesheet" href="(.{30}\.css)/g //Regex to get the stylesheet hash/url
const script = /script src="(\/assets\/.{20}\.js)/g //Regex to get all the scripts on the login page
const loaderRegex = /r\.p\+""\+(\{.*\})\[/g //Regex to extract the app scripts from the chunkloader
const jsonFix = /([0-9]*):/g //Regex to fix json from the chunkloader so we can easily parse it
const buildRegex = /GLOBAL_ENV\.RELEASE_CHANNEL,.=null==="(.{40})/g //Regex to get the build hash
const buildIdRegex = /,"([1234567890]{5})"/g //Regex to get the build id
const canary = 'https://canary.discord.com/login' //Entrypoint to get all the app data from
const assetHost = 'https://canary.discord.com' //Host for assets
const environment = "canary"

async function download(){
  const storage = fs.readFileSync('data.json') // Read and parse jsonstorage
  var jsonstorage = JSON.parse(storage) 
  let site;
  try{
    //check version
    ver = await superagent.get(`${assetHost}/assets/version.${environment}.json`)
    if(jsonstorage.version.buildHash == ver.body.hash){
      console.log(`[Download] Version ${jsonstorage.version.buildId} (${jsonstorage.version.buildHash}) is already downloaded. Press any key to exit.`)
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', process.exit.bind(process, 0));
    }
    site = await superagent.get(canary)
    const match = site.text.match(script) 
    scriptData = await superagent.get(`${assetHost}${match[0].replace(`script src="`, '')}`)
    scripts = loaderRegex.exec(scriptData.body)
    scriptData = scripts[1].toString().replace(jsonFix, "\"$1\":")
    scripts = JSON.parse(scriptData) 
    //The client script
    clientScript = await superagent.get(`${assetHost}${match[3].replace(`script src="`, '')}`)
    fs.writeFileSync('data.client.txt', clientScript.body, 'utf8')
    let mainScript = ""
    Object.values(scripts).forEach(async function(scr){
      if(mainScript !== ""){
        return;
      }
      data = await superagent.get(`${assetHost}/assets/${scr}.js`)
      const buildData = buildRegex.exec(data.body)
      const buildId = buildIdRegex.exec(data.body)
      if(buildData){
        mainScript = data.body
        if(jsonstorage.version.buildHash == buildData[1]){
        } else {
          jsonstorage.version.buildHash = buildData[1]
          jsonstorage.version.buildId = buildId[1]
          fs.writeFileSync('data.json', JSON.stringify(jsonstorage, null, 2), 'utf8')
          console.log(`[Download] Downloading files for build ${jsonstorage.version.buildId} (${jsonstorage.version.buildHash.substr(0, 7)})...`)
          fs.writeFileSync('data.js.txt', mainScript, 'utf8')
          console.log('[Download] JavaScript Downloaded.')
          //Stylesheet Download
          const matches = stylesheet.exec(site.text)
          style = await superagent.get(`${assetHost}${matches[1]}`)
          fs.writeFileSync('data.css.txt', style.text, 'utf8')
          console.log('[Download] Stylesheet Downloaded.')
          console.log(`[Download] Successfully downloaded files for build ${jsonstorage.version.buildId} (${jsonstorage.version.buildHash}). Press any key to exit.`)
          process.stdin.setRawMode(true);
          process.stdin.resume();
          process.stdin.on('data', process.exit.bind(process, 0));
        }
      }
    })
  } catch(e){
    console.log('[Error] Failed to download discord data:')
    console.log(e)
  }
}

(async () => {
  await download()
})();
