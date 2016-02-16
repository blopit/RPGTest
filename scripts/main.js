////////////////////////////////////////////////////////////////////////////////
// Ajax sync script require
// sync aditional JS scripts, makes things modular
////////////////////////////////////////////////////////////////////////////////

//add required scripts in post (Not actually required can just add in html...)
function require(jsFilePath) {
    var js = document.createElement("script");

    js.type = "text/javascript";
    js.src = jsFilePath;

    document.body.appendChild(js);
}

require("scripts/base_objects.js");
require("scripts/computation.js");
require("scripts/camera.js");
require("scripts/passives.js");

var fps = {
    startTime: 0,
    frameNumber: 0,
    getFPS: function () {
        this.frameNumber++;
        var d = new Date().getTime(),
            currentTime = ( d - this.startTime ) / 1000,
            result = Math.floor(( this.frameNumber / currentTime ));
        if (currentTime > 1) {
            this.startTime = new Date().getTime();
            this.frameNumber = 0;
        }
        return result;
    }
};
var f = document.querySelector("#fps");

////////////////////////////////////////////////////////////////////////////////
// Globals
////////////////////////////////////////////////////////////////////////////////

//screen globals
screen_width = 800;
screen_height = 600;
timefctr = 1.0;         //time factor
time = 0;               //time increment

normal = true; //NORMAL EXECUTION VARIABLE
currrent_loc = 0;

//Global initializations
objects = [];
var targ_fps = 60;

canvas = null;
c = null;

//KEYBOARD GLOBALS
//up,down,left,right,jump,att,item
//how long since last key press of same key
//how long key has been held down

/*var KEYS = {
 vk_up : 38,
 vk_down: 40,
 vk_left : {value: 2, name: "Large", code: "L"}
 };*/

key = [];
key_press = [];
key_release = [];
key_rel = [];

//up_key, down_key, left_key, right_key, space_key, space_key, space_key
key_codes = [38, 40, 37, 39, 32, 32, 32]; // key codes
var KEY = {
    vk_up: 0,
    vk_down: 1,
    vk_left: 2,
    vk_right: 3
}

////////////////////////////////////////////////////////////////////////////////
// Event loop
////////////////////////////////////////////////////////////////////////////////

window.onload = function () {

    //set keys
    for (var i = 0; i < key_codes.length; i++) {
        key.push(false);
        key_press.push(false);
        key_release.push(false);
        key_rel.push(true);
    }

    //get & set canvas
    canvas = document.getElementById('screen')
    c = canvas.getContext("2d", {alpha: false})
    canvas.width = screen_width;
    canvas.height = screen_height;
    c.imageSmoothingEnabled = false;

    cam = new Camera(0.15);


    objects.push(new Unit(300, 400, 0));
    objects.push(new ControlledUnit(500, 400, 1));

    console.log(mitigation([750, 500, 0], [0.5, 1.0, 0]));

    //MAIN GAME LOOP
    setInterval(function () {
        time++;
        f.innerHTML = "FPS: " + fps.getFPS();
        //save canvas settings
        c.save();
        c.translate(0.5, 0.5);
        //clear screen & draw background
        //c.clearRect(0,0,screen_width,screen_height);
        c.fillStyle = "darkblue";
        c.fillRect(0, 0, screen_width, screen_height);

        //draw objects relative to centered camera
        //c.translate(cam.width/2-cam.cx,cam.height/2-cam.cy);

        //draw objects TODO: draw objects by depth property

        var objs = objects.clone();
        for (i = 0; i < objs.length; i++) {
            var o = objs[i];
            o.update();
            o.draw();
        }

        //restore saved canvas
        c.restore();

        //reset keys
        for (var i = 0; i < key_press.length; i++) {
            key_press[i] = false;
            key_release[i] = false;
        }

    }, 1000 / targ_fps); //60fps TODO: find better/faster way to do this
};


function actionForEvent(e) {
    var k = e.which;
    for (var i = 0; i < key_codes.length; i++) {
        if (k == key_codes[i])
            return i;
    }
    return null;
}

window.onkeydown = function (e) {
    var action = actionForEvent(e);
    key[action] = true;
    if (key_rel[action]) {
        key_press[action] = true;
        key_rel[action] = false;
    }

};

window.onkeyup = function (e) {
    var action = actionForEvent(e);
    key[action] = false;
    key_release[action] = true;
    key_rel[action] = true;
};
