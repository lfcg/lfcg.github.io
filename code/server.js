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

var server = {
	settings: {
		framerate: 5,     // server refresh rate per second
		slowmotion: 4,    // framerate divisor
		latency: 300,     // client <-> server rtt = 600 ms
		layerCount: 5,
		layerStart: 3200,
		layerBase: 0.5,   // panorama,3200,1600,800/0,0/cart
		preferredBlendWidth: 0.25,
	},
	materials: {
		ground: {
			color: utils.bytes2floats([45,50,8,255]),
			mirror: true,
			cull: [0,1,2,3,4],
		},
		rock: {
			color: utils.bytes2floats([134,134,134,255]),
			collision: true,
			cull: [4],
		},
		wood: {
			color: utils.bytes2floats([0,0,0,255]),
			collision: true,
			cull: [4,5],
		},
		paint: {
			cull: [3,4],
		},
		arrow_left: {
			cull: [4,5],
		},
		leaf: {
			color: utils.bytes2floats([32,96,0,160]),
		},
		grass: {
			color: utils.bytes2floats([32,96,0,160]),
			mirror: true,
			cull: [1,3,4,5],
		},
	},
	models: {
		// brushes: x,y,z,width,depth,height,material,texScale
		// bounds:  x,y,z,width,depth,height,cull,color
		ground: {
			brushes: [
				[0,0,0,20000,20000,0,"ground",1000],
			],
		},
		wall: {
			brushes: [
				[0,0,0,1000,1000,1000,"rock",500],
				[0,0,-160,1100,1100,500,"leaf",50],
			],
			camCollision: true,
		},
		arrow_left: {
			brushes: [
				[0,0,300,1000,1000,200,"arrow_left",200],
			],
		},
		tree: {
			brushes: [
				[0,0,150,50,50,300,"wood",50],
				[0,0,300,200,200,300,"leaf",200],
			],
		},
		rock: {
			brushes: [
				[0,0,40,80,80,80,"rock",80],
				[40,40,30,60,60,60,"rock",40],
				[-40,-40,20,40,40,40,"rock",20],
				[-40,40,10,20,20,20,"rock",20],
			],
			bounds: [5,5,40,130,130,80,[4],utils.bytes2floats([134,134,134,255])],
		},
		grass: {
			brushes: [
				[-150,-175,50,0,100,100,"grass",100],
				[-150,-175,50,100,0,100,"grass",100],
				
				[175,-150,50,0,100,100,"grass",100],
				[175,-150,50,100,0,100,"grass",100],
				
				[-175,150,50,0,100,100,"grass",100],
				[-175,150,50,100,0,100,"grass",100],
				
				[150,175,50,0,100,100,"grass",100],
				[150,175,50,100,0,100,"grass",100],
			],
		},
		cart: {
			brushes: [
				[0,0,20,120,200,40,"paint",100],
				[0,0,50,80,100,20,"paint",100],
				
				[-45,50,25,60,60,50,"paint",100],
				[45,50,25,60,60,50,"paint",100],
				[-45,-50,25,60,60,50,"paint",100],
				[45,-50,25,60,60,50,"paint",100],
			],
			bounds: [0,0,30,150,200,60,[3,4],null],
		},
	},
	data: [], // data per demo mode
	
	requestFrame: null,
	update: null,
	pixels: null, // pixel buffers, preallocated: list,length,cursor
	receive_state: null,
	register_receive_state: function(ctx) {
		server.receive_state = function(msg) {
			if(msg.startCtr != game.startCtr[ctx.process]) // discard previous contexts
				return;
			
			ctx.viewRot = msg.viewRot;
			ctx.viewPos = msg.viewPos;
			ctx.cartRot = msg.cartRot;
			ctx.cartPos = msg.cartPos;
		};
	},
	send_frame: function(ctx) {
		var msg = JSON.parse(JSON.stringify({
			startCtr: ctx.startCtr,
			time: utils.currentTime(),
			requiredSize: render.requiredSize,
			framebufferSize: render.framebufferSize,
			compensationMode: render.compensationMode,
			viewRot: ctx.viewRot,
			viewPos: ctx.viewPos,
			cartRot: ctx.cartRot,
			cartPos: ctx.cartPos,
			pixels: server.pixels[2], // reference preallocated
			geometry: server.geometry,
		}));
		setTimeout(function() {
			client.receive_frame(msg);
		},server.settings.latency * [1,server.settings.slowmotion][render.slowmotionMode]);
	},
};
