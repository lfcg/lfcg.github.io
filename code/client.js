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

var client = {
	settings: {
		framerate: 30,        // client refresh rate per second
		bufferLength: 1000,   // buffer 1 second
		selectWeight: 1000 / utils.deg2rad(45), // 1000 pos = 45 deg rot
	},
	
	started: false,
	control: null, // pressed keys
	pointer: null, // mouse movement since last update
	capture: function(mouse) {
		if(!client.started)
			return;
		
		window.onkeydown = function(e) {
			switch(e.which) {
			case 65: client.control[0][0] = true; return false;
			case 68: client.control[0][1] = true; return false;
			case 83: client.control[1][0] = true; return false;
			case 87: client.control[1][1] = true; return false;
			case 37: client.control[2][0] = true; return false;
			case 39: client.control[2][1] = true; return false;
			case 38: client.control[3][0] = true; return false;
			case 40: client.control[3][1] = true; return false;
			}
		};
		window.onkeyup = function(e) {
			switch(e.which) {
			case 65: client.control[0][0] = false; break;
			case 68: client.control[0][1] = false; break;
			case 83: client.control[1][0] = false; break;
			case 87: client.control[1][1] = false; break;
			case 37: client.control[2][0] = false; break;
			case 39: client.control[2][1] = false; break;
			case 38: client.control[3][0] = false; break;
			case 40: client.control[3][1] = false; break;
			}
		};
		
		var canvas = document.getElementById("canvas_1");
		canvas.onmousemove = function(e) {};
		if(mouse) {
			try {
				canvas.requestPointerLock = canvas.requestPointerLock
							|| canvas.msRequestPointerLock
							|| canvas.mozRequestPointerLock
							|| canvas.webkitRequestPointerLock;
				canvas.requestPointerLock();
				canvas.onmousemove = function(e) {
					client.pointer[0] += e.movementX
								|| e.msMovementX
								|| e.mozMovementX
								|| e.webkitMovementX
								|| 0;
					client.pointer[1] += e.movementY
								|| e.msMovementY
								|| e.mozMovementY
								|| e.webkitMovementY
								|| 0;
				};
			} catch(e) {}
		}
	},
	fullscreen: function() {
		if(!client.started)
			return;
		
		try {
			var canvas = document.getElementById("canvas_1");
			canvas.requestFullscreen = canvas.requestFullscreen
						|| canvas.msRequestFullscreen
						|| canvas.mozRequestFullScreen
						|| canvas.webkitRequestFullscreen
						|| canvas.webkitRequestFullScreen;
			canvas.requestFullscreen();
		} catch(e) {}
	},
	
	frames: null, // received frames: list,length,selected,time (load pixel buffers after select)
	send_state: function(ctx) {
		var msg = JSON.parse(JSON.stringify({
			startCtr: ctx.startCtr,
			time: utils.currentTime(),
			viewRot: ctx.viewRotPred,
			viewPos: ctx.viewPosPred,
			cartRot: ctx.cartRotPred,
			cartPos: ctx.cartPosPred,
		}));
		setTimeout(function() {
			server.receive_state(msg);
		},server.settings.latency * [1,server.settings.slowmotion][render.slowmotionMode]);
	},
	receive_frame: null,
	register_receive_frame: function(ctx) {
		client.receive_frame = function(msg) {
			if(msg.startCtr != game.startCtr[0]
			|| msg.requiredSize[0] != render.requiredSize[0]
			|| msg.requiredSize[1] != render.requiredSize[1]
			|| msg.compensationMode != render.compensationMode) // discard previous contexts and invalid properties
				return;
			
			client.frames[0].push(msg);
			if(client.frames[0].length > client.frames[1])
				client.frames[0].splice(0,client.frames[0].length - client.frames[1]);
		};
	},
};
