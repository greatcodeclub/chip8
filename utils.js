// Converts a number to its hexadecimal representation.
// With optional leading 0 padding.
// Eg.:
//
//   hex(255) => 'FF'
//   hex(255, 4) => '00FF'
//
function hex(num, pad) {
  num = num.toString(16).toUpperCase()
  if (pad) {
    var s = num+""
    while (s.length < pad) s = "0" + s
    return s
  }
  return num
}
