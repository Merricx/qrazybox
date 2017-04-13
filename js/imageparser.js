function loadFromImage(canvasID){
	var canvas_qr = document.getElementById(canvasID);
	var context = canvas_qr.getContext('2d');
	qrcode.width = canvas_qr.width;
	qrcode.height = canvas_qr.height;
	qrcode.imagedata = context.getImageData(0, 0, qrcode.width, qrcode.height);
	
	var image = qrcode.grayScaleToBitmap(qrcode.grayscale());

	var detector = new Detector(image);
	var qRCodeMatrix = detector.detect();

	var qrArray = qRCodeMatrix.bits.bits;
	var size = qRCodeMatrix.bits.width;
	var result = [];

	for(var i=0; i < qrArray.length; i++){
		var bin = (qrArray[i] >>> 0).toString(2);
		while(bin.length < size){
			bin = "0"+bin;
		}
		result[i] = bin.split("").reverse();
	}

	for(var i=0; i < result.length; i++){
		for(var j=0; j < result[i].length; j++){
			result[i][j] = parseInt(result[i][j]);
		}
	}

	return result;
}