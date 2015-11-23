var express = require('express');
var app = express();
//var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var session = require('express-session');
var cookieParser = require('cookie-parser');
//var RedisStore = require('connect-redis')(session); //Armazenagem dos dados das sessões em disco
var util = require('util'); //para ver objetos no console
var fs = require('fs'); //Métodos para I/O em arquivos
var multer = require('multer');
var favicon = require('serve-favicon'); 
var handlebars = require('handlebars');

/*var mysql = require('mysql');

//Configurações para conexão do banco de dados MySQL
var connection = mysql.createConnection({
	host	: 'localhost',		//127.0.0.0
	port	: 3306,			//porta padrão
	user	: 'admin',			//usuário criado para o servidor
	password : 'admin@f33c',	//senha do administrador
	database : 'clickerdb'		//nome do banco de dados do aplicativo
	//charset : 'latin-1' ??
	//debug	: 'true';
});

//Tenta se conectar à DB MySQL
try{
	connection.connect(function(err){
		if(err){
			console.log('Erro');
			console.error('error connecting: ' + err.stack);
			return;
		} else {
			console.log("Conectado ao banco de dados MySQL.");
		}
	});
} catch (e){
	console.log('Não foi possível conectar ao MySQL.');
}
*/

//#### Configurações multer: upload de arquivos e envio de dados de formulários (login)

//Armazenamento em disco
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, __dirname + '/public/fotos'); //mudar para public/images ## antes estava /public/avatar
	},
	filename: function (req, file, cb){
		var extensao = file.originalname.split(".").pop(); //pega a extensão da imagem enviada
		//cb(null, 'foto-' + req.body.ra + '.' + extensao.toLowerCase()); 
		cb(null, 'foto-' + req.session.ra + '.' + extensao.toLowerCase()); 
	}
});

//Filtro para aceitar apenas envios de imagens nos formatos JPG, GIF e PNG
var filtro = function fileFilter (req, file, cb){ 
//para aceitar um arquivo, deve chamar cb com um boolean true; para recusar, chamar cb com false;

	if((file.mimetype == 'image/jpeg') || (file.mimetype == 'image/gif') || (file.mimetype == 'image/png')){ //Checa se o arquivo é imagem
		console.log('OK: arquivo de imagem');
		cb(null, true);
		
	} else {
		console.log('Arquivo recusado. Mimetype: ' + file.mimetype);
		cb(null, false);
		
	}
};


var upload = multer({ storage: storage, limits: {fileSize: 1024*1024, files: 1}, fileFilter: filtro,} ); //limite de tamanho = 1MB
var form = multer({storage: storage});

//### Fim configurações Multer



//### Fornecer arquivos estáticos (imagens, css, etc)
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use('/public', express.static(__dirname + '/public'));


var segredoCookie = 'A234sdasd3454dsd23499diyd'; //Chave "aleatória" utilizada na "criptografia hash" dos cookies

app.use(cookieParser(segredoCookie));

//### Configuração do uso de Sessões

var sessionMiddleware = session({
	/*store: new RedisStore({
		host: 'localhost',
		port: '6379',
		db: 1,
		pass: 'SenhaRedis'
	}),*/
	secret: segredoCookie,
	resave: false,
	cookie: {secure: false},
	saveUninitialized: true
});

app.use(sessionMiddleware);


//### Inicio Routing

app.get('/testewebsocket', function(req,res){ //##########NAO FUNCIONOU
	res.sendFile(__dirname + 'testewebsocket.html');
	
});


app.get('/', function(req, res){  //Página inicial
	
	if(req.session.tipo=="aluno"){
		res.redirect('/aluno');

	} else if (req.session.tipo=="admin"){
		res.redirect('/admin');
		
	} else {
		res.sendFile(__dirname + '/index.html');
	}
});

