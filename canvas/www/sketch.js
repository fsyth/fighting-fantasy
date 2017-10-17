var hero, enemy, scl, fr = 45;

function setup() {
    createCanvas(windowWidth, windowHeight);
    scl = height / 44;

    hero  = new Character('Hero', -20 * scl, -15 * scl);
    enemy = new Character('Enemy', 20 * scl, -15 * scl);

    hero.skill = 10;
    hero.stamina = 20;
    hero.maxStamina = 20;
    hero.luck = 10;

    enemy.skill = 8;
    enemy.stamina = 16;
    enemy.maxStamina = 16;
    enemy.luck = 0;
}


function draw() {
    colorMode(HSB);
    background(0, 0, 20);
    translate(width / 2, height / 2);
    push();

    var t = (frameCount - hero.fc) / fr - 2.4;
    if (0 < t && t < 1) {
        var y1 = scl * pow(1 - (abs(t - 0.5) / 0.5), 3),
            //y2 = PI/2 * (1-t) * pow(sin(PI * t), 2);
            y2 = -2*PI * (t + 3) / (t + 1);
        if (hero.total > enemy.total) {
            translate(20 * y1, 10 * y1);
            rotate(y2);
        } else if (enemy.total > hero.total) {
            translate(-20 * y1, 10 * y1);
            rotate(-y2);
        }
    }

    hero.drawRollsBar();
    enemy.drawRollsBar();

    pop();

    hero.drawStaminaBar();
    enemy.drawStaminaBar();


}


function mousePressed() {
    hero.rollDice();
    enemy.rollDice();

    if (hero.total > enemy.total) {
        enemy.stamina -= hero.attack;
        if (enemy.stamina < 0) {
            enemy.stamina = 0;
        }
    } else if (enemy.total > hero.total) {
        hero.stamina -= enemy.attack;
        if (hero.stamina < 0) {
            hero.stamina = 0;
        }
    }
}


