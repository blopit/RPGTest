/**
 * Created by shrenilpatel on 2016-02-11.
 */
var LOC = {
    none: 0,
    constant: 1, //none

    att_after_mit: 2, //dmg, mit, type
    def_after_mit: 3, //dmg, mit, type

    att_before_mit: 4, //dmg, type
    def_before_mit: 5, //dmg, type

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

};

var BTYPE = {
    neutral: 0,
    buff: 1,
    debuff: 2
};

var ID = 0;

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

    p = executeWithLoc(LOC.def_any_expire, source, target, [p])[0];

    if (p.buff === BTYPE.buff) {
        p = executeWithLoc(LOC.def_buff_expire, source, target, [p])[0];
    } else if (p.buff === BTYPE.debuff) {
        p = executeWithLoc(LOC.def_debuff_expire, source, target, [p])[0];
    }

    if (normal) {
        p.expire();
        remove(target.passives, p);
    }
}

function tickWithLoc(loc, source, target, list) {
    currrent_loc = loc;

    for (var i = 0; i < source.passives.length; i++) {
        var p = source.passives[i];

        p.timer++;
        if (p.dur != -1 && p.timer > p.dur) {
            removePassive(source, source, p);
        }
        if (contains(p.loc, loc) && p.timer % p.tick == 0) {
            list = p.process(source, target, list);
        }
    }
    return list;
}

function dblexeWithLocs(locSrc, locTar, source, target, list) {
    plist = [];

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

function p_passive(name, loc, buff, cat, dur, tick) {
    this.id = ID++;
    this.loc = loc || [LOC.constant];
    this.prio = 5;
    this.tick = tick || ~~(targ_fps/2);
    this.dur = ~~(dur * targ_fps) || -1;
    this.source = null;
    this.buff = buff || BTYPE.neutral;
    this.name = name || "NAME ERROR";
    this.cat = cat || ['error'];
    this.dmg = 0;
    this.timer = 0;

    this.process = function (source, target, list) {
        console.log(this.name + " null PROCESS");
        return null;
    };
    this.expire = function () {
        console.log(this.name + " null EXPIRED");
    };
    this.stack = function () {
        console.log(this.name + " null STACKING");
    }
};

function passiveCompare(a, b) {
    return parseInt(b.prio) - parseInt(a.prio);
};

function passiveCompareDbl(a, b) {
    return parseInt(b[0].prio) - parseInt(a[0].prio);
};

//gives user unmitigated damage
function p_UnmitigatedDamage() {
    p_passive.call(this,
        "Unmitigated Damage",
        [LOC.att_after_mit],
        BTYPE.buff,
        ['unique']
    );

    //dmg, mit, type
    this.process = function (source, target, list) {
        return [list[0], list[0], DTYPE.raw];
    }
}

//gives user invincible
function p_Invincible() {
    p_passive.call(this,
        "Invincible",
        [LOC.def_before_mit],
        BTYPE.buff,
        ['unique']
    );
    this.prio = 1;

    //dmg, type
    this.process = function (source, target, list) {
        return [0, DTYPE.raw];
    }
}

//basic DoT
function p_DoT(dmg, dur, tick, type) {
    p_passive.call(this,
        "Test DoT",
        [LOC.constant],
        BTYPE.debuff,
        ['dot'],
        dur,
        tick
    );

    this.dmg = dmg;
    this.type = type || DTYPE.eth_mjk;

    //[none]
    this.process = function (source, target) {
        damage(this.source, target, this.dmg, this.type);
        return [];
    }
}