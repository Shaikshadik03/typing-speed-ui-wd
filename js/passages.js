'use strict';
const passageBank = {
  everyday: [
    'The sky is clear today. I will take a short walk after lunch and look for birds near the garden.',
    'My friend and I made tea after class. We sat by the window and watched the rain fall on the road.',
    'A good study session starts with one clear goal. Close the extra tabs, set a timer, and write a short summary when you finish.',
    'The library was quiet, so Mira found a window seat and opened her notebook. She reviewed her notes before writing a few practice questions.',
    'Learning a skill takes time. Small steps repeated with care can become a habit that lasts for years.',
    'There is a small bookshop at the end of our street. Its windows are full of stories waiting for someone to take them home.',
    'We planted seeds in the spring and watered them each morning. By summer, the empty patch had become a garden.',
    'When a task feels difficult, take a breath and try one part at a time. Progress often begins with a simple question.',
    'The train crossed the river just as the sun rose. Golden light reached across the water and through the open windows.',
    'Good ideas can arrive during an ordinary day. Keep a notebook nearby and give your thoughts a little room to grow.',
    'Our class worked together to build a model bridge. Each person brought a different idea, and the final design surprised us all.',
    'A balanced routine makes space for work, rest, and friends. Some days move quickly, while others ask us to slow down.',
    'The path curved around the lake and into the trees. We could hear the soft sound of leaves moving in the wind.',
    'Practice does not need to be perfect to be useful. Notice one thing you can improve, then bring that idea into your next attempt.',
    'Before submitting the project, read every section aloud. Check that the examples are clear and the conclusion follows from your evidence.',
    'The market opened early on Saturday. Fresh fruit, bright flowers, and warm bread filled the stalls along the square.'
  ],
  symbols: [
    'Order #204: 3 notebooks at $4.50 each; total = $13.50. Save 15% with code STUDY15!',
    'Schedule: 08:30 - 09:45 (Room 12); 10:00 - 11:15 (Room 36). Bring 2 pens & 1 ruler.',
    'Measurements: width 24.5 cm, height 18.2 cm, depth 7.0 cm. Ratio: 3:2; margin: +/- 0.5.',
    'Compare 72 > 48 and 16 < 25. Calculate (12 + 8) * 3 = 60. Is 100% the same as 1.0?',
    'Inventory [A-17]: 240 units; [B-29]: 135 units; [C-08]: 96 units. Updated: 2026-11-27.',
    'Contact: hello@example.com; reference: KS_42. Use "practice" as the label, then press Enter.',
    'Trip budget: tickets $48.00 + lunch $12.75 + snacks $6.25 = $67.00; remaining $33.00.',
    'Read pages 15-32, answer questions 1-8, and check sections 2.1 & 2.2 before 17:30.',
    'The result was 98.6%, with a change of +2.4%. Sample sizes: {12, 24, 36, 48, 60}.',
    'Codes: A7#B9, C2@D4, E6!F8. Keep symbols precise: ! @ # $ % ^ & * ( ) _ +.'
  ],
  code: [
    'const total = 12; const price = 4.5; console.log(total * price);',
    'function greet(name) { return "Hello, " + name + "!"; }',
    'const scores = [24, 36, 48]; const best = Math.max(...scores);',
    'if (accuracy >= 95) { stars = 3; } else { stars = 2; }',
    'for (let i = 0; i < 10; i++) { results.push(i * 2); }',
    'const user = { name: "Mira", level: 3, active: true };',
    'const words = text.trim().split(" "); return words.length;',
    'function add(a, b) { return a + b; } const sum = add(4, 8);',
    'const items = ["fern", "moss", "leaf"]; items.forEach(item => grow(item));',
    'try { JSON.parse(input); } catch (error) { console.log("Try again."); }',
    'const ready = count > 0 && count <= 100; const label = ready ? "Go" : "Wait";',
    'document.querySelector("button").addEventListener("click", start);'
  ]
};
const modeLabels = {everyday:'Everyday Text',symbols:'Numbers and Symbols',code:'Code'};
function makePassage(textMode, seed) {
  let value = [...String(seed)].reduce((n,c) => (Math.imul(n,31)+c.charCodeAt(0))>>>0,2166136261);
  const random = () => { value = (Math.imul(value,1664525)+1013904223)>>>0; return value/4294967296; };
  const bank = [...passageBank[textMode]];
  for(let i=bank.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[bank[i],bank[j]]=[bank[j],bank[i]];}
  // Room for more than 2,400 standard words, extended on demand.
  return Array.from({length:Math.ceil(14000/bank.join(' ').length)},()=>bank.join(' ')).join(' ');
}
