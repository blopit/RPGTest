/**
 * Created by shrenilpatel on 2016-02-17.
 */
var PRIO = {
    HIGHEST: 0,
    SPECIAL: 1,
    HIGH_ULT: 2,
    ULTIMATE: 3,
    LOW_ULT: 4,
    RARE: 5,
    NORMAL: 7,
    LOW: 9,
    JUNK: 10
};

var damageType = function (arr, color, name) {
    var array = arr || [];
    for (var i = 0; i < array.length; i++)
        this[i] = array[i];

    this.color = color;
    this.name = name;
    this.length = array.length;
};

var DTYPE = {
    none: new damageType([-1, -1, -1], "rgba(0,0,0,0)", "None"),
    raw: new damageType([0, 0, 0], "#000", "Raw"),
    basic: new damageType([1, 1, 1], "#fff", "Basic"),

    piercing: new damageType([0, 0, 1], "RoyalBlue", "Pierce"),
    slashing: new damageType([0, 1, 1], "Turquoise", "Slash"),
    blunt: new damageType([0, 1, 0], "#32CD32", "Blunt"),

    natural: new damageType([1, 1, 0], "Gold", "Natural"),
    energy: new damageType([1, 0, 0], "#ff3300", "Energy"),
    ethereal: new damageType([1, 0, 1], "#ff00ff", "Ethereal")
};

var LOC = {
    none: 0,
    constant: 1, //none

    att_after_mit: 2, //dmg, mit, type
    def_after_mit: 3, //dmg, mit, type

    att_before_mit: 4, //dmg, type
    def_before_mit: 5, //dmg, type

    att_alter: 19,//oldlist, newlist, buff
    def_alter: 20,//oldlist, newlist, buff

    inc_any_buff: 6, //buff
    out_any_buff: 7, //buff

    inc_buff: 8, //buff
    out_buff: 9, //buff

    inc_debuff: 10, //buff
    out_debuff: 11, //buff

    out_spell: 12, //buff
    in_spell: 13, //buff

    def_buff_expire: 14, //buff
    def_debuff_expire: 15, //buff
    def_any_expire: 16, //buff

    inc_heal: 17, //heal
    out_heal: 18, //heal

    crowd_control: 19, //slow, move, attack, cast
};

var BTYPE = {
    none: -1,
    neutral: 0,
    buff: 1,
    debuff: 2,
    crowd_control: 3
};

function applyPassive(source, target, p) {
    normal = true;

    if (normal) {
        target.passives.push(p);
        p.source = source;
    }

    target.passives.sort(passiveCompare);
}

function removePassive(source, target, p) {
    normal = true;

    p = executeWithLoc(LOC.def_any_expire, source, target, {buff: p}).buff;

    if (p.buff === BTYPE.buff) {
        p = executeWithLoc(LOC.def_buff_expire, source, target, {buff: p}).buff;
    } else if (p.buff === BTYPE.debuff) {
        p = executeWithLoc(LOC.def_debuff_expire, source, target, {buff: p}).buff;
    }

    if (normal) {
        p.expire();
        remove(target.passives, p);
    }
}

function tickWithLoc(loc, source, target, list) {
    currrent_loc = loc;
    var l = list;
    for (var i = 0; i < source.passives.length; i++) {
        var p = source.passives[i];

        p.timer++;
        if (p.dur != -1 && p.timer > p.dur) {
            removePassive(source, source, p);
        }
        if (contains(p.loc, loc) && p.timer % p.tick == 0) {
            l = p.process(source, target, l);
        }
    }
    return l;
}

function dblexeWithLocs(locSrc, locTar, source, target, list) {
    var plist = [];

    for (var i = 0; i < source.passives.length; i++) {
        var p = source.passives[i];
        if (contains(p.loc, locSrc)) {
            plist.push([p, source, target, locSrc]);
        }
    }

    for (i = 0; i < target.passives.length; i++) {
        p = target.passives[i];
        if (contains(p.loc, locTar)) {
            plist.push([p, target, source, locTar]);
        }
    }

    plist.sort(passiveCompareDbl);

    for (i = 0; i < plist.length; i++) {
        p = plist[i];
        currrent_loc = p[3];
        list = p[0].process(p[1], p[2], list);
    }

    return list;
}

function dblexeWithLocsAlt(locSrc, locTar, locSrcAlt,
                           locTarAlt, source, target, list) {
    var plist = [];
    var clist, nlist;

    for (var i = 0; i < source.passives.length; i++) {
        var p = source.passives[i];
        if (contains(p.loc, locSrc)) {
            plist.push([p, source, target, locSrc]);
        }
    }

    for (i = 0; i < target.passives.length; i++) {
        p = target.passives[i];
        if (contains(p.loc, locTar)) {
            plist.push([p, target, source, locTar]);
        }
    }

    plist.sort(passiveCompareDbl);

    for (i = 0; i < plist.length; i++) {
        clist = list;
        p = plist[i];
        currrent_loc = p[3];
        nlist = p[0].process(p[1], p[2], list);
        list = dblexeWithLocs(locSrcAlt, locTarAlt, source, target,
            {oldlist: clist, newlist: nlist, buff: p[0]}).newlist;
    }

    return list;
}

function executeWithLoc(loc, source, target, list) {
    currrent_loc = loc;
    //source.passives.sort(passiveCompare);
    for (var i = 0; i < source.passives.length; i++) {
        var p = source.passives[i];
        if (contains(p.loc, loc)) {
            list = p.process(source, target, list);
        }
    }
    return list;
}
