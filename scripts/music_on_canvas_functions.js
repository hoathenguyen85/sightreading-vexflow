

function makeContext(elementId) {
    var canvas = document.getElementById(elementId);
    var renderer = new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS);
    var ctx = renderer.getContext();
    return ctx;
}

var ctx = makeContext('canvas-1');
var ctx2 = makeContext('canvas-2');


function renderBars(barsSingleLine, context) {
    //put bars oon canvas and add connectors and shit
    var bars_rh = barsSingleLine.bars_rh;
    var bars_lh = barsSingleLine.bars_lh;
    var numBars = bars_rh.length;
    var connectors = [];
    bars_rh[0].setContext(context).draw();
    bars_lh[0].setContext(context).draw();
    var newConnector = new Vex.Flow.StaveConnector(bars_rh[0], bars_lh[0]);
    newConnector.setType(Vex.Flow.StaveConnector.type.BRACE).setContext(context).draw();
    for (var i=1; i<numBars; i+=1) {
        bars_rh[i].setContext(context).draw();
        bars_lh[i].setContext(context).draw();
        var newConnector1 = new Vex.Flow.StaveConnector(bars_rh[i], bars_lh[i]);
        var newConnector2 = new Vex.Flow.StaveConnector(bars_rh[i], bars_lh[i]);
        // connectors.push(newConnector);
        newConnector1.setType(Vex.Flow.StaveConnector.type.SINGLE_LEFT).setContext(context).draw();
        newConnector2.setType(Vex.Flow.StaveConnector.type.SINGLE_RIGHT).setContext(context).draw();
    }
}

function renderBarsMultipleLines(lines, context) {
    for (var i=0; i<lines.length; i+=1) {
        renderBars(lines[i], context);
    }
}

function putLineOnStaff(line_multiple_bars, staffSingleLine, hand, major_or_minor, context) {
    var timeSig = staffSingleLine.timeSig;
    var beatsPer = Number(timeSig[0])
    var bars_rh = staffSingleLine.bars_rh;
    var bars_lh = staffSingleLine.bars_lh;
    var len = bars_rh[0].modifiers.length;
    //careful here. the keySignature may not be the correct index in the array. find a better way?
    var numSharps = bars_rh[0].modifiers[len - 1].accList.length;
    //be wary of major vs minor right here
    var keyHalfStepsFromC = numSharps * 7 % 12;
    for (var i=0; i<bars_rh.length; i+=1) {
        var voice = createVoice(line_multiple_bars[i], beatsPer, 4);
        //for now assuming the voice was created in a major key only
        transposeVoice(voice, 0, keyHalfStepsFromC, 'M', major_or_minor);
        if (hand === 'r'){
            formatVoice(voice, bars_rh[i], context);
        }
        else if (hand === 'l'){
            formatVoice(voice, bars_lh[i], context);
        }
    }

}


function formatVoice(voice, stave, context) {
    //render a non-transposed voice to the stave
    var beams = Vex.Flow.Beam.applyAndGetBeams(voice);
    var formatter = new Vex.Flow.Formatter().joinVoices([voice]).
    formatToStave([voice], stave);
    voice.draw(context,stave);
}


function formatNotes(notes, stave, context) {
    /// not using this function right now, but can render notes without a voice if you want
    Vex.Flow.Formatter.FormatAndDraw(context, stave, notes);
}