app.route('/login')
	.get(function(req, res){
		//var sess = req.session;
		
		//console.log('Sessão: ' + JSON.stringify(req.session, false, 4));
		//console.log('cookie: ' + JSON.stringify(req.session.cookie, false, 4));
		//console.log('ID: ', req.sessionID);
		
		if(req.session.ra && req.session.turma){ 
			//Aluno já está logado
			res.redirect('/aluno');
		} else  if (req.session.tipo == "admin"){
			//Logado como administrador
			res.redirect('/admin');
		} else {
			//Usuário não identificado => envia página de login
			console.log('Página de login requisitada');
			res.sendFile(__dirname + '/login.html');
		}
	})
	.post(form.single(), function(req, res){
		
		var stats, path;
		
		if(req.session && req.body.ra && req.body.turma && req.body.nome){
			
			//Armazena na sessão do usuário os dados de Nome, RA e Turma que constam na variável req.body (envio do formulário de login)
			req.session.tipo = "aluno";
			req.session.ra = req.body.ra;
			req.session.turma = req.body.turma;
			req.session.nome = req.body.nome;
			req.session.fotoUrl = false;
			
			//Será verificado se o usuário já tem foto no sistema. 
			//O nome padrão é "foto-xxxxxx", onde xxxxxx é o RA do aluno
			//As extensões aceitas são .JPG e .PNG
			path = '/public/fotos/foto-'+req.session.ra;
			
			try {
				stats = fs.statSync(__dirname + path + '.jpg');
				req.session.fotoUrl = path + '.jpg';

			} catch(err) {
				
				try {
					stats = fs.statSync(__dirname + path + '.png');
					req.session.fotoUrl = path + '.png';
				} catch(err){
					console.log('Não encontrou foto do aluno.');
					req.session.fotoUrl = '/public/images/anonimo.jpg';
				}
			}
			
			console.log('Login efetuado. Nome: ' + req.session.nome + ', RA: ' + req.session.ra + ', Turma: ' + req.session.turma + ', Foto: ' + req.session.fotoUrl + '.');
			res.redirect('/aluno');
	
		} else {
			console.log('Sem sessão. Login abortado.');
			res.send('<p>Erro no login.</p><p><a href="/">Clique para voltar ao início</a>');
		}
	});
	
app.route('/login_admin')
	.get(function(req, res, next){
		
		if(req.session.tipo == 'admin'){
			//Se o admin já está logado, redireciona para a página do admin
			res.redirect('/admin');
		} else {
			//Admin não logado => envia página de login
			res.sendFile(__dirname + '/login_admin.html');
		}
	})
	.post(form.single(), function(req, res, next){ 
		//Dados enviados constam em "req.body": req.body.username e req.body.password
		if(req.session){
			if(req.body.username == 'admin' && req.body.password == 'admin@f33c') { //confere usuário e senha administrativos
				//Concede o status de admin
				req.session.tipo = "admin";
				console.log('Logado como administrador.');
				res.redirect('/admin');
			} else {
				//Dados inválidos. Redireciona para página de login
				res.redirect('/login_admin');
			}
		} else {
			console.log('Sem sessão. Redirecionado à página inicial.');
			res.redirect('/');
		}
	}); 

	
//verificaSessão: função que verifica se a sessão do usuário existe. Se existir, envia a requisição para as próximas rotas ("next()"). 
//Caso contrário, redireciona para pagina inicial.
function verificaSessao (req, res, next) {
	
	if(req.session){
		next();
	} else{
		console.log('Sessão inexistente, redicionado para index.');
		res.redirect('/');
	}
}

app.get('/logout', verificaSessao, function(req, res){

	req.session.destroy(function(err){
		if(err){
			console.log(err);
		} else {
			res.redirect('/');
		}
	});
});

