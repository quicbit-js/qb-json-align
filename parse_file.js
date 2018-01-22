var Transform = require('stream').Transform
var util = require('util')
var fs = require('fs')

var align = require('.')
var next = require('qb-json-next')

function TokTransform(stream_opt) {
    this.ps = {}
    this.state = {
        src: null,
        off: 0,
        lim: 0,
        lines: 0,                   // number of lines processed (\n or \n\r) (updated after src chunk is done),
        bytes: 0,                   // total bytes processed (updated after src chunk is done)
        buffers: 0,                 // total number of buffers processed
    }
    Transform.call(this, stream_opt)
}

TokTransform.prototype = {
    constructor: TokTransform,
    _transform: function (src, enc, cb) {
        if (this.start == null) { this.start = new Date() }
        var ps = this.ps
        if (src && src.length) {
            ps.next_src = src
            align(ps)
            while (next(ps) !== 0) {}
            this.state.bytes += src.length
            this.state.buffers++
            cb()
        }
        else {
            this.finish = new Date()
            console.log('values:', ps.vcount, 'end-state:', next.tokstr(ps))
            console.log(this.state)
            console.log((this.finish - this.start) / 1000)
        }
    },
    _flush: function (cb) {
        this._transform(new Uint8Array(0), '', cb)
    }
}
util.inherits(TokTransform, Transform)


function parse_file (path, stream_opt) {
    var inp = fs.createReadStream(path, stream_opt)
    var scantran = new TokTransform(stream_opt)

    inp.pipe(scantran).pipe(process.stdout)
}

// parse_file('../package.json', cb, { highWaterMark: 1024 * 1000000 })
parse_file('/Users/dad/dev/qzip/cache_150mb.json', { highWaterMark: 1024 * 2048 })
// parse_file('/Users/dad/dev/qb1-scan-sampler/samples/blockchain_unconfirmed.json', cb, { highWaterMark: 1024 * 1000000 })

// var f = fs.readFileSync('/Users/dad/dev/qb1-scan-sampler/samples/blockchain_unconfirmed.json')
