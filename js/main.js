

/*
****************************************
			GLOBAL VARIABLES
****************************************
*/

var APP_VERSION = '0.4.0';

var qr_version = 1;										//Current QR version (1-9)
var qr_pixel_size = 10;									//Current view size of QR code (pixel per module)
var qr_pixel_size_togglesave =	10;						//Last toggle view size	of QR code (pixel per module)

var qr_size = 17+(qr_version*4);						//Current size of QR code

var qr_array = [];										//Main array to store QR data
var qr_format_array = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];	//Store QR format information

var active_painter = "0";								//Current active painter tool (0,1,2)
var fill_painter = false;								//Is flood fill tool active?

var changed_state = false;								//Is document in changed state and not saved yet?

var show_grey = true;									//Show grey modules in Decode mode
var extract_info_mode = false;							//Is Extract QR Information active?
var brute_force_mode = false;							//Is Brute-force Format Info active?
var analysis_mode = false;								//Is Data Analysis tool active?
var	masking_mode =	false;								//Is Masking active?

var qr_temp_array = [];									//Temporary variable to handle qr_array duplicates
var qr_data_block = [];									//Array to store data block in "Data Analysis tool"

var is_data_module = [];								//Store data that separate between data module and fixed module (function pattern, alignment pattern, etc)

var history_array = [];									//Store history information and its qr_array data
var active_history = -1;								//Current active history

const maxSupportedSize = 177;    // max is 177 for v40
const maxVersion = 40;		// max is not 50

/***
*
*	generate QR table based on qr_array
*	
***/
function generateTable(version){
	qr_array = JSON.parse(JSON.stringify(generate_qr(version)));
	if (version > 9 && version <= 20){
		qr_pixel_size = 5;
	} else if (version > 20 && version <=35){
		qr_pixel_size = 2;
	} else if (version > 35 ){
		qr_pixel_size = 1;
	}
	
	changed_state = false;

	var element = "";
	var size = 17+(version*4);

	for(var i=0; i < qr_array.length; i++){
		element += "<tr>";
		for(var j=0; j < qr_array.length; j++){
			if(qr_array[i][j] == 0)
				element += "<td class='static' id='qr-"+i+"-"+j+"'></td>";
			else if(qr_array[i][j] == 1)
				element += "<td class='static black' id='qr-"+i+"-"+j+"'></td>";
			else
				element += "<td id='qr-"+i+"-"+j+"'></td>";
		}
		element += "</tr>";
	}
	$("#qr-table").html(element);

	getInformation(size);
	resize(qr_pixel_size);
	is_data_module = getDataModule(qr_array);
	updateToolbox();
	clearHistory();
	updateHistory("New QR code");
}

/***
*
*	get format information value
*	
***/
function getInformation(size){
	//Information top-left beside Finder
	for(var i=0; i < 9; i++){
		if(i == 6)
			continue;
		$("#qr-"+i+"-8").removeClass("static").addClass("info");
		qr_array[i][8] = 0;
	}

	//Information top-left below Finder
	for(var i=0; i < 9; i++){
		if(i == 6)
			continue;
		$("#qr-8-"+i).removeClass("static").addClass("info");
		qr_array[8][i] = 0;
	}

	//Information top-right below Finder
	for(var i=size-8; i < size; i++){
		$("#qr-8-"+i).removeClass("static").addClass("info");
		qr_array[8][i] = 0;
	}

	//Information bottom-left beside Finder and get Dark module
	for(var i=size-8; i < size; i++){
		if(i != size-8){
			$("#qr-"+i+"-8").removeClass("static").addClass("info");
			qr_array[i][8] = 0;
		}
	}
}

/***
*
*	generate QR table in format information overlay dialog
*	
***/
function generateInfoTable(position){

	position = position || "TOP_LEFT";

	$("#qr-format-info").html("");
	$("#select-format-info-pos").val(position);
	var pattern_array = function_pattern_with_format_info[position];

	if(position == "TOP_LEFT"){
		var start_index = 0;
		var end_index = 15;
	} else if(position == "TOP_RIGHT"){
		var start_index = 0;
		var end_index = 8;
	} else if(position == "BOTTOM_LEFT"){
		var start_index = 8;
		var end_index = 15;
	}

	for(var i=0; i < pattern_array.length; i++){
		var element = "<tr>";
		for(var j=0; j < pattern_array[i].length;j++){
			if(pattern_array[i][j] == 0){
				element += "<td class='static'></td>";
			} else if(pattern_array[i][j] == 1){
				element += "<td class='static black'></td>";
			} else {
				element += "<td id='qr-info-"+(pattern_array[i][j]-2)+"'></td>";
			}
		}
		element += "</tr>";
		$("#qr-format-info").append(element);
	}

	for(var i=start_index; i < end_index; i++){
		if(qr_format_array[i] == 1){
			$("td#qr-info-"+i).addClass("black");
		} else {
			$("td#qr-info-"+i).addClass("white");
		}
	}
	
}

/***
*
*	Save format information value to qr_format_array
*	
***/
function saveInfoTable(size){
	for(var i=0; i < 8; i++){
		if(i > 5)
			qr_array[i+1][8] = parseInt(qr_format_array[i]);
		else
			qr_array[i][8] = parseInt(qr_format_array[i]);
		qr_array[8][size-(i+1)] = parseInt(qr_format_array[i]);
	}
	var index = 0;
	for(var i=14; i >= 8; i--){
		if(index > 5)
			qr_array[8][index+1] = parseInt(qr_format_array[i]);
		else
			qr_array[8][index] = parseInt(qr_format_array[i]);
		qr_array[size-(index+1)][8] = parseInt(qr_format_array[i]);
		index++;
	}
	
	refreshTable();
	$("#format-information-box").hide();
	changed_state = true;
}

/***
*
*	Reload QR table based on qr_array value
*	
***/
function refreshTable(){
	for(var i=0; i < qr_array.length; i++){
		for(var j=0; j < qr_array[i].length; j++){
			if(!$("#qr-"+i+"-"+j).hasClass("static")){
				$("#qr-"+i+"-"+j).removeClass("black");
				$("#qr-"+i+"-"+j).removeClass("white");
				if(qr_array[i][j] == 1){
					$("#qr-"+i+"-"+j).addClass("black");
				} else if(qr_array[i][j] == 0) {
					$("#qr-"+i+"-"+j).addClass("white");
				}
			}
		}
	}
}

/***
*
*	Update qr_array from new array (exclude fixed pattern: function pattern, alignment pattern, timing, and version information)
*	
***/
function updateQRArray(new_data){
	for(var i=0; i < qr_array.length; i++){
		for(var j=0; j < qr_array[i].length; j++){
			if(is_data_module[i][j]){
				qr_array[i][j] = new_data[i][j];
			}
		}
	}

	//update format information when using image upload
	var size = qr_size;

	for(var i=0; i < 8; i++){
		if(i > 5)
			qr_array[i+1][8] = new_data[i+1][8];
		else
			qr_array[i][8] = new_data[i][8];
		qr_array[8][size-(i+1)] = new_data[8][size-(i+1)];
	}
	var index = 0;
	for(var i=14; i >= 8; i--){
		if(index > 5)
			qr_array[8][index+1] = new_data[8][index+1];
		else
			qr_array[8][index] = new_data[8][index];;
		qr_array[size-(index+1)][8] = new_data[size-(index+1)][8];;
		index++;
	}
}

/***
*
*	Get format information from format information overlay dialog
*	
***/
function getInfoBits(){
	var result = {ecc:"",mask:-1};
	$("#slider-mask div.active").removeClass("active");
	$("#slider-ecc div.active").removeClass("active");

	var bits = "";
	bits = qr_format_array.join("");
	bits = bits.split("").reverse().join("");
	var raw_bits = [bits.substring(0,2), bits.substring(2,5)];
	var bch_bits = bits.substring(5);
	
	if(format_information_bits_raw.ecc.indexOf(raw_bits[0]) > -1){
		if(format_information_bits_raw.ecc.indexOf(raw_bits[0]) == 0) result.ecc = "L";
		else if(format_information_bits_raw.ecc.indexOf(raw_bits[0]) == 1) result.ecc = "M";
		else if(format_information_bits_raw.ecc.indexOf(raw_bits[0]) == 2) result.ecc = "Q";
		else result.ecc = "H";
	}

	if(format_information_bits_raw.mask.indexOf(raw_bits[1]) > -1){
		result.mask = format_information_bits_raw.mask.indexOf(raw_bits[1]);
	}
	
	if(format_information_bits[0].indexOf(bits) > -1){
		result.ecc = "L";
		result.mask = format_information_bits[0].indexOf(bits);
	} else if(format_information_bits[1].indexOf(bits) > -1){
		result.ecc = "M";
		result.mask = format_information_bits[1].indexOf(bits);
	} else if(format_information_bits[2].indexOf(bits) > -1){
		result.ecc = "Q";
		result.mask = format_information_bits[2].indexOf(bits);
	} else if(format_information_bits[3].indexOf(bits) > -1){
		result.ecc = "H";
		result.mask = format_information_bits[3].indexOf(bits);
	}
	console.log(bits);

	return result;
}