app.get('/aluno', verificaSessao, function(req, res){
	
	if(req.session.ra && req.session.turma && req.session.nome){
		
	//"Rotina" para páginas personalizadas: lê arquivo .html, compila com Handlebars e utiliza o Contexto desejado.
		fs.readFile('aluno.html', 'utf-8', function (err, dadosArquivo){
			if(err) {
				console.log('Erro: ' + err);
				res.send("Falha ao acessar/compilar o template.");
			} else {
				//Contexto: dados e foto do aluno
				var context = {nome: req.session.nome, ra: req.session.ra, turma:req.session.turma, fotoUrl:req.session.fotoUrl}; //Dados do aluno
				
				console.log("Contexto: " + JSON.stringify(context, null, 2));
				if(context["fotoUrl"]) console.log("context['fotoUrl']: " + context.fotoUrl);
				var template = handlebars.compile(dadosArquivo); //Compila o arquivo html (template) para geração de página dinâmica
				var html = template(context); //Gera o arquivo final com os dados do aluno
				res.send(html); //Envia o resultado
			}
			
		});
	} else {
	res.redirect('/login');

	}
});

app.get('/admin', verificaSessao, function(req, res){
	
	//Verifica se há privilégios de administrador
	if(req.session.tipo == 'admin'){
		res.sendFile(__dirname + '/admin.html');
	} else { //Não há privilégios => recusa o acesso
		//console.log('Logado como ' + req.sessionID);
		res.sendFile(__dirname + '/acessonegado.html');
	}
});


app.get('/downloadteste', function(req, res){
	var path = __dirname + '/uploads/foto-116735.jpg';
	console.log('Download teste com res.download');
	res.download(path, 'DL-foto-116735.jpg', function(err){
		if (err) {
			console.log('erro no DL');
		} else {
			console.log('DL sucesso');
		}
	});
	
});


app.get('/clicker', verificaSessao, function(req, res){
	
	if(req.session.nome && req.session.ra && req.session.turma) {
		
		res.sendFile(__dirname + '/clicker.html');
		
	} else if(req.session.tipo == 'admin') {
		
		console.log("Admin entrou no clicker-display.");
		res.sendFile(__dirname + '/clicker-display.html');
		
	} else {
		res.redirect('/');
	}
	
});

app.get('/clicker-controle', verificaSessao, function(req, res){
	
	if(req.session.tipo == 'admin') {
		
		console.log("Admin entrou na interface de controle.");
		res.sendFile(__dirname + '/clicker-controle.html');
		
	} else {
		res.redirect('/');
	}
	
});

app.get('/professor', function(req, res){

	console.log(req.method, req.url);
	res.sendFile(__dirname + '/professor.html');
	
});

app.get('/register', function(req, res){
	res.sendFile(__dirname + '/enviaFoto.html');
	console.log(req.method, req.url);
});

app.post('/file-upload', upload.single('foto'), function(req, res){
	
	console.log('Teste multer');
	console.log('Req.body :' + JSON.stringify(req.body));
	var imagem="";
	
	if(typeof req.file !== 'undefined') {
		console.log('Req.file :' + JSON.stringify(req.file));
		console.log('mimetype:' + JSON.stringify(req.file.mimetype)); //conseguiu pegar mimetype
		/*var extensao = file.originalname.split(".").pop(); //pega a extensão da imagem enviada
		imagem = 'foto-' + req.body.ra + '.' + extensao.toLowerCase();
		console.log(extensao);
		console.log(imagem);*/
	}
	req.session.fotoUrl = '/public/fotos/' + req.file.filename;
	res.redirect('/aluno');
	
});

//#### TESTES MySQL
/*
app.get('/getmysql', function(req, res){
	
	connection.query("SELECT * FROM perguntas", function(err, rows){
		if(err){
			res.json(err);
			console.log('Erro no Query.');
		} else {
			// for (x in rows){
				// res.write('rows[' + x + '] ')
				// for(key in rows[x]){
					// res.write(key + ': ' + rows[key])
				// }
			// }
			var x = "";
			rows.forEach( function(arrayItem){
				for (var key in arrayItem){
					if(arrayItem.hasOwnProperty(key)){
						
						x += key + ': ' + arrayItem[key] + ';';
						
					}
				}
				x+='\n';
			});
			res.send(x);
			// res.end();
			// res.json(rows);
		}
	});
	
});*/