function makeSightreading(numBars, beatsPer, key, level, hand, barsPerLine, distance_from_top, context, major_or_minor) {
    /// randomly generate a sightreading exercise, generating rhythms and scale steps in a line in each hand separately
    // then transposing to the given key
    //TODO add fingerings!!!
    var first_hand = hand;
    var second_hand = hand === 'r' ? 'l' : 'r';
    var first_octave = first_hand === 'r' ? 4 : 3;
    var second_octave = first_hand == 'r' ? 3 : 4; 
    var firstClef = first_hand == 'r' ? 'treble' : 'bass';
    var secondClef = first_hand == 'r' ? 'bass' : 'treble';
    var TwoSystems = makePianoStaffMultipleLines(key, String(beatsPer) + '/' + '4', barsPerLine, 2, distance_from_top, context, major_or_minor);
    var rhythms_r = makeRhythms(numBars, beatsPer);
    var steps_r = makeSteps(rhythms_r, 4, level, 'open');
    // start in measure 0
    var start = 0;
    var line1 = generateLine(rhythms_r, steps_r, key, first_octave, firstClef, barsPerLine, major_or_minor);
    start += numBars;
    var rhythms_l = makeRhythms(numBars, beatsPer);
    var steps_l = makeSteps(rhythms_l, 4, level, 'closed');
    var line2 = generateLine(rhythms_l, steps_l, key, second_octave, secondClef, barsPerLine, major_or_minor);
    //console.log(line1.concat(line2));
    renderBarsMultipleLines(TwoSystems, context);
    putLineOnStaff(line1, TwoSystems[0], first_hand, major_or_minor, context);
    putLineOnStaff(line2, TwoSystems[1], second_hand, major_or_minor, context);
    return {firsthand: hand, line1: line1, line2: line2, major_or_minor: major_or_minor};
}

function makeRandomSightReading(numBars, level, barsPerLine, distance_from_top, context) {
    // has to be 6 bar length lines for now. fix this!!
    // 8 bars total;
    var first_hand = ['r', 'l'];
    var hand = first_hand[Math.floor(Math.random() * first_hand.length)];
    var beats = [3, 4];
    var beatsPer = beats[Math.floor(Math.random() * beats.length)];
    if (level == 2) {
        var major_minor_combos = [[0, 'M'], [0, 'm'], [7, 'M'], [7, 'm'], [2, 'M'], [4,'M'], [9, 'M']];
    }
    else {
        var major_minor_combos = [[0, 'M'], [0, 'm'], [7, 'M'], [7, 'm']];
        
    }
    var major_minor_combo = major_minor_combos[Math.floor(Math.random() * major_minor_combos.length)];
    var key = major_minor_combo[0];
    var major_or_minor = major_minor_combo[1];
    var score = makeSightreading(numBars, beatsPer, key, level, hand, barsPerLine, distance_from_top, context, major_or_minor);
    return {line1: score.line1, line2: score.line2, firsthand: score.firsthand, beatsPer: beatsPer, keySig: key, major_or_minor: major_or_minor};
}



//takes the given notes and renders them to the staff, given a key
// function putNotesBackOnSystems(notes, firsthand, keySig, beatsPer, context) {
//     var stave = makePianoStaffMultipleLines(keySig, String(beatsPer) + '/4', 4, 2, 10, context);
//     console.log(stave);
//     var staveLine = 0;
//     beatDict = {'h':2, 'q': 1, '1': 4}
//     // if (startMeasure > 4) {
//     //     staveLine = 1;
//     //     startMeasure = startMeasure - 4;
//     // }
//     var otherhand = firsthand == 'r' ? 'l' : 'r'
//     var measureCounter = 0;
//     notesIndex = 0;
//     for (var i = 1; i<9; i+=1) {
//         measureCounter = measureCounter % 4
//         var currentHand = i < 5 ? firsthand : otherhand;
//         var staveLine = i < 5 ? 0 : 1;
//         currentMeasureNotes = [];
//         currentBeat = 1;
//         while (currentBeat < beatsPer + 1) {
//             console.log('adding a note');
//             currentNote = notes[notesIndex]
//             currentMeasureNotes.push(currentNote);
//             notesIndex += 1;
//             realDuration = beatDict[currentNote.duration];
//             if (currentNote.dots !== 0) {
//                 realDuration += realDuration/2;
//             }
//             currentBeat += realDuration;
//             //console.log('now the beat is');
//             //console.log(currentBeat);
//         }
        

//         console.log(currentMeasureNotes);
//         var voice = createVoice(currentMeasureNotes, beatsPer, 4);
//         transposeVoice(voice, 0, keySig);
//         if (currentHand === 'r') {
//             console.log(staveLine);
//             formatVoice(voice, stave[staveLine].bars_rh[measureCounter], context);
//         }
//         else {
//             console.log(staveLine);
//             formatVoice(voice, stave[staveLine].bars_lh[measureCounter], context);
//         }
//         measureCounter += 1;
//     }
// }

