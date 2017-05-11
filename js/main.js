
var VERSION = '0.1.7';

var qr_version = 1;
var qr_pixel_size = 15;
var qr_size = 17+(qr_version*4);

var qr_array = [];
var qr_format_array = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

var active_painter = "0";
var fill_painter = false;
var toggle_painter = false;
var dragging_painter = false;

var changed_state = false;

var show_grey = true;
var brute_force_mode = false;
var masking_mode = false;
var unmask_status = false;

var qr_temp_array = [];

var is_data_module = [];

var history_array = [];
var active_history = -1;

function generateTable(version){

	qr_array = [];
	changed_state = false;

	var size = 17+(version*4);
	$("#qr-table").html("");


	for(var i=0; i < size; i++){
		var element = "<tr>";
		qr_array[i] = [];
		for(var j=0; j < size;j++){
			element += "<td id='qr-"+i+"-"+j+"'></td>";
			qr_array[i].push(-1);
		}
		element += "</tr>";
		$("#qr-table").append(element);
	}

	getFinder(size);
	getAlignment(size);
	getTiming(size);
	getInformation(size);
	resize(qr_pixel_size);
	is_data_module = getDataModule(qr_array);
	updateToolbox();
	clearHistory();
	updateHistory("New QR code");
}

function getFinder(size){

	//Finder top-left
	var blackFinder = [[0,1,2,3,4,5,6],[0,6],[0,2,3,4,6],[0,2,3,4,6],[0,2,3,4,6],[0,6],[0,1,2,3,4,5,6],[]];
	for(var i=0; i < 8; i++){
		for(var j=0; j < 8;j++){
			$("#qr-"+i+"-"+j).addClass("static");
			if(blackFinder[i].includes(j)){
				$("#qr-"+i+"-"+j).addClass("black");
				qr_array[i][j] = 1;
			} else {
				qr_array[i][j] = 0;
			}
		}
	}

	//Finder top-right
	blackFinder = [
		[size-1,size-2,size-3,size-4,size-5,size-6,size-7],
		[size-1,size-7],
		[size-1,size-3,size-4,size-5,size-7],
		[size-1,size-3,size-4,size-5,size-7],
		[size-1,size-3,size-4,size-5,size-7],
		[size-1,size-7],
		[size-1,size-2,size-3,size-4,size-5,size-6,size-7],
		[]
	];
	for(var i=0; i < 8; i++){
		for(var j=size-8; j < size;j++){
			$("#qr-"+i+"-"+j).addClass("static");
			if(blackFinder[i].includes(j)){
				$("#qr-"+i+"-"+j).addClass("black");
				qr_array[i][j] = 1;
			} else {
				qr_array[i][j] = 0;
			}
		}
	}

	//Finder bottom-left
	blackFinder = [[],[0,1,2,3,4,5,6],[0,6],[0,2,3,4,6],[0,2,3,4,6],[0,2,3,4,6],[0,6],[0,1,2,3,4,5,6]];
	var index = 0;
	for(var i=size-8; i < size; i++){
		for(var j=0; j < 8;j++){
			$("#qr-"+i+"-"+j).addClass("static");
			if(blackFinder[index].includes(j)){
				$("#qr-"+i+"-"+j).addClass("black");
				qr_array[i][j] = 1;
			} else {
				qr_array[i][j] = 0;
			}
		}
		index++;
	}
}

function getTiming(size){

	var status = 0;
	for(var i=8; i < size-8; i++){
		if(status == 0){
			$("#qr-6-"+i).addClass("static black");
			status = 1;
			qr_array[6][i] = 1;
		} else {
			$("#qr-6-"+i).addClass("static");
			status = 0;
			qr_array[6][i] = 0;
		}
	}

	status = 0;
	for(var i=8; i < size-8; i++){
		if(status == 0){
			$("#qr-"+i+"-6").addClass("static black");
			status = 1;
			qr_array[i][6] = 1;
		} else {
			$("#qr-"+i+"-6").addClass("static");
			status = 0;
			qr_array[i][6] = 0;
		}
	}
}

