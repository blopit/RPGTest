////////////////////////////////////////////////////////////////////////////////
// Drawing Functions
////////////////////////////////////////////////////////////////////////////////

var CP = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
if (CP.lineTo) {
    CP.dashedLine = function (x, y, x2, y2, da) {
        if (!da) da = [10, 5];
        this.save();
        var dx = (x2 - x), dy = (y2 - y);
        var len = Math.sqrt(dx * dx + dy * dy);
        var rot = Math.atan2(dy, dx);
        this.translate(x, y);
        this.moveTo(0, 0);
        this.rotate(rot);
        var dc = da.length;
        var di = 0, draw = true;
        x = 0;
        while (len > x) {
            x += da[di++ % dc];
            if (x > len) x = len;
            draw ? this.lineTo(x, 0) : this.moveTo(x, 0);
            draw = !draw;
        }
        this.restore();
    }
}

function roundRect(c, x, y, w, h, r, fill, stroke) {
    w = Math.ceil(w);
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    if (r < 0) r = 0;
    if (w < 3) stroke = false;

    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
    if (fill) {
        c.fill();
    }
    if (stroke) {
        c.stroke();
    }
}

//////////////////////////////////////////

Array.prototype.max = function () {
    return Math.max.apply(null, this);
};

Array.prototype.min = function () {
    return Math.min.apply(null, this);
};

Array.prototype.clone = function () {
    return this.slice(0);
};

function contains(a, obj) {
    for (var i = 0; i < a.length; i++) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}

