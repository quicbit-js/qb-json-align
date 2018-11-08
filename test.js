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


var test = require('test-kit').tape()
var utf8 = require('qb-utf8-ez')
var next = require('qb-json-next')

var align = require('.')

function capture_next_src (sources) {
  var ret = []
  var ps = {}
  while (sources.length) {
    var toks = []
    ps.next_src = utf8.buffer(sources.shift())
    align(ps)
    while(next(ps, {err: function () {}})) {    // suppress errors (they are shown in token result)
      toks.push(next.tokstr(ps))
    }
    ret.push(toks.join(','))
  }
  ret.push(next.tokstr(ps, true))
  return ret
}

test('align', function (t) {
  t.table_assert([
    [ 'sources',                      'exp' ],
    [ ['["a', 'bc"', ','] ,           [ '[@0', 's5@0', '', '!@1:A_BV:[' ] ],
    [ ['["abc', '"', ','] ,           [ '[@0', 's5@0', '', '!@1:A_BV:[' ] ],
    [ ['["abc"', ',', ' '] ,          [ '[@0,s5@1', '', '', '!@1:A_BV:[' ] ],
    [ ['["abc"', ',4', ' '] ,         [ '[@0,s5@1', '', 'd1@0', '!@2:A_AV:[' ] ],
    [ ['["abc"', '', ',4 ' ] ,        [ '[@0,s5@1', '', 'd1@1', '!@3:A_AV:[' ] ],
    [ ['t', 'r', 'u', 'e', ', 7' ] ,  [ '', '', '', 't@0', '', '!1@2:D:A_BV' ] ],
  ], function (sources) {
    return capture_next_src(sources)
  })
})

