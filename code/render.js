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

var render = {
	preferredSize: [],    // w = pageSize.w / 2; h = w * 3 / 4;
	requiredSize: [],     // fullscreen ? screenSize : preferredSize
	blendWidth: [],       // requiredSize * min((cot(preferredFieldOfView / 2) - 1) / 2,preferredBlendWidth)
	renderSize: [],       // requiredSize + blendWidth * 2
	framebufferSize: [],  // 2 ^ ceil(log(renderSize))
	depthmapSize: null,   // framebufferSize (update client)
	panoramaSize: [],     // w = framebufferSize.w / 3; h = framebufferSize.h / 2;
	fieldOfView: [[],[]], // renderSize, requiredSize
	compensationMode: null,
	slowmotionMode: null,
	
	resize: function() {
		var canvas0 = document.getElementById("canvas_0");
		var canvas1 = document.getElementById("canvas_1");
		canvas0.width = canvas1.width = 0;
		canvas0.height = canvas1.height = 0;
		render.preferredSize[0] = render.requiredSize[0] = Math.max(canvas0.parentNode.clientWidth - 50,4);
		render.preferredSize[1] = render.requiredSize[1] = Math.floor(render.preferredSize[0] * 3 / 4);
	},
	start: function(ctx) {
		ctx.render = {};
		render.blendWidth = [];
		render.renderSize = [];
		render.framebufferSize = [];
		render.depthmapSize = null;
		render.panoramaSize = [];
		render.fieldOfView = [[],[]];
		render.compensationMode = null;
		render.slowmotionMode = null;
		
		var materials = {/*
		    materialName: {
		        texture: null, // server
		        geometry: [],  // server
		    },
		*/};
		var groups = [/*
		    [[],[],null], // simplified,detailed,color
		*/];
		var layers = [/*
		    {
		        framebuffer: null,    // server
		        depthbuffer: null,    // server
		        texture: null,        // (server)/client
		        enableMaterials: {},  // server/client
		        materials: {
		            materialName: {
		                buffers: [],  // server/client
		                faceCount: 0, // server/client
		                data: [],     // server/client
		            },
		        },
		    },
		*/];
		var depthmap = {
			framebuffer: null, // client
			depthbuffer: null, // client
			texture: null,     // client
		};
		
		// init webgl
		var canvas = document.getElementById("canvas_" + ctx.process);
		var gl = canvas.getContext("webgl",{alpha:false,antialias:false});
		if(!gl)
			throw new Error("");
		
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
		gl.activeTexture(gl.TEXTURE0);
		
		// load shaders
		var programCount = 4;
		var attribCount = 2;
		var attribs = [
			["a_vertex","a_texCoord"],
			["a_vertex"],
			["a_vertex"],
			["a_vertex","a_color"],
		];
		var uniforms = [
			["u_viewMatrix","u_cartMatrix","u_outline"],
			["u_viewMatrix1","u_cartMatrix1","u_viewMatrix2","u_cartMatrix2","u_requiredSize","u_blendWidth","u_blendWidthRec"],
			["u_viewMatrix","u_cartMatrix"],
			["u_viewMatrix1","u_cartMatrix1","u_viewMatrix2","u_cartMatrix2","u_requiredSize","u_blendWidth","u_blendWidthRec"],
		];
		var samplerCounts = [1,1,0,2];
		var programs = [];
		utils.forUpto(programCount,function(i) { // programs
			programs[i] = {};
			programs[i].program = gl.createProgram();
			programs[i].shaders = [];
			utils.forUpto(2,function(j) { // shaders
				programs[i].shaders[j] = gl.createShader([gl.VERTEX_SHADER,gl.FRAGMENT_SHADER][j]);
				gl.shaderSource(programs[i].shaders[j],document.getElementById(["vertexShader_" + i,"fragmentShader_" + i][j]).text);
				gl.compileShader(programs[i].shaders[j]);
				gl.attachShader(programs[i].program,programs[i].shaders[j]);
			});
			gl.linkProgram(programs[i].program);
			if(!gl.getProgramParameter(programs[i].program,gl.LINK_STATUS))
				throw new Error("");
			
			utils.forUpto(attribs[i].length,function(j) { // attribs
				gl.bindAttribLocation(programs[i].program,j,attribs[i][j]);
			});
			programs[i].samplers = [];
			utils.forUpto(samplerCounts[i],function(j) { // samplers
				programs[i].samplers[j] = gl.getUniformLocation(programs[i].program,"u_sampler" + j);
			});
			programs[i].uniforms = [];
			utils.forUpto(uniforms[i].length,function(j) { // uniforms
				programs[i].uniforms[j] = gl.getUniformLocation(programs[i].program,uniforms[i][j]);
			});
		});
		programs[0].init = function(parameters) {
			gl.uniformMatrix4fv(programs[0].uniforms[0],false,utils.flattenMatrix((parameters[0] || geometry.identityMatrix)));
			gl.uniformMatrix4fv(programs[0].uniforms[1],false,utils.flattenMatrix(geometry.identityMatrix));
			gl.uniform1i(programs[0].uniforms[2],parameters[1]);
		};
		programs[1].init = function(parameters) {
			gl.uniformMatrix4fv(programs[1].uniforms[0],false,utils.flattenMatrix((parameters[0] || geometry.identityMatrix)));
			gl.uniformMatrix4fv(programs[1].uniforms[1],false,utils.flattenMatrix(geometry.identityMatrix));
			gl.uniformMatrix4fv(programs[1].uniforms[2],false,utils.flattenMatrix((parameters[1] || geometry.identityMatrix)));
			gl.uniformMatrix4fv(programs[1].uniforms[3],false,utils.flattenMatrix(geometry.identityMatrix));
			gl.uniform2fv(programs[1].uniforms[4],[render.requiredSize[0] / render.framebufferSize[0],render.requiredSize[1] / render.framebufferSize[1]]);
			gl.uniform2fv(programs[1].uniforms[5],[render.blendWidth[0] / render.framebufferSize[0],render.blendWidth[1] / render.framebufferSize[1]]);
			gl.uniform2fv(programs[1].uniforms[6],[render.framebufferSize[0] / render.blendWidth[0],render.framebufferSize[1] / render.blendWidth[1]]);
		};
		programs[2].init = function(parameters) {
			gl.uniformMatrix4fv(programs[2].uniforms[0],false,utils.flattenMatrix((parameters[0] || geometry.identityMatrix)));
			gl.uniformMatrix4fv(programs[2].uniforms[1],false,utils.flattenMatrix(geometry.identityMatrix));
		};
		programs[3].init = function(parameters) {
			gl.uniformMatrix4fv(programs[3].uniforms[0],false,utils.flattenMatrix((parameters[0] || geometry.identityMatrix)));
			gl.uniformMatrix4fv(programs[3].uniforms[1],false,utils.flattenMatrix(geometry.identityMatrix));
			gl.uniformMatrix4fv(programs[3].uniforms[2],false,utils.flattenMatrix((parameters[1] || geometry.identityMatrix)));
			gl.uniformMatrix4fv(programs[3].uniforms[3],false,utils.flattenMatrix(geometry.identityMatrix));
			gl.uniform2fv(programs[3].uniforms[4],[render.requiredSize[0] / render.framebufferSize[0],render.requiredSize[1] / render.framebufferSize[1]]);
			gl.uniform2fv(programs[3].uniforms[5],[render.blendWidth[0] / render.framebufferSize[0],render.blendWidth[1] / render.framebufferSize[1]]);
			gl.uniform2fv(programs[3].uniforms[6],[render.framebufferSize[0] / render.blendWidth[0],render.framebufferSize[1] / render.blendWidth[1]]);
		};
		programs[0].change = function(parameters) {
			gl.uniformMatrix4fv(programs[0].uniforms[1],false,utils.flattenMatrix((parameters[0] || geometry.identityMatrix)));
		};
		programs[1].change = function(parameters) {
			gl.uniformMatrix4fv(programs[1].uniforms[1],false,utils.flattenMatrix((parameters[0] || geometry.identityMatrix)));
			gl.uniformMatrix4fv(programs[1].uniforms[3],false,utils.flattenMatrix((parameters[1] || geometry.identityMatrix)));
		};
		programs[2].change = function(parameters) {
			gl.uniformMatrix4fv(programs[2].uniforms[1],false,utils.flattenMatrix((parameters[0] || geometry.identityMatrix)));
		};
		programs[3].change = function(parameters) {
			gl.uniformMatrix4fv(programs[3].uniforms[1],false,utils.flattenMatrix((parameters[0] || geometry.identityMatrix)));
			gl.uniformMatrix4fv(programs[3].uniforms[3],false,utils.flattenMatrix((parameters[1] || geometry.identityMatrix)));
		};
		programs[0].draw = function(i,materialName) {
			gl.bindBuffer(gl.ARRAY_BUFFER,layers[i].materials[materialName].buffers[0]);
			gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
			gl.bindBuffer(gl.ARRAY_BUFFER,layers[i].materials[materialName].buffers[1]);
			gl.vertexAttribPointer(1,2,gl.FLOAT,false,0,0);
			gl.drawArrays(gl.TRIANGLES,0,layers[i].materials[materialName].faceCount * 6);
		};
		programs[1].draw = function(i,materialName) {
			gl.bindBuffer(gl.ARRAY_BUFFER,layers[i].materials[materialName].buffers[0]);
			gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
			gl.drawArrays(gl.TRIANGLES,0,layers[i].materials[materialName].faceCount * 6);
		};
		programs[2].draw = function(i,materialName) {
			gl.bindBuffer(gl.ARRAY_BUFFER,layers[i].materials[materialName].buffers[0]);
			gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
			gl.drawArrays(gl.TRIANGLES,0,layers[i].materials[materialName].faceCount * 6);
		};
		programs[3].draw = function(i,materialName) {
			gl.bindBuffer(gl.ARRAY_BUFFER,layers[i].materials[materialName].buffers[0]);
			gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
			gl.bindBuffer(gl.ARRAY_BUFFER,layers[i].materials[materialName].buffers[1]);
			gl.vertexAttribPointer(1,4,gl.FLOAT,false,0,0);
			gl.drawArrays(gl.TRIANGLES,0,layers[i].materials[materialName].faceCount * 6);
		};
		var useProgram = function(program,parameters) {
			gl.useProgram(programs[program].program);
			utils.forUpto(attribCount,function(i) { // attribs
				gl.disableVertexAttribArray(i);
				if(i < attribs[program].length)
					gl.enableVertexAttribArray(i);
			});
			utils.forUpto(samplerCounts[program],function(i) { // samplers
				gl.uniform1i(programs[program].samplers[i],i);
			});
			programs[program].init(parameters);
		};
		
		// load textures & geometry
		if(ctx.process == 0) {
			for(materialName in server.materials) {
				materials[materialName] = {
					geometry: [],
				};
				materials[materialName].texture = gl.createTexture();
				gl.bindTexture(gl.TEXTURE_2D,materials[materialName].texture);
				gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,document.getElementById("texture_" + materialName));
				gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
				gl.generateMipmap(gl.TEXTURE_2D);
			}
			geometry.loadGeometry(ctx,materials,groups);
		}
		
		// setup framebuffers per layer
		utils.forUpto(server.settings.layerCount,function(i) { // compose layers
			layers[i] = {
				materials: {},
			};
			layers[i].framebuffer = gl.createFramebuffer();
			layers[i].depthbuffer = gl.createRenderbuffer();
			layers[i].texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D,layers[i].texture);
			gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
			for(materialName in utils.extend(server.materials,["compose"])) {
				layers[i].materials[materialName] = {
					buffers: [],
				};
				utils.forUpto(attribCount,function(j) { // buffers
					layers[i].materials[materialName].buffers[j] = gl.createBuffer();
				});
			}
		});
		
		// setup depth map
		if(ctx.process == 1) {
			depthmap.framebuffer = gl.createFramebuffer();
			depthmap.depthbuffer = gl.createRenderbuffer();
			depthmap.texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D,depthmap.texture);
			gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
		}
		
		// update routine (in process context)
		ctx.render.update = function() {
			var layerCount = [1,[1,2][ctx.process],server.settings.layerCount][render.compensationMode];
			
			// resize viewport
			if(ctx.process == 1) {
				
				//$
				var test1 = [
					[document.fullscreen,document.msFullscreen,document.mozFullscreen,document.webkitFullscreen],
					[document.fullScreen,document.msFullScreen,document.mozFullScreen,document.webkitFullScreen],
					[document.isFullscreen,document.msIsFullscreen,document.mozIsFullscreen,document.webkitIsFullscreen],
					[document.isFullScreen,document.msIsFullScreen,document.mozIsFullScreen,document.webkitIsFullScreen],
					[document.fullscreenElement,document.msFullscreenElement,document.mozFullscreenElement,document.webkitFullscreenElement],
					[document.fullScreenElement,document.msFullScreenElement,document.mozFullScreenElement,document.webkitFullScreenElement],
					[[canvas.clientWidth,canvas.clientHeight],canvas.getClientBoundingRect ? canvas.getClientBoundingRect() : []],
				];
				if(JSON.stringify(test1) != JSON.stringify(window.test2)) {
					window.test2 = test1;
					console.log("fullscreen A",test1[0][0],test1[0][1],test1[0][2],test1[0][3]);
					console.log("fullScreen B",test1[1][0],test1[1][1],test1[1][2],test1[1][3]);
					console.log("isFullscreen C",test1[2][0],test1[2][1],test1[2][2],test1[2][3]);
					console.log("isFullScreen D",test1[3][0],test1[3][1],test1[3][2],test1[3][3]);
					console.log("fullscreenElement E",test1[4][0],test1[4][1],test1[4][2],test1[4][3]);
					console.log("fullScreenElement F",test1[5][0],test1[5][1],test1[5][2],test1[5][3]);
					console.log("clientSize",test1[6][0],test1[6][1]);
				}
				
				var fullscreen = !!document.fullscreen
							|| !!document.msFullscreenElement
							|| !!document.mozFullScreen
							|| !!document.webkitIsFullScreen;
				render.requiredSize = (fullscreen) ? [canvas.clientWidth,canvas.clientHeight] : render.preferredSize;
			}
			if(canvas.width != render.requiredSize[0]
			|| canvas.height != render.requiredSize[1]) {
				gl.bindFramebuffer(gl.FRAMEBUFFER,null);
				gl.clearColor(0,0,0,1);
				gl.clear(gl.COLOR_BUFFER_BIT);
				canvas.width = render.requiredSize[0];
				canvas.height = render.requiredSize[1];
				gl.viewport(0,0,render.requiredSize[0],render.requiredSize[1]);
				if(ctx.process == 0) {
					// determine constant properties
					var tan = Math.tan(server.data[ctx.demo].settings.fieldOfView / 2);
					var prepareBlendWidth = Math.min((1 / tan - 1) / 2,server.settings.preferredBlendWidth);
					utils.forUpto(2,function(i) { // coords
						render.blendWidth[i] = Math.floor(prepareBlendWidth * render.requiredSize[i]);
						render.renderSize[i] = render.requiredSize[i] + render.blendWidth[i] * 2;
						render.framebufferSize[i] = Math.pow(2,Math.ceil(Math.log(render.renderSize[i])/Math.log(2)));
					});
					render.panoramaSize = [Math.floor(render.framebufferSize[0] / 3),Math.floor(render.framebufferSize[1] / 2)];
					render.fieldOfView = [
						[Math.atan(tan * render.renderSize[0] / render.requiredSize[1]) * 2,Math.atan(tan * render.renderSize[1] / render.requiredSize[1]) * 2],
						[Math.atan(tan * render.requiredSize[0] / render.requiredSize[1]) * 2,Math.atan(tan) * 2],
					];
					
					// resize framebuffers
					utils.forUpto(server.settings.layerCount,function(i) { // compose layers
						gl.bindTexture(gl.TEXTURE_2D,layers[i].texture);
						gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,render.framebufferSize[0],render.framebufferSize[1],0,gl.RGBA,gl.UNSIGNED_BYTE,null);
						gl.bindRenderbuffer(gl.RENDERBUFFER,layers[i].depthbuffer);
						gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,render.framebufferSize[0],render.framebufferSize[1]);
						gl.bindFramebuffer(gl.FRAMEBUFFER,layers[i].framebuffer);
						gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,layers[i].texture,0);
						gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,layers[i].depthbuffer);
						gl.bindRenderbuffer(gl.RENDERBUFFER,null);
					});
					
					// reset and preallocate pixel buffers
					server.pixels[0] = [];
					server.pixels[2] = 0;
					client.frames[0] = [];
					client.frames[2] = null;
					client.frames[3] = 0;
					utils.forUpto(server.pixels[1],function(i) { // pixel buffer count
						server.pixels[0][i] = [];
						utils.forUpto(server.settings.layerCount,function(j) { // compose layers
							server.pixels[0][i][j] = new Uint8Array(render.framebufferSize[0] * render.framebufferSize[1] * 4);
						});
					});
				}
			}
			if(ctx.process == 1) {
				if(!client.frames[2]
				|| client.frames[2].requiredSize[0] != render.requiredSize[0]
				|| client.frames[2].requiredSize[1] != render.requiredSize[1]
				|| client.frames[2].compensationMode != render.compensationMode) // wait for valid properties
					return;
				
				if(!render.depthmapSize
				|| client.frames[2].framebufferSize[0] != render.depthmapSize[0]
				|| client.frames[2].framebufferSize[1] != render.depthmapSize[1]) {
					render.depthmapSize = [client.frames[2].framebufferSize[0],client.frames[2].framebufferSize[1]];
					gl.bindTexture(gl.TEXTURE_2D,depthmap.texture);
					gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,render.framebufferSize[0],render.framebufferSize[1],0,gl.RGBA,gl.UNSIGNED_BYTE,null);
					gl.bindRenderbuffer(gl.RENDERBUFFER,depthmap.depthbuffer);
					gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,render.framebufferSize[0],render.framebufferSize[1]);
					gl.bindFramebuffer(gl.FRAMEBUFFER,depthmap.framebuffer);
					gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,depthmap.texture,0);
					gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depthmap.depthbuffer);
					gl.bindRenderbuffer(gl.RENDERBUFFER,null);
				}
			}
			
			// update textures & geometry per layer
			geometry.selectGeometry(ctx,materials,groups,layers);
			utils.forUpto(layerCount,function(i) { // compose layers
				if(ctx.process == 1 && client.frames[3] != client.frames[2].time) { // load pixel buffers
					gl.bindTexture(gl.TEXTURE_2D,layers[i].texture);
					gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,client.frames[2].framebufferSize[0],client.frames[2].framebufferSize[1],0,gl.RGBA,gl.UNSIGNED_BYTE,server.pixels[0][client.frames[2].pixels][i]);
				}
				for(materialName in utils.extend(server.materials,["compose"])) {
					if(layers[i].enableMaterials[materialName]) {
						utils.forUpto(attribCount,function(j) { // buffers
							gl.bindBuffer(gl.ARRAY_BUFFER,layers[i].materials[materialName].buffers[j]);
							gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(layers[i].materials[materialName].data[j]),gl.STATIC_DRAW);
						});
					}
				}
			});
			if(ctx.process == 1)
				client.frames[3] = client.frames[2].time;
			
			// parameterize shaders
			var viewMatrices = JSON.parse(JSON.stringify([
				geometry.identityMatrix,geometry.identityMatrix,geometry.identityMatrix,
				geometry.identityMatrix,geometry.identityMatrix,
			]));
			var cartMatrices = JSON.parse(JSON.stringify([
				geometry.identityMatrix,geometry.identityMatrix,
				geometry.identityMatrix,geometry.identityMatrix,
			]));
			var panoramaMatrices = JSON.parse(JSON.stringify([
				geometry.identityMatrix,geometry.identityMatrix,geometry.identityMatrix,
				geometry.identityMatrix,geometry.identityMatrix,geometry.identityMatrix,
			]));
			var viewParameters = [
				[ctx,render.fieldOfView[0],true],              // server render  - passthrough/background/layers: map/cart
				[client.frames[2],render.fieldOfView[1],true], // client render  - background/layers: map/cart
				[ctx,render.fieldOfView[1],true],              // client display - background/layers: map/cart
				[client.frames[2],render.fieldOfView[0],true], // client render  - background: depth
				[ctx,render.fieldOfView[1],false],             // client display - layers: panorama
			];
			var cartParameters = [
				[ctx],                                         // server render  - passthrough/background/layers: cart
				[client.frames[2]],                            // client render  - background/layers: cart
				[ctx],                                         // client display - background/layers: cart
				[client.frames[2]],                            // client render  - background: depth
			];
			var panoramaParameters = [
				[ctx],                                         // server render  - layers: panorama
			];
			utils.forUpto(viewMatrices.length,function(i) { // view matrices
				if(viewParameters[i][0]) {
					utils.matrixProduct(viewMatrices[i],geometry.perspectiveMatrix(viewParameters[i][1]));        // #5 perspective
					utils.matrixProduct(viewMatrices[i],geometry.coordinateMatrix);                               // #4 coordinate system
					utils.matrixProduct(viewMatrices[i],geometry.rotateXMatrix(viewParameters[i][0].viewRot[1])); // #3 view pitch
					utils.matrixProduct(viewMatrices[i],geometry.rotateZMatrix(viewParameters[i][0].viewRot[0])); // #2 view yaw
					if(viewParameters[i][2])
						utils.matrixProduct(viewMatrices[i],geometry.translateMatrix(viewParameters[i][0].viewPos,-1)); // #1 view position
				}
			});
			if(ctx.demo == 1) {
				utils.forUpto(cartMatrices.length,function(i) { // cart matrices
					if(cartParameters[i][0]) {
						utils.matrixProduct(cartMatrices[i],geometry.translateMatrix(cartParameters[i][0].cartPos,1)); // #2 cart position
						utils.matrixProduct(cartMatrices[i],geometry.rotateZMatrix(-cartParameters[i][0].cartRot));    // #1 cart rotation
					}
				});
			}
			if(ctx.process == 0) {
				utils.forUpto(6,function(i) { // panorama matrices
					utils.matrixProduct(panoramaMatrices[i],geometry.perspectiveMatrix([utils.deg2rad(90),utils.deg2rad(90)])); // #5 perspective
					utils.matrixProduct(panoramaMatrices[i],geometry.coordinateMatrix);                                         // #4 coordinate system
					utils.matrixProduct(panoramaMatrices[i],geometry.rotateXMatrix(utils.deg2rad([0,0,0,0,90,-90][i])));        // #3 view pitch
					utils.matrixProduct(panoramaMatrices[i],geometry.rotateZMatrix(utils.deg2rad([-90,90,180,0,0,0][i])));      // #2 view yaw
					utils.matrixProduct(panoramaMatrices[i],geometry.translateMatrix(panoramaParameters[0][0].viewPos,-1));     // #1 view position
				});
			}
			
			// render and display
			if(ctx.process == 0) {
				gl.viewport(0,0,render.renderSize[0],render.renderSize[1]);
				useProgram(0,[viewMatrices[0],1]);
				utils.forUpto(layerCount,function(i) { // compose layers
					gl.bindFramebuffer(gl.FRAMEBUFFER,layers[i].framebuffer);
					gl.clearColor(0,0,0,0);
					gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
					if(render.compensationMode == 2 && i == 0) {
						utils.forUpto(6,function(j) { // faces
							gl.viewport(render.panoramaSize[0] * (j % 3),render.panoramaSize[1] * Math.floor(j / 3),render.panoramaSize[0],render.panoramaSize[1]);
							programs[0].init([panoramaMatrices[j],1]);
							for(materialName in server.materials) {
								if(layers[i].enableMaterials[materialName]) {
									if(materialName != "paint") { // no cart layer
										gl.bindTexture(gl.TEXTURE_2D,materials[materialName].texture);
										programs[0].draw(i,materialName);
									}
								}
							}
						});
						gl.viewport(0,0,render.renderSize[0],render.renderSize[1]);
						programs[0].init([viewMatrices[0],1]);
					}
					else {
						for(materialName in server.materials) {
							if(layers[i].enableMaterials[materialName]) {
								if(materialName == "paint")
									programs[0].change([cartMatrices[0]]); // cart layer
								gl.bindTexture(gl.TEXTURE_2D,materials[materialName].texture);
								programs[0].draw(i,materialName);
								if(materialName == "paint")
									programs[0].change([null]); // cart layer
							}
						}
					}
				});
			}
			gl.viewport(0,0,render.requiredSize[0],render.requiredSize[1]);
			
			// specific per process and compensation mode
			[
				[
					function() {
						useProgram(1,[null,null]);
						gl.bindFramebuffer(gl.FRAMEBUFFER,null);
						gl.clearColor(1,1,1,1);
						gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
						var i = 0;
						var materialName = "compose";
						gl.bindTexture(gl.TEXTURE_2D,layers[0].texture);
						programs[1].draw(i,materialName);
					},
					function() {
						useProgram(1,[null,null]);
						gl.bindFramebuffer(gl.FRAMEBUFFER,null);
						gl.clearColor(1,1,1,1);
						gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
						var i = 0;
						var materialName = "compose";
						gl.bindTexture(gl.TEXTURE_2D,layers[0].texture);
						programs[1].draw(i,materialName);
					},
					function() {
						useProgram(1,[null,null]);
						gl.bindFramebuffer(gl.FRAMEBUFFER,null);
						gl.clearColor(1,1,1,1);
						gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
						utils.forUpto(layerCount,function(i) { // compose layers
							if(i > 0) {
								var materialName = "compose";
								gl.bindTexture(gl.TEXTURE_2D,layers[i].texture);
								programs[1].draw(i,materialName);
							}
						});
					},
				][render.compensationMode],
				[
					function() {
						useProgram(1,[null,null]);
						gl.bindFramebuffer(gl.FRAMEBUFFER,null);
						gl.clearColor(1,1,1,1);
						gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
						var i = 0;
						var materialName = "compose";
						gl.bindTexture(gl.TEXTURE_2D,layers[0].texture);
						programs[1].draw(i,materialName);
					},
					function() {
						{ // always
							gl.viewport(0,0,render.renderSize[0],render.renderSize[1]);
							useProgram(2,[viewMatrices[3]]);
							gl.bindFramebuffer(gl.FRAMEBUFFER,depthmap.framebuffer);
							gl.clearColor(1,1,1,1);
							gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
							utils.forUpto(layerCount,function(i) { // compose layers
								if(i == 1)
									programs[2].change([cartMatrices[3]]); // cart layer
								var materialName = "compose";
								programs[2].draw(i,materialName);
								if(i == 1)
									programs[2].change([null]); // cart layer
							});
							gl.viewport(0,0,render.requiredSize[0],render.requiredSize[1]);
						}
						{ // always
							useProgram(3,[viewMatrices[1],viewMatrices[2]]);
							gl.bindFramebuffer(gl.FRAMEBUFFER,null);
							gl.clearColor(1,1,1,1);
							gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
							gl.activeTexture(gl.TEXTURE1);
							gl.bindTexture(gl.TEXTURE_2D,depthmap.texture);
							gl.activeTexture(gl.TEXTURE0);
							gl.bindTexture(gl.TEXTURE_2D,layers[0].texture);
							utils.forUpto(layerCount,function(i) { // compose layers
								if(i == 1)
									programs[3].change([cartMatrices[1],cartMatrices[2]]); // cart layer
								var materialName = "compose";
								programs[3].draw(i,materialName);
								if(i == 1)
									programs[3].change([null,null]); // cart layer
							});
						}
					},
					function() {
						{ // always
							useProgram(0,[viewMatrices[4],0]);
							gl.bindFramebuffer(gl.FRAMEBUFFER,null);
							gl.clearColor(1,1,1,1);
							gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
							var i = 0;
							var materialName = "compose";
							gl.bindTexture(gl.TEXTURE_2D,layers[i].texture);
							programs[0].draw(i,materialName);
						}
						{ // always
							useProgram(1,[viewMatrices[1],viewMatrices[2]]);
							gl.bindFramebuffer(gl.FRAMEBUFFER,null);
							gl.clear(gl.DEPTH_BUFFER_BIT);
							utils.forUpto(layerCount,function(i) { // compose layers
								if(i > 0) {
									if(ctx.demo == 1 && i == layerCount - 1)
										programs[1].change([cartMatrices[1],cartMatrices[2]]); // cart layer
									var materialName = "compose";
									gl.bindTexture(gl.TEXTURE_2D,layers[i].texture);
									programs[1].draw(i,materialName);
									if(ctx.demo == 1 && i == layerCount - 1)
										programs[1].change([null,null]); // cart layer
								}
							});
						}
					},
				][render.compensationMode],
			][ctx.process]();
			
			// store pixel buffers
			if(ctx.process == 0) {
				server.pixels[2] = utils.incMod(server.pixels[2],server.pixels[1]);
				if(client.frames[2] && server.pixels[2] == client.frames[2].pixels) // pin frame
					server.pixels[2] = utils.incMod(server.pixels[2],server.pixels[1]);
				utils.forUpto(layerCount,function(i) { // compose layers
					gl.bindFramebuffer(gl.FRAMEBUFFER,layers[i].framebuffer);
					gl.readPixels(0,0,render.framebufferSize[0],render.framebufferSize[1],gl.RGBA,gl.UNSIGNED_BYTE,server.pixels[0][server.pixels[2]][i]);
				});
			}
		};
	},
};
