/*
    This file is part of "Latency-Free Cloud Gaming - Simple Tech Demo".
    
    This program is free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License Version 3 as published
    by the Free Software Foundation.
    
    You can use this program to provide a service closed-source, as long as
    this program and all derivatives of it are executed solely on servers of
    your own. Otherwise, all distributed executables have to be open-source.
    
    This version of the program is suitable for evaluation purposes only.
    
    Copyright (C) 2015 A. Lorey
*/

var utils = {
	forUpto: function(count,func) {
		for(var i = 0; i < count; ++i)
			func(i);
	},
	forEach: function(arr,func) {
		if(arr)
			utils.forUpto(arr.length,function(i) {
				func(arr[i],i);
			});
	},
	extend: function(obj1,arr) {
		var obj2 = JSON.parse(JSON.stringify(obj1));
		utils.forUpto(arr.length,function(i) {
			obj2[arr[i]] = null;
		});
		return obj2;
	},
	
	bytes2floats: function(bytes) {
		var floats = [];
		utils.forUpto(bytes.length,function(i) { // bytes
			floats[i] = bytes[i] / 255;
		});
		return floats;
	},
	
	normalizeRad: function(rad) {
		return (rad % (Math.PI*2) + (Math.PI*2)) % (Math.PI*2);
	},
	deg2rad: function(deg) {
		return utils.normalizeRad(deg * (Math.PI/180));
	},
	mix: function(val1,val2,weight) {
		return val1 * (1 - weight) + val2 * weight;
	},
	incMod: function(val,mod) {
		return (val + 1) % mod;
	},
	
	vectorAbsolute: function(vec,dim) {
		var dot = 0;
		utils.forUpto(dim || vec.length,function(i) { // coords
			dot += vec[i] * vec[i];
		});
		return Math.sqrt(dot);
	},
	vectorDifference: function(vec1,vec2) {
		var diff = [];
		utils.forUpto(vec1.length,function(i) { // coords
			diff[i] = vec1[i] - vec2[i];
		});
		return diff;
	},
	matrixProduct: function(mat1,mat2) { // 4x4 only
		utils.forUpto(4,function(i) { // result rows
			var row = [];
			utils.forUpto(4,function(j) { // result cols
				row[j] = 0;
				utils.forUpto(4,function(k) { // scalar product
					row[j] += mat1[i][k] * mat2[k][j];
				});
			});
			mat1[i] = row; // left: store result
		});
		return mat1;
	},
	linearMapping: function(mat,vecs) {
		utils.forUpto(vecs.length,function(i) { // result vecs
			var vec = [];
			utils.forUpto(mat.length,function(j) { // result components
				vec[j] = 0;
				utils.forUpto(vecs[i].length,function(k) { // scalar product
					vec[j] += mat[j][k] * vecs[i][k];
				});
			});
			vecs[i] = vec; // right: store result
		});
		return vecs;
	},
	flattenMatrix: function(mat) {
		var arr = [];
		utils.forUpto(4,function(i) { // matrix cols
			utils.forUpto(4,function(j) { // matrix rows
				arr.push(mat[j][i]); // transpose
			});
		});
		return arr;
	},
	
	currentTime: function() {
		return (performance || Date).now();
	},
};