test('align object', function (t) {
  t.table_assert([
    [ 'src1',       'src2',               'exp' ],
    [ '{',          '"a":3}',             [ '{@0', 'k3@0:d1@4,}@5', '!@6:A_AV' ] ],
    [ '{"',         'a":3}',              [ '{@0', 'k3@0:d1@4,}@5', '!@6:A_AV' ] ],
    [ '{"a',        '":3}',               [ '{@0', 'k3@0:d1@4,}@5', '!@6:A_AV' ] ],
    [ '{"a"',       ':3}',                [ '{@0', 'k3@0:d1@4,}@5', '!@6:A_AV' ] ],
    [ '{"a":',      '3}',                 [ '{@0', 'k3@0:d1@4,}@5', '!@6:A_AV' ] ],
    [ '{"a":3',     '}',                  [ '{@0', 'k3@0:d1@4,}@5', '!@6:A_AV' ] ],
    [ '{',          '"a":3,"bc":11}',     [ '{@0', 'k3@0:d1@4,k4@6:d2@11,}@13', '!@14:A_AV' ] ],
    [ '{"',         'a":3,"bc":11}',      [ '{@0', 'k3@0:d1@4,k4@0:d2@5,}@7', '!@8:A_AV' ] ],
    [ '{"a',        '":3,"bc":11}',       [ '{@0', 'k3@0:d1@4,k4@0:d2@5,}@7', '!@8:A_AV' ] ],
    [ '{"a"',       ':3,"bc":11}',        [ '{@0', 'k3@0:d1@4,k4@0:d2@5,}@7', '!@8:A_AV' ] ],
    [ '{"a":',      '3,"bc":11}',         [ '{@0', 'k3@0:d1@4,k4@0:d2@5,}@7', '!@8:A_AV' ] ],
    [ '{"a":3',     ',"bc":11}',          [ '{@0', 'k3@0:d1@4,k4@0:d2@5,}@7', '!@8:A_AV' ] ],
    [ '{"a":3,"',   'bc":11}',            [ '{@0,k3@1:d1@5', 'k4@0:d2@5,}@7', '!@8:A_AV' ] ],
    [ '{',          '"a": true,"bc":11}', [ '{@0', 'k3@0:t@5,k4@10:d2@15,}@17', '!@18:A_AV' ] ],
    [ '{"',         'a": true,"bc":11}',  [ '{@0', 'k3@0:t@5,k4@1:d2@6,}@8', '!@9:A_AV' ] ],
    [ '{"a',        '": true,"bc":11}',   [ '{@0', 'k3@0:t@5,k4@1:d2@6,}@8', '!@9:A_AV' ] ],
    [ '{"a"',       ': true,"bc":11}',    [ '{@0', 'k3@0:t@5,k4@1:d2@6,}@8', '!@9:A_AV' ] ],
    [ '{"a": ',     'true,"bc":11}',      [ '{@0', 'k3@0:t@5,k4@1:d2@6,}@8', '!@9:A_AV' ] ],
    [ '{"a": tru',  'e, "bc":11}',        [ '{@0', 'k3@0:t@5,k4@2:d2@7,}@9', '!@10:A_AV' ] ],
    [ '{"a": t',    'rue, "bc":11}',      [ '{@0', 'k3@0:t@5,k4@2:d2@7,}@9', '!@10:A_AV' ] ],
    [ '{"a":true,', '"bc":11}',           [ '{@0,k3@1:t@5', 'k4@0:d2@5,}@7', '!@8:A_AV' ] ],
    [ '{"a": true', ', "bc":11}',         [ '{@0,k3@1:t@6', 'k4@2:d2@7,}@9', '!@10:A_AV' ] ],
    [ '{"a":true ', ', "bc":11}',         [ '{@0,k3@1:t@5', 'k4@2:d2@7,}@9', '!@10:A_AV' ] ],
    [ '{"a":"x","', 'bc":11}',            [ '{@0,k3@1:s3@5', 'k4@0:d2@5,}@7', '!@8:A_AV' ] ],
    [ '{',          '"a":"x","bc":11}',   [ '{@0', 'k3@0:s3@4,k4@8:d2@13,}@15', '!@16:A_AV' ] ],
    [ '{"',         'a":"x","bc":11}',    [ '{@0', 'k3@0:s3@4,k4@1:d2@6,}@8', '!@9:A_AV' ] ],
    [ '{"a',        '":"x","bc":11}',     [ '{@0', 'k3@0:s3@4,k4@1:d2@6,}@8', '!@9:A_AV' ] ],
    [ '{"b"',       ':"x","bc":11}',      [ '{@0', 'k3@0:s3@4,k4@1:d2@6,}@8', '!@9:A_AV' ] ],
    [ '{"c":',      '"x","bc":11}',       [ '{@0', 'k3@0:s3@4,k4@1:d2@6,}@8', '!@9:A_AV' ] ],
    [ '{"d":"',     'x","bc":11}',        [ '{@0', 'k3@0:s3@4,k4@1:d2@6,}@8', '!@9:A_AV' ] ],
    [ '{"e":"x',    '","bc":11}',         [ '{@0', 'k3@0:s3@4,k4@1:d2@6,}@8', '!@9:A_AV' ] ],
    [ '{"f":"x"',   ',"bc":11}',          [ '{@0,k3@1:s3@5', 'k4@1:d2@6,}@8', '!@9:A_AV' ] ],
    [ '{"g":"x","', 'bc":11}',            [ '{@0,k3@1:s3@5', 'k4@0:d2@5,}@7', '!@8:A_AV' ] ],
  ], function (src1, src2) {
    return capture_next_src([src1, src2])
  })
})

