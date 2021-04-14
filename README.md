# Robbit

This project is about making an open source telepresence robot for students who can not attend school in person. The idea is that the robot will be placed on the table where the student is supposed to sit, and the student can remote control it from home/hospital/wherever via the internet. For video streaming we use WebRTC. The robots main parts are a smartphone running the app, which connects via bluetooth to a micro:bit robot for being able to move around (drive around and tilt the phone). The app is made with the Ionic framework.

# App
## getting started
Run `npm install`
To run it on your android phone (connected by usb cable)
Run `ionic cordova run android`

Note: currently there is a bug that when building for production the socket connection does not work.

To see if your phone is connected
Run `adb devices`

## Required files

Following files in the app folder is handling the environment settings. They are not included in this repository. Instead there are .example files that show how they should be structured. Be aware that these files are overridden when running docker-compose in the backend. The ```docker-entrypoint.sh``` in the app folder will in that case inject it's own ```.env.dev```.

* .env.dev
* .env.prod

# Backend

## Getting started
Make a copy of backend/docker/.env.example and rename it to .env and put in the right values. These should correspond to the .env files of the app. 


# See also

* All information about this project can be found in Swedish at https://www.robbit.se
* 3D models for this project https://www.thingiverse.com/thing:3360113

# Credits

Using the sound Open Button 2 by Kickhat with creative commons 0 license.
https://freesound.org/people/kickhat/sounds/264447/

Using the sound Correct by Ertfelda with creative commons 0 license.
https://freesound.org/people/ertfelda/sounds/243701/


