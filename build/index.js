/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Benny Nystroem. All rights reserved.
 *  Licensed under the GNU GENERAL PUBLIC LICENSE v3 License. 
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// NodeJS Dependencies
const process = require('process')
const spawn = require('child_process').spawn
 // NPM Dependencies
const chalk = require('chalk')
const figlet = require('figlet')
const inquirer = require('inquirer')
// Local Dependencies
const cli = require('./modules/clui')
const { clear } = require('./modules/clear')
const ora = require('./modules/spinner')
const { git_fire } = require('./modules/git-fire')
const { platform } = require('./utils')

const init = async () => {
    clear()
    process.stdout.write(
        chalk.redBright(
            figlet.textSync('l3monkeys', {
                horizontalLayout: 'fitted',
            })
        ) + '\n'
    )
}

const installHelper = (command, onSuccess, spinner) => {
    return new Promise((resolve, reject) => {
        let process = spawn(command, { shell: true })
        //spinner.start()
        process.on('exit', () => {
            //spinner.succeed()
            onSuccess()
            resolve()
        })
    })
}

const installPrettier = async () => {
    // const spinner = new Spinner('Installing Prettier...')
    const spinner = ora('Installing Prettier...').start()
    return installHelper(
        'yarn add -D prettier',
        () => { spinner.succeed() },
        spinner
    )
}

const initialiseRepo = (git, usname, pwd) => {
    return git.init()
       .then(() => git.addConfig('user.name', 'git-fire'))
       .then(() => git.addConfig('user.email', 'info@derikmediagroup.xyz'))
       .then(() => git.add('-A'))
       .then(() => git.commit('[>](Init) Project initialised!'))
       .then(() => git.addRemote('hsh', `https://${usname}:${pwd}@lab.it.hs-hannover.de/f4-informatik/prgprj/prgprj-ws19-20/grp13`))
       .catch((err) => console.error('Failed: ', err))
 }

const uploadProject = async (username, pwd) => {
    const gitP = require('simple-git/promise')
    const git = gitP(process.cwd())
    const spinner = ora('Configuring Git Hook...').start()
    return new Promise((resolve, reject) => {
        git.checkIsRepo()
           .then(isRepo => !isRepo && initialiseRepo(git, username, pwd))
           .then(() => git_fire(git).then(() => {
                spinner.succeed()
                resolve()
           }))
           .catch((err) => { spinner.fail(); console.log('Failed: ', err); resolve()})
    })
}

const askForGeneralSettings = () => {
    const questions = [
        {
            name: 'USERNAME',
            type: 'input',
            message: 'Enter your username of HsH',
            validate: function(val) {
                let pass = val.match(/^[a-zA-Z0-9_\-]+$/)
                if (pass) return true;
                return 'Ehm, invalid username'
            }
        },
        {
            name: 'PASSWORD',
            type: 'password',
            message: 'Enter your password of HsH (it\'s encrypted)'
        }
    ]
    return inquirer.prompt(questions)
}

const success = () => {
    process.stdout.write(chalk.blue.bold(`Project successfully uploaded!`) + '\n')
    process.exit(0)
}

(async () => {
    init()

    let answer = await askForGeneralSettings()
    const { USERNAME, PASSWORD } = answer
    // Initialize `simple-git` with the provided cwd
    uploadProject(USERNAME, PASSWORD).then(() => success())
})()