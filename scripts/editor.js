/* 
   Editor
*/

// Simple mode for text highlight
CodeMirror.defineSimpleMode("laine", {
  start: [
      {regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string"},
      {regex: /'(?:[^\\]|\\.)*?(?:'|$)/, token: "string"},
      {regex: /#.*/, token: "comment"},
      {regex: /(?:PropsSI|NasaSI|HAPropsSI|LeeKesler|sin|cos|tan|exp|log|log10|abs)\b/, token: "keyword"},
      {regex: /((\d+(\.|E|e))+(\+|\-)?\d+|\d+)/, token: "number"},
      {regex: /[a-zA-Z$][\w$]*/, token: "variable"},
  ],
});

// Creating the editor
const textBox = document.querySelector(".box");
let editor = CodeMirror.fromTextArea(textBox, {
    scrollbarStyle: "null",
    viewportMargin: Infinity,
    lineNumbers: true,
    lineWrapping: true,
    mode: "laine"});

// Adding effects with changes
let editorDiv = document.querySelector(".CodeMirror")
editor.on("change",function(){textBox.value=editor.getValue()});
const solBox = document.querySelector(".solBox");
editor.on("change",function(){solBox.style.display=""});