test('align incomplete object', function (t) {
  t.table_assert([
    [ 'src1',     'src2',    'exp' ],
    [ '{"a":3,',  '"b',      [ '{@0,k3@1:d1@5', '', 'k2@0:!@2:T:O_BK:{' ] ],
    [ '{',        '"a',      [ '{@0', '', 'k2@0:!@2:T:O_BF:{' ] ],
    [ '{"',       'a',       [ '{@0', '', 'k2@0:!@2:T:O_BK:{' ] ],
    [ '{"',       'ab',      [ '{@0', '', 'k3@0:!@3:T:O_BK:{' ] ],
    [ '{"',       'a"',      [ '{@0', '', 'k3@0:!@3:K:O_AK:{' ] ],
    [ '{"',       'a":',     [ '{@0', '', 'k3@0:!@4:K:O_BV:{' ] ],
    [ '{"',       'a": ',    [ '{@0', '', 'k3@0:!@5:K:O_BV:{' ] ],
    [ '{"a',      '": 3',    [ '{@0', '', 'k3@0:!1@5:D:O_BV:{' ] ],
    [ '{"a',      '": 3,',   [ '{@0', 'k3@0:d1@5', '!@7:O_BK:{' ] ],
    [ '{"a"',     ':',       [ '{@0', '', 'k3@0:!@4:K:O_BV:{' ] ],
    [ '{"a"',     ': ',      [ '{@0', '', 'k3@0:!@5:K:O_BV:{' ] ],
    [ '{"a":',    ' ',       [ '{@0', '', 'k3@0:!@5:K:O_BV:{' ] ],
    [ '{"a":',    ' 3',      [ '{@0', '', 'k3@0:!1@5:D:O_BV:{' ] ],
    [ '{"a":3',   '',        [ '{@0', '', 'k3@1:!1@5:D:O_BV:{' ] ],
    [ '{"a":3',   '4',       [ '{@0', '', 'k3@0:!2@4:D:O_BV:{' ] ],
    [ '{"a":3',   ' ',       [ '{@0', 'k3@0:d1@4', '!@6:O_AV:{' ] ],
    [ '{"a',      '":',      [ '{@0', '', 'k3@0:!@4:K:O_BV:{' ] ],
    [ '{"a',      '": ',     [ '{@0', '', 'k3@0:!@5:K:O_BV:{' ] ],
    [ '{"a',      '": "',    [ '{@0', '', 'k3@0:!1@5:T:O_BV:{' ] ],
    [ '{"a',      '": "qr',  [ '{@0', '', 'k3@0:!3@5:T:O_BV:{' ] ],
    [ '{"a',      '": "qr"', [ '{@0', 'k3@0:s4@5', '!@9:O_AV:{' ] ],
    [ '{"a"',     ': "',     [ '{@0', '', 'k3@0:!1@5:T:O_BV:{' ] ],
    [ '{"a":',    ' "q',     [ '{@0', '', 'k3@0:!2@5:T:O_BV:{' ] ],
    [ '{"a": ',   ' "q',     [ '{@0', '', 'k3@0:!2@6:T:O_BV:{' ] ],
    [ '{"a": "q', '',        [ '{@0', '', 'k3@1:!2@6:T:O_BV:{' ] ],
    [ '{"a": "q', ' ',       [ '{@0', '', 'k3@0:!3@5:T:O_BV:{' ] ],
    [ '{"a": "q', ' tr',     [ '{@0', '', 'k3@0:!5@5:T:O_BV:{' ] ],
  ], function (src1, src2) {
    return capture_next_src([src1, src2])
  })
})

test('align escaped strings', function (t) {
  t.table_assert([
    [ 'src1',     'src2',   'exp' ],
    // [ '["',       'a\\""',      [ '[@0', 's5@0', '!@5:A_AV:[' ] ],
    // [ '["a',      '\\""',      [ '[@0', 's5@0', '!@5:A_AV:[' ] ],
    [ '["a\\',     '""',      [ '[@0', 's5@0', '!@5:A_AV:[' ] ],
    // [ '["a\\"',     '"',      [ '[@0', 's5@0', '!@5:A_AV:[' ] ],
  ], function (src1, src2) {
    return capture_next_src([src1, src2])
  })
})

test('align array', function (t) {
  t.table_assert([
    [ 'src1',     'src2',   'exp' ],
    [ '["',       'a',      [ '[@0', '', '!2@0:T:A_BV:[' ] ],
    [ '[4',       '3',      [ '[@0', '', '!2@0:D:A_BV:[' ] ],
    [ '{"a":[ t', 'ru',     [ '{@0,k3@1:[@5', '', '!3@0:T:A_BV:{[' ] ],
    [ '{"a":[ t', 'rue',    [ '{@0,k3@1:[@5', 't@0', '!@4:A_AV:{[' ] ],
    [ '{"a":[ t', 'rue,',   [ '{@0,k3@1:[@5', 't@0', '!@1:A_BV:{[' ] ],
    [ '{"a":[ t', 'rue, 3', [ '{@0,k3@1:[@5', 't@0', '!1@2:D:A_BV:{[' ] ],
    [ '{"a":[ t', '',       [ '{@0,k3@1:[@5', '', '!1@7:T:A_BF:{[' ] ],
  ], function (src1, src2) {
    return capture_next_src([src1, src2])
  })
})

