#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

/*
	
	VU movie maker
	
	Copyright (c) Johan Zetterberg
	
	The software is provided "as is" without any warranty. Use at your own risk!
	Under no circumstance should the authors be hold responsible for any damages that this software might cause.
	
	How to install:
	===============
	OS X:	   brew install pkg-config cairo libpng jpeg giflib
	Ubuntu:	 sudo apt-get install nodejs npm ffmpeg libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++
	Fedora:	 sudo yum install nodejs npm ffmpeg cairo cairo-devel cairomm-devel libjpeg-turbo-devel pango pango-devel pangomm pangomm-devel giflib-devel
	Solaris: pkgin install nodejs npm ffmpeg cairo pkg-config xproto renderproto kbproto xextproto
	Windows: Read instructions on the following web sites: 
	Windows:   https://nodejs.org/  
	Windows:   https://github.com/felixrieseberg/windows-build-tools  
	Windows:   https://github.com/Automattic/node-canvas/wiki/Installation---Windows
	
	Open command/prompt/terminal and type:
	cd path/to/this/folder/
	npm install
	
	
	How to run:
	===========
	Type the following command in the command/prompt/terminal:
	nodejs moviemaker.js world era
	
	(replace world, and era with numbers!)
	If era is omitted, last era will be used.
	
	
	Creating the movie:
	===================
	Type the following command in the command/prompt/terminal:
	ffmpeg -r 3 -i frames/%04d.png -c:v libx264 -pix_fmt yuv420p vumovie.mp4
	
	-r stands for framerate (fps)
	Some players will have trouble handling libx264 framerates other then 25, then try:
	ffmpeg -r 3 -i frames/%04d.png -b:v 2M -pix_fmt yuv420p vumovie.avi
	
	
	Posting video in the forum:
	===========================
	1. Make a reply
	2. Click edit post
	3. Right click the post and select "Inspect Element" (or open browser dev tools and find the element)
	4. Right click on the element (in dev tools) and select "Edit as HTML":
	5. Paste the following code between the <body> elements and don't forget to change the source src url!
	<video controls="" width="100%">
	<source src="http://static.visual-utopia.com/video/zetamania_56.mp4" type="video/mp4">
	</video>
	
	
	
	Ideas
	=====
	Change ruler color when he/she joins/switch kingdom !?
	
*/

"use strict";

