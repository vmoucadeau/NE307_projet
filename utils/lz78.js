function gen_parity(bin) {
  let out = '';
  for(let i = 0; i < bin.length; i+=15) { // parity need to be on 2 bytes to support extended ascii
    let two_byte = bin.slice(i, i+15);
    let parity = 0;
    for(let j = 0; j < two_byte.length; j++) {
      parity ^= parseInt(two_byte[j]);
    }
    out += parity.toString() + two_byte;
  }
  return out;
}

function check_parity(bin) {
  let out = '';
  for(let i = 0; i < bin.length; i+=15) {
    let byte = bin.slice(i+1, i+15);
    let parity = 0;
    for(let j = 0; j < byte.length; j++) {
      parity ^= parseInt(byte[j]);
    }
    if(parity == parseInt(bin[i])) {
      out += byte;
    }
  }
  return out;

}

function to_bin(lz78) {
  // need to be UTF-8 compliant
  let bin = '';
  for (let i = 0; i < lz78.length; i++) {
    let index = lz78[i][0];
    let char = lz78[i][1];
    bin += index.toString(2).padStart(7, '0');
    bin += char.charCodeAt(0).toString(2).padStart(8, '0');
  }
  return gen_parity(bin);
}

function to_dic(bin) {
  let lz78 = [];

  for (let i = 0; i < bin.length; i += 16) {
    let index = parseInt(bin.slice(i+1, i + 8), 2);
    let char = String.fromCharCode(parseInt(bin.slice(i + 8, i + 16), 2));
    lz78.push([index, char]);
  }
  return lz78;
}

function encode(text) {
  const MAX_DICT_SIZE = 127;
  let dictionary = {};
  let encoded = [];
  let buffer = '';
  for (let i = 0; i < text.length; i++) {
    buffer += text[i];
    if (!dictionary[buffer]) {
      if (Object.keys(dictionary).length < MAX_DICT_SIZE) {
        dictionary[buffer] = Object.keys(dictionary).length + 1;
        let index = dictionary[buffer.slice(0, -1)] || 0;
        encoded.push([index, text[i]]);
      }
      else {
        let index = dictionary[buffer.slice(0, -1)] || 0;
        encoded.push([index, text[i]]);
      }
      buffer = '';
    }
  }
  if (buffer) {
    if(dictionary[buffer]) {
      let index = dictionary[buffer] || 0;
      encoded.push([index, '\0']);
    }
    else {
      encoded.push([0, buffer]);
    }
  }
  return encoded;
}

function decode(encoded) {
  let dictionary = {};
  let text = '';
  for (let i = 0; i < encoded.length; i++) {
    let index = encoded[i][0];
    let char = encoded[i][1];
    let buffer = dictionary[index] || '';
    text += buffer + char;
    dictionary[Object.keys(dictionary).length + 1] = buffer + char;
  }
  return text;
}

module.exports = {encode, decode, to_bin, to_dic, gen_parity}