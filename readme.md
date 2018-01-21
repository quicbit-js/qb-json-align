# qb-json-align

#align()

qb-json-align works with qb-json-next to provide seamless parsing across JSON buffers split at any arbitrary 
point.


While qb-json-next handles splits between values and key-values, align() allows seamless
parsing across any split JSON.

    // parse normally as explained in qb-json-next    
    var next = require('qb-json-next')
    var align = require('qb-json-align')

    var ps = {}
    var src
    while (ps.next_src = get_next_buffer_somehow()) {
        align(ps)   // arrange ps.src and ps.next_src so that they do not split or separate keys or values
        while (next(ps)) {
            // use ps information to process tokens (see qb-json-next for details)
        }
    }

More specifically, align does the following:

   if ps ends with a partial state such as truncated key, truncated value, or key
   without value then align creates a new ps.src buffer and copies a single whole value or key/value to 
   this mini-buffer.  ps.next_src is sliced/reduced by the taken amount and ps offsets
   and position are *rewound* to point to the start of the value or key/value that was 
   truncated so that next(ps) will
   operate on the recovered value or key/value.  If the value cannot be completed with ps.next_src, then
   it will still be rewound to parse the new, longer, but still incomplete value when next(ps) is called.

#why have a separate module for qb-json-align?

Why did we put this functionality in a separate module from qb-json-next?  Mainly, it is separate because align()
is only one of many possible strategies for handling split buffers.  This particular approach isolates the handler
from the complexity of split handling and makes it easy for the client to create whole strings or buffers from key
and value offsets.  This approach makes the assumption the client doesn't need to handle very high 
proportions of splits or very large split values (huge strings).  For special cases where whole
values are not needed (where source is simply being validated, for example), another strategy could be
more effective.