var TEST = (process.argv[4] == "-t"); // Outputs only one image if set to true

	var SHOW_KINGDOM_BORDERS = true;
	var SHOW_KINGDOM_BANNERS = true;
	var KINGDOM_BANNER_ALPHA = 0.25;
	var SHOW_RULER_BORDERS = true;
	
	var WORLD_NAME = process.argv[2] || "Fantasia";
	var ERA = process.argv[3] || "last";
	
	var WORLD_ID;
	
	var CANVAS_SIZE = 1000;
	
	var ARMY_WIDTH = 3;
	var ARMY_HEIGHT = 3;
	
	
	var IMG_FOLDER = "./frames/";
	
	// Mapping of ownerId to color. A random color will be generated if the ruler id does not exist in this list
	var RULER_COLORS = {}; 
	
	// Mapping of kd to color. A random color will be generated if the kingdom id does not exist in this list
	var KINGDOM_COLORS = {
		5783: "#46d2c4",
		5889: "#740100",
		5987: "#bb46d2",
	5204: "#55b6d2",
	6002: "#89996b",
	6001: "#b58570",
	5913: "#014701",
	5999: "#81b83a",
	5992: "#d6a636",
	6000: "#8a6a52",
	5950: "#b106a7",
	5410: "#f65616",
	5927: "#88ced5"
	
	}; 
	
	
	function main() {
		
	WORLD_NAME = WORLD_NAME.toLowerCase();
	// World names converted to lower case
	if(WORLD_NAME == "fantasia") WORLD_ID = 1;
	else if(WORLD_NAME == "mantrax") WORLD_ID = 2;
	else if(WORLD_NAME == "zetamania") WORLD_ID = 3;
	else if(WORLD_NAME == "starta") WORLD_ID = 4;
	else if(WORLD_NAME == "nirvana") WORLD_ID = 5;
	else if(WORLD_NAME == "valhalla") WORLD_ID = 6;
	else if(WORLD_NAME == "armageddon") WORLD_ID = 7;
	else if(WORLD_NAME == "talents") WORLD_ID = 8;
	else if(WORLD_NAME == "midgard") WORLD_ID = 9;
	else if(WORLD_NAME == "latha") WORLD_ID = 10;
	else if(WORLD_NAME == "fensteria") WORLD_ID = 11;
	else if(WORLD_NAME == "mogrox") WORLD_ID = 12;
	else if(WORLD_NAME == "good vs evil") WORLD_ID = 13;
	else WORLD_ID = parseInt(WORLD_NAME);
	
	if(isNaN(WORLD_ID)) throw new Error("The first parameter needs to be the name of the world or the world id! WORLD_NAME=" + WORLD_NAME + " WORLD_ID=" + WORLD_ID);
		
		var csvUrl = "http://visual-utopia.com/history/" + WORLD_ID + "_" + ERA + ".csv";
		
		var folderCleared = false;
		var mapBackground;
		var frames;
		var kingdomBanners;
		
		getTextFromUrl(csvUrl, function gotCsv(err, text) {
			if(err) throw err;
			
			text = text.trim(); // Remove emty lines
			
			var rows = text.split(/\n/);
			
			var metaData = rows.shift(); // First row contains metadata
			
			var world = {
				id: parseInt(findText(metaData, /world=(\d+)/)),
				era: parseInt(findText(metaData, /era=(\d+)/)),
				map: parseInt(findText(metaData, /map=(\d+)/)),
				size: parseInt(findText(metaData, /size=(\d+)/))
			};
			
			makeMapBackground(world, function mapBackgroundCreated(err, imageCanvas) {
				if(err) throw err;
				mapBackground = imageCanvas;
				paintFramesMaybe();
			});
			
			
			frames = makeFrames(rows, world); // Will populate KINGDOM_COLORS and RULER_COLORS
			
			if(SHOW_KINGDOM_BANNERS) {
				var kingdoms = Object.keys(KINGDOM_COLORS);
				//console.log("Getting kingdom banners " + JSON.stringify(kingdoms) + "...");
				console.time("Get kingdom banners");
				getKingdomBanners(kingdoms, function gotKingdomBanners(err, mapOfKdIdToBannerImageCanvas) {
					if(err) throw err;
					kingdomBanners = mapOfKdIdToBannerImageCanvas;
					console.timeEnd("Get kingdom banners");
					paintFramesMaybe();
				});
			}
			else paintFramesMaybe();
			
		});
		
		clearFolder(IMG_FOLDER, function framesFolderCleared(err) {
			if(err) throw err;
			folderCleared = true;
			paintFramesMaybe();
		});
		
		function paintFramesMaybe() {
			if(folderCleared && mapBackground && frames && (SHOW_KINGDOM_BANNERS == !!kingdomBanners) ) {
				for (var i=0; i<frames.length; i++) paintFrame(frames[i], i, mapBackground, kingdomBanners);
			}
			//else console.log("folderCleared=" + folderCleared + " mapBackground=" + !!mapBackground + " frames=" + !!frames + " kingdomBanners=" + (SHOW_KINGDOM_BANNERS == !!kingdomBanners) + " ");
		}
		
	}
	
	
	
	function clearFolder(directory, callback) {
		console.log("Clearing folder: " + directory + " ...");
		var fs = require('fs');
		var path = require('path');
		
		fs.readdir(directory, function dirRead(err, files) {
		if (err) {
			if(err.code != "ENOENT") throw err;
			return fs.mkdir(directory, callback);
		}
		
		var filesDeleted = 0;
			
			if(files.length == 0) return callback(null);
			
			for (var i=0; i<files.length; i++) remove(path.join(directory, files[i]));
			
			function remove(filePath) {
				console.log("Removing " + filePath + " ...");
				fs.unlink(filePath, function fileRemoved(err) {
				if (err) throw err;
					
					console.log("Deleted " + filePath);
					
					if(++filesDeleted == files.length) callback(null);
				});
			}
		});
	}
	
	
	function makeMapBackground(world, callback) {
		
		var mapImg = "";
		
		if(world.map == 1) mapImg = "vuQ.jpg";
		else if(world.map == 2) mapImg = "karta3.jpg";
	else if(world.map == 3) mapImg = "desert.jpg";
	else if(world.map == 4) mapImg = "karta6.jpg";
	else if(world.map == 5) mapImg = "mogrox.jpg";
	else if(world.map == 6) mapImg = "manxmap_HQ.jpg";
	else if(world.map == 7) mapImg = "shatteredworlds_HQ.jpg";
	else if(world.map == 8) mapImg = "bigsnowmap_HQ.jpg";
	else if(world.map == 9) mapImg = "arkan_HQ.png";
	else if(world.map == 10) mapImg = "rivers_HQ.png";
	else throw new Error("Unknown world.map=" + world.map);
		
		var imageType = mapImg.substring(mapImg.lastIndexOf(".")+1);
		
		var assetUrl = "http://static.visual-utopia.com/images/";
		
		var mapImageUrl = assetUrl + mapImg;
		
		var fs = require("fs");
		fs.mkdir("./maps", function kdbannerFolderCreated(err) {
			if(err) {
				if(err.code != "EEXIST") throw err;
			}
			
			fs.readFile("./maps/" + mapImg, function getMapImage(err, imgBuffer) {
				if(err) {
					if(err.code=="ENOENT") getImageDataFromUrl(mapImageUrl, mapImageDownloaded);
				}
				else createImage(imgBuffer);
			});
			
		});
		
		function mapImageDownloaded(err, imageData) {
			if(err) throw err;
			
			fs.writeFile("./maps/" + mapImg, imageData, function fileSaved(err) {
				if(err) throw err;
				console.log("Map saved: " + mapImg);
			});
			
			createImage(imageData);
		}
		
		function createImage(imageData) {
			
			// Paint the image on the canvas
			var Canvas = require('canvas');
			var mapTile = new Canvas.Image;
			mapTile.src = imageData;
			
			//var fs = require("fs");
			//fs.writeFileSync(mapImg, imageData);
			
			var mapSize = world.size * 2;
			var mapScale = CANVAS_SIZE / mapSize;
			var tileSize = Math.floor(2500 * mapScale);
			var tileRepeat = Math.floor(mapSize / 2500);
			
			console.log("mapSize=" + mapSize + " mapScale=" + mapScale + " tileSize=" + tileSize);
			
			var Canvas = require('canvas');
			var mapBackground = new Canvas(CANVAS_SIZE, CANVAS_SIZE);
			var ctx = mapBackground.getContext('2d');
			
			//ctx.drawImage(mapTile,0,0, tileSize, tileSize);
			
			var xStart = 0;
			var yStart = 0;
			
			if(mapSize % 2500 != 0) {
				tileRepeat += 2;
				xStart = -(mapSize % 2500) / 2 * mapScale;
				yStart = -(mapSize % 2500) / 2 * mapScale;
			}
			
			for (var x=xStart; x<CANVAS_SIZE; x+=tileSize) {
				for (var y=yStart; y<CANVAS_SIZE; y+=tileSize) {
					console.log("x=" + x + " y=" + y);
					ctx.drawImage(mapTile, x, y, tileSize, tileSize);
				}
			}
			
			//saveImage(__dirname + '/background.png') // Save background for debugging purpose
			
			callback(null, mapBackground);
			
		}
	}
	
	function getImageDataFromUrl(url, callback) {
		var http = require('http');
		var Stream = require('stream').Transform;
		var req = http.request(url, function(response) {
			
			//console.log(url + " (" + response.statusCode + ")");
			
			if(response.statusCode != 200) {
				var err = new Error("Unable to get image from url=" + url + " (response.statusCode=" + response.statusCode + ")");
				err.code = response.statusCode;
				req.abort();
				return callback(err);
			}
			
			var imgDataStream = new Stream();
			
			response.on('data', function(chunk) {
				imgDataStream.push(chunk);
			});
			
			response.on('end', function() {
				console.log("Image downloaded: " + url);
				var imageData = imgDataStream.read();
				
				callback(null, imageData);
			});
			
		});
		
		req.end();
	}
	
	function getTextFromUrl(url, callback) {
		var http = require('http');
		var Stream = require('stream').Transform;
		var req = http.request(url, function(response) {
			
			//console.log(url + " (" + response.statusCode + ")");
			
			if(response.statusCode != 200) {
				var err = new Error("Unable to get text from url=" + url + " (response.statusCode=" + response.statusCode + ")");
				err.code = response.statusCode;
				req.abort();
				return callback(err);
			}
			
			var data = "";
			
			response.on('data', function(chunk) {
				data += chunk;
			});
			
			response.on('end', function() {
				console.log("File downloaded: " + url);
				
				callback(null, data);
			});
			
		});
		
		req.end();
	}
	
	
	function makeFrames(rows, world) {
		
		console.time("Parsing " + rows.length + " rows of csv data");
		
		var mapSize = world.size * 2;
		var mapScale = CANVAS_SIZE / mapSize;
		
		var frames = [{cities: [], armies: []}];
		var frame = 0;
		
		var firstRow = rows[0].split(",");
		var lastRow = rows[rows.length-1].split(",");
		var dayStart = parseInt(firstRow[0]);
		var dayEnd = parseInt(lastRow[0]);
		
		if(TEST) dayEnd = dayStart;
		
		console.log("dayStart=" + dayStart + " dayEnd=" + dayEnd);
		
		var currentDay = dayStart;
		
		var colonySize = [10,10,20,30,40,50,60,70,75,75];
		
		var armySize = 20;
		
		// CSV is in this order:
		var day, X, Y, kingdomId, worldId, size, type, ownerId;  
		
		for (var i=0; i<rows.length; i++) {
			
			//console.log("Computing row " + i + ": " + JSON.stringify(rows[i]));
			
			rows[i] = rows[i].split(",");
			
			//console.log(rows[i]);
			
			day = parseInt(rows[i][0]);
			X = parseInt(rows[i][1]);
			Y = parseInt(rows[i][2]);
			kingdomId = parseInt(rows[i][3]);
			worldId = parseInt(rows[i][4]);
			size = parseInt(rows[i][5]);
			type = rows[i][6];
			ownerId = parseInt(rows[i][7]);
			
			if(day != currentDay) {
				if(TEST) break;
				frame = frames.push({cities: [], armies: []}) -1;
				if((day - currentDay) != 1) console.warn("Warning: day=" + day + " currentDay=" + currentDay + "");
				currentDay = day;
			}
			
			if(type=="city") {
				frames[frame].cities.push({
					x: Math.round((X + world.size) * mapScale),
					y: Math.round((Y + world.size) * mapScale), 
					radius: colonySize[size] * mapScale,
					kd: kingdomId,
					ownerId: ownerId,
					color: getColor(kingdomId, ownerId)
				});
			}
			else if(type=="army") {
				frames[frame].armies.push({
					x: (X + world.size) * mapScale,
					y: (Y + world.size) * mapScale,
					color: getColor(kingdomId, ownerId)
				});
			}
		}
		console.timeEnd("Parsing " + rows.length + " rows of csv data");
		
		if(frames.length != (dayEnd - dayStart + 1)) throw new Error("frames.length=" + frames.length + " dayStart=" + dayStart + " dayEnd=" + dayEnd);
		
		
		return frames;
	}
	
	
	function paintFrame(frame, frameNr, mapBackground, kingdomBanners) {
		
		console.time("paintFrame " + frameNr);
		
		var Canvas = require('canvas');
		var mapCanvas = new Canvas(CANVAS_SIZE, CANVAS_SIZE);
		var ctx = mapCanvas.getContext('2d');
		
		//ctx.clearRect(0,0, CANVAS_SIZE, CANVAS_SIZE);
		
		ctx.drawImage(mapBackground, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
		
		var Voronoi = require("voronoi");
		var voronoi = new Voronoi();
		var bbox = {xl: 0, xr: CANVAS_SIZE, yt: 0, yb: CANVAS_SIZE}; // xl is x-left, xr is x-right, yt is y-top, and yb is y-bottom
		
		var diagram = voronoi.compute(frame.cities, bbox);
		
		
		
		/*
			ctx.beginPath();
			ctx.arc(CANVAS_SIZE/2, CANVAS_SIZE/2, CANVAS_SIZE/2, 0, 2*Math.PI);
			ctx.stroke();
			ctx.fillStyle = "orange";
			ctx.fill();
		*/
		
		
		if(SHOW_KINGDOM_BANNERS) {
			// Alpha of the kingdom banner patters can not be set here, but we can set the alpha for those without a banner
			ctx.globalAlpha = KINGDOM_BANNER_ALPHA;
			
			var cells = diagram.cells;
			var halfedges, nHalfedges, v, iHalfedge;
			var colvalues = '0123456789ABCDEF';
			
			for (var i=0; i<cells.length; i++) {
				//console.log(cells[i].site);
				halfedges = cells[i].halfedges;
				nHalfedges = halfedges.length;
				//this.assert(nSegments > 0);
			if(halfedges.length == 0) {
				console.warn("halfedges.length=0");
				continue;
			}
			v = halfedges[0].getStartpoint();
				ctx.beginPath();
				ctx.moveTo(v.x,v.y);
				for (iHalfedge=0; iHalfedge<nHalfedges; iHalfedge++) {
					v = halfedges[iHalfedge].getEndpoint();
					//console.log(v);
					ctx.lineTo(v.x,v.y);
				}
				//ctx.closePath();
				//ctx.fillStyle='#'+colvalues[(Math.random()*16)&15]+colvalues[(Math.random()*16)&15]+colvalues[(Math.random()*16)&15];
				
				if(cells[i].site.kd == 0) {
					//ctx.fillStyle = cells[i].site.color;
				}
				else {
					ctx.fillStyle=kingdomBanners[cells[i].site.kd];
					ctx.fill();
				}
				//ctx.fillStyle = "rgb(200,200,0)";
				//ctx.stroke();
				
			}
		}
		
		if(SHOW_KINGDOM_BORDERS) {
			// Kingdom borders
			//console.log(JSON.stringify(diagram.edges, null, 2));
			ctx.globalAlpha = 0.7;
			ctx.setLineDash([4, 2]);
			ctx.lineWidth = 4;
			ctx.strokeStyle = "rgb(0, 0, 0)";
			var edges = diagram.edges;
			for (var i=0; i<edges.length; i++) {
				if(edges[i].lSite && edges[i].rSite) {
					if(edges[i].lSite.kd != edges[i].rSite.kd) {
						//console.log(edges[i]);
						ctx.beginPath();
						ctx.moveTo(edges[i].va.x, edges[i].va.y);
						ctx.lineTo(edges[i].vb.x, edges[i].vb.y);
						//ctx.strokeStyle = edges[i].lSite.color;
						ctx.stroke();
					}
				}
			}
		}
		
		if(SHOW_RULER_BORDERS) {
			ctx.globalAlpha = 1;
			ctx.setLineDash([2, 1]);
			ctx.lineWidth = 1;
			var edges = diagram.edges;
			for (var i=0; i<edges.length; i++) {
				if(edges[i].lSite && edges[i].rSite) {
					if(edges[i].lSite.ownerId != edges[i].rSite.ownerId ) { // && (edges[i].lSite.kd == 0 || edges[i].rSite.kd == 0)
						//console.log(edges[i]);
						ctx.beginPath();
						ctx.moveTo(edges[i].va.x, edges[i].va.y);
						ctx.lineTo(edges[i].vb.x, edges[i].vb.y);
						ctx.strokeStyle = edges[i].lSite.color;
						ctx.stroke();
					}
				}
			}
		}
		
		// Cities
		var cityStartingAngle = 0;
		var cityEndingAngle = 2*Math.PI;
		
		ctx.globalAlpha = 1;
		
		ctx.setLineDash([]);
		ctx.lineWidth = 3;
		ctx.strokeStyle = "black";
		ctx.fillStyle = "black";
		for (var i=0; i<frame.cities.length; i++) {
			ctx.beginPath();
			ctx.arc(frame.cities[i].x, frame.cities[i].y, frame.cities[i].radius, cityStartingAngle, cityEndingAngle);
			ctx.stroke();
			ctx.fillStyle = frame.cities[i].color;
			//ctx.fillStyle = kingdomBanners[obj.kingdomId];
			ctx.fill();
		}
		
		
		// Armies
		ctx.globalAlpha = 1;
		ctx.lineWidth = 1;
		ctx.strokeStyle = "black";
		for (var i=0; i<frame.armies.length; i++) {
			ctx.beginPath();
			ctx.rect(frame.armies[i].x-ARMY_WIDTH/2, frame.armies[i].y-ARMY_HEIGHT/2, ARMY_WIDTH, ARMY_HEIGHT);
			ctx.fillStyle = frame.armies[i].color;
			ctx.stroke();
			ctx.fill();
		}
		
		saveImage(mapCanvas, IMG_FOLDER + zeroPad(frameNr) + ".png", function(err) {
		if(err) throw err;
		});
	
	console.timeEnd("paintFrame " + frameNr);
	}
	
	
	
	function getColor(kingdomId, ownerId) {
		
		//console.log("getColor: kingdomId=" + kingdomId + " ownerId=" + ownerId);
		
		var color;
		if(kingdomId == 0) {
			if(!RULER_COLORS.hasOwnProperty(ownerId)) {
				RULER_COLORS[ownerId] = randomColor();
			}
		}
		else {
			if(!KINGDOM_COLORS.hasOwnProperty(kingdomId)) {
				KINGDOM_COLORS[kingdomId] = randomColor();
			}
			
			if(ownerId == 0) return KINGDOM_COLORS[kingdomId];
			
			if(!RULER_COLORS.hasOwnProperty(ownerId)) {
				RULER_COLORS[ownerId] = KINGDOM_COLORS[kingdomId];
			}
		}
		
		return RULER_COLORS[ownerId];
	}
	
	function randomColor() {
		var colvalues = '0123456789ABCDEF';
		var hexColor = '#'+colvalues[(Math.random()*16)&15]+colvalues[(Math.random()*16)&15]+colvalues[(Math.random()*16)&15];
		//console.log("random hexColor=" + hexColor);
		return hexColor;
	}
	
	
	function getKingdomBanners(kingdoms, callback) {
		
		var kingdomBanners = {};
		var kingdomBannerUrl = "http://visual-utopia.com/KDbanners/"; // kingdom1234.jpg
		var Canvas = require('canvas');
		var kingdomBannerPatternCanvas = new Canvas(120, 100);
		var canvasWidth = 120;
		var canvasHeight = 100;
		var canvas = []; // We need one canvas for each kingdom banner
		
		
		//for (var i=0; i<kingdoms.length; i++) {
		
		var kingdomBannersLoaded = 0;
		
		
		var fs = require("fs");
		fs.mkdir("./kdbanners", function kdbannerFolderCreated(err) {
			if(err) {
				if(err.code != "EEXIST") throw err;
			}
			
			kingdoms.forEach(loadBanner);
			
		});
		
		function loadBanner(kingdomId) {
			var imgName = "kingdom" + kingdomId + ".jpg";
			fs.readFile("./kdbanners/" + imgName, function(err, imgBuffer) {
				if(err) {
					if(err.code=="ENOENT") {
						
						getImageDataFromUrl(kingdomBannerUrl + imgName, function imageDownloaded(err, imageData) {
							if(err) {
								if(err.code == 404) {
									// Kingdom has no kingdom banner
									var colvalues = '0123456789ABCDEF';
									kingdomBanners[kingdomId] = '#'+colvalues[(Math.random()*16)&15]+colvalues[(Math.random()*16)&15]+colvalues[(Math.random()*16)&15];
									if(++kingdomBannersLoaded == kingdoms.length) callback(null, kingdomBanners);
								}
								else throw err;
							}
							else {
								
								makeBannerCanvas(kingdomId, imageData);
								
								fs.writeFile("./kdbanners/" + imgName, imageData, function imageSaved(err) {
									if(err) throw err;
									//console.log("Kingdom banner saved: " + imgName);
								});
							}
						});
					}
				}
				else makeBannerCanvas(kingdomId, imgBuffer);
			});
		}
		
		function makeBannerCanvas(kingdomId, imageData) {
			
			//console.log("Make canvas for kingdomId=" + kingdomId);
			
			// We need to put the images in a canvas for transparency to work!
			var canvasId = canvas.push(new Canvas(canvasWidth, canvasHeight)) -1;
			
			var ctx = canvas[canvasId].getContext('2d');
			ctx.globalAlpha = KINGDOM_BANNER_ALPHA;
			
			var kingdomBanner = new Canvas.Image;
			kingdomBanner.src = imageData;
			
			//ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			ctx.drawImage(kingdomBanner, 0, 0, canvasWidth, canvasHeight);
			
			kingdomBanners[kingdomId] = ctx.createPattern(canvas[canvasId], "repeat");
			
			if(++kingdomBannersLoaded == kingdoms.length) callback(null, kingdomBanners);
			
		}
	}
	
	function saveImage(canvas, filePath, callback) {
	
	if(callback == undefined) throw new Error("No callback!");
	
		var fs = require('fs');
		
		var fileStream = fs.createWriteStream(filePath);
		var imageStream = canvas.pngStream();
		
		imageStream.on('data', function(chunk){
			fileStream.write(chunk);
		});
		
		imageStream.on('end', function(){
			console.log("Saved " + filePath);
		callback(null);
		});
	}
	
	function findText(myString, myRegexp) {
		var match = myRegexp.exec(myString);
		//console.log("match: " + JSON.stringify(match));
		return match[1];
	}
	
	function zeroPad(nr) {
		var str = nr.toString();
	var padLength = 4;
		for(var i=str.length; i<padLength; i++) str = "0" + str;
		return str;
	}
	
	main();