function remove(a, obj) {
    var i = a.indexOf(obj);
    if (i != -1) {
        a.splice(i, 1);
    }
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function defToColor(col) {
    if (col[0] == -1) {
        return "rgba(0,0,0,0)";
    }

    var max = Math.max.apply(null, col);
    if (max === 0)
        return "#000";
    return rgbToHex(~~(255 * col[0] / max), ~~(255 * col[1] / max), ~~(255 * col[2] / max));
}

////////////////////////////////////////////////////////////////////////////////
// Math Functions
////////////////////////////////////////////////////////////////////////////////

function log(val, base) {
    return Math.log(val) / Math.log(base);
}

function choose(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomRangeInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//FOR SAFARI, safari does not like sign function :(
Math.sign = Math.sign || function (x) {
        x = +x;
        if (x === 0 || isNaN(x)) {
            return x;
        }
        return x > 0 ? 1 : -1;
    };


function median(values) {

    values.sort(function (a, b) {
        return a - b;
    });

    var half = Math.floor(values.length / 2);

    if (values.length % 2)
        return values[half];
    else
        return (values[half - 1] + values[half]) / 2.0;
}

//distance between two points (x1,y1) and (x2,y2)
function distPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

//angle between two points starts in East quadrant returns PI <-> -PI
function anglePoints(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

function angleDiff(a0, a1) {
    var M2PI = Math.PI * 2;
    return ((((a0 - a1) % M2PI) + (M2PI + Math.PI)) % M2PI) - Math.PI;
}

function rotate(dir, target, sp) {
    var spd = sp / 180 * Math.PI;
    return (dir + median([-spd, spd, angleDiff(target, dir)]));
}

//returns value (q) mitigate by an amount of (fr)
function fric(q, fr) {
    var s = q;
    if (Math.abs(s) > fr) {
        s -= fr * Math.sign(s)
    }
    else {
        s = 0;
    }
    return s;
}

////////////////////////////////////////////////////////////////////////////////
// Collision Functions
////////////////////////////////////////////////////////////////////////////////

//Rectangle collsion with Rectangle
function colRxR(rect1, rect2) {
    return (rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.height + rect1.y > rect2.y);
}

//Rectangle collsion with line segment with endpoints p1,p2
function colRxL(rect, p1, p2) {
    var minX = p1.x;
    var maxX = p2.x;

    if (p1.x > p2.x) {
        minX = p2.x;
        maxX = p1.x;
    }

    if (maxX > rect.x + rect.width)
        maxX = rect.x + rect.width;

    if (minX < rect.x)
        minX = rect.x;

    if (minX > maxX)
        return false;

    var minY = p1.y;
    var maxY = p2.y;

    var dx = p2.x - p1.x;

    if (Math.abs(dx) > 0.0000001) {
        var a = (p2.y - p1.y) / dx;
        var b = p1.y - a * p1.x;
        minY = a * minX + b;
        maxY = a * maxX + b;
    }

    if (minY > maxY) {
        var tmp = maxY;
        maxY = minY;
        minY = tmp;
    }

    if (maxY > rect.y + rect.height)
        maxY = rect.y + rect.height;

    if (minY < rect.y)
        minY = rect.y;

    if (minY > maxY)
        return false;

    return true;
}

////////////////////////////////////////////////////////////////////////////////
// Movement Functions
////////////////////////////////////////////////////////////////////////////////

//simple movement
//adjusts x and y of obj based on vertical and horizontal speeds
function simpMove(obj, b) {

    //Loop though values adn adjust accordingly
    if (obj.vsp > 0) {
        for (var i = 0; i < obj.vsp * timefctr; i++) {
            if (!colPlace(obj, b, 0, 1)) {
                obj.y += 1;
            } else {
                obj.vsp = 0;
                break;
            }
        }
    } else if (obj.vsp < 0) {
        for (var i = 0; i < -obj.vsp * timefctr; i++) {
            if (!colPlace(obj, b, 0, -1)) {
                obj.y -= 1;
            } else {
                obj.vsp = 0;
                break;
            }
        }
    }
    if (obj.hsp > 0) {
        for (var i = 0; i < obj.hsp * timefctr; i++) {
            if (!colPlace(obj, b, 1, 0)) {
                obj.x += 1;
            } else {
                obj.hsp -= obj.hsp;
                break;
            }
        }
    } else if (obj.hsp < 0) {
        for (var i = 0; i < -obj.hsp * timefctr; i++) {
            if (!colPlace(obj, b, -1, 0)) {
                obj.x -= 1;
            } else {
                obj.hsp -= obj.hsp;
                break;
            }
        }
    }
}

function slopeMove(obj, b, slope, xsp, ysp) {
    var xsp = xsp || obj.hsp * timefctr;
    var ysp = ysp || obj.vsp * timefctr;

    var done = false;
    if (xsp > 0) {
        for (var i = 0; i < xsp; i++) {
            //adjust y value to account for slopes
            for (var s = -slope; s <= slope; s++) {
                //only account for slopes if on the ground
                if (s != 0 && !colPlace(obj, b, 0, 1))
                    continue;
                var xs = Math.cos(Math.atan2(-s, 1));//1;
                var ys = Math.sin(Math.atan2(-s, 1));//-s;

                if (!colPlace(obj, b, xs, ys)) {
                    obj.x += xs;
                    obj.y += ys;
                    //do not account for slopes later on when doing vsp
                    if (s != 0)
                        done = true;
                    break;
                } else if (s >= slope) {
                    obj.hsp = -obj.hsp * obj.bnc;
                    break;
                }
            }
        }
    } else if (xsp < 0) {
        for (var i = 0; i < -xsp; i++) {
            for (var s = -slope; s <= slope; s++) {
                if (s != 0 && !colPlace(obj, b, 0, 1))
                    continue;
                var xs = Math.cos(Math.atan2(-s, -1));//-1;
                var ys = Math.sin(Math.atan2(-s, -1));//-s;

                if (!colPlace(obj, b, xs, ys)) {
                    obj.x += xs;
                    obj.y += ys;
                    if (s != 0)
                        done = true;
                    break;
                } else if (s >= slope) {
                    obj.hsp = -obj.hsp * obj.bnc;
                    break;
                }
            }
        }
    }

    if (ysp > 0) {
        for (var i = 0; i < ysp; i++) {
            if (!colPlace(obj, b, 0, 1)) {
                obj.y += 1;
            } else if (!colPlace(obj, b, 1, 1) && !done) {
                obj.y += 0.7;
                obj.x += 0.7;
            } else if (!colPlace(obj, b, -1, 1) && !done) {
                obj.y += 0.7;
                obj.x -= 0.7;
            } else {
                obj.vsp = 0;
                break;
            }
        }
    } else if (ysp < 0) {
        for (var i = 0; i < -ysp; i++) {
            if (!colPlace(obj, b, 0, -1)) {
                obj.y -= 1;
            } else if (!colPlace(obj, b, 1, -1) && !done) {
                obj.y -= 0.7;
                obj.x += 0.7;
            } else if (!colPlace(obj, b, -1, -1) && !done) {
                obj.y -= 0.7;
                obj.x -= 0.7;
            } else {
                obj.vsp = 0;
                break;
            }
        }
    }

}