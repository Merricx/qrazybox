/*****************************************************************************************
	------------------Javascript Reed-Solomon Universal Encoder/Decoder--------------------

	Written by : Merricx

	Heavily referenced from https://en.wikiversity.org/wiki/Reed%E2%80%93Solomon_codes_for_coders
	And ported partly from https://github.com/tomerfiliba/reedsolomon

******************************************************************************************/

var gf_exp = new Uint8Array(512);
var gf_log = new Uint8Array(256);

//Source: http://stackoverflow.com/questions/2044760/default-array-values
Array.prototype.repeat = function(def, len){
	while(len)
		this[--len]= def;
	return this;
};

/*
======================================================
					GALOIS FIELD
======================================================
*/


function init_tables(prim){
	prim = prim || 0x11d;

	gf_exp = new Uint8Array(512);
	gf_log = new Uint8Array(256);

	var x = 1;
	for(var i=0; i < 255;i++){
		gf_exp[i] = x;
		gf_log[x] = i;
		x = gf_mult_noLUT(x,2,prim);
	}

	for(var i=255; i < 512; i++){
		gf_exp[i] = gf_exp[i - 255];
	}

	return [gf_log, gf_exp];
}

function gf_add(x,y){
	return x ^ y;
}

function gf_sub(x,y){
	return x ^ y;
}

function gf_mult_noLUT(x,y,prim){
	prim = prim || 0;

	function cl_mult(x,y){
		var z = 0;
		var i = 0;
		while((y>>i) > 0){
			if(y & (1<<i)){
				z ^= x<<i;
			}
			i++;
		}

		return z;
	}

	function bit_length(n){
		var bits = 0;
		while(n>>bits){
			bits += 1;
		}
		return bits;
	}

	function cl_div(dividend,divisor){

		var dl1 = bit_length(dividend);
		var dl2 = bit_length(divisor);

		if(dl1 < dl2){
			return dividend;
		}

		for(var i=dl1-dl2; i > -1; i--){
			if(dividend & (1 << i+dl2-1)){
				dividend ^= divisor << i;
			}
		}

		return dividend;
	}

	var result = cl_mult(x,y);

	if(prim > 0){
		result = cl_div(result, prim);
	}

	return result;
}

function gf_mul(x,y){
	if(x == 0 || y == 0)
		return 0;

	return gf_exp[gf_log[x] + gf_log[y]];
}

function gf_div(x,y){
	if(y == 0){
		throw "Division by zero";
	}
	if(x == 0){
		return 0;
	}

	return gf_exp[(gf_log[x] + 255 - gf_log[y]) % 255];
}

function gf_pow(x, power){
	return gf_exp[(((gf_log[x] * power) % 255) + 255) % 255];
}

function gf_inverse(x){
	return gf_exp[255 - gf_log[x]];
}

/*
======================================================
				POLYNOMIAL OPERATION
======================================================
*/

function gf_poly_scale(p,x){
	var r = [];
	for(var i=0; i < p.length; i++){
		r[i] = gf_mul(p[i], x);
	}
	return r;
}

function gf_poly_add(p,q){
	var r = new Array(Math.max(p.length, q.length));
	for(var i=0; i < p.length; i++){
		r[i+r.length-p.length] = p[i];
	}
	for(var i=0; i < q.length; i++){
		r[i+r.length-q.length] ^= q[i];
	}

	return r;
}

function gf_poly_mul(p,q){
	var r = new Array(p.length+q.length-1);

	for(var j=0; j < q.length;j++){
		for(var i=0; i < p.length; i++){
			r[j+i] ^= gf_mul(p[i], q[j]);
		}
	}

	return r;
}

function gf_poly_div(dividend, divisor){

	var msg_out = Array.prototype.slice.call(dividend);

	for(var i=0; i < dividend.length - (divisor.length-1); i++){
		coef = msg_out[i];
		if(coef != 0){
			for(var j=1; j < divisor.length; j++){
				if(divisor[j] != 0){
					msg_out[i+j] ^= gf_mul(divisor[j], coef);
				}
			}
		}
	}

	var separator = divisor.length - 1;
	var result = [[],[]];
	for(var i=0; i < msg_out.length-separator; i++){
		result[0][i] = msg_out[i];
	}
	
	for(var i=msg_out.length-separator; i < msg_out.length; i++){
		result[1].push(msg_out[i]);
	}
	
	return result;
}