test('soff and vcount', function (t) {
  t.table_assert([
    [ 's1',          's2',              's3',       'exp' ],
    [ '1',          ',2',              ',3,',       { vcounts: [0, 1, 3], soffs: [0, 2, 4] } ],  // '1,' -> '2' -> ',3,'
    [ '1',          ',2',              ',3',        { vcounts: [0, 1, 2], soffs: [0, 2, 4] } ],  // '1,' -> '2' -> ',3,'
    [ '1',          '',                ',2',        { vcounts: [0, 0, 1], soffs: [0, 0, 2] } ],
    [ '[11,12,13,',  '',                '14]',      { vcounts: [3, 3, 5], soffs: [0, 0, 10] } ],
    [ '[11,12,13,',  ' ',               '14]',      { vcounts: [3, 3, 5], soffs: [0, 10, 11] } ], 
    [ '[1',          '1,12,13,',        '14]',      { vcounts: [0, 3, 5], soffs: [0, 4, 10] } ],  // '[' -> '11,' -> '12,13,' -> '14]'
    [ '[1',          '1,12,1',          '3,14]',    { vcounts: [0, 2, 5], soffs: [0, 4, 10] } ],  // '[' -> '11,' -> '12,13,' -> '14]'
    [ '[1',          '1,12,13,',       '14]',       { vcounts: [0, 3, 5], soffs: [0, 4, 10] } ],  // '[' -> '11,' -> '12,13,' -> '14]'
    [ '[1',          '1,12,13,1',       '4]',       { vcounts: [0, 3, 5], soffs: [0, 4, 10] } ],  // '[' -> '11,' -> '12,13,' -> '14]'
    [ '[1',          '1,12,13,14',      '],',       { vcounts: [0, 3, 5], soffs: [ 0, 4, 13 ] } ], // '[' -> '11,' -> '12,13,' -> '14]'

    [ '[ {"a": 7, ', '"b": [1,2,3] },', ' true ]',  { vcounts: [1, 6, 8], soffs: [0, 11, 26] } ],
  ], function (s1, s2, s3) {
    var sources = [s1, s2, s3]
    var ps = {}
    var ret = {vcounts: [], soffs: []}
    while (sources.length) {
      ps.next_src = utf8.buffer(sources.shift())
      align(ps)
      while (next(ps)) {
      }
      // console.log('ecode:', ps.ecode, 'voff:', ps.voff, 'vlim:', ps.vlim)
      next.checke(ps)
      ret.vcounts.push(ps.vcount)
      ret.soffs.push(ps.soff)
    }
    return ret
  })
})

test('new_buf', function (t) {
  t.table_assert([
    [ 's1',    's2',        'new_buf',    'exp' ],
    [ '"a,',    '", "b"',   null,         '[object Uint8Array]' ],
    [ '"a,',    '", "b"',   'Array',      '[object Array]' ],
    [ '"a,',    '", "b"',   'Buffer',     '[object Uint8Array]' ],    // Buffer is a Uint8Array
    [ '"a,',    '", "b"',   'Uint8Array', '[object Uint8Array]' ],
  ], function (s1, s2, new_buf) {
    var ps = { src: utf8.buffer(s1), next_src: utf8.buffer(s2) }
    next(ps)
    switch (new_buf) {
      case 'Array' : new_buf = function (l) { return new Array(l) }; break
      case 'Buffer' : new_buf = function (l) { return new Buffer(l) }; break
      case 'Uint8Array': new_buf = function (l) { return new Uint8Array(l) }; break
    }
    align(ps, {new_buf: new_buf})
    return Object.prototype.toString.call(ps.src)
  })
})

test('align errors', function (t) {
  t.table_assert([
    [ 'src1',    'src2',    'exp' ],
    [ '{"a": t', 'rux',     [ '{@0', '', 'k3@0:!4@5:B:O_BV:{' ] ],
  ], function (src1, src2) {
    return capture_next_src([src1, src2])
  })
})



