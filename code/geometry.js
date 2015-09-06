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

var geometry = {
	identityMatrix: [
		[1,0,0,0],
		[0,1,0,0],
		[0,0,1,0],
		[0,0,0,1],
	],
	coordinateMatrix: [
		[1,0,0,0],
		[0,0,1,0],
		[0,1,0,0],
		[0,0,0,1],
	],
	passthroughGeometry: [
		[-1, 1, 0],
		[ 1, 1, 0],
		[ 1,-1, 0],
		[-1,-1, 0],
	],
	panoramaGeometry: [],
	rotateXMatrix: function(angle) {
		var cos = Math.cos(angle);
		var sin = Math.sin(angle);
		return [
			[1,0,0,0],
			[0,cos,-sin,0],
			[0,sin,cos,0],
			[0,0,0,1],
		];
	},
	rotateZMatrix: function(angle) {
		var cos = Math.cos(angle);
		var sin = Math.sin(angle);
		return [
			[cos,-sin,0,0],
			[sin,cos,0,0],
			[0,0,1,0],
			[0,0,0,1],
		];
	},
	translateMatrix: function(pos,scale) {
		return [
			[1,0,0,(pos[0] || 0) * scale],
			[0,1,0,(pos[1] || 0) * scale],
			[0,0,1,(pos[2] || 0) * scale],
			[0,0,0,1],
		];
	},
	perspectiveMatrix: function(fov) {
		var tan = [Math.tan(fov[0] / 2),Math.tan(fov[1] / 2)];
		return [
			[1 / tan[0],0,0,0],
			[0,1 / tan[1],0,0],
			[0,0,1,-1],
			[0,0,1,0],
		];
	},
	
	loadGeometry: function(ctx,materials,groups) {
		geometry.panoramaGeometry = [];
		
		/*
		faces
		      _______
		    /:      /|
		   / : 5  3/ |
		  /__:____/  |
		 | 0 :...|.1.|
		 |  .    |  /
		 | .2  4 | /
		 |_______|/
		
		vertices
		     6_______7
		    /:      /|
		   / :     / |
		 4/__:___5/  |
		 |   2...|...3
		 |  .    |  /
		 | .     | /
		 0_______1/
		*/
		var vertPos = [
			[-1,-1,-1],
			[ 1,-1,-1],
			[-1, 1,-1],
			[ 1, 1,-1],
			[-1,-1, 1],
			[ 1,-1, 1],
			[-1, 1, 1],
			[ 1, 1, 1],
		];
		var faceQuads = [
			[0,4,6,2],
			[3,7,5,1],
			[1,5,4,0],
			[2,6,7,3],
			[0,2,3,1],
			[6,4,5,7],
		];
		var texAxis = [
			[[1,2],[-1,1]],
			[[0,2],[1,1]],
			[[0,1],[1,1]],
		];
		
		// panorama geometry
		utils.forUpto(6,function(i) { // faces
			var quad = faceQuads[i];
			var vertices = JSON.parse(JSON.stringify([
				vertPos[quad[0]],
				vertPos[quad[1]],
				vertPos[quad[2]],
				vertPos[quad[3]],
			]));
			utils.forUpto(4,function(j) { // vertices
				utils.forUpto(3,function(k) { // coords
					vertices[j][k] *= 1000;
				});
			});
			var texOff = [(i % 3),Math.floor(i / 3)];
			var texCoords = [
				[texOff[0] + 0,texOff[1] + 0],
				[texOff[0] + 0,texOff[1] + 1],
				[texOff[0] + 1,texOff[1] + 1],
				[texOff[0] + 1,texOff[1] + 0],
			];
			geometry.panoramaGeometry.push([vertices,texCoords]);
		});
		
		// map geometry
		utils.forEach(server.data[ctx.demo].map,function(instance) {
			var group = null;
			
			// simplified geometry
			if(server.models[instance[3]].bounds) {
				var brush = server.models[instance[3]].bounds;
				group = [[],[],brush[7],instance[3],"group"];
				groups.push(group);
				utils.forUpto(6,function(i) { // faces
					var append = brush[6].indexOf(i) == -1;
					var quad = faceQuads[i];
					var vertices = JSON.parse(JSON.stringify([
						vertPos[quad[0]],
						vertPos[quad[1]],
						vertPos[quad[2]],
						vertPos[quad[3]],
					]));
					utils.forUpto(4,function(j) { // vertices
						utils.forUpto(3,function(k) { // coords
							vertices[j][k] *= brush[k + 3] / 2;
							vertices[j][k] += brush[k] + instance[k];
						});
					});
					if(append)
						group[0].push([vertices]);
				});
			}
			
			// geometry for render and display
			for(materialName in server.materials) {
				utils.forEach(server.models[instance[3]].brushes,function(brush) {
					if(brush[6] == materialName) {
						if(!server.models[instance[3]].bounds) {
							group = [[],[],server.materials[materialName].color,instance[3],materialName];
							groups.push(group);
						}
						utils.forUpto(6,function(i) { // faces
							var append1 = [true,true,true,true];
							var append2 = true;
							var append3 = !server.materials[materialName].cull || server.materials[materialName].cull.indexOf(i) == -1;
							var quad = faceQuads[i];
							var vertices = JSON.parse(JSON.stringify([
								vertPos[quad[0]],
								vertPos[quad[1]],
								vertPos[quad[2]],
								vertPos[quad[3]],
							]));
							utils.forUpto(4,function(j) { // vertices
								utils.forUpto(3,function(k) { // coords
									vertices[j][k] *= brush[k + 3] / 2;
									vertices[j][k] += brush[k] + instance[k];
									if(vertices[j][k] < server.data[ctx.demo].cull[k][0]
									|| vertices[j][k] > server.data[ctx.demo].cull[k][1])
										append1[j] = false; // cull outside
								});
								vertices[j][2] = Math.max(vertices[j][2],0);
							});
							if(vertices[0][2] == 0
							&& vertices[1][2] == 0
							&& vertices[2][2] == 0
							&& vertices[3][2] == 0
							&& materialName != "ground")
								append2 = false; // cull bottom
							utils.forUpto(4,function(j) { // vertices
								utils.forUpto(4,function(k) { // vertices
									if(j != k
									&& vertices[j][0] == vertices[k][0]
									&& vertices[j][1] == vertices[k][1]
									&& vertices[j][2] == vertices[k][2])
										append2 = false; // cull empty
								});
							});
							var texCoords = [];
							utils.forUpto(4,function(j) { // vertices
								texCoords[j] = [];
								utils.forUpto(2,function(k) { // coords
									texCoords[j][k] = [1,-1][k] * vertices[j][texAxis[Math.floor(i / 2)][0][k]] * texAxis[Math.floor(i / 2)][1][k] / brush[7];
								});
								if(!server.materials[materialName].mirror)
									texCoords[j][0] *= [1,-1][i % 2];
							});
							if((append1[0] || append1[1] || append1[2] || append1[3] || materialName == "ground")
							&& append2
							&& append3) {
								if(!server.models[instance[3]].bounds)
									group[0].push([vertices]);
								group[1].push([materialName,materials[materialName].geometry.length]);
								materials[materialName].geometry.push([vertices,texCoords]);
							}
						});
					}
				});
			}
		});
	},
	selectGeometry: function(ctx,materials,groups,layers) {
		server.geometry = [];
		utils.forUpto(server.settings.layerCount,function(i) { // compose layers
			layers[i].enableMaterials = {};
		});
		
		// specific per process and compensation mode
		[
			[
				function() {
					// render: single layer
					// display: passthrough
					var i = 0;
					for(materialName in server.materials) {
						layers[i].materials[materialName].faceCount = 0;
						var data = layers[i].materials[materialName].data = [[],[]];
						utils.forEach(materials[materialName].geometry,function(face) {
							layers[i].enableMaterials[materialName] = true;
							layers[i].materials[materialName].faceCount++;
							geometry.pushData(data[0],face[0]);
							geometry.pushData(data[1],face[1]);
						});
					}
					{ // always
						var materialName = "compose";
						layers[i].materials[materialName].faceCount = 0;
						var data = layers[i].materials[materialName].data = [[],[]];
						var face = [geometry.passthroughGeometry];
						layers[i].enableMaterials[materialName] = true;
						layers[i].materials[materialName].faceCount++;
						geometry.pushData(data[0],face[0]);
					}
				},
				function() {
					// render: single layer
					// display: passthrough
					// client: simplified and cart geometry
					{ // always
						var i = 0;
						for(materialName in server.materials) {
							layers[i].materials[materialName].faceCount = 0;
							var data = layers[i].materials[materialName].data = [[],[]];
							utils.forEach(materials[materialName].geometry,function(face) {
								layers[i].enableMaterials[materialName] = true;
								layers[i].materials[materialName].faceCount++;
								geometry.pushData(data[0],face[0]);
								geometry.pushData(data[1],face[1]);
							});
						}
						{ // always
							var materialName = "compose";
							layers[i].materials[materialName].faceCount = 0;
							var data = layers[i].materials[materialName].data = [[],[]];
							var face = [geometry.passthroughGeometry];
							layers[i].enableMaterials[materialName] = true;
							layers[i].materials[materialName].faceCount++;
							geometry.pushData(data[0],face[0]);
						}
					}
					{ // always
						var sortGeometry = [];
						utils.forUpto(2,function(i) { // compose layers
							sortGeometry[i] = {"group":[]};
							for(materialName in server.materials) {
								sortGeometry[i][materialName] = [];
							}
						});
						utils.forEach(groups,function(group) {
							utils.forEach(group[0],function(face) {
								sortGeometry[(group[3] == "cart") ? 1 : 0][group[4]].push([face[0],(group[2] || [0,0,0,0])]); // geometry and color
							});
						});
						utils.forUpto(2,function(i) { // compose layers
							server.geometry[i] = [];
							for(materialName in server.materials) {
								utils.forEach(sortGeometry[i][materialName],function(face) {
									server.geometry[i].push(face); // detailed geometry
								});
							}
							utils.forEach(sortGeometry[i]["group"],function(face) {
								server.geometry[i].push(face); // simplified geometry
							});
						});
					}
				},
				function() {
					// render: panorama, select by simplified geometry, multiple layers
					// display: passthrough
					// client: simplified and cart geometry
					utils.forUpto(server.settings.layerCount,function(i) { // compose layers
						if(i == 0) {
							for(materialName in server.materials) {
								layers[i].materials[materialName].faceCount = 0;
								var data = layers[i].materials[materialName].data = [[],[]];
								utils.forEach(materials[materialName].geometry,function(face) {
									layers[i].enableMaterials[materialName] = true;
									layers[i].materials[materialName].faceCount++;
									geometry.pushData(data[0],face[0]);
									geometry.pushData(data[1],face[1]);
								});
							}
						}
						else {
							var sortGeometry = {"group":[]};
							for(materialName in server.materials) {
								layers[i].materials[materialName].faceCount = 0;
								layers[i].materials[materialName].data = [[],[]];
								sortGeometry[materialName] = [];
							}
							var scope = [server.settings.layerStart * Math.pow(server.settings.layerBase,i - 1),server.settings.layerStart * Math.pow(server.settings.layerBase,i - 2)];
							var near = [server.settings.layerCount - 1,server.settings.layerCount - 2][ctx.demo];
							utils.forEach(groups,function(group) {
								var min = null;
								utils.forEach(group[0],function(face) {
									var dist = [
										utils.vectorAbsolute(utils.vectorDifference(face[0][0],ctx.viewPos),2),
										utils.vectorAbsolute(utils.vectorDifference(face[0][1],ctx.viewPos),2),
										utils.vectorAbsolute(utils.vectorDifference(face[0][2],ctx.viewPos),2),
										utils.vectorAbsolute(utils.vectorDifference(face[0][3],ctx.viewPos),2),
									];
									min = (min == null) ? dist[0] : Math.min(min,dist[0]);
									min = Math.min(min,dist[1]);
									min = Math.min(min,dist[2]);
									min = Math.min(min,dist[3]);
								});
								var select = false;
								if(ctx.demo == 1 && i == server.settings.layerCount - 1)
									select = (group[3] == "cart");
								else
									select = ((i == near || min > scope[0]) && (i == 1 || min <= scope[1]) && group[3] != "cart");
								if(select) {
									utils.forEach(group[1],function(reference) {
										var materialName = reference[0];
										var face = materials[materialName].geometry[reference[1]];
										var data = layers[i].materials[materialName].data;
										layers[i].enableMaterials[materialName] = true;
										layers[i].materials[materialName].faceCount++;
										geometry.pushData(data[0],face[0]);
										geometry.pushData(data[1],face[1]);
									});
									utils.forEach(group[0],function(face) {
										sortGeometry[group[4]].push([face[0]]); // geometry
									});
								}
							});
							{ // always
								var materialName = "compose";
								layers[i].materials[materialName].faceCount = 0;
								var data = layers[i].materials[materialName].data = [[],[]];
								var face = [geometry.passthroughGeometry];
								layers[i].enableMaterials[materialName] = true;
								layers[i].materials[materialName].faceCount++;
								geometry.pushData(data[0],face[0]);
							}
							{ // always
								server.geometry[i] = [];
								for(materialName in server.materials) {
									utils.forEach(sortGeometry[materialName],function(face) {
										server.geometry[i].push(face); // detailed geometry
									});
								}
								utils.forEach(sortGeometry["group"],function(face) {
									server.geometry[i].push(face); // simplified geometry
								});
							}
						}
					});
				},
			][render.compensationMode],
			[
				function() {
					// layer 0: passthrough
					var i = 0;
					var materialName = "compose";
					layers[i].materials[materialName].faceCount = 0;
					var data = layers[i].materials[materialName].data = [[],[]];
					var face = [geometry.passthroughGeometry];
					layers[i].enableMaterials[materialName] = true;
					layers[i].materials[materialName].faceCount++;
					geometry.pushData(data[0],face[0]);
				},
				function() {
					// layer 0: simplified geometry
					// layer 1: cart geometry
					utils.forUpto([1,2][ctx.demo],function(i) { // compose layers
						var materialName = "compose";
						layers[i].materials[materialName].faceCount = 0;
						var data = layers[i].materials[materialName].data = [[],[]];
						layers[i].enableMaterials[materialName] = true;
						utils.forEach(client.frames[2].geometry[i],function(face) {
							layers[i].materials[materialName].faceCount++;
							geometry.pushData(data[0],face[0]);
							data[1].push.apply(data[1],face[1]); // unrolled: 2 triangles
							data[1].push.apply(data[1],face[1]);
							data[1].push.apply(data[1],face[1]);
							data[1].push.apply(data[1],face[1]);
							data[1].push.apply(data[1],face[1]);
							data[1].push.apply(data[1],face[1]);
						});
					});
				},
				function() {
					// layer 0: panorama geometry
					// layer 1..n-1: layer geometry
					utils.forUpto(server.settings.layerCount,function(i) { // compose layers
						if(i == 0) {
							var materialName = "compose";
							layers[i].materials[materialName].faceCount = 0;
							var data = layers[i].materials[materialName].data = [[],[]];
							layers[i].enableMaterials[materialName] = true;
							utils.forEach(JSON.parse(JSON.stringify(geometry.panoramaGeometry)),function(face) {
								var stride = [
									render.panoramaSize[0] / render.framebufferSize[0],
									render.panoramaSize[1] / render.framebufferSize[1],
								];
								var pixelOff = [
									0.5 / render.framebufferSize[0],
									0.5 / render.framebufferSize[1],
								];
								face[1] = [
									[face[1][0][0] * stride[0] + pixelOff[0],face[1][0][1] * stride[1] + pixelOff[1]],
									[face[1][1][0] * stride[0] + pixelOff[0],face[1][1][1] * stride[1] - pixelOff[1]],
									[face[1][2][0] * stride[0] - pixelOff[0],face[1][2][1] * stride[1] - pixelOff[1]],
									[face[1][3][0] * stride[0] - pixelOff[0],face[1][3][1] * stride[1] + pixelOff[1]],
								];
								layers[i].materials[materialName].faceCount++;
								geometry.pushData(data[0],face[0]);
								geometry.pushData(data[1],face[1]);
							});
						}
						else {
							var materialName = "compose";
							layers[i].materials[materialName].faceCount = 0;
							var data = layers[i].materials[materialName].data = [[],[]];
							layers[i].enableMaterials[materialName] = true;
							utils.forEach(client.frames[2].geometry[i],function(face) {
								layers[i].materials[materialName].faceCount++;
								geometry.pushData(data[0],face[0]);
							});
						}
					});
				},
			][render.compensationMode],
		][ctx.process]();
	},
	pushData: function(data,face) {
		data.push.apply(data,face[0]); // unrolled: 2 triangles
		data.push.apply(data,face[1]);
		data.push.apply(data,face[2]);
		data.push.apply(data,face[2]);
		data.push.apply(data,face[3]);
		data.push.apply(data,face[0]);
	},
	
	collide: function(ctx,collidePos,camCollide) {
		var collision = false;
		utils.forUpto(2,function(i) { // 2 times
			utils.forEach(server.data[ctx.demo].map,function(instance) {
				utils.forEach(server.models[instance[3]].brushes,function(brush) {
					if(server.materials[brush[6]].collision
					&& (!camCollide || server.models[instance[3]].camCollision)) {
						var area = [[],[]];
						utils.forUpto(2,function(j) { // axis
							utils.forUpto(2,function(k) { // sign
								area[j][k] = brush[j] + instance[j] + [-1,1][k] * (brush[j + 3] / 2 + server.data[ctx.demo].settings.collisionRadius);
							});
						});
						if(collidePos[0] > area[0][0]
						&& collidePos[0] < area[0][1]
						&& collidePos[1] > area[1][0]
						&& collidePos[1] < area[1][1]) {
							collision = true;
							var min = null;
							utils.forUpto(2,function(j) { // axis
								utils.forUpto(2,function(k) { // sign
									if(!instance[4] || instance[4][j][k]) {
										var dist = Math.abs(collidePos[j] - area[j][k]);
										if(!min || min[0] > dist)
											min = [dist,[j,k]];
									}
								});
							});
							if(min)
								collidePos[min[1][0]] = area[min[1][0]][min[1][1]];
						}
					}
				});
			});
		});
		return collision;
	},
};