/***
*
* Sanitize and verify qr is square before parsing it
*
***/
function sanitizeQrTxt(lines) {
	const linesOut = [];

	for(let i=0;i<lines.length;i++) {
		if(lines[i].length !== 0) {
			linesOut.push(lines[i]);
		}
		else if(i+1 !== lines.length) {
			throw "Unexpected empty line file."
		}
	}
	for(let i=0;i<linesOut.length;i++) {
		if(linesOut[i].length !== linesOut.length) {
			throw `QR line: ${i} width:${linesOut[i].length} does not match QR size: ${linesOut.length}`
		}
	}
	return linesOut;
}

/***
*
*	Load Waidotto QR text format 
*		 https://github.com/waidotto/strong-qr-decoder
***/
function loadTxt2Array(linesIn) {
	console.info(lines)
    
    var lines = sanitizeQrTxt(linesIn);
    
    let sz = lines.length;

	var data = [];

	for(let i=0;i<sz;i++) {
		data[i] = [];

		for (let j=0; j<sz ; j++ )	{
			switch ( lines[i][j] )
			{
				case 'X':
				case 'x':
				case 'O':
				case 'o':
				case '#':
				case '1':
					data[i].push(1);
					break;
				
				case '_':
				case ' ':
				case '0':
					data[i].push(0);
					break;
			
				case '?':
					data[i].push(-1) ; //grey
					break;

				default:
					throw `Error invalid text QR caracter: ${lines[i][j]}; from: ${i}x${j}`
			}
		}
    }

	return data;
	
}



/***
*
*	Create text format compatible with Strong Decoder based	on qr_array	values
*		from https://github.com/saitouena/qrazybox/commit/b64a0580be81e0d091c544abae3fff5e246dc09c
***/
function dumpQRArray() {
    let sz = qr_array.length;
	dump_qr = "";
    for(let i=0;i<sz;i++) {
		let line = qr_array[i].map(x => ( x===1 ? '#' : ( x===0 ? '_' : ( show_grey ?  '?' : '_' ) ) ) ).join('');
		console.log(line);
		dump_qr += line + "\n"
    }
	
	return dump_qr;

}

/***
*
*	generate QR code made from canvas based on qr_array values
*	
***/
function generateResult(){

	var	c =	document.getElementById("qr-result-canvas");
	var	size = 17+(qr_version*4);
	var	ctx	= c.getContext("2d");

	c.width	= qr_pixel_size*size;
	c.height = qr_pixel_size*size;
	
	// add quiet zone border and white fill
	c.width	+= (qr_pixel_size*4) * 2;
	c.height +=	(qr_pixel_size*4) *	2;
	ctx.fillStyle =	"#fff";
	ctx.fillRect(0,0,c.width,c.height);

	ctx.fillStyle =	"#000";
	
	for(var	i=0; i < qr_array.length; i++){
		for(var	j=0; j < qr_array[i].length; j++){
			var	x =	qr_pixel_size*j;
			var	y =	qr_pixel_size*i;
			
			//shift due to quiet zone 
			x += qr_pixel_size*4;
			y += qr_pixel_size*4;

			if(qr_array[i][j] == 1){
				ctx.fillStyle = "#000";
				ctx.fillRect(x,y,qr_pixel_size,qr_pixel_size);
			} else if(qr_array[i][j] == 0) {
				ctx.fillStyle = "#fff";
				ctx.fillRect(x,y,qr_pixel_size,qr_pixel_size);
			} else {
				if(show_grey){
					ctx.fillStyle = "#bdbdbd";
					ctx.fillRect(x,y,qr_pixel_size,qr_pixel_size);
				}
				else{
					ctx.fillStyle = "#fff";
					ctx.fillRect(x,y,qr_pixel_size,qr_pixel_size);
				}
			}
		}
	}

	$("#qr-result-dump").attr('rows', qr_version*4 +17 );
	$("#qr-result-dump").attr('cols', qr_version*4 +17 );
	$("#qr-result-dump").css( 'font-family', 'Courier New');
	$("#qr-result-dump").css("font-size",  "7px");
	$("#qr-result-dump").val( dumpQRArray() );

	$("#qr-result").show();
	$("#qr-table").hide();
	$("#qr-overlay").hide();
	$("body").css("background-color","#FFFFFF");
}

/***
*
*	Update toolbox values
*	
***/
function updateToolbox(){
	$("#qr-version").val(qr_size+"x"+qr_size+" (ver. "+qr_version+")");
	$("#qr-size").val(qr_pixel_size+"px");
}

/***
*
*	Resize QR size
*	
***/
function resize(size){
	$("td").each(function(){
		$(this).css({"min-width":size+"px","min-height":size+"px","width":size+"px","height":size+"px"});
	})
}

/***
*
*	Toggle between Editor and Decode mode
*	
***/
function toggleResult(){
	if(!$("#btn-switch-mode").hasClass("active")){
		$(".mode-indicator button").removeClass("active");
		$("#mobile-decode-mode").addClass("active");

		//resize for decode ( minimum 2px module width needed for standard device decoding )
		qr_pixel_size_togglesave = qr_pixel_size;
		if (qr_pixel_size == 1 ) 	{
			$("#btn-size-plus").trigger("click");
		}

		generateResult();
		$("#btn-switch-mode").addClass("active");
		$("#div-tool-work, #box-history").hide();
		$("#div-tool-result").show();
		$("#btn-switch-mode").text("Decode Mode");
		$("#box-tools-masking").hide();
		if(brute_force_mode)
			$("#h6-brute-force-msg").show();
		else
			$("#h6-brute-force-msg").hide();

		if(analysis_mode){
			$("#box-work").show();
			$("#box-tools-analysis").hide();
		}

	} else {
		$(".mode-indicator button").removeClass("active");
		$("#mobile-editor-mode").addClass("active");

		//restore to previous encode mode pixel size
		if (qr_pixel_size - qr_pixel_size_togglesave >= 0){
			for (i = qr_pixel_size - qr_pixel_size_togglesave  ; i > 0 ; i-- ){
				$("#btn-size-min").trigger("click");
			}
		}
		else {
			for (i = qr_pixel_size_togglesave - qr_pixel_size  ; i > 0 ; i-- ){
				$("#btn-size-plus").trigger("click");
			}
		}
		
		$("#qr-result").hide();
		$(".qr-tab").show();	
		$("#btn-switch-mode").removeClass("active");
		$("body").css("background-color","#eceff1");
		$("#div-tool-result").hide();
		$("#div-tool-work, #box-history").show();
		$("#btn-switch-mode").text("Editor Mode");

		if(analysis_mode){
			$("#box-work").hide();
			$("#box-tools-analysis").show();
		}
	}
}

/***
*
*	Load image from file and put to {target}
*	
***/
function loadImage(input, target){
	if(input.files && input.files[0]){
		var reader = new FileReader();

		reader.onload = function(e){
			$(target).attr("src",e.target.result);
		}
		reader.readAsDataURL(input.files[0]);
	}
}

/***
*
*	Save project to LocalStorage
*	
***/
function saveProject(projectName){

	if(projectName == ""){
		alert("Please, enter name of your Project!");
		return;
	}
	
	var saveData = [qr_array, qr_version, qr_format_array];
	var dataList = JSON.parse(localStorage.getItem("dataList"));
	var timeNow = new Date();
	var timeData = timeNow.toDateString();
	var projectNameList = [];
	if(dataList == undefined){
		dataList = [];
	}
	for(var i=0; i < dataList.length; i++){
		projectNameList[i] = dataList[i][0];
	}
	if(!projectNameList.includes(projectName)) {
		dataList.push([projectName, timeData]);
	} else {
		var index = projectNameList.indexOf(projectName);
		dataList[index][1] = timeData;
	}
	localStorage.setItem("saveData_"+projectName,JSON.stringify(saveData));
	localStorage.setItem("dataList",JSON.stringify(dataList));
	$("#div-save").hide();
	changed_state = false;
}

/***
*
*	Load project from LocalStorage
*	
***/
function loadProject(name){
	if(changed_state){
		if(!confirm("Are you sure want to proceed?\nYour unsaved progress will be lost!"))
			return;
	}
	var loadedData = JSON.parse(localStorage.getItem("saveData_"+name));
	qr_version = loadedData[1];
	qr_size = 17+(qr_version*4);
	generateTable(qr_version);
	qr_array = loadedData[0];
	qr_format_array = loadedData[2];
	brute_force_mode = false;
	$("#tools-brute-force, #tools-unmasking").removeClass("active");
	refreshTable();
	$("#qr-version").val(qr_size+"x"+qr_size+" (ver. "+qr_version+")");
	$("#div-load").hide();
	if($("#btn-switch-mode").hasClass("active")){
		toggleResult();
	}
	if($("#div-extract").css("display") != "none"){
		$("#btn-tools-extract").trigger("click");
	}
	if(analysis_mode){
		$("#tools-data-analysis").trigger("click");
	}
	$("#box-tools-masking").hide();
	$("#qr-overlay").html("");
	clearHistory();
	updateHistory("Load project");
}