function Character(name, x, y) {
    // Character name
    this.name = name;

    // Positioning in the window
    this.pos = { x: x, y: y };
    this.left = x < 0;

    // Game attributes
    this.stamina = 0;
    this.maxStamina = 0;
    this.skill = 1;
    this.luck = 1;
    this.attack = 2;
    this.total = this.skill;

    // Current rolls, add more elements for more dice
    this.rolls = [0, 0];

    // The frame count that animation was last started on
    this.fc = frameCount;

    // Position of the rolls bar in the window
    this.rollBarPos = {
        x: this.left ? -20 : 20,
        y: height / 3
    };

    // Position of the stamina bar in the window
    this.stamBarPos = {
        x: this.pos.x,
        y: this.pos.y + 30 * scl
    };

    // Re-roll all dice
    this.rollDice = function () {
        this.finishAnimation();

        //this.rolls[0] = this.skill;
        this.total = this.skill;
        for (var i = 0; i < this.rolls.length; i++) {
            this.rolls[i] = roll();
            this.total += this.rolls[i];
            this.drawRollsBar.hs[i] = 0;
        }
        this.fc = frameCount;
    };

    // Draw bar sections for skill and dice rolls
    this.drawRollsBar = function () {
        // Heights of dice bars
        // Static variable
        if (this.drawRollsBar.hs === undefined) {
            this.drawRollsBar.hs = this.rolls.slice();
        }

        var hs = this.drawRollsBar.hs;

        var spc = 0.2 * scl,
            w = 1 * scl - spc;

        var s = this.skill * scl,
            x = this.rollBarPos.x,
            y = this.rollBarPos.y - s,
            t = (frameCount - this.fc) / fr,
            offsetDir = this.left ? LEFT : RIGHT;

        // Skill bar
        fill(0, 100, 80);
        noStroke();
        rect(x, y, w, s);
        this.drawBarNumbers(this.skill, x, y, w, s, offsetDir);

        // Bars for each dice roll
        for (var i = 0; i < this.rolls.length; i++) {
            // Change colours between bar sections
            colorMode(HSB);
            fill((1 + i) * 20, 100, 80);

            // Get time since this bar section started animating
            var ti = t - i - 0.4 - (this.left ? 0 : 0.5),
                target = scl * this.rolls[i];

            // Apply an animation to the bar height if it has started animating
            if (ti >= 0) {
                switch ('bounce') {
                    case 'lerp':
                        hs[i] = lerp(hs[i], target, 0.2);
                        break;

                    case 'pd':
                        hs[i] = pd(hs[i], target, 0.3, 5);
                        break;

                    case 'cosTo':
                        hs[i] = cosTo(0, target, ti, 3, 15);
                        break;

                    case 'overshoot':
                        hs[i] = overshoot(0, target, ti, 15, 3, 0.2, 15);
                        break;

                    case 'bounce':
                        hs[i] = bounce(0, target, ti, 5, 15);
                        break;

                    default:
                        hs[i] = target;
                }
            }

            // Subtract a small space of the bottom of the bar for separation
            var h = hs[i] - spc;
            h = h < 0 ? 0 : h;

            // Move to the top of the bar to start drawing
            y -= hs[i];
            rect(x, y, w, h);
            this.drawBarNumbers(this.rolls[i], x, y, w, h, offsetDir);


        }
    };

    // Draw a number n next to each bar section, given the bars rect parameters
    this.drawBarNumbers = function (n, x, y, w, h, offsetDir) {
        // Switch to manually toggle numbers on and off
        var enabled = true;

        // Set text size to smallest dimension of rectangle
        var ts = min(w, h);

        // Only draw numbers if the bar has height
        if (enabled && ts > 0) {
            textSize(ts);

            // Positional offsets for the text relative to the bar
            var xo,	yo;

            // Switch text alignment and x offset depending on which side of
            // the bar the numbers are drawn on
            switch (offsetDir) {
                case LEFT:
                    textAlign(RIGHT);
                    xo = -0.5 * ts;
                    yo = 0.5 * h + 0.35 * ts;
                    break;

                case RIGHT:
                    textAlign(LEFT);
                    xo = w + 0.5 * ts;
                    yo = 0.5 * h + 0.35 * ts;
                    break;

                case TOP:
                    textAlign(CENTER);
                    xo = 0.5 * w;
                    yo = h - 1.5 * ts;
                    break;

                case BOTTOM:
                    textAlign(CENTER);
                    xo = 0.5 * w;
                    yo = h + 1.5 * ts;
                    break;

                default:
                    xo = 0;
                    yo = 0;
            }

            text(n, x + xo, y + yo);
        }
    };

    // Draw a bar near the character for its current stamina
    this.drawStaminaBar = function () {

        var h = 0.8 * scl,
            w = h * this.maxStamina,
            x = this.stamBarPos.x - w/2,
            y = this.stamBarPos.y,
            t = (frameCount - this.fc) / fr;


        // Max stamina underbar
        noStroke();
        fill(352, 30, 20);
        rect(x, y, w, h);

        // Stamina overbar

        // Animated width of the bar
        // Static variable to keep track between draw calls
        if (this.drawStaminaBar.w === undefined) {
            this.drawStaminaBar.w = h * this.stamina;
        }
        w = this.drawStaminaBar.w;

        // Stamina overbar
        if (t > 2.9) {
            // Lerp to the new width after a delay
            w = lerp(w, h * this.stamina, 0.2);
        }

        x = this.stamBarPos.x - this.drawStaminaBar.w / 2;
        fill(352, 80, 60);
        rect(x, y, w, h);
        this.drawBarNumbers(w / h | 0, x, y, w, h, BOTTOM);

        this.drawStaminaBar.w = w;
    };

    this.finishAnimation = function () {
        this.drawStaminaBar.w = 0.8 * scl * this.stamina;
    };
}

// Dice roll, returns a random integer uniformly between 1 and 6, inclusive
function roll() {
    return random(1, 7) | 0;
}

// Linearly interpolate from a current value towards a target value by the
// fraction p
function lerp(current, target, p) {
    return current * (1 - p) + target * p;
}

// Proportial-Derivative controller. Move from a current value towards a
// target value with PD coefficients
function pd(current, target, p, d) {
    var r = current;
    r += p * (target - current);
    r += d * (r - current);
    return r;
}

// Decaying cosine from start value to a target over time t.
// Adjust the decay rate of the the oscillations a, and frequency of
// oscillation w.
function cosTo(start, target, t, a, w) {
    return target - (target - start) * (exp(-a*t)) * (0.5 * (1 + cos(w*t)));
}

// Sinusoidal overshoot controller. Move from a start value to a target value
// based on the time t. Adjust amplitude of overshoot, rate of approach a,
// rate of oscillation decay b, and frequency of oscillation w.
function overshoot(start, target, t, a, b, amp, w) {
    return start + (target - start) * (1 - exp(-a*t)) * (1 + amp * exp(-b*t) * sin(w*t));
}

// The same as cosTo, but the value will never go past the target and will
// instead bounce in front of it
function bounce(start, target, t, a, w) {
    //return target - (target - start) * abs(1 - (1 - exp(-a*t)) * (1 + amp * exp(-b*t) * sin(w*t)));
    return target - (target - start) * (exp(-a*t)) * abs(cos(w*t));
}
