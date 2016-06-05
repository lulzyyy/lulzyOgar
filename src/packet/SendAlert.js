function SendAlert(message) 
{
	this.message = message;
}

module.exports = SendAlert;

SendAlert.prototype.build = function() {
    var buf = new ArrayBuffer(3+2*this.message.length);
    var view = new DataView(buf);

    view.setUint8(0, 111, true);
	var offset = 1;
	for (var j = 0; j < this.message.length; j++) {
        view.setUint16(offset, this.message.charCodeAt(j), true);
        offset += 2;
    }
    view.setUint16(offset, 0, true);
	offset += 2;
    return buf;
};

