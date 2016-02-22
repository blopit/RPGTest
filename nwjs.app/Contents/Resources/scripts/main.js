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
require("scripts/passive_comps.js");
require("scripts/RPG_comps.js");

var mouse = {x: 0, y: 0};
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
        if (result < targ_fps) {
            fps_adjust--;
        } else if (result > targ_fps) {
            fps_adjust++;
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
var fps_adjust = 0;

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

//up_key, down_key, left_key, right_key,
// space_key, tab, shift, ctrl, alt,
// 1, 2, 3, 4, 5,
// w, a, s, d
key_codes = [38, 40, 37, 39,
    32, 9, 16, 17, 18,
    49, 50, 51, 52, 53,
    87, 65, 83, 68]; // key codes
var KEY = {
    vk_up: 0,
    vk_down: 1,
    vk_left: 2,
    vk_right: 3,
    vk_space: 4,
    vk_tab: 5,
    vk_shift: 6,
    vk_ctrl: 7,
    vk_alt: 8,
    vk_1: 9,
    vk_2: 10,
    vk_3: 11,
    vk_4: 12,
    vk_5: 13,
    vk_w: 14,
    vk_a: 15,
    vk_s: 16,
    vk_d: 17
};

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


    new Unit(300, 400, 0);
    new ControlledUnit(500, 400, 1);

    console.log(mitigation([750, 500, 0], [0.5, 1.0, 0]));

    var root = new Segment('root', null, 200, 200, 16, 0, 90);

    var body = new Segment('torso', root, 0, 0, 8, 0, 90);
    var Larm = new Segment('LUarm', root, 0, 0, 12, 270 + 45);
    var Rarm = new Segment('RUarm', root, 0, 0, 12, 90 - 45);

    var LSarm = new Segment('LLarm', Larm, 0, 0, 8, 45, 0);
    var RSarm = new Segment('RLarm', Rarm, 0, 0, 8, -45, 0);

    var Lleg = new Segment('LUleg', body, 0, 0, 8, 270 + 15, 45);
    var Rleg = new Segment('RUleg', body, 0, 0, 8, 90 - 15, 45);

    var LSleg = new Segment('LLleg', Lleg, 0, 0, 12, 0, 90);
    var RSleg = new Segment('RLleg', Rleg, 0, 0, 12, 0, 90);

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

    }, Math.max(1000 / targ_fps + fps_adjust, 1)); //60fps TODO: find better/faster way to do this
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

document.onmousemove = function (e) {
    var rect = canvas.getBoundingClientRect();
    mouse = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
};