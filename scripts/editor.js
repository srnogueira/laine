/*
  imports
*/
/*global CodeMirror */ // from scripts

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