app.post('/admin/enviaPergunta', upload.single('enunciado_imagem'), function(req, res){
	//Conteúdos enviados: materia, aula, tipo_enunciado, enunciado_texto, enunciado_imagem, alternativa_correta
	// if()
	console.log('Pergunta enviada.');
	console.log('Req.body :' + JSON.stringify(req.body));
	if(typeof req.file !== 'undefined') {
		console.log('Req.file :' + JSON.stringify(req.file));
		console.log('mimetype:' + JSON.stringify(req.file.mimetype)); //conseguiu pegar mimetype
	}
	res.json(req.body);
	// console.log('ID: ' + res.sessionID);
	
});




app.use(function (err, req, res, next) {
	if (err.code === 'LIMIT_FILE_SIZE') {
		res.send({ result: 'fail', error: { code: 1001, message: 'File is too big' } })
	return 
	}
	
	next();
  
});


app.use(function(req, res, next){
	res.status(404).send('Not found');
	
});




//#### Configuração Socket.io

var userList = {}; //Lista que armazenará os usuários conectados no Socket.io

var perguntas = []; //Lista com ids das perguntas, na ordem em que foram realizadas
var respostas = []; //Array de objetos que armazenam as respostas dos alunos (respostas no formato 'RA': 'alternativa')

var clickerIniciado = false;
var aceitandoRespostas = undefined; //era false
var perguntaAtiva = 0; //ERA 1

var stringCSV = "";

respostas[perguntaAtiva] = {};

//Configura o Socket.io para utilizar as mesmas sessões utilizadas no resto do aplicativo
io.use(function(socket,next){
	sessionMiddleware(socket.request, socket.request.res, next);
	
});

//Middleware para verificação de nova conexão, podendo aceitar ou recusar
io.use(function(socket, next){
	
	if(socket.request.session.tipo){ //Verifica se o usuário já fez login no aplicativo
		console.log('Encontrou o tipo no socketIO:' + socket.request.session.tipo);
		
		//Verifica se o aluno já está usando o clicker (controle de múltiplas janelas)
		if(socket.request.session.tipo == "aluno" && !(socket.request.session.ra in userList)){ 
			userList[socket.request.session.ra] = socket.id; //Armazena o ID do socket na hash de usuários usando o RA como chave
			next(); //Primeira conexão do aluno => aceita.
			
		} else if(socket.request.session.tipo == "admin") {
			next(); //Login do professor => aceita.
			
		}  else { //caso contrário a conexão é rejeitada
		next(new Error('Erro: aluno já logado no sistema.'));
		}
		
	} else { //Não há sessão => Usuário não fez login => rejeitada
		next(new Error('Erro: usuário não fez login no aplicativo.'));
	}
});