function gf_poly_eval(poly, x){
	var y = poly[0];
	for(var i=1; i < poly.length; i++){
		y = gf_mul(y,x) ^ poly[i];
	}

	return y;
}

/*
======================================================
				REED-SOLOMON ENCODING
======================================================
*/

function rs_generator_poly(nysm){
	var g = [1];
	for(var i=0; i < nysm; i++){
		g = gf_poly_mul(g, [1, gf_pow(2, i)])
	}

	return g;
}

function rs_encode_msg(msg_in, nysm){

	if(msg_in.length + nysm > 255)
		throw "Message is too long...";

	var gen = rs_generator_poly(nysm);
	var msg_out = [].repeat(0, (msg_in.length+gen.length)-1)
	for(var i=0; i < msg_in.length; i++){
		msg_out[i] = msg_in[i];
	}

	for(var i=0; i < msg_in.length; i++){
		var coef = msg_out[i];

		if(coef != 0){
			for(var j=1; j < gen.length; j++){
				msg_out[i+j] ^= gf_mul(gen[j], coef);
			}
		}
	}

	for(var i=0; i < msg_in.length; i++){
		msg_out[i] = msg_in[i];
	}

	return msg_out;
}

/*
======================================================
				REED-SOLOMON DECODING
======================================================
*/

function rs_calc_syndromes(msg, nysm){
	var synd = [].repeat(0, nysm);

	for(var i=0; i < nysm; i++){
		synd[i] = gf_poly_eval(msg, gf_pow(2,i));
	}

	return [0].concat(synd);
}

function rs_check(msg, nysm){
	var check = rs_calc_syndromes(msg, nysm);
	var no_error = true;
	for(var i=0; i < check.length; i++){
		if(check[i] !=  0){
			no_error = false;
			break;
		}
	}

	return no_error;
}

function rs_find_errata_locator(e_pos){
	var e_loc = [1];

	for(var i=0; i < e_pos.length; i++){
		e_loc = gf_poly_mul(e_loc, gf_poly_add([1], [gf_pow(2,e_pos[i]), 0]))
	}

	return e_loc;
}

function rs_find_error_evaluator(synd, err_loc, nysm){
	var x = [].repeat(0, nysm+1);
	var remainder = gf_poly_div(gf_poly_mul(synd, err_loc), ([1].concat(x)))[1];


	return remainder;
}

function rs_correct_errata(msg_in, synd, err_pos){
	var coef_pos = [];
	for(var i=0; i < err_pos.length; i++){
		coef_pos[i] = msg_in.length - 1 - err_pos[i];
	}
	
	var err_loc = rs_find_errata_locator(coef_pos);
	var err_eval = rs_find_error_evaluator(synd.reverse(), err_loc, err_loc.length-1);

	var X = [];
	for(var i=0; i < coef_pos.length; i++){
		var l = 255 - coef_pos[i];
		X.push(gf_pow(2, -l));
	}

	var E = [].repeat(0, msg_in.length);

	for(var i=0; i < X.length; i++){
		var Xi_inv = gf_inverse(X[i]);

		err_loc_prime_tmp = [];
		for(var j=0; j < X.length; j++){
			if(j != i){
				err_loc_prime_tmp.push(gf_sub(1, gf_mul(Xi_inv, X[j])));
			}
		}
		
		var err_loc_prime = 1;
		for(var j=0; j < err_loc_prime_tmp.length; j++){
			err_loc_prime = gf_mul(err_loc_prime, err_loc_prime_tmp[j]);
		}

		var y = gf_poly_eval(err_eval, Xi_inv);
		y = gf_mul(gf_pow(X[i], 1), y);

		var magnitude = gf_div(y, err_loc_prime);

		E[err_pos[i]] = magnitude;
	}

	msg_in = gf_poly_add(msg_in, E);

	return msg_in;
}

