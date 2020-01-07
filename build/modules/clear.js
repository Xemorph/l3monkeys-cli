/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Benny Nystroem. All rights reserved.
 *  Licensed under the GNU GENERAL PUBLIC LICENSE v3 License. 
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// NodeJS Dependencies
const assert = require('assert')
// Export function
module.exports.clear = (opts) => {
    if (typeof (opts) === 'boolean') {
        opts = {
            fullClear: opts
        }
    }

    opts = opts || {}
    assert(typeof (opts) === 'object', 'opts must be an object')

    opts.fullClear = opts.hasOwnProperty('fullClear') ?
        opts.fullClear : true

    assert(typeof (opts.fullClear) === 'boolean',
        'opts.fullClear must be a boolean')

    if (opts.fullClear === true) {
        process.stdout.write('\x1b[2J')
    }

    process.stdout.write('\x1b[0f')
}