io.on('connection', function(socket){
	var req = socket.request;
	
	// Nova conexão de aluno
	if(req.session.tipo == 'aluno' && req.session.ra && req.session.turma && req.session.nome){
		
		console.log('SocketIO: Usuário com RA' + req.session.ra + ' conectado.');
		
		//Entra na room dos alunos, onde todos os alunos entrarão
		socket.join('alunos');
		
		//Envia ao browser do aluno o nome e a foto para serem exibidos
		io.to(socket.id).emit('info aluno', {'nome': req.session.nome, 'fotoUrl':req.session.fotoUrl});
		//socket.id é o ID da conexão (professor ou aluno) que está interagindo com o servidor
		
		var semResposta = false;
		var ultimaResposta = false;
		
		//O servidor enviará ao aluno, também, informações acerca do status atual do clicker: Se ele está iniciado ou não e, caso esteja, se o aluno já respondeu a última pergunta
		//Confere os itens mencionados
		
		if(clickerIniciado && !(req.session.ra in respostas[perguntaAtiva])){ //Clicker iniciado. Aluno não respondeu.
		
			semResposta = true;
			console.log("SocketIO: Não há resposta do aluno.");
			
		} else if (clickerIniciado){ //Clicker iniciado. Aluno já respondeu => recupera a resposta dada por ele.
		
			ultimaResposta = respostas[perguntaAtiva][req.session.ra]["resposta"];
		}
		
		//Envia as informações para o browser do aluno
		//if(perguntaAtiva) {
			io.to(socket.id).emit('info clicker', {'clicker iniciado': clickerIniciado, 'iniciou perguntas': perguntaAtiva, 'pergunta finalizada': !aceitandoRespostas, 'aguardando resposta': semResposta, 'ultima resposta': ultimaResposta}); 
		//} else { //perguntaAtiva == 0 -> não começaram as perguntas
		//	io.to(socket.id).emit('info clicker', {'clicker iniciado': clickerIniciado, 'iniciouPerguntas': perguntaAtiva, 'pergunta finalizada': false, 'aguardando resposta': semResposta, 'ultima resposta': ultimaResposta}); 
		//}
		//Notifica ao professor que há uma nova conexão, com os dados do aluno a exibir.
		
		if(!clickerIniciado) {
			
			io.to('professor').emit('alunoConectado', {'nome': req.session.nome, 'ra': req.session.ra, 'fotoUrl': req.session.fotoUrl, 'jaRespondeu': false});
		
		} else {
			
			io.to('professor').emit('alunoConectado', {'nome': req.session.nome, 'ra': req.session.ra, 'fotoUrl': req.session.fotoUrl, 'jaRespondeu': !semResposta});
			
		}
		
	
	}
	
	//Controle: verifica o número de alunos conectados.
	if(io.nsps['/'].adapter.rooms['alunos'])
		console.log('SocketIO: Há ' + Object.keys(io.nsps['/'].adapter.rooms['alunos']).length + ' aluno(s) conectados.');
	
	//Nova conexão de professor
	if(req.session.tipo == 'admin') {
		
		//Entrar na room do professor
		socket.join('professor');
		console.log('SocketIO: Professor conectado.');
		
		//Serão enviadas informações do status atual do clicker e das respostas. Necessário para exibir o estado correto da aplicação.
		//Verificará quais dos alunos conectados já respondeu à última pergunta ativa.
		var infoRespostasAlunos = {};
		
		if(clickerIniciado)
			io.to(socket.id).emit('clicker iniciado'); 
		
		/* //####### isso seria para saber quais alunos ja responderam, mas o alunosAck faz isso ja
		for(var ra in userList) {
			if(ra in respostas[perguntaAtiva]) {
				infoRespostasAlunos[ra]=true;
			} else {
				infoRespostasAlunos[ra]=false;
			}	
			console.log("SocketIO: RA: " + ra + ", infoRespostasAlunos: " + infoRespostasAlunos[ra]);
		}*/
		
		io.to(socket.id).emit('info clicker', {'clicker iniciado': clickerIniciado, 'aceitando respostas': aceitandoRespostas, 'pergunta ativa': perguntaAtiva});
		
	}
	
	
	
	//Se receber um disconnect
	socket.on('disconnect', function(data){
		console.log('SocketIO: Usuário do tipo ' + req.session.tipo + ' desconectou-se');
		
		if(req.session.tipo == 'aluno'){
			io.to('professor').emit('alunoDesconectado', {'ra': req.session.ra}); //Notifica o professor
			if(req.session.ra in userList){
				delete userList[req.session.ra];
				console.log("SocketIO: Usuário retirado da userList");
			}
			
		}
		
	});
	
	
	
	socket.on('checaAlunosOnline', function(data){
		if(req.session.tipo == "admin")
			io.to('alunos').emit('checaAlunosOnline');
	});
	
	socket.on('alunoOnlineAck', function(msg){
		var alunoRespondeuPerguntaAtual = false;
		
		if(req.session.ra in respostas[perguntaAtiva]) {
				alunoRespondeuPerguntaAtual=true;
		} 
		
		if((req.session.tipo == "aluno") && req.session.ra && req.session.turma && req.session.nome){
			io.to('professor').emit('alunoConectado', {'ra': req.session.ra, 'nome': req.session.nome, 'fotoUrl': req.session.fotoUrl, 'jaRespondeu': alunoRespondeuPerguntaAtual});
		}
		
	});
	
	
	//### Até aqui são eventos de controle de conexão, desconexão e atualização dos displays.
	
	//### Configuração dos eventos de Controle do fluxo da aplicação
	
	socket.on('iniciaClicker', function(msg){
		
		if(req.session.tipo == "admin"){
			
			if(!clickerIniciado){
				
				clickerIniciado = true;
				
				io.emit('clicker iniciado');
				io.to('professor').emit('mensagem', 'Sessão do Clicker iniciada.');
				console.log("SocketIO: Clicker iniciado.");
				
			} else {
				
				io.to('professor').emit('mensagem', 'Clicker já foi iniciado anteriormente.');
				
			}
		}			
		
	});
	
	socket.on('nova pergunta', function(data){
		
		if(req.session.tipo == "admin" && clickerIniciado) {

			console.log("SocketIO: perguntaAtiva antiga: " + perguntaAtiva);
		
			perguntaAtiva++; 
			aceitandoRespostas = true;   // ############### INCLUI ACEITANDORESPOSTAS
			
			console.log("SocketIO: perguntaAtiva nova: " + perguntaAtiva);
			
			if(perguntas) {
				perguntas.push(perguntaAtiva);
				console.log("SocketIO: Perguntas: " + JSON.stringify(perguntas));
			}
			
			respostas[perguntaAtiva]={};
			
			
			io.to('alunos').emit('nova pergunta ativa', {'alternativa': true, 'texto': false}); 
			io.to('professor').emit('novaPerguntaAck'); //Ack ao professor
			io.to(socket.id).emit('mensagem', 'Pergunta ' + perguntaAtiva + ' iniciada.');
			
		} else {
			io.to(socket.id).emit('mensagem', 'Sessão não iniciada.');
		}
		
	});
	
	socket.on('termina pergunta', function(data){
		
		if (req.session.tipo == "admin" && clickerIniciado) {
			
			if(aceitandoRespostas == true){
				
				aceitandoRespostas = false;
				io.emit('pergunta finalizada');
				io.to(socket.id).emit('mensagem', 'Pergunta ' + perguntaAtiva + ' finalizada.');
				console.log("SocketIO: terminou a pergunta nº" + perguntaAtiva + ".");
			} else {
				
				io.to(socket.id).emit('mensagem', 'Pergunta ' + perguntaAtiva + ' já está finalizada.');
				console.log("SocketIO: Tentou finalizar pergunta já finalizada.");
			}
				
		} else {
			
			io.to(socket.id).emit('mensagem', 'Sessão não iniciada.');
		}
	
	});
	
	socket.on('toggleGrafico', function(data){
		if (req.session.tipo == "admin") {
			io.to('professor').emit('toggleGrafico');
			console.log("SocketIO: deu broadcast em toggleGrafico.");
			
		}
		
	});
	
	//Evento de resposta do aluno. A função callback armazena a resposta e emite duas mensagens, uma para a interface do professor (resposta aluno)
	//E outra mensagem para o aluno, confirmando o recebimento da resposta (ackResposta)
	
	socket.on('resposta', function(data){
		
		//Verifica se a sessão do clicker já foi iniciada para o professor e se a resposta veio de um aluno logado
		if(clickerIniciado && socket.request.session.ra && aceitandoRespostas) { //########## INCLUI ACEITANDOREPOSTAS
			
			//Se aluno já respondeu essa pergunta, ignora.
			if(respostas[perguntaAtiva][req.session.ra]) {
				console.log("SocketIO: Aluno já respondeu essa pergunta. Resposta armazenada: " + req.session.ra + ': ' + respostas[perguntaAtiva][req.session.ra]);
			} else {
				
				//Armazena resposta enviada pelo aluno
				respostas[perguntaAtiva][req.session.ra] = {
					"nome": req.session.nome,
					"turma": req.session.turma,
					"resposta": data 
				};
				
				//Envia as mensagens
				io.to('professor').emit('resposta aluno', {'ra': socket.request.session.ra, 'alternativa': data}); 
				io.to(socket.id).emit('ackResposta', {alternativa: data}); // Acknowledge das respostas enviadas pelos alunos
				console.log("SocketIO: Resposta recebida. " + req.session.ra + ': ' + data);
			}


		}
		
	});
	
	socket.on('status respostas', function(data){
		
		var respostasPreTabeladas = [];
		var listaRAs = [];
		
		console.log(JSON.stringify(respostas, null, 4));
		console.log(JSON.stringify(perguntas, null, 4));
		console.log("Respostas.length: " + respostas.length);
		
	});
	
	
	//O callback desse evento converte o array de respostas em uma string CSV e envia para o browser do professor, onde será feito o download.
	//O arquivo CSV é também escrito em disco para possuir um histórico de uso
	socket.on('salvar e exportar', function(mensagem){
		
		var path;
		var respostasPreTabeladas = [];
		var listaRAs = [];
		
		console.log(JSON.stringify(respostas, null, 4));
		console.log(JSON.stringify(perguntas, null, 4));
		console.log("Respostas.length: " + respostas.length);
		
		//Cria uma lista com todos os RAs (array listaRAs) dos alunos que responderam a pelo menos uma pergunta.
		for(var j=1; j<respostas.length; j++){
			
			for(var ra in respostas[j]) {
				
				if(listaRAs.indexOf(ra) < 0) //Se o RA não está presente em "listaRAs", o método indexOf retorna -1
					listaRAs.push(ra);
				
			}
		}

		listaRAs.sort(); //Ordena a lista em ordem crescente de RA
		
		//Varrerá o array respostas para cada RA na lista
		listaRAs.forEach(function(ra, index, array){
			
			var linha = {};
			linha["RA"]= ra;
			
			for(var i=1; i < respostas.length; i++){
				var keyResposta = 'RP' + i;
				
				//Verifica se o aluno respondeu aquela pergunta
				if(ra in respostas[i]){ 
					//Respondeu:
				
					//Insere o nome e a turma do aluno na primeira resposta presente
					if(!("Nome" in linha)){
						linha["Nome"] = respostas[i][ra]["nome"];
						linha["Turma"] = respostas[i][ra]["turma"];
					}
					
					//Insere a resposta do aluno
					linha[keyResposta] =  respostas[i][ra]['resposta'];
						
				} else {
					//Não respondeu:
					linha[keyResposta] = " ";
				}
			
				
			}
				
			respostasPreTabeladas.push(linha);
			
		});
		
		console.log("SocketIO: respostasPreTabeladas: ");
		console.log(JSON.stringify(respostasPreTabeladas, null, 4));
		
		//Transformar para formato CSV
	
		var array = respostasPreTabeladas;
		var str = '';
		var line = '';

		var head = array[0];
	 
		for (var index in array[0]) {
			var value = index + "";
			line += '"' + value.replace(/"/g, '""') + '",';
		}
	
		line = line.slice(0, -1);
		str += line + '\r\n';
		
		for (var i = 0; i < array.length; i++) {
			var line = '';

				for (var index in array[i]) {
					var value = array[i][index] + "";
					line += '"' + value.replace(/"/g, '""') + '",';
				}

			line = line.slice(0, -1);
			str += line + '\r\n';
		}
		
		stringCSV = str;
		
		console.log("SocketIO: Em formato CSV:");
		console.log(stringCSV);
		
		io.to(socket.id).emit('stringCSV', {"nome": "clicker_respostas_" + mensagem.date, "CSV":stringCSV});
		
		if(typeof mensagem !== "undefined" && mensagem.date !== "undefined") {
			
			path = __dirname + "/public/output/clicker_respostas_" + mensagem.date + ".csv";
			
			fs.writeFile(path, stringCSV, function(err) {
				if(err) {
					console.log("SocketIO: Erro na escrita do arquivo .csv.");
					io.to(socket.id).emit('mensagem', 'Erro ao salvar o arquivo CSV.');
				} else {
					io.to(socket.id).emit('mensagem', 'Arquivo CSV salvo com sucesso.');
				}
				
			});
				
		}
	});
		
	
	
	
}); //Fim no io.on 'connection'


var server = http.listen(80, function(){
	
	var host = server.address().address;
	var port = server.address().port;
	
	console.log('Listening at http://%s:%s  running from %s', host, port, __dirname);
	
});



