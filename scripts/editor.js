/*
  imports
*/
// from scripts
/*global CodeMirror */ 

/*
  exports
*/
// for ui.js
/*exported editor, textBox*/ 

/*
  Text highlight using simple mode
*/
CodeMirror.defineSimpleMode("laine", {
  start: [
    { regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string" },
    { regex: /'(?:[^\\]|\\.)*?(?:'|$)/, token: "string" },
    { regex: /(#.*(?=;)|#.*)/, token: "comment" },
    { regex: /\w+(?=\()/, token: "keyword" },
    { regex: /((\d+(\.|E|e))+(\+|-)?\d+|\d+)/, token: "number" },
    { regex: /[a-zA-Z$][\w$]*/, token: "variable" },
  ],
});

let textBox = document.querySelector(".box");
const editor = CodeMirror.fromTextArea(textBox, {
  scrollbarStyle: "null",
  viewportMargin: Infinity,
  lineNumbers: true,
  lineWrapping: true,
  inputStyle: "textarea",
  mode: "laine",
});
