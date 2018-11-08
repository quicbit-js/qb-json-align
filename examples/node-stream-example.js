// example of classic node Transform stream implementation

var Transform = require('stream').Transform
var util = require('util')
var fs = require('fs')

var next = require('qb-json-next')
var align = require('..')

function TokenTransform() {
  Transform.call(this)
  this.ps = null
  this.buffer_count = 0
  this.start_time = 0
  this.finish_time = 0
}

TokenTransform.prototype = {
  constructor: TokenTransform,
  _transform: function (src, enc, cb) {
    if (this.start_time === 0) { this.start_time = new Date() }
    var ps = this.ps
    if (src && src.length) {
      this.buffer_count++
      var trace = false
      if (ps === null) {
        ps = this.ps = next.new_ps(src)
      } else {
        ps.next_src = src
        // 87371765 - messed up align
        if (ps.soff > 87370000) {
          trace = true
          console.log('align', ps.soff)
        }
        align(ps, {new_buf: function (len) { return new Buffer(len )}})
        if (trace) console.log('aligned', ps.to_obj())
      }
      while (next(ps) !== 0) {
        if (trace) console.log('next', ps.to_obj())
      }   // just process through to let ps collect line count and other stats.
      cb()
    }
    else {
      this.finish_time = new Date()
      console.log(this.buffer_count, 'buffers')
      console.log(ps.line, 'lines')
      console.log(ps.vcount, 'values')
      console.log(ps.soff + ps.vlim, 'bytes')
      console.log((this.finish_time - this.start_time) / 1000, 'seconds')
      console.log('end-state:', ps.to_obj())
    }
  },
  _flush: function (cb) {
    this._transform(new Uint8Array(0), '', cb)
  }
}
util.inherits(TokenTransform, Transform)

// var path = '../package.json'
var path = './bitcoin-transactions.json'

fs.createReadStream(path, { highWaterMark: 1 * 1024 })
  .pipe(new TokenTransform())
  .pipe(process.stdout)
