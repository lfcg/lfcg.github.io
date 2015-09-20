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

var game = {
	startCtr: [0,0], // terminate previous contexts
	
	start: function(ctx) {
		ctx.game = {};
		ctx.startCtr = ++game.startCtr[ctx.process];
		
		// reset static properties, determine buffer sizes
		if(ctx.process == 0) {
			server.requestFrame = true;
			server.update = function() {};
			server.geometry = null;
			server.pixels = [[],0,0];
			server.pixels[1] = Math.ceil((client.settings.bufferLength + server.settings.latency * 2) / 1000 * server.settings.framerate + 2);
			// (buffer time + rtt latency) * server refresh rate per second + 2, round up
			server.receive_state = function() {};
			client.started = false;
			client.control = [[false,false],[false,false],[false,false],[false,false]];
			client.pointer = [0,0];
			client.frames = [[],0,null,0];
			client.frames[1] = Math.floor(client.settings.bufferLength / 1000 * server.settings.framerate);
			// buffer time * server refresh rate per second, round down
			client.receive_frame = function() {};
			geometry.panoramaGeometry = [];
			render.blendWidth = [1,1];
			render.renderSize = [1,1];
			render.framebufferSize = [1,1];
			render.depthmapSize = null;
			render.panoramaSize = [1,1];
			render.fieldOfView = [[utils.deg2rad(90),utils.deg2rad(90)],[utils.deg2rad(90),utils.deg2rad(90)]];
			render.compensationMode = 1;
			render.slowmotionMode = 0;
		}
		
		// register message handlers
		if(ctx.process == 0) {
			server.register_receive_state(ctx);
		}
		else {
			client.started = true;
			client.register_receive_frame(ctx);
		}
		
		// reset game state
		ctx.viewRot = [0,0];
		ctx.viewPos = [0,[0,server.data[1].settings.camDistance][ctx.demo],server.data[ctx.demo].settings.camHeight];
		ctx.cartRot = 0;
		ctx.cartPos = [0,0];
		var viewDir = [0,1];
		var cartVel = 0;
		var steerSign = 1;
		var nextFrame = 0;
		
		render.start(ctx);
		
		// update routine (in process context)
		ctx.game.update = function() {
			if(ctx.startCtr != game.startCtr[ctx.process]) // terminate previous contexts
				return;
			
			if(ctx.process == 1) {
				// configuration flags
				render.compensationMode = 0;
				if(document.getElementById("latency_1").checked)
					render.compensationMode = 1;
				else if(document.getElementById("latency_2").checked)
					render.compensationMode = 2;
				render.slowmotionMode = 0
				if(document.getElementById("slowmotion").checked)
					render.slowmotionMode = 1;
				
				// game state
				var viewRotPrev = JSON.parse(JSON.stringify(ctx.viewRot));
				var viewPosPrev = JSON.parse(JSON.stringify(ctx.viewPos));
				var cartRotPrev = JSON.parse(JSON.stringify(ctx.cartRot));
				var cartPosPrev = JSON.parse(JSON.stringify(ctx.cartPos));
				if(ctx.demo == 0) {
					// look
					utils.forUpto(2,function(i) { // axis
						utils.forUpto(2,function(j) { // sign
							if(client.control[i + 2][j])
								ctx.viewRot[i] += [-1,1][j] * server.data[0].settings.lookSpeed / client.settings.framerate;
						});
					});
					utils.forUpto(2,function(i) { // axis
						ctx.viewRot[i] += client.pointer[i] * server.data[0].settings.mouseSensitivity;
					});
					client.pointer = [0,0];
					ctx.viewRot[0] = utils.normalizeRad(ctx.viewRot[0]);
					ctx.viewRot[1] = Math.max(ctx.viewRot[1],-utils.deg2rad(90));
					ctx.viewRot[1] = Math.min(ctx.viewRot[1],utils.deg2rad(90));
					
					// move
					var move = utils.linearMapping(geometry.rotateZMatrix(-ctx.viewRot[0]),[
						[1,0],
						[0,1],
					]);
					utils.forUpto(2,function(i) { // axis
						utils.forUpto(2,function(j) { // sign
							utils.forUpto(2,function(k) { // coords
								if(client.control[i][j])
									ctx.viewPos[k] += [-1,1][j] * move[i][k] * server.data[0].settings.moveSpeed / client.settings.framerate;
							});
						});
					});
					geometry.collide(ctx,ctx.viewPos,false);
				}
				else {
					// steer
					if(client.control[3][0])
						steerSign = 1;
					else if(client.control[3][1] && cartVel < server.data[1].settings.reverseThreshold)
						steerSign = -1;
					if(!client.control[3][1] || cartVel > 0 || cartVel < server.data[1].settings.reverseThreshold) {
						utils.forUpto(2,function(i) { // sign
							if(client.control[2][i])
								ctx.cartRot += [-1,1][i] * steerSign * server.data[1].settings.steerSpeed / client.settings.framerate;
						});
					}
					ctx.cartRot = utils.normalizeRad(ctx.cartRot);
					var viewDir2 = utils.linearMapping(geometry.rotateZMatrix(-ctx.cartRot),[[0,1]])[0];
					
					// accelerate
					var accel = 0;
					if(client.control[3][1])
						accel = server.data[1].settings.brake;
					else if(client.control[3][0])
						accel = server.data[1].settings.accelerate;
					else if(cartVel > 0)
						accel = server.data[1].settings.slowdown;
					cartVel += accel / client.settings.framerate;
					if(client.control[3][0])
						cartVel = Math.max(cartVel,server.data[1].settings.startSpeed); // start speed
					cartVel = Math.min(cartVel,server.data[1].settings.maxSpeed); // max speed
					var cartVel2 = cartVel;
					if(client.control[3][1] && cartVel < server.data[1].settings.reverseThreshold)
						cartVel2 = server.data[1].settings.reverseSpeed; // reverse
					else
						cartVel2 = Math.max(cartVel,0); // stop
					var cartVel3 = JSON.parse(JSON.stringify(ctx.cartPos));
					utils.forUpto(2,function(i) { // coords
						if(Math.abs(viewDir[i] - viewDir2[i]) > server.data[1].settings.camTrackThreshold)
							viewDir[i] = utils.mix(viewDir[i],viewDir2[i],server.data[1].settings.camTrackCoeff); // camera tracking
						ctx.cartPos[i] += cartVel2 * viewDir[i] / client.settings.framerate; // move cart
					});
					if(geometry.collide(ctx,ctx.cartPos,false)) {
						utils.forUpto(2,function(i) { // coords
							cartVel3[i] -= ctx.cartPos[i];
						});
						cartVel = Math.min(cartVel,utils.vectorAbsolute(cartVel3) * client.settings.framerate); // slow down on collision
					}
					
					// camera
					ctx.viewRot[0] = utils.normalizeRad(Math.atan2(viewDir[0],viewDir[1]));
					utils.forUpto(2,function(i) { // coords
						ctx.viewPos[i] = ctx.cartPos[i] + server.data[1].settings.camDistance * viewDir[i];
					});
					geometry.collide(ctx,ctx.viewPos,true);
				}
				
				// predict state, then send
				if(render.compensationMode == 0) {
					ctx.viewRotPred = ctx.viewRot;
					ctx.viewPosPred = ctx.viewPos;
					ctx.cartRotPred = ctx.cartRot;
					ctx.cartPosPred = ctx.cartPos;
				}
				else {
					ctx.viewRotPred = game.predictState(viewRotPrev,ctx.viewRot,true);
					ctx.viewPosPred = game.predictState(viewPosPrev,ctx.viewPos);
					ctx.cartRotPred = game.predictState([cartRotPrev],[ctx.cartRot],true)[0];
					ctx.cartPosPred = game.predictState(cartPosPrev,ctx.cartPos);
					ctx.viewRotPred[0] = utils.normalizeRad(ctx.viewRotPred[0]);
					ctx.viewRotPred[1] = Math.max(ctx.viewRotPred[1],-utils.deg2rad(90));
					ctx.viewRotPred[1] = Math.min(ctx.viewRotPred[1],utils.deg2rad(90));
					geometry.collide(ctx,ctx.viewPosPred,true);
					ctx.cartRotPred = utils.normalizeRad(ctx.cartRotPred);
					geometry.collide(ctx,ctx.cartPosPred,true);
				}
				client.send_state(ctx);
				
				// frame selection
				if(render.compensationMode == 0) {
					if(client.frames[0].length > 0)
						client.frames[2] = client.frames[0][client.frames[0].length - 1];
				}
				else {
					var time = utils.currentTime() - server.settings.latency * [1,server.settings.slowmotion][render.slowmotionMode];
					var min = null;
					if(client.frames[2])
						min = game.selectDist(ctx,client.frames[2]); // pin frame
					utils.forEach(client.frames[0],function(frame,i) {
						if(frame.time <= time) {
							var dist = game.selectDist(ctx,frame);
							if(!min || min >= dist) {
								min = dist;
								client.frames[2] = client.frames[0][i];
							}
						}
					});
				}
			}
			
			ctx.render.update(ctx);
			
			if(ctx.process == 0)
				server.send_frame(ctx);
			
			// priorize client refresh
			if(ctx.process == 1 && server.requestFrame) {
				server.requestFrame = false;
				server.update();
			}
			
			// schedule next frame
			var time = utils.currentTime();
			nextFrame = Math.max(nextFrame + 1000 / [server,client][ctx.process].settings.framerate * [1,server.settings.slowmotion][render.slowmotionMode],time);
			if(ctx.process == 0) {
				setTimeout(function() {
					server.requestFrame = true;
				},nextFrame - time);
			}
			else {
				window.setTimeout(ctx.game.update,nextFrame - time);
			}
		}
		
		// enter game loop
		if(ctx.process == 0) {
			server.update = ctx.game.update;
		}
		else {
			client.capture(false);
			ctx.game.update();
		}
	},
	predictState: function(prev,next,rad) {
		var pred = [];
		utils.forUpto(prev.length,function(i) { // coords
			var diff = next[i] - prev[i];
			if(rad && Math.abs(diff) > utils.deg2rad(180))
				diff += ((diff < 0) ? 1 : -1 ) * utils.deg2rad(180) * 2;
			pred[i] = next[i] + diff * client.settings.framerate * (server.settings.latency * 2 / 1000 + 1 / server.settings.framerate);
			// diff per second * (rtt latency + server refresh latency)
		});
		return pred;
	},
	selectDist: function(ctx,frame) {
		var dist = utils.vectorAbsolute(utils.vectorDifference(ctx.viewPos,frame.viewPos),2);
		var diffRot = [];
		utils.forUpto(2,function(i) { // coords
			diffRot[i] = Math.abs(utils.normalizeRad(ctx.viewRot[i]) - utils.normalizeRad(frame.viewRot[i]));
			if(diffRot[i] > utils.deg2rad(180))
				diffRot[i] -= utils.deg2rad(180) * 2;
		});
		dist += utils.vectorAbsolute(diffRot) * client.settings.selectWeight;
		return dist;
	},
};
