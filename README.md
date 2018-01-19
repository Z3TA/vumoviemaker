# vumoviemaker
Make VU movies


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


