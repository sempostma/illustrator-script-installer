// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const minimatch = require('minimatch')
const unzipper = require('unzipper');
const Store = require('electron-store');
const { app, dialog, getCurrentWindow } = require('electron').remote
const mainWindow = getCurrentWindow()
const fs = require('fs-extra')
const path = require('path')
var sudo = require('sudo-prompt');
const request = require('request')
const packageJson = require('./package.json')
var options = {
    name: 'Electron',
};
const md5 = require('md5')
const library = require('./library.json')

const store = new Store();

const defaultLocale = 'en'
const locales = ['en']

const deviceLocale = store.get('locale', app.getLocale())
const locale = locales.includes(deviceLocale) ? deviceLocale : defaultLocale

store.set('locale', locale)

const qs = document.querySelector.bind(document)
const qa = document.querySelectorAll.bind(document)

const messages = require(`./locales/${locale}.json`)

function __(id, args) {
    let msg = messages[id]
    for (const key in args) {
        if (args.hasOwnProperty(key)) {
            const element = args[key];
            msg = msg.replace('{{' + key + '}}', element)
        }
    }
    return msg
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
    renderScriptRows()
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
    renderScriptRows()
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
    const fileName = path.basename(filePath).split('.')[0]
    var tr = document.createElement("div");
    tr.classList.add('five', 'column', 'row')
    var e_3 = document.createElement("div");
    e_3.classList.add('column')
    var dummy = document.createElement("div");
    dummy.classList.add('column')
    var e_4 = document.createElement("div");
    e_4.setAttribute("class", "ui checkbox");
    var checkbox = document.createElement("input");
    checkbox.setAttribute("type", "checkbox");
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) checkbox.setAttribute("checked", "true");
    checkbox.addEventListener('change', e => {
        makeActive(filePath, e.target.checked)
    })
    e_4.appendChild(checkbox);
    var e_6 = document.createElement("label");
    e_4.appendChild(e_6);
    e_3.appendChild(e_4);
    tr.appendChild(e_3);
    var e_7 = document.createElement("div");
    e_7.classList.add('column')
    e_7.appendChild(document.createTextNode(fileName));
    tr.appendChild(e_7);
    var sizeColumn = document.createElement("div");
    sizeColumn.classList.add('column')
    tr.appendChild(sizeColumn);
    var lastModified = document.createElement("div");
    lastModified.classList.add('column')
    tr.appendChild(lastModified);
    var createdAt = document.createElement("div");
    createdAt.classList.add('column')
    tr.appendChild(createdAt);
    fs.lstat(filePath, (err, stat) => {
        if (err) {
            console.error(err)
        } else {
            sizeColumn.innerText = stat.size
            lastModified.innerText = stat.mtime.toLocaleString()
            createdAt.innerText = stat.ctime.toLocaleString()
        }
    })
    return tr;
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
        const scripts = files.filter(x => x.endsWith('.jsx') || x.endsWith('.jsx.bak') || x.endsWith('.js') || x.endsWith('.js.bak'))

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

qs('#add-script-file-button').addEventListener('click', e => {
    const file = qs('#add-script-file-input').files[0]
    if (!file) {
        alert(__('noFileSelected'))
        return
    }
    const illustratorPresetDir = store.get('illustrator-presets-dir')
    if (!illustratorPresetDir) {
        alert(__('cannotFindIllustratorInstallationPleaseSpecifyManually'))
        return
    }

    const scriptsDir = path.join(illustratorPresetDir, 'Scripts')

    qs('#add-script-file-input').value = ''

    const filepath = file.path
    const filename = file.name
    const targetDir = path.join(scriptsDir, filename)

    if (!(filename.endsWith('.jsx') || filename.endsWith('.js'))) {
        alert(__('fileNameMustEndWithDotJsx'))
        return
    }

    fs.exists(targetDir, exists => {
        if (exists) {
            alert(__('scriptAlreadyExists'))
            return
        }

        const command = process.platform === "win32"
            ? `copy "${filepath.replace(/\//g, '\\')}" "${targetDir.replace(/\//g, '\\')}"`
            : `cp "${filepath}" "${targetDir}"`

        console.log(command)

        sudo.exec(command, options,
            function (error, stdout = '', stderr = '') {
                if (error) return alert(error + '\n' + stderr + '\n' + stdout)
                renderScriptRows()
                $('#add-script-modal').modal('hide')

                alert(__('successfullyAddedScriptToIllustrator') + '\n' + __('restartIllustratorToUseTheScript'))
            }
        );

    })
})

