// Software License Agreement (ISC License)
//
// Copyright (c) 2018, Matthew Voss
//
// Permission to use, copy, modify, and/or distribute this software for
// any purpose with or without fee is hereby granted, provided that the
// above copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

var next = require('qb-json-next')
var POS = next.POS
var TOK = next.TOK
var ECODE = next.ECODE

function align (ps) {
  if (ps.next_src == null || ps.next_src.length === 0) {
    ps.next_src = null
    return
  }
  var ns_lim = 0                // selection of ps.next_src to include up to (0 means none)
  var npos = ps.pos             // position (updated for completed truncated values)
  var ps_off = ps.lim           // selection of ps.src to keep (ps_off through ps.lim)
  var tinfo = trunc_info(ps)
  if (tinfo) {
    ps_off = in_obj(ps.pos) ? ps.koff : ps.voff
    ns_lim = tinfo.ns_lim
    if (tinfo.pos === ps.pos) {
      // truncated value not complete
      align_src(ps, ps_off, ns_lim)
      return
    } else {
      npos = tinfo.npos // advance position
    }
  }

  // continue from ns_lim and npos...
  switch (npos) {
    case POS.O_BF: case POS.O_BK: case POS.O_AV: case POS.A_BF: case POS.A_BV: case POS.A_AV:
      if (ps_off < ps.lim) {
        align_src(ps, ps_off, ns_lim)
      }
      return

    case POS.O_AK: case POS.O_BV:
      // find next position in ps.next_src
      var nps = {src: ps.next_src}
      nps.stack = ps.stack.slice(0)
      nps.vlim = ns_lim
      nps.pos = npos
      next._init(nps)
      next(nps)
      if (nps.tok === TOK.DEC && nps.vlim < nps.lim) { nps.vlim++ }   // shift truncated decimal
      align_src(ps, ps.koff, nps.vlim)
  }
}

function trunc_info (ps) {
  if (ps.ecode !== ECODE.TRUNCATED && ps.ecode !== ECODE.TRUNC_DEC) {
    return null
  }
  var ret = {}
  switch (ps.pos) {
    case POS.O_BF: case POS.O_BK:
      ret.ns_lim = complete_val(ps.src, ps.koff, ps.klim, ps.next_src)
      ret.npos = POS.O_AK
      break
    case POS.O_BV:
      ret.ns_lim = complete_val(ps.src, ps.voff, ps.vlim, ps.next_src)
      ret.npos = POS.O_AV
      break
    case POS.A_BF: case POS.A_BV:
      ret.ns_lim = complete_val(ps.src, ps.voff, ps.vlim, ps.next_src)
      ret.npos = POS.A_AV
      break
  }
  if (ret.ns_lim < 0) {
    // could not complete truncated value - pos unchanged
    ret.ns_lim = -ret.ns_lim
    if (ret.ns_lim < ps.next_src.length) { ret.ns_lim++ }   // early stop means BAD_VALUE - include byte in selection
    ret.pos = ps.pos
  } else {
    if (ps.ecode === ECODE.TRUNC_DEC && ret.ns_lim < ps.next_src.length) {
      ret.ns_lim++    // include byte after decimal (avoid truncation in src)
    }
  }
  return ret
}

function align_src (ps, ps_off, ns_lim) {
  // combine ps.src with ps.next_src selection
  var ns_remain = ns_lim === ps.next_src.length ? null : ps.next_src.slice(ns_lim)
  ps.src = concat_src(ps.src, ps_off, ps.lim, ps.next_src, 0, ns_lim)
  // ps.src is being used.  rewind position.
  ps.pos = in_obj(ps.pos) ? POS.O_BK : POS.A_BV
  // rewind position to be at value or key/value start
  ps.koff = ps.klim = ps.voff = ps.vlim = ps.tok = ps.ecode = 0
  ps.lim = ps.src.length
  ps.next_src = ns_remain
}

function in_obj (pos) {
  switch (pos) {
    case POS.O_BF: case POS.O_BK: case POS.O_AK: case POS.O_BV: case POS.O_AV: return true
    default: return false
  }
}

function complete_val (src1, voff, vlim, src2) {
  var c = src1[voff]
  if (c === 34) {
    return next._skip_str(src2, 0, src2.length)
  } else if (next._TOK_BYTES[c]) {
    return next._skip_bytes(src2, 0, src2.length, next._TOK_BYTES[c].slice(vlim - voff - 1))
  } else {
    return next._skip_dec(src2, 0, src2.length)
  }
}

function concat_src (src1, off1, lim1, src2, off2, lim2) {
  var len1 = lim1 - off1
  var len2 = lim2 - off2
  var ret = new Uint8Array(len1 + len2)
  for (var i = 0; i < len1; i++) { ret[i] = src1[i + off1] }
  for (i = 0; i < len2; i++) { ret[i + len1] = src2[i + off2] }
  return ret
}

module.exports = align
