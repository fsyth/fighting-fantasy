/*global $*/

function rollDie() {
  return 1 + 6 * Math.random() | 0;
}

function twoDiceProbabilityUnder(n) {
  // Clamp n to range 1:12
  n = n < 1 ? 1 : n > 12 ? 12 : n;
  // Calculate probabilty from quadratic evalution of discrete sum
  if (n <= 7) {
    return n * (n - 1) / 72;
  } else {
    return 1 - (12 - n) * (13 - n) / 72;
  }
}

$(function () {
  var t = 400,
      outcomeDelay = 600,
      won = false,
      calcHidden = true,
      helpLuckWinShown = false,
      helpLuckLoseShown = false,
      history = 'TURN HISTORY';

  $('#hero-skill, #enemy-skill').change(function () {
        // Parse the new skill value
    var skill = parseInt($(this).val()) || 0,
        // Construct the id of the corresponding skill die
        die = '#' + $(this).attr('id') + '-die';

    // Fade out the skill die
    $(die).stop(true, false).fadeTo(t, 0.1);

    // Once faded, update the text and fade in
    setTimeout(function () {
      $(die).text(skill).fadeTo(t, 1);
    }, t);
  });

  $('#hero-stam, #enemy-stam').change(function () {
    // Parse the current stamina values
    var heroStam  = parseInt($('#hero-stam').val())  || 0,
        enemyStam = parseInt($('#enemy-stam').val()) || 0;

    // Disable fight button if either character is dead
    if (heroStam === 0 || enemyStam === 0) {
      $('#fight-button').addClass('disabled');
    } else {
      $('#fight-button').removeClass('disabled');
    }

    // Clear critical and dead styles after editing stamina
    if (heroStam === 0) {
      $('#fight').addClass('hero-dead');
      $('#fight').removeClass('hero-critical');
    } else {
      $('#fight').removeClass('hero-dead');
      if (heroStam <= 2) {
        $('#fight').addClass('hero-critical');
      } else {
        $('#fight').removeClass('hero-critical');
      }
    }

    if (enemyStam === 0) {
      $('#fight').addClass('enemy-dead');
      $('#fight').removeClass('enemy-critical');
    } else {
      $('#fight').removeClass('enemy-dead');
      if (enemyStam <= 2) {
        $('#fight').addClass('enemy-critical');
      } else {
        $('#fight').removeClass('enemy-critical');
      }
    }


    // Hide help text when ready to fight
    if (heroStam > 0 && enemyStam > 0) {
      $('#help').fadeOut();
    }
  });

  $('#hero-luck').change(function () {
    // Parse luck and calculate probability of winning a luck roll
    var luck = parseInt($(this).val()) || 1,
        percentage = Math.round(twoDiceProbabilityUnder(luck) * 100);

    // Update the text on the button
    $('#luck-percentage').text(percentage);

    // Disable the button if there is no chance of winning
    if (percentage === 0) {
      $('#luck-button').addClass('disabled');
    } else {
      $('#luck-button').removeClass('disabled');
    }
  });

  function dealDamage(target, damage) {
    // Parse current stamina
    var heroStam  = parseInt($('#hero-stam').val())  || 0,
        enemyStam = parseInt($('#enemy-stam').val()) || 0,
        targetStam = target === 'hero' ? heroStam : enemyStam;

    // Update history
    history += '\n' + target.toUpperCase() + ': ' +
               targetStam + ' -> ' + Math.max(targetStam - damage, 0);
    $('img[src="images/stam.png"]').attr('title', history);

    // Play damaging animation towards target
    $('#damage').addClass('damage-' + target);

    if (damage > 0) {
      // Apply damage to hero or enemy
      $('#damage').text(-damage).addClass('damage');
    } else {
      // Heal the target
      $('#damage').text('+' + (-damage)).addClass('heal');
    }


    setTimeout(function () {
      // Deal 2 damage, clamp stamina at 0
      var stam = Math.max((target === 'enemy' ? enemyStam : heroStam) - damage, 0);

      // Display stamina
      $('#' + target + '-stam').val(stam);

      // If stamina was reduced to 0
      if (stam === 0) {
        // Victory or defeat outcome
        $('#outcome-dialogue h1').text(target === 'enemy' ? 'Victory!' : 'Defeat!');

        // Fade in the outcome dialogue
        $('#outcome-dialogue').fadeTo(t, 1, function () {
          $(this).removeClass('hidden');
        });

        // Disable number inputs while the outcome dialogue is shown
        $('input[type="number"]').attr('readonly', true);

        // Apply styles for dead target
        $('#fight').removeClass(target + '-critical').addClass(target + '-dead');
      } else {
        // Fight continues, re-enable fight button
        $('#fight-button').removeClass('disabled');

        // If low health, apply critical health animation
        if (stam <= 2) {
          $('#fight').addClass(target + '-critical');
        } else {
          $('#fight').removeClass(target + '-critical');
        }
      }
    }, outcomeDelay);


    setTimeout(function () {
      // Reset animation
      $('#damage').removeClass('damage-hero damage-enemy');
    }, outcomeDelay + t);
  }

  $('#fight-button').click(function () {
    // Return if the button is disabled
    if ($(this).hasClass('disabled')) {
      return;
    }

    // Disable luck rolls
    $('#luck-button').addClass('disabled');

    // If first time running / after reset
    if (calcHidden) {
      // Fade in calculation dice
      $('.calc').fadeTo(t, 1);
      calcHidden = false;

      // Clear values from all rollable dice
      $('.rollable').text('').fadeTo(0, 0);

      // If the panel was hidden, wait a bit before running
      // the rest of the function
      setTimeout(function () {
        $('#fight-button').click();
      }, t);

      return;
    }

    // Disable the fight button until this round completes
    $(this).addClass('disabled');

        // Parse the skills
    var heroSkill  = parseInt($('#hero-skill').val())  || 0,
        enemySkill = parseInt($('#enemy-skill').val()) || 0,
        // Parse current stamina
        heroStam  = parseInt($('#hero-stam').val())  || 0,
        enemyStam = parseInt($('#enemy-stam').val()) || 0,
        // Parse current luck
        luck = parseInt($('#hero-luck').val()) || 0,
        // Roll the dice
        heroRoll   = rollDie(),
        heroRoll2  = rollDie(),
        enemyRoll  = rollDie(),
        enemyRoll2 = rollDie(),
        // Add roll to skill for total
        heroTotal  = heroSkill  + heroRoll + heroRoll2,
        enemyTotal = enemySkill + enemyRoll + enemyRoll2;


    // Hide the luck roll panels
    $('#luck-dice, #luck-comparison').fadeOut(t);

    // Fade out all rollable dice
    $('.rollable').fadeTo(t, 0);

    // Remove critical state from luck roll button
    $('#luck-button').removeClass('critical');

    // Fade out luck roll tutorials
    $('#help-luck-win, #help-luck-lose').fadeOut(t);


    // Update dice numbers once faded out
    setTimeout(function () {
      // Remove last win/lose/draw state
      $('#fight').removeClass('win lose draw');

      // Reset sizing on win/lose/draw/lucky/unlucky text
      $('#win-lose').removeClass('small');

      // Reset damage or heal colouring on damage indicator
      $('#damage').removeClass('critical damage heal');

      // Fade in the disabled luck button
      $('#luck-button').fadeIn(t);

      // Display the dice rolls
      $('#hero-roll').text(heroRoll).fadeTo(t, 1);
      $('#hero-roll-2').text(heroRoll2).fadeTo(t, 1);

      // Do the same for the enemy rolls
      $('#enemy-roll').text(enemyRoll).fadeTo(t, 1);
      $('#enemy-roll-2').text(enemyRoll2).fadeTo(t, 1);


      // Then display the hero total
      setTimeout(function () {
        $('#hero-total').text(heroTotal).fadeTo(t, 1);
        $('#enemy-total').text(enemyTotal).fadeTo(t, 1);


        // Then display win/loss/draw and damage animations
        setTimeout(function () {
          // Apply win/lose/draw class
          if (heroTotal > enemyTotal) {
            // Won this round
            won = true;
            $('#fight').addClass('win');

            // Fade in the win text
            $('#win-lose').text('Win!').fadeTo(t, 1);


            // Once faded in, deal 2 damage to the enemy
            setTimeout(function () {
              dealDamage('enemy', 2);

              // Enable a luck roll to deal double damage
              if (enemyStam > 2 && luck > 1) {
                // Only if the enemy survived
                setTimeout(function () {
                  $('#luck-button').removeClass('disabled');
                  if (!helpLuckWinShown) {
                    $('#help-luck-win').fadeIn(t);
                  }
                }, outcomeDelay);
              }
            }, t);
          } else if (heroTotal < enemyTotal) {
            // Lost this round
            won = false;
            $('#fight').addClass('lose');

            // Fade in the lose text
            $('#win-lose').text('Lose').fadeTo(t, 1);


            // Once faded in, deal 2 damage to the hero
            setTimeout(function () {
              // Special case if the damage would be lethal
              if (heroStam === 2 && luck > 1) {
                // Can roll luck to survive
                // If lucky, deal only 1 damage
                // If unlucky, lethal damage to hero

                // Critical animation on the luck button
                $('#luck-button').addClass('critical').removeClass('disabled');

                // Critical animation on the damage indicator
                $('#damage').text(-2).addClass('critical damage');

                // Fade in critical dialogue
                $('#critical-dialogue').removeClass('hidden').fadeTo(t, 1);
              } else {
                dealDamage('hero', 2);

                // Enable a luck roll to mitigate damage
                if (heroStam > 2 && luck > 1) {
                  // But only if hero is not dead yet
                  setTimeout(function () {
                    $('#luck-button').removeClass('disabled');
                    if (!helpLuckLoseShown) {
                      $('#help-luck-lose').fadeIn(t);
                    }
                  }, outcomeDelay);
                }
              }
            }, t);
          } else {
            // Draw, no damage dealt
            $('#fight').addClass('draw');

            // Fade in the draw text
            $('#win-lose').text('Draw').fadeTo(t, 1);

            // Once faded
            setTimeout(function () {
              // Fight continues, re-enable fight button
              $('#fight-button').removeClass('disabled');
            }, t);
          }
        }, t);
      }, t);
    }, t);
  });

  $('#help-luck-win-hide').click(function () {
    helpLuckWinShown = true;
    $('#help-luck-win').fadeOut(t);
  });

  $('#help-luck-lose-hide').click(function () {
    helpLuckLoseShown = true;
    $('#help-luck-lose').fadeOut(t);
  });

  $('#luck-button').click(function () {
    // Return if the button is disabled
    if ($(this).hasClass('disabled')) {
      return;
    }

    var luckRoll1 = rollDie(),
        luckRoll2 = rollDie(),
        luckTotal = luckRoll1 + luckRoll2,
        // Parse hero's luck
        luck = parseInt($('#hero-luck').val()) || 0,
        // Roll two dice under the hero's luck score to be lucky
        lucky = luckTotal <= luck,
        // Special case of critical luck roll when it's life or death for hero
        critical = $('#luck-button').hasClass('critical');

    if (luck < 2) {
      // It is impossible to win a luck roll
      return;
    }

    // Hide luck related tutorials from appearing in the future
    if (won) {
      helpLuckWinShown = true;
    } else {
      helpLuckLoseShown = true;
    }

    // Fade out luck button
    $('#luck-button').fadeOut(t);

    // Fade out luck roll tutorials
    $('#help-luck-win, #help-luck-lose').fadeOut(t);

    // Fade damage animation
    $('#damage').fadeTo(t, 0);

    // Disable fight button
    $('#fight-button').addClass('disabled');

    // Fade critical dialogue if it's present
    $('#critical-dialogue').fadeTo(t, 0);

    setTimeout(function () {
      // Hide critical dialogue
      $('#critical-dialogue').addClass('hidden');

      // Update luck rolls
      $('#luck-roll-1').text(luckRoll1);
      $('#luck-roll-2').text(luckRoll2);

       // Fade in luck dice rolls
      $('#luck-dice').fadeIn(t);

      // Remove lucky/unlucky colours
      $('#luck-comparison').removeClass('lucky unlucky');

      // Remove critical damage animation
      $('#damage').removeClass('critical');

      // Once faded in
      setTimeout(function () {
        // Display total
        $('#luck-total').text(luckTotal);

        // Set inequality operator to <= or > based on outcome
        $('#luck-inequality').text(lucky ? '\u2264' : '>');

        // Display hero's current luck
        $('#hero-luck-die').text(luck);

        // Fade in luck comparison panel
        $('#luck-comparison').fadeIn(t);

        // Fade out win/lose text
        $('#win-lose').fadeTo(t, 0);

        // Once faded, colour and display Lucky or Unlucky
        setTimeout(function () {
          if (lucky) {
            // Lucky
            $('#win-lose').text('Lucky!');

            // Set lucky colour
            $('#luck-comparison').addClass('lucky');

            if (critical) {
              // Critical roll occurs when the damage reduction from
              // luckiness keeps the hero alive
              dealDamage('hero', 1);
            } else if (won) {
              // If previously won the round, deal double damage
              dealDamage('enemy', 2);
            } else {
              // If previously lost the round, take 1 less damage
              dealDamage('hero', -1);
            }
          } else {
            // Unlucky
            $('#win-lose').addClass('small').text('Unlucky');

            // Set unlucky colour
            $('#luck-comparison').addClass('unlucky');

            if (critical) {
              // Critical luck roll failed, so hero takes lethal damage
              dealDamage('hero', 3);
            } else if (won) {
              // If previously won the round, deal 1 less damage
              dealDamage('enemy', -1);
            } else {
              // If previously lost the round, take 1 extra damage
              dealDamage('hero', 1);
            }
          }
          // Fade in luck/unlucky text
          $('#win-lose').fadeTo(t, 1);

          // Once the damge animation is complete
          setTimeout(function () {
            // Subtract 1 from luck, clamped at 1
            luck = Math.max(luck - 1, 1);

            // Update the value in the stats panel
            $('#hero-luck').val(luck);

            // Recalculate the percentage chance of winning
            var percentage = Math.round(twoDiceProbabilityUnder(luck) * 100);

            // Update the text on the button
            $('#luck-percentage').text(percentage);

            // Disable the button if there is no chance of winning
            if (percentage === 0) {
              $('#luck-button').addClass('disabled');
            }
          }, outcomeDelay);
        }, t);
      }, t);
    }, t);
  });

  function reset() {
    // Hide the outcome dialogue when F is pressed
    $('#outcome-dialogue').fadeOut(t).addClass('hidden');

    // Re-enable number inputs
    $('input[type="number"]').attr('readonly', false);

    // Show the help text once faded
    setTimeout(function () {
      $('#help').fadeIn(t);
    }, t);

    // Hide the luck rolls
    $('#luck-dice, #luck-comparison').fadeOut(t);

    // Hide the calculation dice
    $('.calc').fadeTo(t, 0);
    calcHidden = true;

    // Reset turn history
    history = 'TURN HISTORY';
  }

  $('body').keypress(function (e) {
    switch (e.which) {
      case 70:  // F
      case 102: // f
        if (!$('#outcome-dialogue').hasClass('hidden')) {
          // Reset everything
          reset();

          // Prevent typing
          e.preventDefault();
        }
        break;

      case 13: // Enter
      case 32: // Space
        if (!$('input:focus, :focus[contenteditable=true]').length) {
          $('#fight-button').click();
          e.preventDefault();
        }
        break;
    }
  });

  $('#outcome-dialogue').click(reset);

  $('#settings-button').click(function () {
    if ($('#settings-panel').hasClass('hidden')) {
      $('#settings-panel').removeClass('hidden');
      $('#settings-button').html('&times;');
    } else {
      $('#settings-panel').addClass('hidden');
      $('#settings-button').html('&bull;&bull;&bull;');
    }
  });

  $('#animation-duration-input').change(function () {
    t = parseInt($(this).val());
    $('#animation-duration').text(t);
    $('#damage').css({
      animationDuration: (1.5 * t | 0) + 'ms'
    });
    outcomeDelay = 1.5 * t;
  });

  $('#background-color-input').change(function () {
    $('body').css({
      backgroundColor: $(this).val()
    });
  });
});