function makeActive(filepath, active) {
    const to = path.basename(active ? filepath : filepath + '.bak')
    const from = active ? filepath + '.bak' : filepath

    fs.exists(from, (exists) => {
        if (!exists) {
            alert(__('cannotFindFile', { file: from }))
        }
        else {
            fs.exists(to, exists => {
                if (exists) {
                    alert(__('fileAlreadyExists', { file: to }))
                    return
                }
                else {
                    const command = process.platform === "win32"
                        ? `rename "${from.replace(/\//g, '\\')}" "${to.replace(/\//g, '\\')}"`
                        : `mv "${from}" "${to}"`

                    console.log(command)
                    sudo.exec(command, options,
                        function (error, stdout = '', stderr = '') {
                            if (error) return alert(error + '\n' + stderr + '\n' + stdout)

                            if (active) {
                                alert(__('successfullyAddedScriptToIllustrator') + '\n' + __('restartIllustratorToUseTheScript'))
                            } else {
                                alert(__('successfullyDeactivatedScript') + '\n' + __('restartIllustratorToUseTheScript'))
                            }
                        }
                    );
                }
            })
        }
    })
}

qs('#add-script-plain-text-button').addEventListener('click', e => {
    const basename = qs('#add-script-plain-text-filename').value
    const contents = qs('#add-script-plain-text-textarea').value

    if (!(basename.endsWith('.jsx') || basename.endsWith('.js'))) {
        alert(__('filenameShouldEndWithDotJsx'))
        return
    }

    const location = store.get('illustrator-presets-dir')
    if (!location) {
        alert(__('cannotFindIllustratorInstallationPleaseSpecifyManually'))
        return
    }

    const scriptsDir = path.join(location, 'Scripts')
    const targetFilePath = path.join(scriptsDir, basename)

    fs.exists(targetFilePath, exists => {
        if (exists) {
            alert(__('fileAlreadyExists', { file: to }))
            return
        } else {
            const temp = path.join(app.getPath('userData'), 'temporary-writes', basename)
            fs.writeFile(temp, contents, err => {
                if (err) {
                    alert(err)
                } else {
                    const command = process.platform === "win32"
                        ? `move "${temp.replace(/\//g, '\\')}" "${scriptsDir.replace(/\//g, '\\')}"`
                        : `mv "${temp}" "${targetFilePath}"`

                    console.log(command)
                    sudo.exec(command, options,
                        function (error, stdout = '', stderr = '') {
                            if (error) return alert(error + '\n' + stderr + '\n' + stdout)

                            alert(__('successfullyAddedScriptToIllustrator') + '\n' + __('restartIllustratorToUseTheScript'))
                        }
                    );
                }
            })
        }
    })
})

const libraryModules = qs('#library-modules')

const giveMeScriptsDir = zipModule => {
    return new Promise(async (resolve, reject) => {
        const url = zipModule.zip
        const tempName = md5(url)
        const modulesFolder = path.join(app.getPath('userData'), 'modules')
        fs.ensureDir(modulesFolder)
        const tempFolder = path.join(modulesFolder, tempName)
        if (await fs.exists(tempFolder)) {
            return resolve(tempFolder)
        } else {
            await fs.mkdir(tempFolder)
            request(url, {  }, (error, response, body) => {
                if (error) reject(error)
            })
                .pipe(unzipper.Parse())
                .on('entry', entry => {
                    const basename = path.basename(entry.path)
                    const filename = entry.path.split('/').slice(1).join('/')
                    if (entry.type === 'File' && zipModule.files.some(p => minimatch(filename, p))) {
                        const tempFileName = path.join(tempFolder, basename)
                        console.log(tempFileName)
                        entry.pipe(fs.createWriteStream(tempFileName))
                    } else {
                        entry.autodrain()
                    }
                })
                .promise()
                .then(() => resolve(tempFolder), reject)
        }
    })
}

qs('#open-temp-folder').title = app.getPath('userData')

qs('#open-temp-folder').addEventListener('click', () => {
    open(app.getPath('userData'))
})