/***
*
*	Remove project from LocalStorage
*	
***/
function removeProject(name, origin){
	if(confirm("Are you sure want to permanently delete this project?")){
		var dataList = JSON.parse(localStorage.getItem("dataList"));
		var projectNameList = [];

		for(var i=0; i < dataList.length; i++){
			projectNameList[i] = dataList[i][0];
		}

		var index = projectNameList.indexOf(name);
		if(index >= 0){
			dataList.remove(index);
			localStorage.removeItem("saveData_"+name);
			localStorage.setItem("dataList",JSON.stringify(dataList));
			refreshLoadList(origin);
		}
	}
}

/***
*
*	Refresh list of project in LocalStorage
*	
***/
function refreshLoadList(origin){
	var dataList = JSON.parse(localStorage.getItem("dataList"));
	if(dataList == undefined){
		$("#list-"+origin).html("<h5>There's no saved project in Local Storage.</h5>");
	} else {
		var element = "";
		for(var i=0; i < dataList.length; i++){
			element	+= "<div><h5>"+dataList[i][0]+"</h5><h6>"+dataList[i][1]+"</h6><span>&#10006;<span></div>";
		}
		$("#list-"+origin).html(element);
	}
}

/***
*
*	Decode Base64 to image
*	
***/
function decodeFromBase64(img, callback){
	qrcode.callback = callback;
	qrcode.decode(img, callback);
}

function importFromImage(src, cb){
	var img = new Image();
	img.crossOrigin = "Anonymous";
	console.log(src);
	img.onload = function(){
		var canvas_qr = document.createElement("canvas");
		var context = canvas_qr.getContext('2d');
		var nheight = img.height;
    	var nwidth = img.width;
    	if(img.width*img.height>qrcode.maxImgSize){
            var ir = img.width / img.height;
            nheight = Math.sqrt(qrcode.maxImgSize/ir);
        	nwidth=ir*nheight;
        }

        canvas_qr.width = nwidth;
        canvas_qr.height = nheight;
        context.drawImage(img, 0, 0, canvas_qr.width, canvas_qr.height );
		qrcode.width = canvas_qr.width;
    	qrcode.height = canvas_qr.height;

		try{
        	qrcode.imagedata = context.getImageData(0, 0, canvas_qr.width, canvas_qr.height);
        }catch(e){
			cb(e);
			return;
		}

		var image = qrcode.grayScaleToBitmap(qrcode.grayscale());

		var detector = new Detector(image);
		try {
			var qRCodeMatrix = detector.detect();
		} catch(error){
			console.log(error);
			cb(error);
			return;
		}

		var qrArray = qRCodeMatrix.bits.bits;
		var size = qRCodeMatrix.bits.width;
		if(size > maxSupportedSize){
			alert("QR version is unsupported");
			return;
		}
		qr_size = size;
		qr_version = (size-17)/4;
		updateToolbox();
		var result = [];

		for(var x=0; x < size; x++){
			result[x] = [];
			for(var y=0; y < size; y++){
				result[x][y] = qRCodeMatrix.bits.get_Renamed(y,x) ? 1 : 0;
			}
		}

		cb(result);
	}
	img.src = src;
}


/***
*
*	Flood fill algorithm to perform paint-like bucket tool
*
*	Reference : https://jsfiddle.net/eWxNE/2/
*	
***/
function floodFill(x, y, oldVal, newVal){
	
	x = parseInt(x);
	y = parseInt(y);

	if(oldVal == null){
		oldVal = parseInt(qr_array[x][y]);
	}

	if(qr_array[x][y] !== oldVal){
    	return;
    }

    if(is_data_module[x][y])
    	qr_array[x][y] = parseInt(newVal);
    else
    	return;

    if (x > 0){
        floodFill(x-1, y, oldVal, newVal);
    }
    if(y > 0){
        floodFill(x, y-1, oldVal, newVal);
    }
    if(x < qr_size-1){
        floodFill(x+1, y, oldVal, newVal);
    }
    if(y < qr_size-1){
        floodFill(x, y+1, oldVal, newVal);
    }
}

/***
*
*	Update history
*	
***/
function updateHistory(msg){

	if(active_history < 10) active_history++;

	history_array = history_array.slice(0, active_history);
	if(history_array.length == 10){
		history_array.shift();
	}
	history_array.push([msg, JSON.stringify(qr_array)]);

	var html = "";
	for(var i=history_array.length-1; i >= 0; i--){
		if(i == history_array.length-1){
			html += "<div class='active' id='history-"+i+"'><h6>"+history_array[i][0]+"</h6></div>";
		} else {
			html += "<div id='history-"+i+"'><h6>"+history_array[i][0]+"</h6></div>";
		}
	}
	$(".history").html(html);
}

/***
*
*	Get history value and refresh QR table
*	
***/
function getHistory(index){
	qr_array = JSON.parse(history_array[index][1]);
	if(qr_array.length != qr_size){
		qr_size = qr_array.length;
		qr_version = (qr_size-17)/4;
		updateToolbox();
	}
	refreshTable();
}

/***
*
*	Clear all history value
*	
***/
function clearHistory(){
	history_array = [];
	active_history = -1;
	$(".history").html("");
}

/***
*
*	Display information text result in Extract QR Information tool and
*	load it to #div-extract
*	
***/
function extractInfo(){

	var data_array = JSON.stringify(qr_array);
	var result = QRDecode(JSON.parse(data_array));
	var size = 17+(qr_version*4);
	console.log(result);

	var html = "<h5>QR version : <span>"+qr_version+" ("+size+"x"+size+")</span></h5>\
			<h5>Error correction level : <span>"+result.ecc+"</span></h5>\
			<h5>Mask pattern : <span>"+result.mask_pattern+"</span></h5>\
			<div class=\"space\"></div>\
			<h5>Number of missing bytes (erasures) : <span>"+result.erasure_count+" bytes ("+(result.erasure_count/result.data_module_count * 100).toFixed(2)+"%)</span></h5>\
			<div class=\"space\"></div>\
			<h5>Data blocks : </h5>\
			<h5><span>"+result.data_blocks+"</span></h5>\
			<div class=\"space\"></div>";
	if($("#btn-extract-show-rs").hasClass("active")){
		for(var i=0; i < result.rs_block.length; i++){
			html += "<h5>----------------Block "+(i+1)+"----------------</h5>\
				<h5>Reed-Solomon Block : <span>"+result.rs_block[i]+"</span></h5>";
			if(result.syndrome[i] != undefined && result.error_count[i] != undefined){
				console.log(result.syndrome[i], result.error_count);
				html +="<h5>Syndrome : <span>"+result.syndrome[i]+"</span></h5>\
					<h5>Number of Errors : <span>"+result.error_count[i]+"</span></h5>\
					<h5>Coefficient of the error location polynomial : <span>"+result.coeff_error[i]+"</span></h5>\
					<h5>Error Position : <span>"+result.error_position[i]+"</span></h5>\
					<h5>Error Magnitude : <span>"+result.error_magnitude[i]+"</span></h5>\
					<div class='space'></div>";
			} else {
				html += "<div class='space'></div>";
			}
		}
	}
	html += "<h5>Final data bits : </h5>\
			<h5><span>"+result.data_bits+"</span></h5>\
			<div class=\"space\"></div>";

	for(var i=0; i < result.data_bits_count; i++){
		html += "<h5><span>"+result.data_bits_block[i]+"</span></h5>\
			<h5>Mode Indicator : <span>"+result.mode[i]+"</span></h5>\
			<h5>Character Count Indicator : <span>"+result.count[i]+"</span></h5>\
			<h5>Decoded data : <span>"+result.decoded[i]+"</span></h5>\
			<div class=\"space\"></div>";
	}

	html += "<h5>Final Decoded string : <span>"+result.message+"</span></h5>";
	if($("#btn-extract-show-error").hasClass("active") && result.error.length > 0){
		html += "<div class='space'></div><h5>Error : </h5>";
		for(var i=0; i < result.error.length; i++){
			html += "<h5><span> - "+result.error[i]+"</span></h5>";
		}
	}
	$("#div-extract").html(html);
}

var brute_result = [];
var brute_result_index = [];
var current_brute_result = 0;

function callbackBruteForce(){
	console.log(brute_result);
	if(brute_result.length != 32)
		return;

	for(var i=0; i < brute_result.length; i++){
		if(brute_result[i] != "error decoding QR Code"){
			brute_result_index.push(i);
		}
	}

	var true_count = brute_result_index.length;
	current_brute_result = 0;

	if(true_count > 0){
		var ecc = Math.floor(brute_result_index[0] / 8);
		var mask = brute_result_index[0] % 8;

		qr_format_array = format_information_bits[ecc][mask].split("").reverse();

		if(ecc == 0)
			ecc = "L";
		else if(ecc == 1)
			ecc = "M";
		else if(ecc == 2)
			ecc = "Q";
		else if(ecc == 3)
			ecc = "H";

		$("#brute-force-msg-wait").hide();
		$("#brute-force-msg-fail").hide();
		$("#brute-force-content").show();
		$("#btn-brute-force-apply-pattern").show();
		$("#brute-force-decoded-data").val(brute_result[brute_result_index[current_brute_result]]);
		$("#brute-force-ecc span").text(ecc);
		$("#brute-force-mask span").text(mask);
		$("#brute-force-result-counter").text("1 of "+true_count+" result");
		saveInfoTable(qr_size);
		generateResult();
		$("#tools-brute-force").trigger("click");
	} else {
		$("#brute-force-msg-wait").hide();
		$("#brute-force-msg-fail").show();
		$("#btn-brute-force-apply-pattern").show();
		qr_format_array = [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1];
		saveInfoTable(qr_size);
		generateResult();
		updateHistory("Update format info pattern");
	}
}

