/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Benny Nystroem. All rights reserved.
 *  Licensed under the GNU GENERAL PUBLIC LICENSE v3 License. 
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const path = require('path')
// Current epoch
const current_epoch = () => {
    return Math.round(new Date().getTime() / 1000);
}
// Users EMail
const user_email = (git) => {
    return new Promise((resolve, reject) => {
        git.raw(['config', 'user.email'])
              .then((result) => resolve(result))
              .catch((err) => { console.log('Failed: ', err); resolve('info@derikmediagroup.xyz')})
    })
}
// Git fire
module.exports.git_fire = (git) => {
    return new Promise((resolve, reject) => {
        git.raw([
            'symbolic-ref',
            'HEAD'
        ]).then((result) => {
            let inital_branch = path.basename(result)
            return user_email(git).then((user_email) => {
                inital_branch = inital_branch.replace(/(\r\n|\n|\r)/gm, '')
                user_email = user_email.replace(/(\r\n|\n|\r)/gm, '')
                git.checkout(['-b', `fire-${inital_branch}-${user_email}-${current_epoch()}`])
                return git.raw(['rev-parse', '--show-toplevel'])
                   .then((result) => {
                        result = result.replace(/(\r\n|\n|\r)/gm, '')
                        git.cwd(path.normalize(result))
                        git.add('-A')
                        let message = `\"Fire! [>](Save) Project saved!\"`
                        git.raw(['commit', '-m', `${message}`, '--no-verify'])
                        return git.raw(['remote'])
                           .then((data) => {
                               let remote = data.replace(/(\r\n|\n|\r)/gm, '')
                               return git.raw(['symbolic-ref', 'HEAD'])
                                  .then((current_branch) => {
                                      current_branch = current_branch.replace(/(\r\n|\n|\r)/gm, '')
                                      current_branch = path.basename(current_branch)
                                      return git.raw([
                                          'push',
                                          '--no-verify',
                                          '--set-upstream',
                                          `${remote}`,
                                          `${current_branch}`
                                      ])
                                      .then(() => { return true })
                                      .catch((err) => { return true })
                                  })
                           })
                           .catch((err) => { console.log('Failed: ', err); resolve() })
                   })
                
            })
        })
        .then(() => { resolve() })
    })
}