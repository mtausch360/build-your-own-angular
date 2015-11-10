/*
  will contain


    A Lexer
      -takes the original expression string and returns an array of tokens paresed form that string
        ex. 'a + b' -> ['a', '+', 'b']


    An AST Builder
      -takes the array of tokens generated by the lexer, and builds up an abstract syntax tree. The
        tree represents the syntactic structure of the expression as nexted javascript objects
        ex cont from above.

        {
          type: AST.BinaryExpression,
          operator: '+',
          left: {
            type: AST.Identifier,
            name: 'a'
          },
          right: {
            type: AST.Identifier,
            name: 'b'
          }
        }


    An AST Compiler
      -takes the abstract syntax tree and compiles it into a JavaScript function that evaluates the 
        expression represented in the tree.
        ex


    a Parser
      -responsible for combining the low-level steps ^^^. 

 */


function parse(expr) {

  var lexer = new Lexer();

  var parser = new Parser(lexer);

  return parser.parse(expr);

}


function Lexer() {

}

Lexer.prototype.lex = function(text) {
  //Tokenization will be done here
};

function AST(lexer) {
  this.lexer = lexer;
}

AST.prototype.ast = function(text) {
  var ast = this.astBuilder.ast(text);
  //AST compilation will be done here
};

function ASTCompiler(astBuilder) {
  this.astBuilder = astBuilder;
}

ASTCompiler.prototype.compile = function(text) {
  var ast = this.astBuilder.ast(text);
  //AST compilation will be done here
};

function Parser(lexer) {
  this.lexer = lexer;
  this.ast = new AST(this.lexer);
  this.astCompiler = new ASTCompiler(this.ast);
}

Parser.prototype.parse = function(text) {
  return this.astCompiler.compile(text);
};