function bruteForceFormatInfo(){
	brute_result = [];
	brute_result_index = [];

	var possible_ecc = ["L","M","Q","H"];
	var possible_mask = [0,1,2,3,4,5,6,7];

	for(var i=0; i < possible_ecc.length; i++){
		for(var j=0; j < possible_mask.length; j++){
			qr_format_array = format_information_bits[i][j].split("").reverse();
			saveInfoTable(qr_size);
			generateResult();
			var image = document.getElementById("qr-result-canvas").toDataURL();
			if(i == 3 && j == 7){
				decodeFromBase64(image, function(data){
					brute_result.push(data);
					callbackBruteForce();
				})
			} else {
				decodeFromBase64(image, function(data){
					brute_result.push(data);
				})
			}
		}
	}
}

/***
*
*	Mask qr_array with mask_pattern and refresh QR table
*	
***/
function maskDataBits(){
	var mask_pattern = getFormatInfo(qr_array).mask;
	qr_array = maskData(qr_array, mask_pattern);
	refreshTable();
	updateHistory("Data masking");
}

function showMaskPatternArea(){
	var qr_mask_array = [];
	for(var i=0; i < qr_array.length; i++){
		qr_mask_array[i] = [];
		for(var j=0; j < qr_array[i].length; j++){
			qr_mask_array[i][j] = 0;
		}
	}
	var mask_pattern = getFormatInfo(qr_array).mask;
	qr_mask_array = maskData(qr_mask_array, mask_pattern);

	$("#qr-overlay").html("");
	for(var i=0; i < qr_array.length; i++){
		var html = "<tr>";
		for(var j=0; j < qr_array[i].length; j++){
			if($("#qr-"+i+"-"+j).hasClass("info") || $("#qr-"+i+"-"+j).hasClass("static")){
				html += "<td class='invisible'></td>";
			} else {
				if(qr_mask_array[i][j] == 0)
					html += "<td class='invisible'></td>";
				else
					html += "<td></td>";
			}
		}
		html += "</tr>";
		$("#qr-overlay").append(html);
	}
	resize(qr_pixel_size);
}

function patchingRecovery(result){
	var	warning	= 0;

	$("#qr-dummy").html("");
	$("#div-patch-rec-warning, #div-patch-rec-error").hide();
	$("#div-patch-rec-data, #btn-patch-rec-apply").show()

	if(typeof result == "string"){
		$("#div-patch-rec-error").show();
		$("#div-patch-rec-error textarea").val(result);
		$("#div-patch-rec-warning, #div-patch-rec-data,	#btn-patch-rec-apply").hide();
		return;
	}

	for(var i=0; i < result.result_array.length; i++){
		var elem = "<tr>";
		for(var j=0; j < result.result_array[i].length; j++){
			if(qr_array[i][j] != result.result_array[i][j]){
				if(result.result_array[i][j] == 0)
					elem += "<td class='green white'></td>";
				else if(result.result_array[i][j] == 1)
					elem += "<td class='green black'></td>";
				else
					elem += "<td></td>";
			} else {
				if(result.result_array[i][j] == 0)
					elem += "<td class='white'></td>";
				else if(result.result_array[i][j] == 1)
					elem += "<td class='black'></td>";
				else
					elem += "<td></td>";
			}
		}
		elem += "</tr>";
		$("#qr-dummy").append(elem);
		resize(qr_pixel_size);

	}

	for(var i=0; i < result.after.length; i++){
		if(result.before.charAt(i) != "?"){
			if(result.after.charAt(i) != result.before.charAt(i)){
				warning++;
			}
		}
	}

	if(warning){
		$("#div-patch-rec-warning").show();
		$("#div-patch-rec-warning textarea").val("There's are " + warning +" modules conflict with the already known module of original QR code. Correction may fail.")
	}

	$("#patch-rec-before").val(result.before);
	$("#patch-rec-after").val(result.after);

	qr_temp_array = Array.prototype.slice.call(result.result_array);
}


/***
*
*	Perform Reed-Solomon decode
*	
***/
function reedSolomonDecode(data, nysm){

	var result = [];
	//console.log('nysm: '+nysm, 'data: '+data);

	for(var i=0; i < data.length; i++){
		var err_pos = [];
		for(var j=0; j < data[i].length; j++){
			if(data[i][j] == 0)
				err_pos.push(j);
		}
		var decoded = RS.decode(data[i], nysm, err_pos);

		if(typeof decoded == "string"){
			$("#rs-decoder-error").text("ERROR: "+decoded).removeClass("invisible");
			$("#rs-decoder-output, #rs-decoder-final-msg").val("");
			return;
		}
		
		result = result.concat(decoded);
	}
	
	$("#rs-decoder-output").val(result.join(","));

	var data_bits = "";
	for(var i=0; i < result.length; i++){
		var pad = "00000000";
		var text = parseInt(result[i]).toString(2);
    	var remain = (pad+text).length - 8;
		text = (pad + text).slice(remain);
    	data_bits += text;
	}
	
	var readed_data = readDataBits(data_bits);
	if(readed_data != '')
		$("#rs-decoder-final-msg").val(readed_data);
	else {
		$("#rs-decoder-error").text("ERROR: Data can't be readed").removeClass("invisible");
		$("#rs-decoder-final-msg").val("");
	}

}

function showQRTableOverlay(){
	$("#qr-overlay").html("");
	for(var i=0; i < qr_array.length; i++){
		var html = "<tr>";
		for(var j=0; j < qr_array[i].length; j++){
			if($("#qr-"+i+"-"+j).hasClass("info") || $("#qr-"+i+"-"+j).hasClass("static")){
				html += "<td class='invisible'></td>";
			} else {
				html += "<td index='"+i+"-"+j+"' style='opacity:0;'></td>";
			}
		}
		html += "</tr>";
		$("#qr-overlay").append(html);
	}
	resize(qr_pixel_size);
}

function activateAnalysisMode(status){

	status = status || "true";

	if(status === "true"){

		$("#qr-table tr td").css({"pointer-events":"none","border-color":"transparent"});
		$("#qr-table tr td.static, #qr-table tr td.info").css("opacity","0.2");

		generateDataBlocks();


	} else if(status === "false") {

		$("#qr-table tr td").css({"opacity":"1","pointer-events":"auto","border-color":"#434A54"});
		$("#qr-table tr td.static, #qr-table tr td.info").css("opacity","1");

		$("#qr-overlay").html("");

	}
}

var module_order = [];

function pushBlock(type,value,decoded){

	var modules = [];

	for(var k=0; k < value.length; k++){
		modules.push(module_order.shift());
	}

	var obj = {value:value,type:type,decoded:decoded,modules:modules};

	qr_data_block.push(obj);
}