function rs_find_error_locator(synd, nysm, erase_loc, erase_count){

	erase_loc = erase_loc || undefined;
	erase_count = erase_count || 0;

	if(erase_loc != undefined){
		err_loc = Array.prototype.slice.call(erase_loc);
		old_loc = Array.prototype.slice.call(erase_loc);
	} else {
		err_loc = [1];
		old_loc = [1];
	}

	synd_shift = 0
	if(synd.length > nysm){
		synd_shift = synd.length - nysm;
	}

	for(var i=0; i < nysm-erase_count;i++){
		if(erase_loc != undefined){
			K = erase_count+i+synd_shift;
		} else {
			K = i+synd_shift;
		}

		delta = synd[K];
		
		for(var j=1;j < err_loc.length; j++){
			delta ^= gf_mul(err_loc[err_loc.length-(j+1)], synd[K-j]);
		}
		
		old_loc = old_loc.concat([0]);
		
		if(delta != 0){
			if(old_loc.length > err_loc.length){
				new_loc = gf_poly_scale(old_loc, delta);
				old_loc = gf_poly_scale(err_loc, gf_inverse(delta));
				err_loc = new_loc;
			}
			err_loc = gf_poly_add(err_loc, gf_poly_scale(old_loc, delta));
		}
	}

	while(err_loc.length != 0 && err_loc[0] == 0){
		err_loc.shift();
	}
	errs = err_loc.length - 1;
	if((errs - erase_count) * 2 + erase_count > nysm){
		throw new Error("Too many errors to correct");
	}

	return err_loc;

}

function rs_find_errors(err_loc, nmess){
	errs = err_loc.length - 1;
	err_pos = [];
	for(var i=0; i < nmess; i++){
		if(gf_poly_eval(err_loc, gf_pow(2, i)) == 0){
			err_pos.push(nmess - 1 - i);
		}
	}

	if(err_pos.length != errs){
		throw new Error("Could not locate error!");
	}

	return err_pos;
}

function rs_forney_syndromes(synd, pos, nmess){

	erase_pos_reversed = [];
	for(var i=0; i < pos.length; i++){
		erase_pos_reversed.push(nmess-1-pos[i]);
	}

	fsynd = Array.prototype.slice.call(synd);
	fsynd.shift();

	for(var i=0; i < pos.length; i++){
		x = gf_pow(2, erase_pos_reversed[i]);
		for(var j=0; j < fsynd.length-1; j++){
			fsynd[j] = gf_mul(fsynd[j], x) ^ fsynd[j+1];
		}
	}

	return fsynd;
}

function rs_correct_msg(msg_in, nysm, erase_pos){

	erase_pos = erase_pos || undefined;

	var msg_len = msg_in.length - nysm;

	if(msg_in.length > 255){
		return "Message is too long...";
	}

	msg_out = Array.prototype.slice.call(msg_in);

	if(erase_pos == undefined){
		erase_pos = [];
	} else {
		for(var i=0; i < erase_pos.length; i++){
			msg_out[erase_pos[i]] = 0;
		}
	}

	if(erase_pos.length > nysm)
		return "Too many erasures to correct";

	synd = rs_calc_syndromes(msg_out, nysm);

	if(rs_check(msg_out, nysm)){
		msg_in = msg_in.slice(0, msg_len);
		return msg_in;
	}

	fsynd = rs_forney_syndromes(synd, erase_pos, msg_out.length);
	try {
		err_loc = rs_find_error_locator(fsynd, nysm, undefined ,erase_pos.length);
	}
	catch (error){
		return error.message;
	}
	
	try {
		err_pos = rs_find_errors(err_loc.reverse(), msg_out.length);
	} catch (error) {
		return error.message;
	}
	

	msg_out = rs_correct_errata(msg_out, synd, erase_pos.concat(err_pos));
	synd = rs_calc_syndromes(msg_out, nysm);

	if(!rs_check(msg_out, nysm)){
		return "Could not correct message";
	}

	return msg_out.slice(0, msg_len);
}


/*
======================================================
					MAIN FUNCTION
======================================================
*/

//Generate pre-computed tables
init_tables();
var RS = {
	//Encoding
	encode: function(data, nysm){
		return rs_encode_msg(data, nysm);
	},

	//Decoding
	decode: function(data, nysm, erase_pos){
		return rs_correct_msg(data, nysm, erase_pos);
	}

}