function getInformation(size){
	//Information top-left beside Finder
	for(var i=0; i < 9; i++){
		if(i == 6)
			continue;
		$("#qr-"+i+"-8").addClass("info");
		qr_array[i][8] = 0;
	}

	//Information top-left below Finder
	for(var i=0; i < 9; i++){
		if(i == 6)
			continue;
		$("#qr-8-"+i).addClass("info");
		qr_array[8][i] = 0;
	}

	//Information top-right below Finder
	for(var i=size-8; i < size; i++){
		$("#qr-8-"+i).addClass("info");
		qr_array[8][i] = 0;
	}

	//Information bottom-left beside Finder and get Dark module
	for(var i=size-8; i < size; i++){
		if(i != size-8){
			$("#qr-"+i+"-8").addClass("info");
			qr_array[i][8] = 0;
		}
		else {
			$("#qr-"+i+"-8").addClass("static black");
			qr_array[i][8] = 1;
		}
	}
}

function getAlignment(size){
	if(size < 25)
		return;

	var row = (6);
	var col = (size-7);

	var blackBox = [[0,1,2,3,4],[0,4],[0,2,4],[0,4],[0,1,2,3,4]];
	var row_index = 0;
	for(var i=col-2; i <= col+2; i++){
		var col_index = 0;
		for(var j=col-2; j <= col+2; j++){
			$("#qr-"+i+"-"+j).addClass("static");
			if(blackBox[row_index].includes(col_index)){
				$("#qr-"+i+"-"+j).addClass("black");
				qr_array[i][j] = 1;
			} else {
				qr_array[i][j] = 0;
			}
			col_index++;
		}
		row_index++;
	}
}

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

function generateResult(){

	var c = document.getElementById("qr-result");
	var size = 17+(qr_version*4);
	c.width = qr_pixel_size*size;
	c.height = qr_pixel_size*size;
	var ctx = c.getContext("2d");
	ctx.fillStyle = "#000";
	
	for(var i=0; i < qr_array.length; i++){
		for(var j=0; j < qr_array[i].length; j++){
			var x = qr_pixel_size*j;
			var y = qr_pixel_size*i;
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
	
	$("#qr-result").show();
	$("#qr-table").hide();
	$("#qr-mask-table").hide();
	$("body").css("background-color","#FFFFFF");
}

function updateToolbox(){
	$("#qr-version").val(qr_size+"x"+qr_size+" (ver. "+qr_version+")");
	$("#qr-size").val(qr_pixel_size+"px");
}

function resize(size){
	$("td").each(function(){
		$(this).css({"min-width":size+"px","min-height":size+"px","width":size+"px","height":size+"px"});
	})
}

function toggleResult(){
	if(!$("#btn-switch-mode").hasClass("active")){
		$(".mode-indicator button").removeClass("active");
		$("#mobile-decode-mode").addClass("active");

		if(unmask_status)
			maskDataBits();
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
	} else {
		$(".mode-indicator button").removeClass("active");
		$("#mobile-editor-mode").addClass("active");

		if(unmask_status){
			maskDataBits();
			refreshTable();
		}
		$("#qr-result").hide();
		$(".qr-tab").show();	
		$("#btn-switch-mode").removeClass("active");
		$("body").css("background-color","#eceff1");
		$("#div-tool-result").hide();
		$("#div-tool-work, #box-history").show();
		$("#btn-switch-mode").text("Editor Mode");
		if(masking_mode)
			$("#box-tools-masking").show();
	}
}

function loadImage(input, target){
	if(input.files && input.files[0]){
		var reader = new FileReader();

		reader.onload = function(e){
			$(target).attr("src",e.target.result);
		}
		reader.readAsDataURL(input.files[0]);
	}
}

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
	masking_mode = false;
	unmask_status = false;
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
	$("#box-tools-masking").hide();
	$("#qr-mask-table").html("");
	clearHistory();
	updateHistory("Load project");
}

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
		if(size > 41){
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

//Reference : https://jsfiddle.net/eWxNE/2/
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

function getHistory(index){
	qr_array = JSON.parse(history_array[index][1]);
	if(qr_array.length != qr_size){
		qr_size = qr_array.length;
		qr_version = (qr_size-17)/4;
		updateToolbox();
	}
	refreshTable();
}

function clearHistory(){
	history_array = [];
	active_history = -1;
	$(".history").html("");
}

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
			var image = document.getElementById("qr-result").toDataURL();
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

	$("#qr-mask-table").html("");
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
		$("#qr-mask-table").append(html);
	}
	resize(qr_pixel_size);
}