const loadModule = module => {
    switch (module.type) {
        case 'zip': {
            return giveMeScriptsDir(module)
        }
        default: {
            throw new Error('Unknown type ' + module.type)
        }
    }
}

library.modules.forEach(module => {
    const item = document.createElement('div')
    item.setAttribute('class', 'item')
    const header = document.createElement('div')
    header.setAttribute('class', 'header')
    header.innerText = module.title
    item.appendChild(header)
    if (module.description) item.appendChild(document.createTextNode(module.description))
    libraryModules.appendChild(item)

    const modulePromise = loadModule(module)

    item.addEventListener('click', async function () {
        const directory = await modulePromise
        const moduleContent = qs('#library-module-content')

        const license = document.createElement('a')
        license.innerText = __('license')
        license.href = module.license
        license.target = '_system'
        moduleContent.appendChild(license)
        moduleContent.appendChild(document.createTextNode(' - '))
        const readme = document.createElement('a')
        readme.innerText = __('readme')
        readme.href = module.readme
        readme.target = '_system'
        moduleContent.appendChild(readme)
        moduleContent.appendChild(document.createElement('br'))
        moduleContent.appendChild(document.createElement('br'))
        const title = document.createElement('h2')
        title.innerText = module.title
        moduleContent.appendChild(title)
        if (module.description) {
            const description = document.createElement('p')
            description.innerText = module.description
            moduleContent.appendChild(description)
        }

        const files = await fs.readdir(directory)

        const list = document.createElement('div')
        list.setAttribute('class', 'ui grid')

        var headerRow = document.createElement("div");
        headerRow.classList.add('three', 'column', 'row')
        var iconCol = document.createElement('div')
        iconCol.appendChild(document.createTextNode(__('install')))
        iconCol.classList.add('column')
        headerRow.appendChild(iconCol)
        var nameCol = document.createElement("div");
        nameCol.classList.add('column')
        nameCol.appendChild(document.createTextNode(__('name')));
        headerRow.appendChild(nameCol);
        var sizeColumn = document.createElement("div");
        sizeColumn.appendChild(document.createTextNode(__('fileSize')))
        sizeColumn.classList.add('column')
        headerRow.appendChild(sizeColumn);
        headerRow.style.fontWeight = 'bold'
        list.appendChild(headerRow)

        for (const name of files) {
            const fileName = path.join(directory, name)
            const stat = await fs.lstat(fileName)
            var tr = document.createElement("div");
            const iconContainer = document.createElement('a')
            iconContainer.classList.add('column')
            iconContainer.href = '#'
            tr.classList.add('three', 'column', 'row')
            var iconCol = document.createElement('i')
            iconCol.setAttribute('class', 'column download icon')
            iconContainer.appendChild(iconCol)
            tr.appendChild(iconContainer)
            var nameCol = document.createElement("div");
            nameCol.classList.add('column')
            nameCol.appendChild(document.createTextNode(name));
            tr.appendChild(nameCol);
            var sizeColumn = document.createElement("div");
            sizeColumn.appendChild(document.createTextNode(stat.size))
            sizeColumn.classList.add('column')
            tr.appendChild(sizeColumn);
            list.appendChild(tr)

            iconContainer.addEventListener('click', () => {
                const filepath = fileName
                const illustratorPresetDir = store.get('illustrator-presets-dir')
                if (!illustratorPresetDir) {
                    alert(__('cannotFindIllustratorInstallationPleaseSpecifyManually'))
                    return
                }
                const scriptsDir = path.join(illustratorPresetDir, 'Scripts')

                const targetFilePath = path.join(scriptsDir, name)
                const command = process.platform === "win32"
                    ? `copy "${filepath.replace(/\//g, '\\')}" "${targetFilePath.replace(/\//g, '\\')}"`
                    : `cp "${filepath}" "${targetFilePath}"`

                sudo.exec(command, options,
                    function (error, stdout = '', stderr = '') {
                        if (error) return alert(error + '\n' + stderr + '\n' + stdout)
                        renderScriptRows()
                        $('#add-script-modal').modal('hide')

                        alert(__('successfullyAddedScriptToIllustrator') + '\n' + __('restartIllustratorToUseTheScript'))
                    }
                );
            })
        }
        moduleContent.appendChild(list)
    })
})



