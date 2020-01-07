/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Benny Nystroem. All rights reserved.
 *  Licensed under the GNU GENERAL PUBLIC LICENSE v3 License. 
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// NPM Dependencies
const chalk = require('chalk')
const readline = require('readline')
const symbols = require('log-symbols')
const MuteStream = require('mute-stream')
// Constants
const TEXT = Symbol('text')
const PREFIX_TEXT = Symbol('prefixText')

const ASCII_ETX_CODE = 0x03 // Ctrl+C emits this code
// Class
class StdinDiscarder {
    constructor() {
        this.requests = 0

        this.mutedStream = new MuteStream()
        this.mutedStream.pipe(process.stdout)
        this.mutedStream.mute()

        const self = this
        this.ourEmit = function (event, data, ...args) {
            const {stdin} = process;
            if (self.requests > 0 || stdin.emit === self.ourEmit) {
                if (event === 'keypress') // Fixes readline behavior
                    return
                if (event === 'data' && data.includes(ASCII_ETX_CODE))
                    process.emit('SIGINT')

                Reflect.apply(self.oldEmit, this, [event, data, ...args])
            } else
                Reflect.apply(process.stdin.emit, this, [event, data, ...args])
        }
    }

    start() {
        this.requests++

        if (this.requests === 1)
            this.realStart()
    }

    stop() {
        if (this.requests <= 0)
            throw new Error('`stop` called more times than `start`')

        this.requests--

        if (this.requests === 0)
            this.realStop()
    }

    realStart() {
        // No known way to make it work reliably on Windows
        if (process.platform === 'win32')
            return

        this.rl = readline.createInterface({
            input: process.stdin,
            output: this.mutedStream
        })

        this.rl.on('SIGINT', () => {
            if (process.listenerCount('SIGINT') === 0)
                process.emit('SIGINT')
            else {
                this.rl.close()
                process.kill(process.pid, 'SIGINT')
            }
        })
    }

    realStop() {
        if (process.platform === 'win32')
            return

        this.rl.close()
        this.rl = undefined
    }
}
//
const stdinDiscarder = new StdinDiscarder()
// Class
class Ora {
    constructor(options) {
        if (typeof options === 'string')
            options = { text: options }
        // Default options
        this.options = {
            text: '',
            color: 'cyan',
            stream: process.stderr,
            discardStdin: true,
            ...options
        }
        // Local variables inside of 'Ora' class
        this.spinner = this.options.spinner
        this.color = this.options.color
        this.hideCursor = this.options.hideCursor !== false
        this.interval = this.options.interval || this.spinner.interval || 100
        this.stream = this.options.stream
        this.id = undefined
        // Set *after* `this.stream`
        this.text = this.options.text
        this.linesToClear = 0
        this.indent = this.options.indent
        this.discardStdin = this.options.discardStdin
        this.isDiscardingStdin = false
    }
    _updateInterval(interval) {
        if (interval !== undefined)
            this.interval = interval
    }
    // Getter & Setter -> Spinner
    get spinner() {
        return this._spinner
    }
    set spinner(spinner) {
        this.frameIndex = 0

        if (typeof spinner === 'object') {
            if (spinner.frames === undefined)
                throw new Error('The given spinner must have a `frames` property')
            this._spinner = spinner
        } //else if (process.platform === 'win32')
        //    this._spinner = ['-','\\','|','/']
        else if (spinner === undefined)
            //this._spinner = ['◜','◠','◝','◞','◡','◟'] // Set default spinner
            this._spinner = {"interval": 100, "frames": ["◜","◠","◝","◞","◡","◟"]}
        else
            throw new Error(`There is no built-in spinner named '${spinner}'. See https://github.com/sindresorhus/cli-spinners/blob/master/spinners.json for a full list.`);

        this._updateInterval(this._spinner.interval);
    }
    // Getter & Setter -> Text
    get text() {
        return this[TEXT];
    }
    set text(value) {
        this[TEXT] = value
    }
    // Checkers
    get isSpinning() {
        return this.id !== undefined
    }
    // Internal rendering, low-level API
    frame() {
        const { frames } = this.spinner
        let frame = frames[this.frameIndex]

        if (this.color)
            frame = chalk[this.color](frame)

        this.frameIndex = ++this.frameIndex % frames.length
        return frame
    }
    render() {
        this.stream.write('\u001b[0G' + this.frame() + '\u001b[90m' + ' ' + this[TEXT] + '\u001b[0m')
        return this
    }

    // Start & Stop functions
    start(text) {
        if (text)
            this.text = text
        //if (!this.isEnabled) {
            //this.stream.write(`- ${this.text}\n`)
        //    return this
        //}
        if (this.isSpinning)
            return this
        //if (this.hideCursor)
        //    cliCursor.hide(this.stream)
        if (this.discardStdin && process.stdin.isTTY) {
            this.isDiscardingStdin = true
            stdinDiscarder.start()
        }

        this.render();
        this.id = setInterval(this.render.bind(this), this.interval);

        return this
    }
    stop() {
        this.stream.write('\u001b[0G\u001b[2K')
        clearInterval(this.id)
        this.id = undefined
        this.frameIndex = 0

        //if (this.hideCursor)
        //    cliCursor.show(this.stream)
        if (this.discardStdin && process.stdin.isTTY && this.isDiscardingStdin) {
            stdinDiscarder.stop()
            this.isDiscardingStdin = false
        }

        return this
    }
    stopAndPersist(options = {}) {
        this.stop()
        this.stream.write(`${options.symbol || ' '} ${this.text}\n`)

        return this
    }

    succeed() {
        return this.stopAndPersist({symbol: symbols.success})
    }
    fail() {
        return this.stopAndPersist({symbol: symbols.error})
    }
    warn() {
        return this.stopAndPersist({symbol: symbols.warning})
    }
    info() {
        return this.stopAndPersist({symbol: symbols.info})
    }

}

// EOF - End Of File
const oraFactory = function (options) {
    return new Ora(options)
}

module.exports = oraFactory