function recoverPadding(){
	var data_array = JSON.stringify(qr_array);
	var result =  recoverPaddingBits(JSON.parse(data_array));
	var warning = false;

	$("#qr-dummy").html("");
	$("#div-pad-rec-warning, #div-pad-rec-error").hide();
	$("#div-pad-rec-data, #btn-pad-rec-apply").show()

	if(typeof result == "string"){
		$("#div-pad-rec-error").show();
		$("#div-pad-rec-error textarea").val(result);
		$("#div-pad-rec-warning, #div-pad-rec-data, #btn-pad-rec-apply").hide();
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
	}

	for(var i=0; i < result.after.length; i++){
		if(result.before.charAt(i) != "?"){
			if(result.after.charAt(i) != result.before.charAt(i)){
				warning = true;
				break;
			}
		}
	}

	if(warning){
		$("#div-pad-rec-warning").show();
		$("#div-pad-rec-warning textarea").val("There's one or more modules conflict with the already known module of original QR code. Correction may fail.")
	}

	$("#pad-rec-before").val(result.before);
	$("#pad-rec-after").val(result.after);

	qr_temp_array = Array.prototype.slice.call(result.result_array);
}

function reedSolomonDecode(data, nysm){

	var result = [];

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
		masking_mode = false;
		unmask_status = false;
		$("#tools-brute-force, #tools-unmasking").removeClass("active");
		$("#qr-mask-table").html("");
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
						qr_array = Array.prototype.slice.call(data);
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
				if(qr_version != 6){
					qr_version += 1;
					qr_size = 17+(qr_version*4);
					$("#qr-version").val(qr_size+"x"+qr_size+" (ver. "+qr_version+")");
					generateTable(qr_version);
				}
			}
		} else {
			if(qr_version != 6){
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
		if(qr_pixel_size != 50){
			qr_pixel_size += 5;
		}
		$("#qr-size").val(qr_pixel_size+"px");
		resize(qr_pixel_size);
		if($("#btn-switch-mode").hasClass("active")){
			generateResult();
		}
	})
	$("#btn-size-min").click(function(){
		if(qr_pixel_size != 5){
			qr_pixel_size -= 5;
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
			var image = document.getElementById("qr-result").toDataURL();
			$("#decode-message").val("");
			$("#div-decode").show();
			decodeFromBase64(image, function(decodedData){
				if(decodedData != "error decoding QR Code"){
					$("#decode-message").val(decodedData);
				}
			});
		}
	})

	$("#btn-switch-mode").click(function(){
		toggleResult();
	})

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
		$("#qr-mask-table").html("");
		$("#qr-result").hide();
		$("#div-extract").show();
		$(".footer .mode-indicator").hide();
		$("body").css("background-color","#fff");
		$(this).addClass("active");
		if(unmask_status && !$("#btn-switch-mode").hasClass("active"))
			maskDataBits();
		extractInfo();
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
		if(!masking_mode){
			$("#box-tools-masking").hide();
		}
		if(unmask_status)
				maskDataBits();
		$("#box-tools-extract").hide();
		$("#qr-table").show();
		if($("#btn-mask-show-pattern-area").hasClass("active")){
			$("#qr-mask-table").show();
		}
		$("#btn-switch-mode").removeClass("active");
		$("#div-tool-result").hide();
		$("#div-tool-work").show();
		$("#btn-switch-mode").text("Editor Mode");
		$("#div-extract").hide();
		$(".footer .mode-indicator").show();
		$("body").css("background-color","#eceff1");
	})

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

	$("#tools-unmasking").click(function(){
		if($(this).hasClass("active")){
			$(this).removeClass("active");
			masking_mode = false;
			unmask_status = false;
			$("#box-tools-masking").hide();
			$("#qr-mask-table").html("");
		} else {
			$(this).addClass("active");
			masking_mode = true;
			unmask_status = false;
			//if($("#qr-result").css == "none" && $("#div-extract").css == "none")
				$("#box-tools-masking").show();
			$("#btn-tools-mask").removeClass("active");

			var mask_pattern = getFormatInfo(qr_array).mask;
			$("#mask-pattern").val("Pattern "+mask_pattern);
			$("#btn-mask-show-pattern-area").removeClass("active");
		}
	})

	$("#btn-mask-plus").click(function(){
		var current_mask = getFormatInfo(qr_array).mask;
		if(current_mask == 7)
			return;

		if(unmask_status)
			maskDataBits();

		var ecc = getFormatInfo(qr_array).ecc;
		if(ecc == 0)
			ecc = 1;
		else if(ecc == 1)
			ecc = 0;
		else if(ecc == 2)
			ecc = 3;
		else if(ecc == 3)
			ecc = 2;
		var next_mask = parseInt(current_mask) + 1;
		qr_format_array = format_information_bits[ecc][next_mask].split("").reverse();
		saveInfoTable(qr_size);
		$("#mask-pattern").val("Pattern "+next_mask);
		if($("#btn-mask-show-pattern-area").hasClass("active")){
			showMaskPatternArea();
		}
		if(unmask_status)
			maskDataBits();
		updateHistory("Data masking");
	})

	$("#btn-mask-min").click(function(){
		var current_mask = getFormatInfo(qr_array).mask;
		if(current_mask == 0)
			return;

		if(unmask_status)
			maskDataBits();

		var ecc = getFormatInfo(qr_array).ecc;
		if(ecc == 0)
			ecc = 1;
		else if(ecc == 1)
			ecc = 0;
		else if(ecc == 2)
			ecc = 3;
		else if(ecc == 3)
			ecc = 2;
		var prev_mask = parseInt(current_mask) - 1;
		qr_format_array = format_information_bits[ecc][prev_mask].split("").reverse();
		saveInfoTable(qr_size);
		$("#mask-pattern").val("Pattern "+prev_mask);
		if($("#btn-mask-show-pattern-area").hasClass("active")){
			showMaskPatternArea();
		}
		if(unmask_status)
			maskDataBits();
		updateHistory("Data masking");
	})

	$("#btn-mask-show-pattern-area").click(function(){
		if($(this).hasClass("active")){
			$(this).removeClass("active");
			$("#qr-mask-table").html("");
		} else {
			$(this).addClass("active");
			showMaskPatternArea();
			$("#qr-mask-table").show();
		}
	})

	$("#btn-tools-mask").click(function(){
		if($(this).hasClass("active")){
			$(this).removeClass("active");
			unmask_status = false;
		} else {
			$(this).addClass("active");
			unmask_status = true;
		}
		maskDataBits();
	})

	$("#tools-pad-recovery").click(function(){
		recoverPadding();
		$("#div-padding-recovery").show();
		$("#div-tools").hide();
	})

	$("#btn-pad-rec-apply").click(function(){
		qr_array = JSON.parse(JSON.stringify(qr_temp_array));
		refreshTable();
		updateHistory("Padding bits recovery");
		$("#div-padding-recovery").hide();
		changed_state = true;
	})

	$("#btn-pad-rec-cancel").click(function(){
		$("#div-padding-recovery").hide();
	})

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

	$("#sample-file").change(function(){
		loadImage(this, "#img-sample");
		$("#img-sample").show();
	})

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

	$(document).on("mouseover", "#qr-table td:not(.static):not(.info)", function(){
		
	})

	$(document).on("mouseleave", "#qr-table td:not(.static):not(.info)", function(){	
		
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
		if(unmask_status)
			maskDataBits();
		saveInfoTable(size);
		updateHistory("Update format info pattern");
		if(masking_mode){
			if(unmask_status)
				maskDataBits();
			if($("#btn-mask-show-pattern-area").hasClass("active")){
				showMaskPatternArea();
			}
			var mask_pattern = getFormatInfo(qr_array).mask;
			$("#mask-pattern").val("Pattern "+mask_pattern);
		}
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

	$("#txt-version").text('QRazyBox v'+VERSION);

	$("#mobile-editor-mode, #mobile-decode-mode").click(function(){
		toggleResult();
	})

	$(window).resize(function(){
		if(document.body.clientWidth > 900){
			$("#header-menu").css({"display":""});
			$(".left-box").css({"left":"","display":""});
			$(".right-box").css({"right":"","display":""});
			$(".float-nav, .menu-bar").removeClass("active");
		}
	})

	//Prevent page from closing
	window.onbeforeunload = function(){
		if(changed_state)
			return "Do you really want to close? Your unsaved progress will be lost!";
	};

})