function generateDataBlocks(){

	qr_data_block = [];

	var format_info = getFormatInfo(qr_array);
	var mask_pattern = format_info.mask;
	var ecc_level = format_info.ecc;

	if(RS_block_num_table[qr_version-1][ecc_level] > 1){
		alert('Interleaved blocks is not supported yet!');
		return;
	}

	var unmasked_data_array = maskData(qr_array, mask_pattern);

	var decoded_data = readDataBlock(qr_array);
	var data_block = decoded_data.blocks;
	module_order = decoded_data.module_order;

	while(data_block.length != 1){

		if(data_block.substring(0,4) == "0001"){
			var enc_mode = "Numeric mode";
		} else if(data_block.substring(0,4) == "0010"){
			var enc_mode = "Alphanumeric mode";
		} else if(data_block.substring(0,4) == "0100"){
			var enc_mode = "Binary mode";
		} else if(data_block.substring(0,4) == "0000") {
			var enc_mode = "Terminator";
		} else {
			break;
		}
				
		pushBlock(
			"Mode indicator",
			data_block.substring(0,4),
			enc_mode
		);
		data_block = data_block.substring(4);

		if(enc_mode == "Numeric mode"){

			var data_length = parseInt(data_block.substring(0,10), 2);
			pushBlock(
				"Char. count indicator",
				data_block.substring(0,10),
				data_length
			);
			data_block = data_block.substring(10);
						
			for(var k=0; k < Math.floor((data_length + 2) / 3); k++){

				var temp_value = "";
				var temp_decoded = "";

				if(k == Math.floor((data_length + 2) / 3) - 1){
					if(data_length % 3 == 0){
						temp_value = data_block.substring(0,10);
    					temp_decoded = parseInt(data_block.substring(0,10), 2).toString().padStart(3, "0");
            			data_block = data_block.substring(10);
    				} else if(data_length % 3 == 1){
    					temp_value = data_block.substring(0,4);
	    				temp_decoded = parseInt(data_block.substring(0,4), 2).toString();
    	    			data_block = data_block.substring(4);
    				} else {
    					temp_value = data_block.substring(0,7);
    					temp_decoded = parseInt(data_block.substring(0,7), 2).toString().padStart(2, "0");
        				data_block = data_block.substring(7);
    				}
				} else {
					temp_value = data_block.substring(0,10);
					temp_decoded = parseInt(data_block.substring(0,10), 2).toString().padStart(3, "0");
					data_block = data_block.substring(10);
				}

				pushBlock(
					"Message data",
					temp_value,
					temp_decoded
				);
			}

		} else if(enc_mode == "Alphanumeric mode"){

			var data_length = parseInt(data_block.substring(0,9), 2);
			pushBlock(
				"Char. count indicator",
				data_block.substring(0,9),
				data_length
			);
			data_block = data_block.substring(9);

			for(var i=0; i < Math.floor((data_length + 1) / 2); i++){
				
    			if(i == Math.floor((data_length + 1) / 2) - 1){
    				if(data_length % 2 == 0){
    					var num = parseInt(data_block.substring(0,11), 2);
    					temp_value = data_block.substring(0,11);
    					temp_decoded = alphanumeric_table[Math.floor(num / 45)] + alphanumeric_table[num % 45];
    					data_block = data_block.substring(11);
    				} else {
    					var num = parseInt(data_block.substring(0,6), 2);
    					temp_value = data_block.substring(0,6);
    					temp_decoded = alphanumeric_table[num];
    					data_block = data_block.substring(6);
    				}
    			} else {
    				var num = parseInt(data_block.substring(0,11), 2);
    				temp_value = data_block.substring(0,11);
    				temp_decoded = alphanumeric_table[Math.floor(num / 45)] + alphanumeric_table[num % 45]
    				data_block = data_block.substring(11);
    			}

    			pushBlock(
					"Message data",
					temp_value,
					temp_decoded
				);
    		}

		} else if(enc_mode == "Binary mode"){

			var data_length = parseInt(data_block.substring(0,8), 2);
			pushBlock(
				"Char. count indicator",
				data_block.substring(0,8),
				data_length
			);
			data_block = data_block.substring(8);

			for(var i=0; i < data_length; i++){
				temp_value = data_block.substring(0,8);
    			temp_decoded = String.fromCharCode(parseInt(data_block.substring(0,8), 2));
    			data_block = data_block.substring(8);

    			pushBlock(
					"Message data",
					temp_value,
					temp_decoded
				);
    		}

    	} else if(enc_mode == "Terminator"){


		} else {
			break;
		}
	}

	//console.log(data_block);

	
	var error_correction_level = getFormatInfo(qr_array).ecc;
	var offset = data_block.length - error_correction_code_table[qr_version - 1][error_correction_level]*8;
		
	pushBlock(
		"Padding bits",
		data_block.substring(0,offset),
		""
	);
	data_block = data_block.substring(offset);

	while(data_block.length >= 8){
		pushBlock(
			"Error correction",
			data_block.substring(0,8),
			parseInt(data_block.substring(0,8), 2)
		);
		data_block = data_block.substring(8);
	}

	console.log(qr_data_block);

	showQRTableOverlay();

	//Generate QR Overlay
	for(var i=0; i < qr_data_block.length; i++){
		for(var j=0; j < qr_data_block[i].modules.length; j++){
			var module = qr_data_block[i].modules[j];
			$("#qr-overlay td[index="+module+"]").addClass("hoverable data-block-"+i);
		}
		for(var j=0; j < qr_data_block[i].modules.length; j++){
			var module = qr_data_block[i].modules[j].split('-');
			generateSeparator(module[0], module[1], "data-block-"+i);
		}
	}

}

//Generate separator border between blocks
function generateSeparator(i,j,cls){

	i = parseInt(i);
	j = parseInt(j);

	var up = $("#qr-overlay td[index="+(i-1)+"-"+j+"]");
	var down = $("#qr-overlay td[index="+(i+1)+"-"+j+"]");
	var left = $("#qr-overlay td[index="+i+"-"+(j-1)+"]");
	var right = $("#qr-overlay td[index="+i+"-"+(j+1)+"]");


	if(!left.hasClass(cls)){
		$("#qr-"+i+"-"+j).css("border-left","solid 1px #f44336");
	}
	if(!right.hasClass(cls)){
		$("#qr-"+i+"-"+j).css("border-right","solid 1px #f44336");
	}
	if(!up.hasClass(cls)){
		$("#qr-"+i+"-"+j).css("border-top","solid 1px #f44336");
	}
	if(!down.hasClass(cls)){
		$("#qr-"+i+"-"+j).css("border-bottom","solid 1px #f44336");
	}
}

function selectBlock(cls){

	var index = cls.substring(11);

	$("#data-analysis-value").val(qr_data_block[index].value);
	$("#data-analysis-type").val(qr_data_block[index].type);
	$("#data-analysis-decoded").val(qr_data_block[index].decoded);
}

function updateBlock(value, cls){

	var index = cls[cls.length-2].substring(11);

	if(value == qr_data_block[index].value){
		//return;
	}

	if(value.length != qr_data_block[index].value.length || !/^[01\?]+$/g.test(value)){
		alert('Invalid value!');
		$("#data-analysis-value").val(qr_data_block[index].value).focus();
		return;
	}

	qr_data_block[index].value = value;
	var mask_pattern = getFormatInfo(qr_array).mask;

	for(var i=0; i < qr_data_block[index].modules.length; i++){
		var cord = qr_data_block[index].modules[i].split('-');
		var new_val = value.substring(i,i+1);
		console.log(new_val, qr_array[cord[0]][cord[1]]);

		if(new_val == '?')
			new_val = -1;
		else
			new_val = parseInt(new_val);

		/*if(mask(mask_pattern, cord[0], cord[1])){
			if(new_val == 1)
				new_val = 0;
			else if(new_val == 0)
				new_val = 1;
		}*/

		qr_array[cord[0]][cord[1]] = new_val;
	}

	refreshTable();
	activateAnalysisMode();
	updateHistory("Modules edited");

	$("#data-analysis-value").val("");
	$("#data-analysis-type").val("");
	$("#data-analysis-decoded").val("");

}


