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
let textBox = document.querySelector(".box");

const editor = CodeMirror.fromTextArea(textBox, {
    scrollbarStyle: "null",
    viewportMargin: Infinity,
    lineNumbers: true,
    lineWrapping: true,
    mode: "laine"});

// Adding effects with changes
let editorDiv = document.querySelector(".CodeMirror")
const solBox = document.querySelector(".solBox");
const errorBox = document.querySelector(".errorBox");
editor.on("change",function(){
    textBox.value=editor.getValue();
    solBox.style.display="";
    errorBox.style.display="";
});
