function int8buffer(num) {
    return Buffer.from([num]);
}

function int16buffer(num) {
    return Buffer.from([num >> 8, num & 0xFF]);
}

function int32buffer(num) {
    return Buffer.from([num >> 24, num >> 16, num >> 8, num]);
}

module.exports = {int8buffer, int16buffer, int32buffer}