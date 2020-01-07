/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Benny Nystroem. All rights reserved.
 *  Licensed under the GNU GENERAL PUBLIC LICENSE v3 License. 
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
// NPM Dependencies
const sprintf  = require('util').format

// Helper functions
// Tiny helper function used for making default values prettier.
function pick(value, defaultValue) {
    return (typeof value == 'undefined' ? defaultValue : value)
}

const helpers = {
    // Make a console spinner.
    // Code based on code from Mocha by Visionmedia/Tj
    // https://github.com/visionmedia/mocha/blob/master/bin/_mocha
    Spinner: function (message, style) {
        var spinnerMessage = message
        var spinnerStyle = style

        this.start = function () {
            var self = this
            var spinner = spinnerStyle

            if (!spinner || spinner.length === 0) {
                spinner = ['◜','◠','◝','◞','◡','◟']
            }

            function play(arr, interval) {
                var len = arr.length, i = 0
                interval = interval || 100

                var drawTick = function () {
                    var str = arr[i++ % len]
                    process.stdout.write('\u001b[0G' + str + '\u001b[90m' + spinnerMessage + '\u001b[0m')
                }

                self.timer = setInterval(drawTick, interval)
            }

            var frames = spinner.map(function(c) {
                return sprintf('  \u001b[96m%s ', c)
            })

            play(frames, 70)
        }

        this.message = function (message) {
            spinnerMessage = message
        };

        this.stop = function () {
            process.stdout.write('\u001b[0G\u001b[2K')
            clearInterval(this.timer)
        };
    },
    // Effectively clear a screen.
    // Code based on code from Clear by bahamas10/node-clear
    // https://github.com/bahamas10/node-clear
    Clear: function(clear) {
        if (clear !== false) {
            // Ansi code for clearing screen
            process.stdout.write('\033[2J')
        }
        // if false, don't clear screen, rather move cursor to top left
        process.stdout.write('\033[0;0f')
    }
}


module.exports = helpers