/*******************************************************************
*
*					EVENT LISTENER USING JQUERY
*	
********************************************************************/
$(document).ready(function(){



	$("#home-new").click(function(){
		$("#home-box").hide();
		$("#div-new").show();
	})

	$("#home-load").click(function(){
		$("#home-box").hide();
		$("#div-load").show();
		var dataList = JSON.parse(localStorage.getItem("dataList"));
		if(dataList == undefined){
			$("#list-load").html("<h5>There's no saved project in Local Storage.</h5>");
		} else {
			var element = "";
			for(var i=0; i < dataList.length; i++){
				element	+= "<div><h5>"+dataList[i][0]+"</h5><h6>"+dataList[i][1]+"</h6><span>&#10006;<span></div>";
			}
			$("#list-load").html(element);
		}
	})

	$("#new-btn-new").click(function(){
		generateTable(qr_version);
		qr_format_array = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
		if($("#btn-switch-mode").hasClass("active")){
			toggleResult();
		}
		if($("#div-extract").css("display") != "none"){
			$("#btn-tools-extract").trigger("click");
		}
		brute_force_mode = false;
		extract_info_mode = false;
		if(analysis_mode){
			$("#tools-data-analysis").trigger("click");
		}
		$("#tools-brute-force, #tools-unmasking").removeClass("active");
		$("#qr-overlay").html("");
		$("#box-tools-masking").hide();
		$("#div-new").hide();
	})

	$("#new-btn-import-img").click(function(){
		$("#import-img").click();
		return false;
	})

	$("#import-img").change(function(){
		if(this.files && this.files[0]){
			var reader = new FileReader();

			reader.onload = function(e){
				$("#hidden-img").attr("src",e.target.result);
				importFromImage($("#hidden-img").attr("src"), function(data){
					if(Array.isArray(data)){
						$("#div-new").hide();
						generateTable(qr_version);
						updateQRArray(data);
						clearHistory();
						updateHistory("Load from image");
						refreshTable();
						changed_state = true;
					} else {
						alert(data);
					}
				})
			}
			reader.readAsDataURL(this.files[0]);
		}
	})

	$("#new-btn-import-txt").click(function(){
		$("#import-txt").click();
		return false;
	})

	$("#import-txt").change(function(){
		if(this.files && this.files[0]){
			var	reader = new FileReader();

			reader.onload = function (e) {
		        const file = e.target.result;
  
				const lines = file.split(/\r\n|\n/);
				$("#hidden-txt").val(lines.join('\n'));
				$("#div-new").hide();
				qr_size = lines[0].length;
				qr_version = (qr_size-17)/4;
				generateTable( qr_version );
				data = loadTxt2Array(lines);
				updateQRArray(data);
				clearHistory();
				updateHistory("Load	from image");
				refreshTable();
				changed_state =	true;

			};
			reader.readAsText(this.files[0]);
		}
	})

	$("#menu-new").click(function(){
		if(changed_state){
			if(!confirm("Are you sure want to proceed?\nYour unsaved progress will be lost!"))
				return;
		}
		$("#home-box").hide();
		$("#div-new").show();	
	})

	$("#menu-save").click(function(){
		$("#div-save").show();
		var dataList = JSON.parse(localStorage.getItem("dataList"));
		if(dataList == undefined){
			$("#div-save-ext").hide();
		} else {
			var element = "";
			for(var i=0; i < dataList.length; i++){
				element	+= "<div><h5>"+dataList[i][0]+"</h5><h6>"+dataList[i][1]+"</h6><span>&#10006;<span></div>";
			}
			$("#list-save").html(element);
			$("#div-save-ext").show();
		}
	})



	$("#menu-load").click(function(){
		$("#div-load").show();
		var dataList = JSON.parse(localStorage.getItem("dataList"));
		if(dataList == undefined){
			$("#list-load").html("<h5>There's no saved project in Local Storage.</h5>");
		} else {
			var element = "";
			for(var i=0; i < dataList.length; i++){
				element	+= "<div><h5>"+dataList[i][0]+"</h5><h6>"+dataList[i][1]+"</h6><span>&#10006;<span></div>";
			}
			$("#list-load").html(element);
		}
	})

	$("#menu-tools").click(function(){
		$("#div-tools").show();
	})

	$(document).on("click", "#list-load div", function(e){
		var projectName = $(this).find("h5").text();
		if(e.target.nodeName != "SPAN"){
			loadProject(projectName);
		} else {
			removeProject(projectName, "load");
		}
	})

	$(document).on("click", "#list-save div", function(e){
		var projectName = $(this).find("h5").text();
		if(e.target.nodeName != "SPAN"){
			saveProject(projectName);
		} else {
			removeProject(projectName, "save");
		}
	})

	$("#painter-box div").click(function(){
		$("#painter-box div.active").removeClass("active")
		$(this).addClass("active");
		active_painter = $(this).attr("index");
	})

	$("#painter-fill").click(function(){
		if(fill_painter){
			$(this).removeClass("active");
			fill_painter = false;
		} else {
			$(this).addClass("active");
			fill_painter = true;
		}
	})
		
	$("#btn-version-plus").click(function(){
		if(changed_state){
			if(confirm("Are you sure want to proceed?\nYour unsaved progress will be lost!")){
				if(qr_version != maxVersion){
					qr_version += 1;
					qr_size = 17+(qr_version*4);
					$("#qr-version").val(qr_size+"x"+qr_size+" (ver. "+qr_version+")");
					generateTable(qr_version);
				}
			}
		} else {
			if(qr_version != maxVersion){
				qr_version += 1;
				qr_size = 17+(qr_version*4);
				$("#qr-version").val(qr_size+"x"+qr_size+" (ver. "+qr_version+")");
				generateTable(qr_version);
			}
		}
	})
	$("#btn-version-min").click(function(){
		if(changed_state){
			if(confirm("Are you sure want to proceed?\nYour unsaved progress will be lost!")){
				if(qr_version != 1){
					qr_version -= 1;
					qr_size = 17+(qr_version*4);
					$("#qr-version").val(qr_size+"x"+qr_size+" (ver. "+qr_version+")");
					generateTable(qr_version);
				}
			}
		} else {
			if(qr_version != 1){
				qr_version -= 1;
				qr_size = 17+(qr_version*4);
				$("#qr-version").val(qr_size+"x"+qr_size+" (ver. "+qr_version+")");
				generateTable(qr_version);
			}
		}
	})

	$("#btn-size-plus").click(function(){
		if(qr_pixel_size != 50 && qr_pixel_size >= 10){
			qr_pixel_size += 5;
		} else if(qr_pixel_size < 10){
			qr_pixel_size += 1;
		}
		$("#qr-size").val(qr_pixel_size+"px");
		resize(qr_pixel_size);
		if($("#btn-switch-mode").hasClass("active")){
			generateResult();
		}
	})
	$("#btn-size-min").click(function(){
		if(qr_pixel_size > 10){
			qr_pixel_size -= 5;
		} else if(qr_pixel_size != 1){
			qr_pixel_size -= 1;
		}
		$("#qr-size").val(qr_pixel_size+"px");
		resize(qr_pixel_size);
		if($("#btn-switch-mode").hasClass("active")){
			generateResult();
		}
	})

	$("#btn-show-grey-pixel").click(function(){
		if($(this).hasClass("active")){
			$(this).removeClass("active");
			show_grey = false;
		} else {
			$(this).addClass("active");
			show_grey = true;
		}
		generateResult();
	})

	$("#btn-qr-decode").click(function(){
		if(brute_force_mode){
			$("#btn-brute-force-apply-pattern").hide();
			$("#brute-force-msg-wait").show();
			$("#brute-force-msg-fail").hide();
			$("#brute-force-content").hide();
			$("#div-brute-force-loader").show();
			bruteForceFormatInfo();
		} else {
			var image = document.getElementById("qr-result-canvas").toDataURL();
			$("#decode-message").val("");
			$("#div-decode").show();
			decodeFromBase64(image, function(decodedData){
				if(decodedData != "error decoding QR Code"){
					$("#decode-message").val(decodedData);
					//resize for text based on QR version
					$("#decode-message").css("height", (17+4*qr_version)*3+"px");
				}
			});
		}
	})

	$("#btn-switch-mode").click(function(){
		toggleResult();
	})

	/****************************
		Extract QR Information
	****************************/
	$("#tools-extract").click(function(){
		$("#div-tools").hide();
		if($(this).hasClass("active")){
			$("#btn-tools-extract").trigger("click");
			return;
		}
		$(".side-box").each(function(){
			$(this).hide();
		});
		$(".right-box").hide();
		$("#box-tools-extract").show();
		$("#qr-table").hide();
		$("#qr-result, #qr-overlay").hide();
		$("#div-extract").show();
		$(".footer .mode-indicator").hide();
		$("body").css("background-color","#fff");
		$(this).addClass("active");
		extractInfo();
		extract_info_mode = true;
	})

	$("#btn-extract-show-rs, #btn-extract-show-error").click(function(){
		if($(this).hasClass("active")){
			$(this).removeClass("active");
		} else {
			$(this).addClass("active");
		}
		extractInfo();
	})

	$("#btn-tools-extract").click(function(){
		$("#div-tools").hide();
		$("#tools-extract").removeClass("active");
		$(".side-box").show();
		$(".right-box").show();
		$("#box-tools-extract").hide();
		$("#qr-table").show();
		if(analysis_mode){
			$("#qr-overlay").show();
		}
		$("#btn-switch-mode").removeClass("active");
		$("#div-tool-result").hide();
		$("#div-tool-work").show();
		$("#btn-switch-mode").text("Editor Mode");
		$("#div-extract").hide();
		$(".footer .mode-indicator").show();
		$("body").css("background-color","#eceff1");

		if(analysis_mode) {
			$("#box-work").hide();
		} else {
			$("#box-tools-analysis").hide();
		}
		extract_info_mode = false;
	})

	/****************************
		Brute-force Format info
	****************************/
	$("#tools-brute-force").click(function(){
		if($(this).hasClass("active")){
			$(this).removeClass("active");
			//qr_format_array = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
			brute_force_mode = false;
			updateHistory("Update format info pattern");
		} else {
			$(this).addClass("active");
			brute_force_mode = true;
			qr_format_array = [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1];
		}
		saveInfoTable(qr_size);
	})

	$("#btn-brute-force-counter-prev").click(function(){
		if(current_brute_result > 0)
			current_brute_result -= 1;

		var ecc = Math.floor(brute_result_index[current_brute_result] / 8);
		var mask = brute_result_index[current_brute_result] % 8;

		qr_format_array = format_information_bits[ecc][mask].split("").reverse();

		if(ecc == 0)
			ecc = "L";
		else if(ecc == 1)
			ecc = "M";
		else if(ecc == 2)
			ecc = "Q"
		else if(ecc == 3)
			ecc = "H"

		$("#brute-force-decoded-data").val(brute_result[brute_result_index[current_brute_result]]);
		$("#brute-force-ecc span").text(ecc);
		$("#brute-force-mask span").text(mask);
		$("#brute-force-result-counter").text((current_brute_result+1)+" of "+brute_result_index.length+" result");
		saveInfoTable(qr_size);
		generateResult();
	})

	$("#btn-brute-force-counter-next").click(function(){
		if(current_brute_result < brute_result_index.length-1)
			current_brute_result += 1;

		var ecc = Math.floor(brute_result_index[current_brute_result] / 8);
		var mask = brute_result_index[current_brute_result] % 8;

		qr_format_array = format_information_bits[ecc][mask].split("").reverse();

		if(ecc == 0)
			ecc = "L";
		else if(ecc == 1)
			ecc = "M";
		else if(ecc == 2)
			ecc = "Q"
		else if(ecc == 3)
			ecc = "H"

		$("#brute-force-decoded-data").val(brute_result[brute_result_index[current_brute_result]]);
		$("#brute-force-ecc span").text(ecc);
		$("#brute-force-mask span").text(mask);
		$("#brute-force-result-counter").text((current_brute_result+1)+" of "+brute_result_index.length+" result");
		saveInfoTable(qr_size);
		generateResult();
	})

	/****************************
		Data Masking
	****************************/

	$("#tools-masking").click(function(){

		var current_mask = getFormatInfo(qr_array).mask;

		$("#data-masking-slider div.active").removeClass("active");
		$("#data-masking-slider div[data="+current_mask+"]").addClass("active");

		$("#div-data-masking").show();
		$("#div-tools").hide();
	})

	$("#data-masking-slider div").click(function(){
		$("#data-masking-slider div.active").removeClass("active");
		$(this).addClass("active");
	})

	$("#btn-data-masking-apply").click(function(){
		var mask = $("#data-masking-slider div.active").attr("data");

		var ecc = getFormatInfo(qr_array).ecc;
		if(ecc == 0)
			ecc = 1;
		else if(ecc == 1)
			ecc = 0;
		else if(ecc == 2)
			ecc = 3;
		else if(ecc == 3)
			ecc = 2;

		qr_format_array = format_information_bits[ecc][mask].split("").reverse();
		saveInfoTable(qr_size);

		maskDataBits();
		$("#div-data-masking").hide();

		//masking toogle visual
		if($("#tools-masking").hasClass("active")){
			masking_mode =	false;
			$("#tools-masking").removeClass("active");
		} else {
			masking_mode =	true;
			$("#tools-masking").addClass("active");
		}

	})

	$("#btn-mask-show-pattern-area").click(function(){
		if($(this).hasClass("active")){
			$(this).removeClass("active");
			$("#qr-overlay").html("");
		} else {
			$(this).addClass("active");
			showMaskPatternArea();
			$("#qr-overlay").show();
		}
	})

	/****************************
		Padding Bits Recovery
	****************************/

	$("#tools-pad-recovery").click(function(){
		patchingRecovery(recoverPaddingBits(JSON.parse(JSON.stringify(qr_array))));
		$("#div-patching-recovery-title").text("Padding Bits Recovery");
		$("#div-patching-recovery").show();

		$("#div-tools").hide();
	})

	$("#btn-patch-rec-apply").click(function(){
		qr_array = JSON.parse(JSON.stringify(qr_temp_array));
		refreshTable();
		updateHistory( $("#div-patching-recovery-title").text() );
		$("#div-patching-recovery").hide();
		changed_state = true;
	})

	$("#btn-patch-rec-cancel").click(function(){
		$("#div-patching-recovery").hide();
	})

	/****************************
		Reed-Solomon Decoder
	****************************/

	var current_rs_decoder_page = 1;

	$("#tools-rs-decoder").click(function(){
		current_rs_decoder_page = 1;
		$("#div-rs-decoder").show();
		$("#div-tools").hide();
		$("#btn-rs-decoder-prev, #btn-rs-decoder-apply").hide();
		$("#rs-decoder-page-1, #btn-rs-decoder-next").show();
		$("#rs-decoder-page-2").hide();

		var ecc = getFormatInfo(qr_array).ecc;
		var nblocks = RS_block_num_table[qr_version-1][ecc];
		var html = "";

		var data_array = JSON.stringify(qr_array);
		var rs_block = QRDecode(JSON.parse(data_array)).rs_block;

		for(var i=1; i <= nblocks; i++){
			html += "<h5>Encoded Reed-Solomon blocks ["+i+"] : </h5>\
					<input type='text' class='rs-decoder-input' id='rs-decoder-input-"+i+"' value='"+rs_block[i-1].replace(/[^0-9,]/g, "")+"'>\
					<div class='clear'></div>";
		}
		$("#rs-decoder-page-1 div").html(html);
	})

	$("#btn-rs-decoder-next").click(function(){
		$("#rs-decoder-page-1").hide();
		$("#rs-decoder-page-2").show();
		$("#rs-decoder-error").addClass("invisible");
		$("#btn-rs-decoder-prev, #btn-rs-decoder-apply").show();
		
		var rs_blocks = [];
		var ecc = getFormatInfo(qr_array).ecc;
		var nysm = error_correction_code_table[qr_version-1][ecc];
		$(this).hide();
		$(".rs-decoder-input").each(function(){
			rs_blocks.push($(this).val().replace(/[^0-9,]+/g, "").split(","));
		})
		
		reedSolomonDecode(rs_blocks, nysm);
		
	})

	$("#btn-rs-decoder-prev").click(function(){
		$("#btn-rs-decoder-prev, #btn-rs-decoder-apply").hide();
		$("#rs-decoder-page-1, #btn-rs-decoder-next").show();
		$("#rs-decoder-page-2").hide();
	})

	$("#btn-rs-decoder-apply").click(function(){

	})

	/****************************
		Data Sequence Analysis
	****************************/
	$("#tools-data-analysis").click(function(){

		if($(this).hasClass("active")){
			analysis_mode = false;

			$(this).removeClass("active");
			$("#box-work").show();
			$("#box-tools-analysis").hide();
			activateAnalysisMode("false");
		} else {
			analysis_mode = true;

			$("#data-analysis-value").val("");
			$("#data-analysis-type").val("");
			$("#data-analysis-decoded").val("");

			$(this).addClass("active");
			$("#box-work").hide();
			$("#box-tools-analysis").show();
			activateAnalysisMode();
		}

		$("#div-tools").hide();
	})

	$("#data-analysis-value").blur(function(){
		if( $("#qr-overlay td.active").length){
			updateBlock($(this).val(), $("#qr-overlay td.active").attr("class").split(" "));
		}
	}).on("keydown", function(e){
		if(e.keyCode == "13"){
			updateBlock($(this).val(), $("#qr-overlay td.active").attr("class").split(" "));
		}
	})



	/****************************
		Load Sample
	****************************/
	$("#sample-file").change(function(){
		loadImage(this, "#img-sample");
		$("#img-sample").show();
	})

	/****************************
		Painter stuff
	****************************/
	$(document).on("click","td.info", function(){
		$("#format-information-box").show();
		if(brute_force_mode){
			$("#format-info-content").hide();
			$("#btn-save-info").hide();
			$("#format-info-msg").show();
		} else {
			for(var i=0; i < 8; i++){
				if(i > 5)
					qr_format_array[i] = qr_array[i+1][8];
				else
					qr_format_array[i] = qr_array[i][8];
				qr_format_array[i] = qr_array[8][qr_size-(i+1)];
			}
			var index = 0;
			for(var i=14; i >= 8; i--){
				if(index > 5)
					qr_format_array[i] = qr_array[8][index+1];
				else
					qr_format_array[i] = qr_array[8][index];
				qr_format_array[i] = qr_array[qr_size-(index+1)][8];
				index++;
			}

			var id = $(this)[0].id;
			var i = /\d{1,2}/.exec(id)[0];
			var j = /\d{1,2}$/.exec(id)[0];

			if(i <= 8 && j <= 8) position = "TOP_LEFT";
			else if(j == 8 && i > 8) position = "BOTTOM_LEFT";
			else position = "TOP_RIGHT";

			$("#slider-ecc div.active").removeClass("active");
			$("#slider-mask div.active").removeClass("active");
			generateInfoTable(position);
			var desc = getInfoBits(position);
			if(desc.ecc != ""){
				$("#slider-ecc #ecc-"+desc.ecc.toLowerCase()).addClass("active");
			}
			if(desc.mask != -1){
				$("#slider-mask #mask-"+desc.mask).addClass("active");
			}
			$("#format-info-content").show();
			$("#btn-save-info").show();
			$("#format-info-msg").hide();
		}
	})

	$(document).on("mouseover", ".info", function(){
		$(".info:not(.black)").each(function(){
			$(this).css("opacity","0.8");
		})
	})

	$(document).on("mouseleave", ".info", function(){
		$(".info:not(.black)").each(function(){
			$(this).css("opacity","1");
		})
	})

	$(document).on("mouseover", ".hoverable:not(.active)", function(){
		var cls = $(this).attr("class").split(" ").pop();
		$("#qr-overlay td."+cls).each(function(){
			$(this).css("opacity","0.5");
		})

		if(!$("#qr-overlay td.active:not(."+cls+")").length){
			//selectBlock(cls);
		}
	})

	$(document).on("mouseleave", ".hoverable:not(.active)", function(){	
		var cls = $(this).attr("class").split(" ").pop();
		$("#qr-overlay td."+cls).each(function(){
			$(this).css("opacity","0");
		})
	})

	$(document).on("click", ".hoverable", function(){
		$("#qr-overlay td.active").css("opacity","0").removeClass("active");
		var cls = $(this).attr("class").split(" ").pop();
		$("#qr-overlay td."+cls).each(function(){
			$(this).css("opacity","0.75").addClass("active");
		})

		selectBlock(cls);
	})

	$(document).on("mousedown", "#qr-table td", function(){
		if(!$(this).hasClass("static") && !$(this).hasClass("info")){
			if(active_painter == "0"){
				if($(this).hasClass("black")){
					$(this).removeClass("black");
					var id = $(this)[0].id;
					var i = /\d{1,2}/.exec(id)[0];
					var j = /\d{1,2}$/.exec(id)[0];
					qr_array[i][j] = -1;
					changed_state = true;
					updateHistory("Painter");
				} else {
					if(!fill_painter){
						$(document).on("mousemove", startDragging);
						$(document).on("mouseup", stopDragging);
						$(this).removeClass("white");
						$(this).addClass("black");
						var id = $(this)[0].id;
						var i = /\d{1,2}/.exec(id)[0];
						var j = /\d{1,2}$/.exec(id)[0];
						qr_array[i][j] = 1;
					} else {
						var id = $(this)[0].id;
						var i = /\d{1,2}/.exec(id)[0];
						var j = /\d{1,2}$/.exec(id)[0];
						var original_color = qr_array[i][j];
						floodFill(i,j,original_color,1);
						refreshTable();
						updateHistory("Flood fill");
					}
					
					changed_state = true;
				}
			} else if(active_painter == "1"){
				if($(this).hasClass("white")){
					$(this).removeClass("white");
					var id = $(this)[0].id;
					var i = /\d{1,2}/.exec(id)[0];
					var j = /\d{1,2}$/.exec(id)[0];
					qr_array[i][j] = -1;
					changed_state = true;
					updateHistory("Painter");
				} else {
					if(!fill_painter){
						$(document).on("mousemove", startDragging);
						$(document).on("mouseup", stopDragging);
						$(this).removeClass("black");
						$(this).addClass("white");
						var id = $(this)[0].id;
						var i = /\d{1,2}/.exec(id)[0];
						var j = /\d{1,2}$/.exec(id)[0];
						qr_array[i][j] = 0;
					} else {
						var id = $(this)[0].id;
						var i = /\d{1,2}/.exec(id)[0];
						var j = /\d{1,2}$/.exec(id)[0];
						var original_color = qr_array[i][j];
						floodFill(i,j,original_color,0);
						refreshTable();
						updateHistory("Flood fill");
					}
					changed_state = true;
				}
			} else if(active_painter == "2"){
				if(!fill_painter){
					$(document).on("mousemove", startDragging);
					$(document).on("mouseup", stopDragging);
					$(this).removeClass("black");
					$(this).removeClass("white");
					var id = $(this)[0].id;
					var i = /\d{1,2}/.exec(id)[0];
					var j = /\d{1,2}$/.exec(id)[0];
					qr_array[i][j] = -1;
				} else {
					var id = $(this)[0].id;
					var i = /\d{1,2}/.exec(id)[0];
					var j = /\d{1,2}$/.exec(id)[0];
					var original_color = qr_array[i][j];
					floodFill(i,j,original_color,-1);
					refreshTable();
					updateHistory("Flood fill");
				}
				changed_state = true;
			}
		}
	})

	var startDragging = function(e){
		var x = e.clientX;
		var y = e.clientY;
		var elem = document.elementFromPoint(x, y);
		var id = elem.id;
		if(elem.tagName == "TD" && elem.className.search("static") == -1 && elem.className.search("info") == -1){
			var i = /\d{1,2}/.exec(id)[0];
			var j = /\d{1,2}$/.exec(id)[0];
			if(active_painter == "0"){
				elem.className = "black";
				qr_array[i][j] = 1;
			}
			else if(active_painter == "1"){
				elem.className = "white";
				qr_array[i][j] = 0;
			}
			else if(active_painter == "2"){
				elem.className = "";
				qr_array[i][j] = -1;
			}
		}
	}

	var stopDragging = function(){
		$(document).off("mousemove");
		$(document).off("mouseup");
		updateHistory("Painter");
	}

	$(document).on("click","#qr-format-info td", function(){
		if(!$(this).hasClass("static")){
			if($(this).hasClass("black")){
				$(this).removeClass("black");
				$(this).addClass("white");
				var id = $(this)[0].id;
				var i = /\d{1,2}/.exec(id)[0];
				qr_format_array[i] = 0;
			} else {
				$(this).removeClass("white");
				$(this).addClass("black");
				var id = $(this)[0].id;
				var i = /\d{1,2}/.exec(id)[0];
				qr_format_array[i] = 1;
			}
			
		}

		var desc = getInfoBits();
		if(desc.ecc != ""){
			$("#slider-ecc #ecc-"+desc.ecc.toLowerCase()).addClass("active");
		} else {
			$("#slider-ecc div.active").removeClass("active");
		}

		if(desc.mask != -1){
			$("#slider-mask #mask-"+desc.mask).addClass("active");
		} else {
			$("#slider-mask div.active").removeClass("active");
		}
	})

	$("#select-format-info-pos").change(function(){
		var position = $(this).val();
		generateInfoTable(position);
	})

	$("#slider-ecc div").click(function(){
		var position = $("#select-format-info-pos").val();
		$("#slider-ecc div.active").removeClass("active");
		$(this).addClass("active");
		var i = /\w$/.exec($(this)[0].id)[0];
		if(i == "l")
			i = 0;
		else if(i == "m")
			i = 1;
		else if(i == "q")
			i = 2;
		else if(i == "h")
			i = 3;
		
		if($("#slider-mask div.active").length){
			var j = /\d$/.exec($("#slider-mask div.active")[0].id)[0];
			qr_format_array = format_information_bits[i][j].split("").reverse();
		} else {
			qr_format_array = (format_information_bits_raw.ecc[i]+"0000000000000").split("").reverse();
		}

		generateInfoTable(position);
	})

	$("#slider-mask div").click(function(){
		var position = $("#select-format-info-pos").val();
		$("#slider-mask div.active").removeClass("active");
		$(this).addClass("active");
		var j = /\d$/.exec($(this)[0].id)[0];
		
		if($("#slider-ecc div.active").length){
			var i = /\w$/.exec($("#slider-ecc div.active")[0].id)[0];
			if(i == "l")
				i = 0;
			else if(i == "m")
				i = 1;
			else if(i == "q")
				i = 2;
			else if(i == "h")
				i = 3;
			qr_format_array = format_information_bits[i][j].split("").reverse();
		} else {

			qr_format_array = ("00"+format_information_bits_raw.mask[j]+"0000000000").split("").reverse();
		}
		generateInfoTable(position);
	})

	$("#btn-save-info").click(function(){
		var size = 17+(qr_version*4);
		saveInfoTable(size);
		updateHistory("Update format info pattern");
	})

	//Undo/Redo in History
	$(document).on("click",".history div", function(){
		var index = $(this)[0].id.substring(8);
		$(".history div.active").removeClass("active");
		$(this).addClass("active");
		getHistory(index);
		active_history = parseInt(index);
	})

	$(".menu-bar").click(function(){
		if(!$(this).hasClass("active")){
			$(".header div.right").show();
			$(this).addClass("active");
		} else {
			$(".header div.right").hide();
			$(this).removeClass("active");
		}
	})

	$(document).click(function(e){
		if(!$(e.target).closest(".menu-bar").length && $(".menu-bar").css("display") == "block"){
			$(".header div.right").hide();
			$(".menu-bar").removeClass("active");
		}
	})

	$(".float-nav.left").click(function(){
		if(!$(this).hasClass("active")){
			$(".left-box").show().animate({left:'0'},350);
			$(this).addClass("active");
		} else {
			$(".left-box").animate({left:'-280px'},350, function(){$(this).hide()});
			$(this).removeClass("active");
		}
	})

	$(".float-nav.right").click(function(){
		if(!$(this).hasClass("active")){
			$(".right-box").show().animate({right:'0'},350);
			$(this).addClass("active");
		} else {
			$(".right-box").animate({right:'-340px'},350, function(){$(this).hide()});
			$(this).removeClass("active");
		}
	})

	$("#txt-version").text('QRazyBox v'+APP_VERSION);

	$("#mobile-editor-mode, #mobile-decode-mode").click(function(){
		toggleResult();
	})

	$(window).resize(function(){
		if(document.body.clientWidth > 900){
			$("#header-menu").css({"display":""});
			$(".left-box").css({"left":"","display":""});
			if(!extract_info_mode){
				$(".right-box").css({"right":"","display":""});
			}
			$(".float-nav, .menu-bar").removeClass("active");
		}
	})

	$(document).keydown(function(e){
		if(!$("input[type=text], textarea").is(":focus") && !$("#tools-extract").hasClass("active")){

			//Shortcut key : Tab
			if(e.keyCode == 9){
				e.preventDefault();
				$("#btn-switch-mode").trigger("click");
			}

			//Shortcut key : -
			else if(e.keyCode == 173 || e.keyCode == 109 || e.keyCode == 189){
				e.preventDefault();
				$("#btn-size-min").trigger("click");
			}

			//Shortcut key : =
			else if(e.keyCode == 61 || e.keyCode == 187){
				e.preventDefault();
				$("#btn-size-plus").trigger("click");
			}

			//Shortcut key : Q
			else if(e.keyCode == 81){
				$("#painter-black").trigger("click");
			}

			//Shortcut key : W
			else if(e.keyCode == 87){
				$("#painter-white").trigger("click");
			}

			//Shortcut key : E
			else if(e.keyCode == 69){
				$("#painter-eraser").trigger("click");
			}

			//Shortcut key : G
			else if(e.keyCode == 71){
				$("#painter-fill").trigger("click");
			}

			//Shortcut key : Z
			else if(e.keyCode == 90){
				$(".history div.active").next().trigger("click");
			}

			//Shortcut key : X
			else if(e.keyCode == 88){
				$(".history div.active").prev().trigger("click");
			}

		}
	})

	//Prevent page from closing
	window.onbeforeunload = function(){
		if(changed_state)
			return "Do you really want to close? Your unsaved progress will be lost!";
	};

})
