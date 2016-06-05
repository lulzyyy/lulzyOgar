function PingPacket() {}

module.exports = PingPacket;

PingPacket.prototype.build = function() {
    var buf = new ArrayBuffer(1);
    var view = new DataView(buf);

    view.setUint8(0, 130, true);

    return buf;
};

