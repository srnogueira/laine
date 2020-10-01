html {
    font-size: 12pt;
    font-family: math;
    margin:1%;
}

header{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin:0% 0% 1% 0%;
}

header h1{
    margin:0% 1% 0% 0%;
}

button{
    font-family:math;
    font-size:12pt;
    padding: 0.5% 2%;
    border-radius:5px;
    border:2px solid #3d3d3d;
    margin-right:10px;
}

button:hover{
    background-color: #F04747;
}

.helpText,.functionBox,.fileBox {
    display:none;
    flex-wrap:wrap;
}

.solBox{
    display:none;
}

label {
    color:#F04747;
    font-weight: 700;
}

.helpText div {
    max-width: 300px;
    background-color:#fcec;
    margin:0.5%;
    padding: 0.5%;
}

.functionBox div{
    max-width: 350px;
    background-color:#fcec;
    margin:0.5%;
    padding: 0.5%;
}

.fileBox div{
    min-width: 200px;
    max-width: 350px;
    background-color:#fcec;
    margin:0.5%;
    padding: 0.5%;
}

select,input {
    max-width: 95%;
}

input{
    width:90%;
    margin-bottom:2%;
}

main {
    display: flex;
    flex-wrap: wrap;
    padding:0.5%;
}

main div {
    margin-right: 2%;
    max-width: 100%;
}

h2{
    font-size:14pt;
    color: #F04747;
}

main a{
    font-size:14pt;
    color: #F04747;
    padding:1px;
}

textarea {
    font-family:math;
    font-size: 12pt;
    padding:1px;
    line-height: 1.5;
    border-radius: 5px;
    border: 2px solid #3d3d3d;
    max-width: 98%;
    overflow:hidden;
}

.out{
    min-height: 24px;
    border-radius: 5px;
    border: 2px solid #3d3d3d;
    padding: 2%;
    width: 100%;
    background-color:#fced;
}

.out p{
    margin: 5px;
}

footer {
    font-size: 10pt;
}
