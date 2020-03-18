// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.


const Store = require('electron-store');
const { app, dialog, getCurrentWindow } = require('electron').remote
const mainWindow = getCurrentWindow()
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
} else {
    qs('#remove-illustrator-dir').style.display = 'none'
}

qs('#illustrator-location').innerText = store.get('illustrator-presets-dir', __('notFound'))

const isDirectory = source => fs.lstatSync(source).isDirectory()

function tryDirectoryAsIllustratorInstallationDirectory(rootDir) {
    const presetDir = path.join(rootDir, 'Presets')
    return new Promise((resolve, reject) => {
        fs.readdir(presetDir, (err, localeDirs) => {
            if (err) {
                alert(__('cannotFindIllustratorInstallationPleaseSpecifyManually') + '\n' + err.toString())
                reject()
            } else {
                localeDirs = localeDirs.map(dir => path.join(presetDir, dir)).filter(isDirectory)
                if (localeDirs.length === 1) {
                    const localePresetsDir = localeDirs[0]
                    store.set('illustrator-presets-dir', localePresetsDir)
                    alert(__('foundIllustratorDirectory'))
                    resolve()
                } else {
                    alert(__('cannotFindIllustratorInstallationPleaseSpecifyManually') + '\nLocale directories ' + localeDirs)
                    reject()
                }
            }
        })
    })
}

function findIllustratorDirectory() {
    return new Promise((resolve, reject) => {
        var isWin = process.platform === "win32";
        if (isWin) {
            const installDir = 'C:/Program Files/Adobe'
            fs.readdir(installDir, (err, directories) => {
                if (err) {
                    alert(__('cannotFindIllustratorInstallationPleaseSpecifyManually') + '\n' + err.toString())
                    reject()
                } else {
                    const correctDir = directories.find(dir => dir.startsWith('Adobe Illustrator'))
                    if (correctDir) {
                        const rootDir = path.join(installDir, correctDir)
                        tryDirectoryAsIllustratorInstallationDirectory(rootDir).then(resolve).catch(reject)
                    } else {
                        alert(__('cannotFindIllustratorInstallationPleaseSpecifyManually') + '\n' + __('noAdobeIllustratorFolder'))
                        reject()
                    }
                }
            })
        } else {
            alert(__('cannotFindIllustratorInstallationPleaseSpecifyManually'))
            reject()
        }
    })
}

qs('#search-illustrator-dir').addEventListener('click', async e => {
    await findIllustratorDirectory()
    qs('#illustrator-dir-not-found-message').style.display = 'none'
    qs('#search-illustrator-dir').style.display = 'none'
    qs('#illustrator-location').innerText = store.get('illustrator-presets-dir', __('notFound'))

})

qs('#select-illustrator-dir').addEventListener('click', async e => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    })
    const [filePath] = result.filePaths

    await tryDirectoryAsIllustratorInstallationDirectory(filePath)

    qs('#illustrator-dir-not-found-message').style.display = 'none'
    qs('#search-illustrator-dir').style.display = 'none'
    qs('#illustrator-location').innerText = store.get('illustrator-presets-dir', __('notFound'))

})

qs('#remove-illustrator-dir').addEventListener('click', e => {
    if (confirm(__('areYouSure'))) {
        store.delete('illustrator-presets-dir')
        qs('#illustrator-dir-not-found-message').style.display = null
        qs('#search-illustrator-dir').style.display = null
        qs('#illustrator-location').innerText = ''
        qs('#remove-illustrator-dir').style.display = 'none'
    }
})

function createItem(filePath) {
    const fileName = path.basename(filePath).replace(path.extname(filePath), '')


    var e_2 = document.createElement("tr");
    var e_3 = document.createElement("td");
    e_3.setAttribute("class", "collapsing");
    var e_4 = document.createElement("div");
    e_4.setAttribute("class", "ui checkbox");
    var e_5 = document.createElement("input");
    e_5.setAttribute("type", "checkbox");
    e_5.setAttribute("checked", "true");
    e_4.appendChild(e_5);
    var e_6 = document.createElement("label");
    e_4.appendChild(e_6);
    e_3.appendChild(e_4);
    e_2.appendChild(e_3);
    var e_7 = document.createElement("td");
    e_7.appendChild(document.createTextNode(fileName));
    e_2.appendChild(e_7);
    var e_8 = document.createElement("td");
    e_8.appendChild(document.createTextNode("September 14, 2013"));
    e_2.appendChild(e_8);
    var e_9 = document.createElement("td");
    e_9.appendChild(document.createTextNode("jhlilk22@yahoo.com"));
    e_2.appendChild(e_9);
    var e_10 = document.createElement("td");
    e_10.appendChild(document.createTextNode("No"));
    e_2.appendChild(e_10);
    return e_2;
}

function renderScriptRows() {
    var list = qs('#scripts-rows-tbody')

    const location = store.get('illustrator-presets-dir')
    if (!location) return

    while (list.children.length) list.removeChild(list.firstElementChild)

    const scriptsDir = path.join(location, 'Scripts')

    fs.readdir(scriptsDir, (err, files) => {
        if (err) {
            console.error(err)
            return
        }
        const scripts = files.filter(x => x.endsWith('.jsx'))

        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i];
            list.appendChild(
                createItem(
                    path.join(
                        scriptsDir,
                        script
                    )
                )
            )
        }
    })
}

qs('#add-script').addEventListener('click', e => {
    $('#add-script-modal').modal('show')
})

qs('#refresh-illustrator-scripts').addEventListener('click', e => {
    renderScriptRows()
})

renderScriptRows()

Array.from(qa('[data-tab-controls]')).forEach(tabButton => {
    tabButton.addEventListener('click', e => {
        for (let i = 0; i < tabButton.parentElement.children.length; i++) {
            const element = tabButton.parentElement.children[i];
            if (element.classList.contains('active') &&
                tabButton !== element) {
                element.classList.remove('active')
            }
        }
        tabButton.classList.add('active')
        const tab = qs(`#${tabButton.getAttribute('data-tab-controls')}`)
        for (let i = 0; i < tab.parentElement.children.length; i++) {
            const element = tab.parentElement.children[i];
            if (element.classList.contains('tab') &&
                element.classList.contains('active') &&
                element.getAttribute('id') !== element.getAttribute('data-tab-controls')) {

                element.classList.remove('active')
            }
        }
        tab.classList.add('active')
    })
})