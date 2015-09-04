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

server.data[0] = {
	settings: {
		camHeight: 120,
		fieldOfView: utils.deg2rad(60),
		collisionRadius: 80,
		moveSpeed: 800,
		lookSpeed: utils.deg2rad(90),
		mouseSensitivity: utils.deg2rad(0.1),
	},
	cull: [[-5000,5000],[-4000,4000],[0,1000]],
	map: [
		/*
		x,y,z,model,collision-direction
		wal wall
		t   tree
		r   rock
		g   grass
		*   spawn/origin
		   -5 -4 -3 -2 -1  0  1  2  3  4  5
		 4    walwalwalwalwalwalwalwalwal
		      walwalwalwalwalwalwalwalwal
		 3 wal                           wal
		   wal           g g g           wal
		 2 wal    r     g g g g     t    wal
		   wal   r r     g g g     t t   wal
		 1 wal    r    wal   wal    t    wal
		   wal   r r   wal   wal   t t   wal
		 0 wal    r                 t    wal
		   wal   r r       *       t t   wal
		-1 wal    r    walwalwal    t    wal
		   wal         walwalwalwa       wal
		-2    walwal           lwalwalwal
		      walwalwalw  wal  lwalwalwal
		-3        alwalw  wal  lwa
		             alw       lwa
		-4           alwalwalwalwa
		               walwalwal
		*/
		[0,0,0,"ground"],
		
		[-4000,4000,0,"wall",[[0,0],[1,0]]],
		[-3000,4000,0,"wall",[[0,0],[1,0]]],
		[-2000,4000,0,"wall",[[0,0],[1,0]]],
		[-1000,4000,0,"wall",[[0,0],[1,0]]],
		[0,4000,0,"wall",[[0,0],[1,0]]],
		[1000,4000,0,"wall",[[0,0],[1,0]]],
		[2000,4000,0,"wall",[[0,0],[1,0]]],
		[3000,4000,0,"wall",[[0,0],[1,0]]],
		[4000,4000,0,"wall",[[0,0],[1,0]]],
		
		[-4000,-2000,0,"wall",[[0,0],[0,1]]],
		[-3000,-2000,0,"wall",[[0,1],[0,1]]],
		
		[2000,-2000,0,"wall",[[1,0],[0,1]]],
		[3000,-2000,0,"wall",[[0,0],[0,1]]],
		[4000,-2000,0,"wall",[[0,0],[0,1]]],
		
		[-5000,3000,0,"wall",[[0,1],[0,0]]],
		[-5000,2000,0,"wall",[[0,1],[0,0]]],
		[-5000,1000,0,"wall",[[0,1],[0,0]]],
		[-5000,0,0,"wall",[[0,1],[0,0]]],
		[-5000,-1000,0,"wall",[[0,1],[0,0]]],
		
		[5000,3000,0,"wall",[[1,0],[0,0]]],
		[5000,2000,0,"wall",[[1,0],[0,0]]],
		[5000,1000,0,"wall",[[1,0],[0,0]]],
		[5000,0,0,"wall",[[1,0],[0,0]]],
		[5000,-1000,0,"wall",[[1,0],[0,0]]],
		
		[-1000,1000,0,"wall",[[1,1],[1,1]]],
		[1000,1000,0,"wall",[[1,1],[1,1]]],
		
		[-1000,-1000,0,"wall",[[1,0],[1,1]]],
		[0,-1000,0,"wall",[[0,0],[1,1]]],
		[1000,-1000,0,"wall",[[0,1],[1,1]]],
		
		[-2500,-2500,0,"wall",[[0,0],[0,1]]],
		
		[-1500,-2500,0,"wall",[[0,1],[0,1]]],
		[-1500,-3500,0,"wall",[[0,1],[0,0]]],
		
		[1500,-1500,0,"wall",[[1,1],[0,1]]],
		[1500,-2500,0,"wall",[[1,0],[0,0]]],
		[1500,-3500,0,"wall",[[1,0],[0,0]]],
		
		[-1000,-4000,0,"wall",[[0,0],[0,1]]],
		[0,-4000,0,"wall",[[0,0],[0,1]]],
		[1000,-4000,0,"wall",[[0,0],[0,1]]],
		
		[0,-2500,-300,"wall",[[1,1],[1,1]]],
		
		[-5000,4000,500,"wall",[[1,1],[1,1]]],
		[5000,4000,500,"wall",[[1,1],[1,1]]],
		
		[-5000,-2000,500,"wall",[[1,1],[1,1]]],
		[5000,-2000,500,"wall",[[1,1],[1,1]]],
		
		/*
		 x x x
		x x x x
		 x x x
		*/
		[-1000,3000,0,"grass"],
		[0,3000,0,"grass"],
		[1000,3000,0,"grass"],
		
		[-1500,2500,0,"grass"],
		[-500,2500,0,"grass"],
		[500,2500,0,"grass"],
		[1500,2500,0,"grass"],
		
		[-1000,2000,0,"grass"],
		[0,2000,0,"grass"],
		[1000,2000,0,"grass"],
		
		[-3500,2000,0,"rock"],
		[-3500,1000,0,"rock"],
		[-3500,0,0,"rock"],
		
		[-3000,2500,0,"rock"],
		[-3000,1500,0,"rock"],
		[-3000,500,0,"rock"],
		[-3000,-500,0,"rock"],
		
		[-2500,2000,0,"rock"],
		[-2500,1000,0,"rock"],
		[-2500,0,0,"rock"],
		
		[2500,2000,0,"tree"],
		[2500,1000,0,"tree"],
		[2500,0,0,"tree"],
		
		[3000,2500,0,"tree"],
		[3000,1500,0,"tree"],
		[3000,500,0,"tree"],
		[3000,-500,0,"tree"],
		
		[3500,2000,0,"tree"],
		[3500,1000,0,"tree"],
		[3500,0,0,"tree"],
	],
};
