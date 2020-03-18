// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.


const Store = require('electron-store');
const { app } = require('electron').remote
const fs = require('fs')
const path = require('path')

const store = new Store();

const defaultLocale = 'en'
const locales = ['en']

const deviceLocale = store.get('locale', app.getLocale())
const locale = locales.includes(deviceLocale) ? deviceLocale : defaultLocale

store.set('locale', locale)

const qs = document.querySelector.bind(document)
const qa = document.querySelectorAll.bind(document)

const messages = require(`./_locales/${locale}.json`)

function __(id) {
    return messages[id]
}

Array.from(qa('[data-i18]')).forEach(item => {
    item.innerText = __(item.getAttribute('data-i18'))
})

// handlers
qs('#illustrator-dir-not-found-close').addEventListener('click', e => {
    qs('#illustrator-dir-not-found-message').style.display = 'none'
})

if (store.get('illustrator-presets-dir')) {
    qs('#illustrator-dir-not-found-message').style.display = 'none'
    qs('#search-illustrator-dir').style.display = 'none'
}

const isDirectory = source => fs.lstatSync(source).isDirectory()

qs('#search-illustrator-dir').addEventListener('click', e => {
    var isWin = process.platform === "win32";
    if (isWin) {
        const installDir = 'C:/Program Files/Adobe'
        fs.readdir(installDir, (err, directories) => {
            if (err) {
                alert(__('cannotFindIllustratorInstallationPleaseSpecifyManually') + '\n' + err.toString())
            } else {
                const correctDir = directories.find(dir => dir.startsWith('Adobe Illustrator'))

                const presetDir = path.join(installDir, correctDir, 'Presets')

                fs.readdir(presetDir, (err, localeDirs) => {
                    localeDirs = localeDirs.map(dir => path.join(presetDir, dir)).filter(isDirectory)
                    if (err) {
                        alert(__('cannotFindIllustratorInstallationPleaseSpecifyManually') + '\n' + err.toString())
                    } else {
                        if (localeDirs.length === 1) {
                            const localePresetsDir = path.join(presetDir, localeDirs[0])
                            store.set('illustrator-presets-dir', localePresetsDir)
                            alert(__('foundIllustratorDirectory'))
                        } else {
                             alert(__('cannotFindIllustratorInstallationPleaseSpecifyManually') + '\nLocale directories ' + localeDirs)
                        }
                    }
                })
            }
        })
    } else {
        alert(__(cannotFindIllustratorInstallationPleaseSpecifyManually))
    }
})