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

server.data[1] = {
	settings: {
		camDistance: -700,
		camHeight: 200,
		camTrackCoeff: 0.1,
		camTrackThreshold: 0.01,
		fieldOfView: utils.deg2rad(45),
		collisionRadius: 100,
		steerSpeed: utils.deg2rad(60),
		accelerate: 800,
		slowdown: -400,
		brake: -800,
		startSpeed: 800,
		maxSpeed: 1600,
		reverseThreshold: -800,
		reverseSpeed: -800,
	},
	cull: [[-8250,2000],[-5250,5000],[0,1000]],
	map: [
		/*
		x,y,z,model,collision-direction
		wal wall
		t   tree
		r   rock
		g   grass
		<>^v arrow signs
		*   spawn/origin
		   -8 -7 -6 -5 -4 -3 -2 -1  0  1  2
		 5 walwalwalwalwalwalwalwalwalwalwal
		   walwalwalwalwalwalwalwalwalwalwal
		 4 wal                  <<<<<<   wal
		   wal           g g g           wal
		 3 walv         g g g g          wal
		   walvt         g g g           wal
		 2 walv           wal            wal
		   walvt          walwa          wal
		 1 wal              lwal         wal
		   wal t             wal         wal
		 0 wal                           wal
		   wal       t                   wal
		-1 wal         wal          *   ^wal
		   wal       t walwa            ^wal
		-2 wal           lwal           ^wal
		   wal            wal           ^wal
		-3 wal                          ^wal
		   wal t                       r^wal
		-4 wal  t                     r  wal
		   wal t t>>>>>            r r r wal
		-5 wtlwalwalwalwalwalwalwalwalwalwal
		   watwalwalwalwalwalwalwalwalwalwal
		*/
		[0,0,0,"ground"],
		
		[0,0,0,"cart"],
		
		[-7000,5000,0,"wall",[[0,0],[1,0]]],
		[-6000,5000,0,"wall",[[0,0],[1,0]]],
		[-5000,5000,0,"wall",[[0,0],[1,0]]],
		[-4000,5000,0,"wall",[[0,0],[1,0]]],
		[-3000,5000,0,"wall",[[0,0],[1,0]]],
		[-2000,5000,0,"wall",[[0,0],[1,0]]],
		[-1000,5000,0,"wall",[[0,0],[1,0]]],
		[0,5000,0,"wall",[[0,0],[1,0]]],
		[1000,5000,0,"wall",[[0,0],[1,0]]],
		
		[-7000,-5000,0,"wall",[[0,0],[0,1]]],
		[-6000,-5000,0,"wall",[[0,0],[0,1]]],
		[-5000,-5000,0,"wall",[[0,0],[0,1]]],
		[-4000,-5000,0,"wall",[[0,0],[0,1]]],
		[-3000,-5000,0,"wall",[[0,0],[0,1]]],
		[-2000,-5000,0,"wall",[[0,0],[0,1]]],
		[-1000,-5000,0,"wall",[[0,0],[0,1]]],
		[0,-5000,0,"wall",[[0,0],[0,1]]],
		[1000,-5000,0,"wall",[[0,0],[0,1]]],
		
		[-8000,4000,0,"wall",[[0,1],[0,0]]],
		[-8000,3000,0,"wall",[[0,1],[0,0]]],
		[-8000,2000,0,"wall",[[0,1],[0,0]]],
		[-8000,1000,0,"wall",[[0,1],[0,0]]],
		[-8000,0,0,"wall",[[0,1],[0,0]]],
		[-8000,-1000,0,"wall",[[0,1],[0,0]]],
		[-8000,-2000,0,"wall",[[0,1],[0,0]]],
		[-8000,-3000,0,"wall",[[0,1],[0,0]]],
		[-8000,-4000,0,"wall",[[0,1],[0,0]]],
		
		[2000,4000,0,"wall",[[1,0],[0,0]]],
		[2000,3000,0,"wall",[[1,0],[0,0]]],
		[2000,2000,0,"wall",[[1,0],[0,0]]],
		[2000,1000,0,"wall",[[1,0],[0,0]]],
		[2000,0,0,"wall",[[1,0],[0,0]]],
		[2000,-1000,0,"wall",[[1,0],[0,0]]],
		[2000,-2000,0,"wall",[[1,0],[0,0]]],
		[2000,-3000,0,"wall",[[1,0],[0,0]]],
		[2000,-4000,0,"wall",[[1,0],[0,0]]],
		
		[-3000,2000,135,"wall",[[1,1],[1,1]]],
		[-2500,1500,135,"wall",[[1,1],[1,1]]],
		[-2000,1000,135,"wall",[[1,1],[1,1]]],
		
		[-4000,-1000,135,"wall",[[1,1],[1,1]]],
		[-3500,-1500,135,"wall",[[1,1],[1,1]]],
		[-3000,-2000,135,"wall",[[1,1],[1,1]]],
		
		[-8000,5000,-500,"wall",[[1,1],[1,1]]],
		[2000,5000,-500,"wall",[[1,1],[1,1]]],
		
		[-8000,-5000,-500,"wall",[[1,1],[1,1]]],
		[2000,-5000,-500,"wall",[[1,1],[1,1]]],
		
		[-1000,4999,0,"arrow_left"],
		[0,4999,0,"arrow_left"],
		
		[-7999,2000,0,"arrow_left"],
		[-7999,3000,0,"arrow_left"],
		
		[-6000,-4999,0,"arrow_left"],
		[-5000,-4999,0,"arrow_left"],
		
		[1999,-1000,0,"arrow_left"],
		[1999,-2000,0,"arrow_left"],
		[1999,-3000,0,"arrow_left"],
		
		/*
		 x x x
		x x x x
		 x x x
		*/
		[-4000,4000,0,"grass"],
		[-3000,4000,0,"grass"],
		[-2000,4000,0,"grass"],
		
		[-4500,3500,0,"grass"],
		[-3500,3500,0,"grass"],
		[-2500,3500,0,"grass"],
		[-1500,3500,0,"grass"],
		
		[-4000,3000,0,"grass"],
		[-3000,3000,0,"grass"],
		[-2000,3000,0,"grass"],
		
		[-7000,3000,0,"tree"],
		[-7000,2000,0,"tree"],
		[-7000,1000,0,"tree"],
		
		[-5000,0,0,"tree"],
		[-5000,-1000,0,"tree"],
		
		[-7000,-3000,0,"tree"],
		[-7000,-4000,0,"tree"],
		
		[-6500,-3500,0,"tree"],
		
		[-6000,-4000,0,"tree"],
		
		[-8000,-4500,500,"tree"],
		[-7500,-5000,500,"tree"],
		
		[0,-3000,0,"rock"],
		
		[500,-3500,0,"rock"],
		
		[-1000,-4000,0,"rock"],
		[0,-4000,0,"rock"],
		[1000,-4000,0,"rock"],
	],
};
