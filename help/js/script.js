var sidebarMenu = 
		'<ul class="help-menu">\
			<center><div class="search mobile"><img src="../../img/search.png"><input type="text" placeholder="Search here..."></div></center>\
			<div class="clear"></div>\
			<a href="../introduction/index.html"><li>Introduction</li></a>\
			<a href="../getting-started/index.html"><li>Getting Started</li></a>\
			<ul class="help-menu hide">\
				<a href="../getting-started/about-qr-code.html"><li>About QR Code</li></a>\
				<a href="../getting-started/interface-overview.html"><li>Interface Overview</li></a>\
				<a href="../getting-started/create-save-load-project.html"><li>Create, Save, and Load Project</li></a>\
				<a href="../getting-started/drawing-and-decoding-qr-code.html"><li>Drawing and Decoding QR Code</li></a>\
			</ul>\
			<a href="../editor-painter/index.html"><li>Editor &amp; Painter</li></a>\
			<ul class="help-menu hide">\
				<a href="../editor-painter/painter-basic-usage.html"><li>Painter Basic Usage</li></a>\
				<a href="../editor-painter/format-info-pattern.html"><li>Format Info Pattern</li></a>\
				<a href="../editor-painter/undo-redo-using-history.html"><li>Undo/Redo using History</li></a>\
			</ul>\
			<a href="../extension-tools/index.html"><li>Extension Tools</li></a>\
			<ul class="help-menu hide">\
				<a href="../extension-tools/extract-qr-information.html"><li>Extract QR Information</li></a>\
				<a href="../extension-tools/reed-solomon-decoder.html"><li>Reed-Solomon Decoder</li></a>\
				<a href="../extension-tools/brute-force-format-info-pattern.html"><li>Brute-force Format Info Pattern</li></a>\
				<a href="../extension-tools/data-masking.html"><li>Data Masking</li></a>\
				<a href="../extension-tools/padding-bits-recovery.html"><li>Padding Bits Recovery</li></a>\
			</ul>\
			<a href="../examples/index.html"><li>Examples</li></a>\
			<ul class="help-menu hide">\
				<a href="../examples/basic-example.html"><li>Basic Example</li></a>\
				<a href="../examples/advanced-example.html"><li>Advanced Example</li></a>\
			</ul>\
			<a href="../misc/index.html"><li>Miscellaneous</li></a>\
			<ul class="help-menu hide">\
				<a href="../misc/qr-code-samples.html"><li>QR Code samples</li></a>\
				<a href="../misc/shortcut-keys.html"><li>Shortcut Keys</li></a>\
				<a href="../misc/license.html"><li>Third-Party &amp; License</li></a>\
			</ul>\
		</ul>';

function getParameterByName(name, url) {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

$(document).ready(function(){

	var url = window.location.pathname;
	var dirname = /help\/.+$/.exec(url)[0].substring(5);

	if(dirname != "index.html" && dirname != "search.html"){
		var dirname_reg = new RegExp(dirname,"g");
		sidebarMenu = sidebarMenu.replace(dirname_reg, dirname+"\" class=\"selected\"");
		$("#help-menu").html(sidebarMenu);
	}

	$(".help-menu a.selected").next().show();
	$(".help-menu .help-menu a.selected").parent().show();

	var mark = getParameterByName("mark");
	if(mark){
		$("h2, h4, p").mark(mark);
	}

	$(document).keydown(function(e){
		if($(".search input[type=text]").is(":focus")){
			var target = e.target;
			if(e.keyCode == 13){
				if(dirname != "index.html" && dirname != "search.html")
					window.location = "../search.html?q="+$(target).val();
				else
					window.location = "search.html?q="+$(target).val();
			}
		}
	
	})

	$(".menu-bar").click(function(){
		if($(".left-box").css("display") == "none"){
			$(".left-box").slideDown();
		} else {
			if(document.documentElement.scrollTop == 0)
				$(".left-box").slideUp();
		}
		$("html,body").animate({
			scrollTop: 0
		}, 400);
	})

	$(window).resize(function(){
		if(document.body.clientWidth > 900)
		{
			$(".left-box").show();	
		}
	})
})